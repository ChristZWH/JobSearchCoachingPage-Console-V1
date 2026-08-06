import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Typography, Spin,
  Table, Modal, Popconfirm, Divider, Upload, Image, Select, InputNumber, Switch, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps, TableColumnsType } from 'antd';
import {
  getMentor, createMentor, updateMentor,
  getEducations, createEducation, updateEducation, deleteEducation,
  type MentorEducation,
} from '../../api/mentors';
import { getTags, type Tag as TagType } from '../../api/tags';
import { StringArrayEditor, ReviewListEditor, ClipListEditor } from '../../components/JsonEditor';
import TagSelect from '../../components/TagSelect';
import { getAccessToken } from '../../utils/storage';

const { Title } = Typography;
const { TextArea } = Input;

/** Image upload field — upload file or paste URL, shows preview */
function ImageUploadField({ value, onChange }: { value?: string; onChange?: (url: string) => void }) {
  const [urlInput, setUrlInput] = useState(value || '');

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/admin/upload',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const url = info.file.response?.data?.url || info.file.response?.url;
        if (url) {
          onChange?.(url);
          setUrlInput(url);
          message.success('上传成功');
        }
      } else if (info.file.status === 'error') {
        message.error('上传失败');
      }
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {value && (
          <Image src={value} width={80} height={80} style={{ borderRadius: 8, objectFit: 'cover' }} />
        )}
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
        <Input
          style={{ width: 200 }}
          placeholder="或粘贴URL"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            onChange?.(e.target.value);
          }}
          allowClear
        />
      </div>
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

  // Tags
  const [allTags, setAllTags] = useState<TagType[]>([]);

  useEffect(() => {
    getTags({ page_size: 200 }).then((res) => setAllTags(res.data)).catch(() => {});
  }, []);

  // Build tag options for Select
  const tagOptions = useMemo(() => {
    const grouped: Record<string, { label: string; value: number }[]> = {};
    allTags.forEach((t) => {
      const cat = t.category === 'industry' ? '行业' : t.category === 'company' ? '公司' : t.category === 'department' ? '部门' : t.category === 'school' ? '学校' : t.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ label: t.name, value: t.id });
    });
    return Object.entries(grouped).map(([group, opts]) => ({ label: group, options: opts }));
  }, [allTags]);

  const loadMentor = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const m = await getMentor(Number(id));
      form.setFieldsValue({
        ...m,
        tags: (m.tags || []).map((t) => t.id),
      });
      loadEducations();
    } catch { message.error('加载导师信息失败'); }
    finally { setLoading(false); }
  };

  const loadEducations = async () => {
    if (!id) return;
    setEduLoading(true);
    try { const list = await getEducations(Number(id)); setEducations(list); }
    catch { message.error('加载教育经历失败'); }
    finally { setEduLoading(false); }
  };

  useEffect(() => { loadMentor(); }, [id, isEdit]);

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
              <TagSelect category="department" placeholder="选择或输入职位..." style={{ width: 200 }} />
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

          <Divider orientation="left">详细信息</Divider>

          {/* JSON 数组字段 */}
          <Form.Item name="professionalBackground" label="职业背景">
            <StringArrayEditor placeholder="例如：10+ years in Investment Banking" />
          </Form.Item>

          <Form.Item name="industrySpecialization" label="行业专长">
            <StringArrayEditor placeholder="例如：Investment Banking" />
          </Form.Item>

          <Form.Item name="languages" label="语言">
            <StringArrayEditor placeholder="例如：English" />
          </Form.Item>

          <Form.Item name="keySkills" label="核心技能">
            <StringArrayEditor placeholder="例如：M&A Advisory" />
          </Form.Item>

          <Form.Item name="reviews" label="学员评价">
            <ReviewListEditor />
          </Form.Item>

          <Form.Item name="teachingClips" label="教学片段">
            <ClipListEditor />
          </Form.Item>

          <Divider orientation="left">标签关联</Divider>

          <Form.Item name="tags" label="标签">
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
    </>
  );
}
