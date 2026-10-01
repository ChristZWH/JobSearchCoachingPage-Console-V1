import { cloneElement, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, AutoComplete, Button, Card, Space, message, Typography, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getCase, createCase, updateCase, updateCaseImage, getCases, type StudentCase } from '../../api/cases';
import { CASE_FILTER_DIMENSIONS, caseFilterFieldLabel, caseFilterControlBox } from '../../utils/filterDimension';
import ImageUploadField from '../../components/ImageUploadField';

const { Title } = Typography;
const { TextArea } = Input;

/**
 * 单值维度下拉：候选来自现有案例数据（与官网案例页筛选下拉同源），
 * 支持直接输入新值（AutoComplete 原生自由输入）。
 */
function DimSelect({ options, value, onChange, placeholder, style }: {
  options?: string[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const mergedOptions = useMemo(() => {
    const seen = new Set<string>(options ?? []);
    if (value) seen.add(value);
    return [...seen].filter((v) => v.trim() !== '').sort().map((v) => ({ label: v, value: v }));
  }, [options, value]);

  // 失焦时归一化（与 TagSelect 同款防脏，官网下拉选项来自数据，任何变体都会变成重复选项）：
  // 去首尾空白与制表符/换行；大小写不敏感命中已有选项时回填已有写法。
  const canonicalize = (input: string): string => {
    const stripped = input.replace(/[\t\n\r]/g, '');
    const cleaned = stripped.trim();
    if (!cleaned) return '';
    const existing = mergedOptions.find((o) => o.value.toLowerCase() === cleaned.toLowerCase());
    if (existing) {
      if (existing.value !== cleaned) message.info(`已使用已有写法「${existing.value}」`);
      return existing.value;
    }
    if (stripped !== input) message.warning('输入包含制表符/换行，已自动移除');
    return cleaned;
  };

  return (
    <AutoComplete
      value={value || undefined}
      onChange={(val) => onChange?.(val ?? '')}
      onBlur={() => {
        if (!value) return;
        const canonical = canonicalize(value);
        if (canonical !== value) onChange?.(canonical);
      }}
      options={mergedOptions}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      placeholder={placeholder}
      allowClear
      style={{ minWidth: 160, ...style }}
    />
  );
}

/** 官网筛选维度控件的高亮盒子（用法与 MentorForm 的 FilterBox 一致） */
function CaseFilterBox({ field, value, onChange, children }: {
  field: (typeof CASE_FILTER_DIMENSIONS)[number];
  value?: string;
  onChange?: (val: string) => void;
  // Form.Item 只会把值注入直接子组件，children 需带 value/onChange 的元素类型才能转发
  children: React.ReactElement<{ value?: string; onChange?: (val: string) => void }>;
}) {
  return (
    <div style={caseFilterControlBox(field)}>
      {cloneElement(children, { value, onChange })}
    </div>
  );
}

export default function CaseForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 标签候选：现有案例已用过的标签（仅卡片展示用，不参与官网筛选）
  const [existingTags, setExistingTags] = useState<string[]>([]);
  // 官网筛选维度的数据驱动选项：从现有案例数据提取各维度去重值，
  // 与官网案例页筛选下拉的数据源保持一致（参考 MentorForm.dimOptions）。
  const [dimOptions, setDimOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getCases({ page_size: 500 })
      .then((res) => {
        const tags = new Set<string>();
        for (const c of res.data ?? []) {
          for (const t of c.tags ?? []) tags.add(t);
        }
        setExistingTags([...tags].sort());
        const values: Record<string, string[]> = {};
        for (const field of CASE_FILTER_DIMENSIONS) {
          values[field] = [
            ...new Set(
              (res.data || [])
                .map((c) => c[field as keyof StudentCase])
                .filter((v): v is string => typeof v === 'string' && v.trim() !== ''),
            ),
          ].sort();
        }
        setDimOptions(values);
      })
      .catch(() => {});
  }, []);

  const tagOptions = useMemo(() => {
    return [...existingTags].sort().map((t) => ({ label: t, value: t }));
  }, [existingTags]);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getCase(Number(id))
        .then((c) => form.setFieldsValue(c))
        .catch(() => message.error('加载案例失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  // 图片上传即入库：上传成功后立即更新 DB，无需等保存（新增时随表单保存）
  const handleImageUploaded = async (url: string) => {
    if (!id) return;
    try { await updateCaseImage(Number(id), url); }
    catch { message.error('图片保存失败，请重新上传'); }
  };

  const onFinish = async (values: Record<string, unknown>) => {
    // 清洗 tags：去除控制字符与首尾空白，防止粘贴带入制表符污染官网筛选
    if (Array.isArray(values.tags)) {
      let stripped = false;
      values.tags = (values.tags as string[])
        .map((t) =>
          t.replace(/[\t\n\r]/g, () => { stripped = true; return ''; })
           // eslint-disable-next-line no-control-regex
           .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, () => { stripped = true; return ''; })
           .trim(),
        )
        .filter((t) => t.length > 0);
      if (stripped) message.warning('部分标签包含制表符/换行，已自动移除');
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateCase(Number(id), values);
        message.success('案例更新成功');
      } else {
        await createCase(values);
        message.success('案例创建成功');
      }
      navigate('/cases');
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card
      title={<Title level={4}>{isEdit ? '编辑案例' : '新增案例'}</Title>}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>返回</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 900 }}>
        <Space size="middle">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input style={{ width: 280 }} />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select style={{ width: 160 }} options={[
              { label: '金融', value: 'finance' }, { label: '咨询', value: 'consulting' },
              { label: '科技', value: 'tech' }, { label: '综合', value: 'general' },
            ]} />
          </Form.Item>
          <Form.Item name="industry" label={caseFilterFieldLabel('industry', '从业行业方向 (industry)')} tooltip="官网筛选维度">
            <CaseFilterBox field="industry">
              <DimSelect options={dimOptions['industry']} placeholder="如：金融 / 咨询 / 数据科技" style={{ width: 200 }} />
            </CaseFilterBox>
          </Form.Item>
          <Form.Item name="company" label={caseFilterFieldLabel('company', '入职公司 (company)')} tooltip="官网筛选维度">
            <CaseFilterBox field="company">
              <DimSelect options={dimOptions['company']} placeholder="如：Goldman Sachs" style={{ width: 200 }} />
            </CaseFilterBox>
          </Form.Item>
        </Space>
        <Space size="middle">
          <Form.Item name="offerPosition" label={caseFilterFieldLabel('offerPosition', 'Offer岗位 (offerPosition)')} tooltip="官网筛选维度">
            <CaseFilterBox field="offerPosition">
              <DimSelect options={dimOptions['offerPosition']} placeholder="如：Investment Banking Analyst" style={{ width: 240 }} />
            </CaseFilterBox>
          </Form.Item>
          <Form.Item name="school" label={caseFilterFieldLabel('school', '毕业院校 (school)')} tooltip="官网筛选维度">
            <CaseFilterBox field="school">
              <DimSelect options={dimOptions['school']} placeholder="如：LSE / 清华大学" style={{ width: 200 }} />
            </CaseFilterBox>
          </Form.Item>
          <Form.Item name="major" label={caseFilterFieldLabel('major', '学员专业 (major)')} tooltip="官网筛选维度">
            <CaseFilterBox field="major">
              <DimSelect options={dimOptions['major']} placeholder="如：金融学 / Mathematics" style={{ width: 200 }} />
            </CaseFilterBox>
          </Form.Item>
        </Space>
        <Space size="middle">
          <Form.Item name="studentName" label="学员姓名">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="result" label="成果">
            <Input style={{ width: 300 }} placeholder="e.g. 获得 Goldman Sachs Offer" />
          </Form.Item>
          <Form.Item name="image" label="展示图 (image)" extra="学员头像/案例展示图：上传保存到 /uploads/student-cases/">
            <ImageUploadField uploadDir="student-cases" onUploaded={handleImageUploaded} previewWidth={80} previewHeight={80} />
          </Form.Item>
        </Space>
        <Form.Item name="description" label="简介">
          <TextArea rows={2} placeholder="案例简要描述..." />
        </Form.Item>
        <Form.Item
          name="tags"
          label="标签 (tags)"
          extra="仅用于案例卡片展示，不参与官网筛选（筛选已改为从业行业/入职公司/Offer岗位/毕业院校/专业五个结构化字段）。可从已有标签选择，也可直接输入新标签后按 Enter 添加"
        >
          <Select
            mode="tags"
            allowClear
            showSearch
            placeholder="选择或输入标签..."
            options={tagOptions}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            style={{ maxWidth: 600 }}
          />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true }]}>
          <TextArea rows={8} placeholder="案例主要内容..." />
        </Form.Item>
        <Form.Item name="challenge" label="挑战">
          <TextArea rows={3} placeholder="学员面临的挑战是什么？" />
        </Form.Item>
        <Form.Item name="strategy" label="策略">
          <TextArea rows={3} placeholder="采取了什么策略？" />
        </Form.Item>
        <Form.Item name="outcome" label="结果">
          <TextArea rows={3} placeholder="结果如何？" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/cases')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
