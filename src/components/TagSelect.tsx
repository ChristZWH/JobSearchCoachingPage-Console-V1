import { useEffect, useState, useMemo } from 'react';
import { Select, message } from 'antd';
import { getTags, createTag, type Tag as TagType } from '../api/tags';

interface TagSelectProps {
  /** tags table category: industry | company | department | school | language | skill */
  category: TagType['category'];
  /** current form value */
  value?: string;
  /** onChange callback (sets form field value) */
  onChange?: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

/**
 * Tag-aware Select with dual-mode: dropdown selection + manual input.
 *
 * - Shows existing tags from the `tags` table as dropdown options.
 * - When the user types something not in the list, a "使用 xxx" option
 *   appears at the top of the dropdown — clicking it selects that value.
 * - On blur, any leftover search text is automatically captured as the value.
 */
export default function TagSelect({ category, value, onChange, placeholder, style }: TagSelectProps) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

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

  // Dynamically prepend a "使用 xxx" option when search has no exact match
  const visibleOptions = useMemo(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return options;
    if (options.some((o) => o.value === trimmed)) return options;
    return [{ label: `使用 "${trimmed}"`, value: trimmed }, ...options];
  }, [options, searchText]);

  // Persist a newly-typed value as a real tag so it shows up in the dropdown next
  // time. Idempotent: the backend createTag is find-or-create, and we skip values
  // already present in the loaded options.
  const persistNewTag = (name: string) => {
    const trimmed = name?.trim();
    if (!trimmed) return;
    if (options.some((o) => o.value === trimmed)) return;
    setOptions((prev) => [...prev, { label: trimmed, value: trimmed }]);
    createTag({ name: trimmed, category }).catch(() => {
      message.error(`创建标签「${trimmed}」失败`);
    });
  };

  // On blur: if the user typed something but didn't explicitly select,
  // auto-capture the search text as the form value.
  const handleBlur = () => {
    const trimmed = searchText.trim();
    if (trimmed && value !== trimmed) {
      onChange?.(trimmed);
      persistNewTag(trimmed);
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
        onChange?.(val);
        setSearchText('');
        if (val) persistNewTag(val);
      }}
      onSearch={setSearchText}
      onBlur={handleBlur}
      searchValue={undefined}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={visibleOptions}
      notFoundContent={
        loading ? '加载中...' :
        searchText.trim() ? `按 Enter 选择 "${searchText.trim()}"` :
        `输入新${categoryLabel}后按 Enter 即可添加`
      }
      style={{ minWidth: 160, ...style }}
      getPopupContainer={(trigger) => trigger.parentElement || document.body}
    />
  );
}
