import { useEffect, useState, useCallback, cloneElement, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Typography, Spin,
  Table, Modal, Popconfirm, Divider, Select, InputNumber, Switch, Tooltip, Radio,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  getMentors, getMentor, createMentor, updateMentor, updateMentorAvatar,
  getEducations, createEducation, updateEducation, deleteEducation,
  getBackgrounds, createBackground, updateBackground, deleteBackground,
  getBioBlocks, createBioBlock, updateBioBlock, deleteBioBlock,
  getClips, createClip, updateClip, deleteClip,
  getReviews, createReview, updateReview, deleteReview,
  type Mentor, type MentorEducation, type MentorBackground, type MentorBioBlock, type MentorClip, type MentorReview,
} from '../../api/mentors';
import { getTags, createTag, type Tag as TagType } from '../../api/tags';
import TagSelect from '../../components/TagSelect';
import ImageUploadField from '../../components/ImageUploadField';
import { filterFieldLabel, filterControlBox, WEBSITE_FILTER_DIMENSIONS } from '../../utils/filterDimension';

const { Title } = Typography;
const { TextArea } = Input;

// 筛选维度与语言/技能/行业专长标签仅允许英文：这些值都会原样显示在
// 官网（英文站无翻译层），若混入中文，英文站的筛选下拉与导师卡片会
// 直接显示中文内容，故在控制台源头拦截。value 可能是数组（tags 模式）。
const noChineseRule = (label: string) => ({
  validator: (_: unknown, value: string | string[] | undefined) => {
    if (!value) return Promise.resolve();
    const values = Array.isArray(value) ? value : [value];
    // 匹配 CJK 汉字：基本区 U+4E00-U+9FFF、扩展A区 U+3400-U+4DBF、兼容区 U+F900-U+FAFF
    const hasHan = values.some((v) =>
      Array.from(v).some((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return (
          (code >= 0x3400 && code <= 0x4dbf) ||
          (code >= 0x4e00 && code <= 0x9fff) ||
          (code >= 0xf900 && code <= 0xfaff)
        );
      }),
    );
    return hasHan
      ? Promise.reject(new Error(`${label}仅支持英文，请勿输入中文`))
      : Promise.resolve();
  },
});

/**
 * 筛选维度高亮盒子：既是视觉包裹层，也负责把 Form.Item 注入的 value/onChange
 * 转发给内部控件。Form.Item 只会把值注入到它的直接子组件，若直接子组件是
 * 普通 div，值会丢失（回显为空、编辑不生效）。
 */
interface FilterBoxProps {
  field: (typeof WEBSITE_FILTER_DIMENSIONS)[number];
  value?: string;
  onChange?: (val: string) => void;
  children: ReactElement<{ value?: string; onChange?: (val: string) => void }>;
}

function FilterBox({ field, value, onChange, children }: FilterBoxProps) {
  return (
    <div style={filterControlBox(field)}>
      {cloneElement(children, { value, onChange })}
    </div>
  );
}

export default function MentorForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Education sub-table
  const [educations, setEducations] = useState<MentorEducation[]>([]);
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<MentorEducation | null>(null);
  const [eduForm] = Form.useForm();
  const [eduLoading, setEduLoading] = useState(false);

  // Background sub-table
  const [backgrounds, setBackgrounds] = useState<MentorBackground[]>([]);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [editingBg, setEditingBg] = useState<MentorBackground | null>(null);
  const [bgForm] = Form.useForm();
  const [bgLoading, setBgLoading] = useState(false);

  // Bio block sub-table (详细介绍图文混排内容块)
  const [bioBlocks, setBioBlocks] = useState<MentorBioBlock[]>([]);
  const [bioBlockModalOpen, setBioBlockModalOpen] = useState(false);
  const [editingBioBlock, setEditingBioBlock] = useState<MentorBioBlock | null>(null);
  const [bioBlockForm] = Form.useForm();
  const [bioBlockLoading, setBioBlockLoading] = useState(false);
  // 弹窗内当前区块类型：Radio 用本地状态控制（不挂 Form.Item，避免
  // useWatch 在 Modal destroyOnClose 下对未挂载表单报 warning），
  // 保存时手动并入 payload。
  const [bioBlockType, setBioBlockType] = useState<'text' | 'image'>('text');

  // Clip sub-table
  const [clips, setClips] = useState<MentorClip[]>([]);
  const [clipModalOpen, setClipModalOpen] = useState(false);
  const [editingClip, setEditingClip] = useState<MentorClip | null>(null);
  const [clipForm] = Form.useForm();
  const [clipLoading, setClipLoading] = useState(false);

  // Review sub-table
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<MentorReview | null>(null);
  const [reviewForm] = Form.useForm();
  const [reviewLoading, setReviewLoading] = useState(false);

  // Tags
  const [allTags, setAllTags] = useState<TagType[]>([]);

  useEffect(() => {
    getTags({ page_size: 500 }).then((res) => setAllTags(res.data)).catch(() => {});
  }, []);

  // 官网筛选维度的数据驱动选项：从现有导师数据提取各维度去重值，
  // 与官网 mentors 页筛选下拉的数据源保持一致（参考 FrontSide extractOptions）。
  const [dimOptions, setDimOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getMentors({ page_size: 500 }).then((res) => {
      const values: Record<string, string[]> = {};
      for (const field of WEBSITE_FILTER_DIMENSIONS) {
        const key = field as keyof Mentor;
        values[field] = [
          ...new Set(
            (res.data || [])
              .map((m) => m[key])
              .filter((v): v is string => typeof v === 'string' && v.trim() !== ''),
          ),
        ].sort();
      }
      setDimOptions(values);
    }).catch(() => {});
  }, []);

  // 三个多值标签框与 tags 表的映射：值存标签名（新值还没有 id），
  // 保存时再解析成 {id} 或 {name, category} 交给后端 upsert。
  const MENTOR_TAG_FIELDS: { field: 'tagLanguages' | 'tagSkills' | 'tagSpecializations'; category: TagType['category']; label: string; placeholder: string }[] = [
    { field: 'tagLanguages', category: 'language', label: '语言 (languages)', placeholder: '选择或输入语言，回车添加...' },
    { field: 'tagSkills', category: 'skill', label: '技能 (keySkills)', placeholder: '选择或输入技能，回车添加...' },
    { field: 'tagSpecializations', category: 'industrySpecialization', label: '行业专长 (industrySpecialization)', placeholder: '选择或输入行业专长，回车添加...' },
  ];

  const tagOptionsByCategory = useCallback((category: TagType['category']) => {
    return allTags
      .filter((t) => t.category === category)
      .map((t) => ({ label: t.name, value: t.name }));
  }, [allTags]);

  // 按 category 拆出 name 回填三个框（表单值存名称而非 id，新值没有 id）
  const tagNamesByCategory = (tags: NonNullable<Mentor['tags']>, category: TagType['category']) =>
    tags.filter((t) => t.category === category).map((t) => t.name);

  const loadEducations = useCallback(async () => {
    if (!id) return;
    setEduLoading(true);
    try { const list = await getEducations(Number(id)); setEducations(list); }
    catch { message.error('加载教育经历失败'); }
    finally { setEduLoading(false); }
  }, [id]);

  const loadBackgrounds = useCallback(async () => {
    if (!id) return;
    setBgLoading(true);
    try { const list = await getBackgrounds(Number(id)); setBackgrounds(list); }
    catch { message.error('加载职业背景失败'); }
    finally { setBgLoading(false); }
  }, [id]);

  const loadBioBlocks = useCallback(async () => {
    if (!id) return;
    setBioBlockLoading(true);
    try { const list = await getBioBlocks(Number(id)); setBioBlocks(list); }
    catch { message.error('加载详细介绍区块失败'); }
    finally { setBioBlockLoading(false); }
  }, [id]);

  const loadClips = useCallback(async () => {
    if (!id) return;
    setClipLoading(true);
    try { const list = await getClips(Number(id)); setClips(list); }
    catch { message.error('加载教学片段失败'); }
    finally { setClipLoading(false); }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewLoading(true);
    try { const list = await getReviews(Number(id)); setReviews(list); }
    catch { message.error('加载学员评价失败'); }
    finally { setReviewLoading(false); }
  }, [id]);

  const loadMentor = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const m = await getMentor(Number(id));
      form.setFieldsValue({
        ...m,
        tagLanguages: tagNamesByCategory(m.tags || [], 'language'),
        tagSkills: tagNamesByCategory(m.tags || [], 'skill'),
        tagSpecializations: tagNamesByCategory(m.tags || [], 'industrySpecialization'),
      });
      loadEducations();
      loadBackgrounds();
      loadBioBlocks();
      loadClips();
      loadReviews();
    } catch { message.error('加载导师信息失败'); }
    finally { setLoading(false); }
  }, [id, form, loadEducations, loadBackgrounds, loadBioBlocks, loadClips, loadReviews]);

  useEffect(() => { loadMentor(); }, [loadMentor]);

  // 头像"上传即入库"：上传成功后立即更新 DB，无需等表单保存，
  // 后端会异步清理旧头像文件。新增模式下导师还没 ID，随表单一起保存。
  const handleAvatarUploaded = useCallback(async (url: string) => {
    if (!id) return;
    try {
      await updateMentorAvatar(Number(id), url);
    } catch {
      message.error('头像保存失败，请重新上传');
    }
  }, [id]);

  // 清洗输入标签：去控制字符与首尾空白（粘贴常带入制表符）。
  const sanitizeTagNames = (names: unknown): string[] =>
    (Array.isArray(names) ? names : [])
      .map((n) => String(n)
        .replace(/[\t\n\r]/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
        .trim(),
      )
      .filter((n) => n.length > 0);

  // 三个框的值 → 后端 tags 载荷：已有标签按 {id} 回传，新值按
  // {name, category} 交给后端在导师事务里 upsert（原子，失败一起回滚）。
  const buildTagsPayload = (values: Record<string, unknown>) => {
    const payloadTags: ({ id: number } | { name: string; category: TagType['category'] })[] = [];
    for (const { field, category } of MENTOR_TAG_FIELDS) {
      for (const name of sanitizeTagNames(values[field])) {
        const existing = allTags.find(
          (t) => t.category === category && t.name.toLowerCase() === name.toLowerCase(),
        );
        payloadTags.push(existing ? { id: existing.id } : { name, category });
      }
    }
    return payloadTags;
  };

  const onFinish = async (values: Record<string, unknown>) => {
    // [临时诊断] 确认保存时表单里 avatar 是什么值、最终 payload 是否携带
    // console.log('[mentor-save-debug] form values:', values);
    // console.log('[mentor-save-debug] avatar in values:', values.avatar);
    setSaving(true);
    const payload = { ...values };
    payload.tags = buildTagsPayload(values);
    for (const { field } of MENTOR_TAG_FIELDS) delete payload[field];
    try {
      if (isEdit) {
        await updateMentor(Number(id), payload);
        message.success('导师更新成功');
      } else {
        const created = await createMentor(payload);
        message.success('导师创建成功');
        navigate(`/mentors?new=${created.id}`, { replace: true });
        return;
      }
      navigate('/mentors');
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  // Education CRUD handlers
  const openAddEdu = () => {
    setEditingEdu(null);
    eduForm.resetFields();
    setEduModalOpen(true);
  };

  const openEditEdu = (record: MentorEducation) => {
    setEditingEdu(record);
    eduForm.setFieldsValue(record);
    setEduModalOpen(true);
  };

  const handleEduOk = async () => {
    const values = await eduForm.validateFields();
    try {
      if (editingEdu) {
        await updateEducation(Number(id), editingEdu.id, values);
        message.success('教育经历更新成功');
      } else {
        await createEducation(Number(id), values);
        message.success('教育经历添加成功');
      }
      // 保存成功后把新学校名写入标签表（学校下拉依赖 tags 表），失败不阻塞
      const school = (values as { schoolName?: string }).schoolName?.trim();
      if (school && !allTags.some((t) => t.category === 'school' && t.name.toLowerCase() === school.toLowerCase())) {
        createTag({ name: school, category: 'school' }).catch(() => {});
      }
      setEduModalOpen(false);
      loadEducations();
    } catch { message.error('保存教育经历失败'); }
  };

  const handleEduDelete = async (eduId: number) => {
    try {
      await deleteEducation(Number(id), eduId);
      message.success('教育经历删除成功');
      loadEducations();
    } catch { message.error('删除教育经历失败'); }
  };

  // Background CRUD handlers
  const openAddBg = () => {
    setEditingBg(null);
    bgForm.resetFields();
    setBgModalOpen(true);
  };

  const openEditBg = (record: MentorBackground) => {
    setEditingBg(record);
    bgForm.setFieldsValue(record);
    setBgModalOpen(true);
  };

  const handleBgOk = async () => {
    const values = await bgForm.validateFields();
    try {
      if (editingBg) {
        await updateBackground(Number(id), editingBg.id, values);
        message.success('职业背景更新成功');
      } else {
        await createBackground(Number(id), values);
        message.success('职业背景添加成功');
      }
      setBgModalOpen(false);
      loadBackgrounds();
    } catch { message.error('保存职业背景失败'); }
  };

  const handleBgDelete = async (bgId: number) => {
    try {
      await deleteBackground(Number(id), bgId);
      message.success('职业背景删除成功');
      loadBackgrounds();
    } catch { message.error('删除职业背景失败'); }
  };

  // Bio block CRUD handlers
  const openAddBioBlock = () => {
    setEditingBioBlock(null);
    bioBlockForm.resetFields();
    bioBlockForm.setFieldsValue({ blockType: 'text' });
    setBioBlockType('text');
    setBioBlockModalOpen(true);
  };

  const openEditBioBlock = (record: MentorBioBlock) => {
    setEditingBioBlock(record);
    bioBlockForm.setFieldsValue({
      content: record.content,
      imageUrl: record.imageUrl,
      caption: record.caption,
    });
    setBioBlockType(record.blockType);
    setBioBlockModalOpen(true);
  };

  const handleBioBlockOk = async () => {
    const values = await bioBlockForm.validateFields();
    try {
      if (editingBioBlock) {
        // 后端整块替换语义：回传完整区块（含 order），避免 partial 更新清不掉字段
        await updateBioBlock(Number(id), editingBioBlock.id, {
          ...editingBioBlock, ...values, blockType: bioBlockType,
        });
        message.success('区块更新成功');
      } else {
        await createBioBlock(Number(id), { ...values, blockType: bioBlockType, order: bioBlocks.length });
        message.success('区块添加成功');
      }
      setBioBlockModalOpen(false);
      loadBioBlocks();
    } catch { message.error('保存区块失败'); }
  };

  const handleBioBlockDelete = async (blockId: number) => {
    try {
      await deleteBioBlock(Number(id), blockId);
      message.success('区块删除成功');
      loadBioBlocks();
    } catch { message.error('删除区块失败'); }
  };

  // 上移/下移：与相邻区块交换 order（后端整块替换语义，回传完整区块）
  const moveBioBlock = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= bioBlocks.length) return;
    const current = bioBlocks[index];
    const neighbor = bioBlocks[target];
    try {
      await updateBioBlock(Number(id), current.id, { ...current, order: neighbor.order });
      await updateBioBlock(Number(id), neighbor.id, { ...neighbor, order: current.order });
      loadBioBlocks();
    } catch { message.error('调整区块顺序失败'); }
  };

  // Clip CRUD handlers
  const openAddClip = () => {
    setEditingClip(null);
    clipForm.resetFields();
    setClipModalOpen(true);
  };

  const openEditClip = (record: MentorClip) => {
    setEditingClip(record);
    clipForm.setFieldsValue(record);
    setClipModalOpen(true);
  };

  const handleClipOk = async () => {
    const values = await clipForm.validateFields();
    try {
      if (editingClip) {
        await updateClip(Number(id), editingClip.id, values);
        message.success('教学片段更新成功');
      } else {
        await createClip(Number(id), values);
        message.success('教学片段添加成功');
      }
      setClipModalOpen(false);
      loadClips();
    } catch { message.error('保存教学片段失败'); }
  };

  const handleClipDelete = async (clipId: number) => {
    try {
      await deleteClip(Number(id), clipId);
      message.success('教学片段删除成功');
      loadClips();
    } catch { message.error('删除教学片段失败'); }
  };

  // Review CRUD handlers
  const openAddReview = () => {
    setEditingReview(null);
    reviewForm.resetFields();
    setReviewModalOpen(true);
  };

  const openEditReview = (record: MentorReview) => {
    setEditingReview(record);
    reviewForm.setFieldsValue(record);
    setReviewModalOpen(true);
  };

  const handleReviewOk = async () => {
    const values = await reviewForm.validateFields();
    try {
      if (editingReview) {
        await updateReview(Number(id), editingReview.id, values);
        message.success('学员评价更新成功');
      } else {
        await createReview(Number(id), values);
        message.success('学员评价添加成功');
      }
      setReviewModalOpen(false);
      loadReviews();
    } catch { message.error('保存学员评价失败'); }
  };

  const handleReviewDelete = async (reviewId: number) => {
    try {
      await deleteReview(Number(id), reviewId);
      message.success('学员评价删除成功');
      loadReviews();
    } catch { message.error('删除学员评价失败'); }
  };

  const eduColumns: TableColumnsType<MentorEducation> = [
    { title: '学校', dataIndex: 'schoolName', key: 'schoolName' },
    { title: '国家', dataIndex: 'country', key: 'country', width: 80 },
    { title: '学位', dataIndex: 'degree', key: 'degree' },
    { title: '专业', dataIndex: 'major', key: 'major' },
    { title: '毕业年份', dataIndex: 'graduationYear', key: 'graduationYear', width: 90 },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: MentorEducation) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditEdu(record)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleEduDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const bgColumns: TableColumnsType<MentorBackground> = [
    { title: '内容', dataIndex: 'content', key: 'content' },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: MentorBackground) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditBg(record)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleBgDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const bioBlockColumns: TableColumnsType<MentorBioBlock> = [
    { title: '顺序', key: 'order', width: 56, render: (_: unknown, __: MentorBioBlock, index: number) => index + 1 },
    {
      title: '类型', dataIndex: 'blockType', key: 'blockType', width: 70,
      render: (t: MentorBioBlock['blockType']) => (
        <span style={{ color: t === 'image' ? '#1677ff' : '#52c41a' }}>{t === 'image' ? '图片' : '文字'}</span>
      ),
    },
    {
      title: '内容', key: 'content',
      render: (_: unknown, record: MentorBioBlock) =>
        record.blockType === 'image' ? (
          <Space size={8}>
            {record.imageUrl && (
              <img src={record.imageUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
            )}
            <Typography.Text type="secondary" ellipsis style={{ maxWidth: 400 }}>
              {record.caption || '(无图注)'}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text ellipsis style={{ maxWidth: 500, display: 'inline-block' }}>{record.content}</Typography.Text>
        ),
    },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: unknown, record: MentorBioBlock, index: number) => (
        <Space size={0}>
          <Tooltip title="上移">
            <Button type="link" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveBioBlock(index, -1)} />
          </Tooltip>
          <Tooltip title="下移">
            <Button type="link" icon={<ArrowDownOutlined />} disabled={index === bioBlocks.length - 1} onClick={() => moveBioBlock(index, 1)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditBioBlock(record)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleBioBlockDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const clipColumns: TableColumnsType<MentorClip> = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 220 },
    { title: '链接', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: MentorClip) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditClip(record)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleClipDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const reviewColumns: TableColumnsType<MentorReview> = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 140 },
    { title: '内容', dataIndex: 'content', key: 'content' },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 70 },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: MentorReview) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditReview(record)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleReviewDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <>
      <Card
        title={<Title level={4}>{isEdit ? '编辑导师' : '新增导师'}</Title>}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mentors')}>返回</Button>}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 900 }}>
          {/* Row 1: 基本信息 */}
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="name" label="姓名 (name)" rules={[{ required: true }]}>
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="title" label="职位 (title)" rules={[{ required: true }]}>
              <Input style={{ width: 200 }} placeholder="例如：Managing Director" />
            </Form.Item>
            <Form.Item name="company" label={filterFieldLabel('company', '公司 (company)')} tooltip="官网筛选维度" rules={[{ required: true }, noChineseRule('公司')]}>
              <FilterBox field="company">
                <TagSelect category="company" placeholder="选择或输入公司..." style={{ width: 180 }} extraOptions={dimOptions['company'] ?? []} />
              </FilterBox>
            </Form.Item>
            <Form.Item name="department" label={filterFieldLabel('department', '部门 (department)')} tooltip="官网筛选维度" rules={[noChineseRule('部门')]}>
              <FilterBox field="department">
                <TagSelect category="department" placeholder="选择或输入部门..." style={{ width: 160 }} extraOptions={dimOptions['department'] ?? []} />
              </FilterBox>
            </Form.Item>
          </Space>

          {/* Row 2: 分类信息 */}
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="category" label="领域 (category)" rules={[{ required: true }]}>
              <Select style={{ width: 140 }} options={[
                { label: '金融', value: 'finance' }, { label: '咨询', value: 'consulting' },
                { label: '科技', value: 'tech' }, { label: '医疗', value: 'healthcare' },
                { label: '法律', value: 'legal' }, { label: '其他', value: 'other' },
              ]} />
            </Form.Item>
            <Form.Item name="region" label={filterFieldLabel('region', '地区 (region)')} tooltip="官网筛选维度" rules={[noChineseRule('地区')]}>
              <FilterBox field="region">
                <TagSelect category="region" placeholder="选择或输入地区..." style={{ width: 160 }} extraOptions={dimOptions['region'] ?? []} />
              </FilterBox>
            </Form.Item>
            <Form.Item name="industry" label={filterFieldLabel('industry', '行业 (industry)')} tooltip="官网筛选维度" rules={[noChineseRule('行业')]}>
              <FilterBox field="industry">
                <TagSelect category="industry" placeholder="选择或输入行业..." style={{ width: 180 }} extraOptions={dimOptions['industry'] ?? []} />
              </FilterBox>
            </Form.Item>
            <Form.Item name="targetRole" label={filterFieldLabel('targetRole', '辅导求职职位 (targetRole)')} tooltip="官网筛选维度" rules={[noChineseRule('辅导求职职位')]}>
              <FilterBox field="targetRole">
                <TagSelect category="targetRole" placeholder="选择或输入职位..." style={{ width: 250 }} extraOptions={dimOptions['targetRole'] ?? []} />
              </FilterBox>
            </Form.Item>
            <Form.Item name="experience" label="经验 (experience)">
              <InputNumber style={{ width: 150 }} min={0} max={50} addonAfter="年" />
            </Form.Item>
          </Space>

          {/* Avatar */}
          <Form.Item name="avatar" label="头像 (avatar)">
            <ImageUploadField uploadDir="mentors" onUploaded={handleAvatarUploaded} />
          </Form.Item>

          {/* Bio */}
          <Form.Item name="shortBio" label="简介 (shortBio)" rules={[{ max: 500 }]}>
            <TextArea rows={2} placeholder="一句话简介，用于卡片展示" />
          </Form.Item>
          {/* 详细介绍图文区块：官网按顺序渲染 */}
          <Form.Item
            label="详细介绍区块 (bioBlocks)"
            extra={isEdit
              ? '图文混排内容块：每块为一段文字或一张图片（可带图注），官网按顺序渲染。'
              : '新增导师请先保存，保存后可在此添加图文区块。'}
          >
            <Table
              dataSource={bioBlocks}
              columns={bioBlockColumns}
              rowKey="id"
              loading={bioBlockLoading}
              pagination={false}
              size="small"
              style={{ maxWidth: 760 }}
              locale={{ emptyText: '暂无区块' }}
            />
            <Button type="dashed" icon={<PlusOutlined />} onClick={openAddBioBlock} disabled={!isEdit} style={{ marginTop: 8 }}>
              添加区块
            </Button>
          </Form.Item>

          <Divider orientation="left">标签关联</Divider>

          {MENTOR_TAG_FIELDS.map(({ field, category, label, placeholder }) => (
            <Form.Item
              key={field}
              name={field}
              label={label}
              extra={category === 'industrySpecialization' ? '官网导师卡片只显示前 3 个行业专长' : undefined}
              rules={[noChineseRule(label.replace(/ \(.*\)$/, ''))]}
            >
              <Select
                mode="tags"
                allowClear
                showSearch
                placeholder={placeholder}
                options={tagOptionsByCategory(category)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                style={{ maxWidth: 600 }}
              />
            </Form.Item>
          ))}

          <Divider orientation="left">显示设置</Divider>

          <Space size="large">
            <Form.Item name="featured" label="首页推荐 (featured)" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="order" label="排序权重 (order)">
              <InputNumber min={0} max={9999} />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/mentors')} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Card>

      {isEdit && (
        <Card title="教育经历" style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddEdu} style={{ marginBottom: 16 }}>添加教育经历</Button>
          <Table dataSource={educations} columns={eduColumns} rowKey="id" loading={eduLoading} pagination={false} />
        </Card>
      )}

      {isEdit && (
        <Card title="职业背景" style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddBg} style={{ marginBottom: 16 }}>添加职业背景</Button>
          <Table dataSource={backgrounds} columns={bgColumns} rowKey="id" loading={bgLoading} pagination={false} />
        </Card>
      )}

      {isEdit && (
        <Card title="教学片段" style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddClip} style={{ marginBottom: 16 }}>添加教学片段</Button>
          <Table dataSource={clips} columns={clipColumns} rowKey="id" loading={clipLoading} pagination={false} />
        </Card>
      )}

      {isEdit && (
        <Card title="学员评价" style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddReview} style={{ marginBottom: 16 }}>添加学员评价</Button>
          <Table dataSource={reviews} columns={reviewColumns} rowKey="id" loading={reviewLoading} pagination={false} />
        </Card>
      )}

      <Modal
        title={editingEdu ? '编辑教育经历' : '添加教育经历'}
        open={eduModalOpen}
        onOk={handleEduOk}
        onCancel={() => setEduModalOpen(false)}
        destroyOnClose
      >
        <Form form={eduForm} layout="vertical">
          <Form.Item name="schoolName" label="学校 (schoolName)" rules={[{ required: true }]}>
            <TagSelect category="school" placeholder="选择或输入学校..." style={{ width: 260 }} />
          </Form.Item>
          <Space size="middle">
            <Form.Item name="degree" label="学位 (degree)" rules={[{ required: true }]}>
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="major" label="专业 (major)">
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="country" label="国家 (country)">
              <Input style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="graduationYear" label="毕业年份 (graduationYear)">
              <InputNumber style={{ width: 100 }} min={1950} max={2030} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={editingBg ? '编辑职业背景' : '添加职业背景'}
        open={bgModalOpen}
        onOk={handleBgOk}
        onCancel={() => setBgModalOpen(false)}
        destroyOnClose
      >
        <Form form={bgForm} layout="vertical">
          <Form.Item name="content" label="内容 (content)" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="例如：10+ years in Investment Banking" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingBioBlock ? '编辑区块' : '添加区块'}
        open={bioBlockModalOpen}
        onOk={handleBioBlockOk}
        onCancel={() => setBioBlockModalOpen(false)}
        destroyOnClose
        width={720}
      >
        <Form form={bioBlockForm} layout="vertical">
          <Form.Item label="类型 (blockType)" required>
            <Radio.Group
              value={bioBlockType}
              onChange={(e) => setBioBlockType(e.target.value)}
              options={[
                { label: '文字', value: 'text' },
                { label: '图片', value: 'image' },
              ]}
              optionType="button"
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="文字内容 (content)"
            rules={bioBlockType === 'text' ? [{ required: true, message: '文字区块必须填写内容' }] : []}
            style={{ display: bioBlockType === 'text' ? 'block' : 'none' }}
          >
            <TextArea rows={8} placeholder="段落文字，支持换行（官网保留换行）" />
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="图片 (imageUrl)"
            extra="上传保存到 /uploads/mentors-bio/"
            rules={bioBlockType === 'image' ? [{ required: true, message: '图片区块必须上传图片' }] : []}
            style={{ display: bioBlockType === 'image' ? 'block' : 'none' }}
          >
            <ImageUploadField uploadDir="mentors-bio" previewWidth={160} previewHeight={160} />
          </Form.Item>
          <Form.Item
            name="caption"
            label="图注 (caption)"
            style={{ display: bioBlockType === 'image' ? 'block' : 'none' }}
          >
            <Input placeholder="可选，图片下方说明文字" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingClip ? '编辑教学片段' : '添加教学片段'}
        open={clipModalOpen}
        onOk={handleClipOk}
        onCancel={() => setClipModalOpen(false)}
        destroyOnClose
      >
        <Form form={clipForm} layout="vertical">
          <Form.Item name="title" label="标题 (title)">
            <Input placeholder="例如：Case Interview 示范" />
          </Form.Item>
          <Form.Item name="url" label="链接 URL (url)" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingReview ? '编辑学员评价' : '添加学员评价'}
        open={reviewModalOpen}
        onOk={handleReviewOk}
        onCancel={() => setReviewModalOpen(false)}
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical">
          <Space size="middle">
            <Form.Item name="studentName" label="学生姓名 (studentName)">
              <Input style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="rating" label="评分 (rating)" initialValue={5}>
              <InputNumber min={1} max={5} style={{ width: 80 }} />
            </Form.Item>
          </Space>
          <Form.Item name="content" label="评价内容 (content)" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
