import { useEffect, useState, useMemo } from 'react';
import { Select, message } from 'antd';
import { getTags, type Tag as TagType } from '../api/tags';

interface TagSelectProps {
  /** tags table category: industry | company | department | region | targetRole | school | language | skill */
  category: TagType['category'];
  /** current form value */
  value?: string;
  /** onChange callback (sets form field value) */
  onChange?: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  /** Data-driven extra options (e.g. values actually used by mentors, same as the website filter), merged with tag-table options */
  extraOptions?: string[];
}

/**
 * 清洗输入值：去首尾空白，移除制表符/换行及其他控制字符（外部粘贴常带入）。
 * 返回 { value, stripped }：stripped=true 表示确实移除了控制字符，调用方提示用户。
 */
function stripControlChars(input: string): { value: string; stripped: boolean } {
  let stripped = false;
  const value = input
    .replace(/[\t\n\r]/g, () => {
      stripped = true;
      return '';
    })
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, () => {
      stripped = true;
      return '';
    })
    .trim();
  return { value, stripped };
}

/** 大小写不敏感查找已有选项（如 "GuoTai" 命中 "Guotai"），返回其标准写法 */
function findExistingOption(options: { label: string; value: string }[], name: string) {
  const lower = name.toLowerCase();
  return options.find((o) => o.value.toLowerCase() === lower);
}

/**
 * Tag-aware Select with dual-mode: dropdown selection + manual input.
 *
 * - Shows existing tags from the `tags` table as dropdown options.
 * - When the user types something not in the list, the typed value is
 *   committed directly on Enter (no "使用 xxx" intermediate option).
 * - On blur, any leftover search text is automatically captured as the value.
 * - Typed values are sanitized (control chars stripped) and case-insensitive
 *   duplicates reuse the existing tag's spelling, so the website filter
 *   dropdown never shows two variants of the same value.
 * - Tag creation is deferred: the parent form persists new values to the
 *   tags table only after a successful submit, so abandoned form edits
 *   never leave orphan tags behind.
 */
export default function TagSelect({ category, value, onChange, placeholder, style, extraOptions }: TagSelectProps) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [open, setOpen] = useState(false);

  // Load tags for this category
  useEffect(() => {
    setLoading(true);
    getTags({ page_size: 500 })
      .then((res) => {
        const filtered = (res.data || []).filter((t: TagType) => t.category === category);
        setOptions(filtered.map((t: TagType) => ({ label: t.name, value: t.name })));
      })
      .catch(() => message.error(`加载${category}标签失败`))
      .finally(() => setLoading(false));
  }, [category]);

  // Merge tag-table options with data-driven options (e.g. actual values used by
  // mentors, same source as the website filter dropdown), dedupe and sort.
  const mergedOptions = useMemo(() => {
    const seen = new Set<string>();
    const merged: { label: string; value: string }[] = [];
    for (const o of [...options, ...(extraOptions ?? []).map((v) => ({ label: v, value: v }))]) {
      if (seen.has(o.value)) continue;
      seen.add(o.value);
      merged.push(o);
    }
    return merged.sort((a, b) => a.value.localeCompare(b.value));
  }, [options, extraOptions]);

  // Enter commits the typed text directly as the field value. preventDefault
  // stops the form's implicit submit, stopPropagation stops antd's internal
  // Enter handling from selecting the highlighted option and overwriting it.
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const trimmed = searchText.trim();
    if (!trimmed) return;
    e.preventDefault();
    e.stopPropagation();
    const canonical = canonicalValue(trimmed);
    if (canonical) {
      onChange?.(canonical);
      setSearchText('');
      setOpen(false);
    }
  };

  // Clean and canonicalize a typed value: control chars stripped, case-insensitive
  // matches reuse the existing option's spelling. Returns the canonical value.
  // NOTE: the new tag is NOT created here — the parent form persists the value to
  // the tags table after a successful submit (deferred creation).
  const canonicalValue = (name: string): string | undefined => {
    const { value: cleaned, stripped } = stripControlChars(name ?? '');
    if (!cleaned) return undefined;
    if (stripped) message.warning(`「${name?.trim()}」包含制表符/换行，已自动移除`);
    const existing = findExistingOption(mergedOptions, cleaned);
    if (existing) {
      if (existing.value !== cleaned) {
        message.info(`已使用已有写法「${existing.value}」`);
      }
      return existing.value;
    }
    // 半成品前缀提示（非阻断）：如 TS 是 TSG 的前缀，可能是边打字边保存
    // 留下的半成品值（problem-to-solve.md P4.2）。不拦截提交，只提醒确认。
    const prefixOf = mergedOptions.find(
      (o) =>
        o.value.toLowerCase().startsWith(cleaned.toLowerCase()) &&
        o.value.toLowerCase() !== cleaned.toLowerCase(),
    );
    if (prefixOf) {
      message.warning(`「${cleaned}」是已有选项「${prefixOf.value}」的前缀，请确认是否为完整值`);
    }
    return cleaned;
  };

  // On blur: if the user typed something but didn't explicitly select,
  // auto-capture the search text as the form value.
  const handleBlur = () => {
    const trimmed = searchText.trim();
    if (trimmed && value !== trimmed) {
      const canonical = canonicalValue(trimmed);
      if (canonical) onChange?.(canonical);
    }
    setSearchText('');
  };

  const categoryLabel =
    category === 'industry' ? '行业' :
    category === 'company' ? '公司' :
    category === 'department' ? '部门' :
    category === 'region' ? '地区' :
    category === 'targetRole' ? '辅导求职职位' :
    category === 'school' ? '学校' :
    category === 'language' ? '语言' :
    category === 'skill' ? '技能' : category;

  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      placeholder={placeholder || `选择或输入${categoryLabel}...`}
      value={value || undefined}
      onChange={(val) => {
        setSearchText('');
        // canonicalValue 返回标准写法：大小写变体回填已有选项的拼写，
        // 避免向 mentors 列写入变体（官网下拉按 JS 大小写敏感去重会出重复项）。
        const canonical = val ? canonicalValue(val) : undefined;
        onChange?.(canonical ?? val);
      }}
      onSearch={setSearchText}
      onBlur={handleBlur}
      open={open}
      onDropdownVisibleChange={setOpen}
      searchValue={undefined}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={mergedOptions}
      onInputKeyDown={handleInputKeyDown}
      notFoundContent={
        loading ? '加载中...' :
        searchText.trim() ? `按 Enter 确认输入 "${searchText.trim()}"` :
        `输入新${categoryLabel}后按 Enter 即可添加`
      }
      style={{ minWidth: 160, ...style }}
      getPopupContainer={(trigger) => trigger.parentElement || document.body}
    />
  );
}
