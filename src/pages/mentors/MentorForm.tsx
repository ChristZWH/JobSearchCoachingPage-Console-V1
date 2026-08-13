import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Typography, Spin,
  Table, Modal, Popconfirm, Divider, Select, InputNumber, Switch, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  getMentor, createMentor, updateMentor,
  getEducations, createEducation, updateEducation, deleteEducation,
  getBackgrounds, createBackground, updateBackground, deleteBackground,
  getClips, createClip, updateClip, deleteClip,
  getReviews, createReview, updateReview, deleteReview,
  type MentorEducation, type MentorBackground, type MentorClip, type MentorReview,
} from '../../api/mentors';
import { getTags, type Tag as TagType } from '../../api/tags';
import TagSelect from '../../components/TagSelect';
import ImageUploadField from '../../components/ImageUploadField';

const { Title } = Typography;
const { TextArea } = Input;

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
    getTags({ page_size: 200 }).then((res) => setAllTags(res.data)).catch(() => {});
  }, []);

  // Build tag options for Select
  const tagOptions = useMemo(() => {
    const grouped: Record<string, { label: string; value: number }[]> = {};
    allTags.forEach((t) => {
      const cat = t.category === 'industry' ? '行业' : t.category === 'company' ? '公司' : t.category === 'department' ? '部门' : t.category === 'school' ? '学校' : t.category === 'language' ? '语言' : t.category === 'skill' ? '技能' : t.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ label: t.name, value: t.id });
    });
    return Object.entries(grouped).map(([group, opts]) => ({ label: group, options: opts }));
  }, [allTags]);

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
        tags: (m.tags || []).map((t) => t.id),
      });
      loadEducations();
      loadBackgrounds();
      loadClips();
      loadReviews();
    } catch { message.error('加载导师信息失败'); }
    finally { setLoading(false); }
  }, [id, form, loadEducations, loadBackgrounds, loadClips, loadReviews]);

  useEffect(() => { loadMentor(); }, [loadMentor]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    // Convert tag IDs to backend format: [1,2,3] → [{id:1},{id:2},{id:3}]
    const payload = { ...values };
    if (Array.isArray(payload.tags)) {
      payload.tags = (payload.tags as number[]).map((id: number) => ({ id }));
    }
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
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="title" label="职位" rules={[{ required: true }]}>
              <Input style={{ width: 200 }} placeholder="例如：Managing Director" />
            </Form.Item>
            <Form.Item name="company" label="公司" rules={[{ required: true }]}>
              <TagSelect category="company" placeholder="选择或输入公司..." style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="department" label="部门">
              <TagSelect category="department" placeholder="选择或输入部门..." style={{ width: 160 }} />
            </Form.Item>
          </Space>

          {/* Row 2: 分类信息 */}
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="category" label="领域" rules={[{ required: true }]}>
              <Select style={{ width: 140 }} options={[
                { label: '金融', value: 'finance' }, { label: '咨询', value: 'consulting' },
                { label: '科技', value: 'tech' }, { label: '医疗', value: 'healthcare' },
                { label: '法律', value: 'legal' }, { label: '其他', value: 'other' },
              ]} />
            </Form.Item>
            <Form.Item name="region" label="地区">
              <Select style={{ width: 140 }} options={[
                { label: '北美', value: 'North America' }, { label: '欧洲', value: 'Europe' },
                { label: '亚洲', value: 'Asia' }, { label: '大洋洲', value: 'Oceania' },
                { label: '其他', value: 'Other' },
              ]} />
            </Form.Item>
            <Form.Item name="industry" label="行业">
              <TagSelect category="industry" placeholder="选择或输入行业..." style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="targetRole" label="目标职位">
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="experience" label="经验(年)">
              <InputNumber style={{ width: 80 }} min={0} max={50} />
            </Form.Item>
          </Space>

          {/* Avatar */}
          <Form.Item name="avatar" label="头像">
            <ImageUploadField />
          </Form.Item>

          {/* Bio */}
          <Form.Item name="shortBio" label="简介" rules={[{ max: 500 }]}>
            <TextArea rows={2} placeholder="一句话简介，用于卡片展示" />
          </Form.Item>
          <Form.Item name="bio" label="详细介绍 (bio)">
            <TextArea rows={4} placeholder="完整个人介绍" />
          </Form.Item>

          <Divider orientation="left">标签关联</Divider>

          <Form.Item name="tags" label="标签（语言 / 技能 / 行业专长等）" extra="职业背景、教学片段、学员评价在下方独立管理">
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="选择已有标签..."
              options={tagOptions}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ maxWidth: 600 }}
            />
          </Form.Item>

          <Divider orientation="left">显示设置</Divider>

          <Space size="large">
            <Form.Item name="featured" label="首页推荐" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="order" label="排序权重">
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
          <Form.Item name="schoolName" label="学校" rules={[{ required: true }]}>
            <TagSelect category="school" placeholder="选择或输入学校..." style={{ width: 260 }} />
          </Form.Item>
          <Space size="middle">
            <Form.Item name="degree" label="学位" rules={[{ required: true }]}>
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="major" label="专业">
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="country" label="国家">
              <Input style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="graduationYear" label="毕业年份">
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
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="例如：10+ years in Investment Banking" />
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
          <Form.Item name="title" label="标题">
            <Input placeholder="例如：Case Interview 示范" />
          </Form.Item>
          <Form.Item name="url" label="链接 URL" rules={[{ required: true }]}>
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
            <Form.Item name="studentName" label="学生姓名">
              <Input style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="rating" label="评分" initialValue={5}>
              <InputNumber min={1} max={5} style={{ width: 80 }} />
            </Form.Item>
          </Space>
          <Form.Item name="content" label="评价内容" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
