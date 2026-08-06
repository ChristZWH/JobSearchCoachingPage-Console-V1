import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Typography, Spin,
  Table, Modal, Popconfirm, Divider, Upload, Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  getMentor, createMentor, updateMentor,
  getEducations, createEducation, updateEducation, deleteEducation,
  type MentorEducation,
} from '../../api/mentors';
import { getTags, type Tag as TagType } from '../../api/tags';
import { StringArrayEditor } from '../../components/JsonEditor';
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

  const loadMentor = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const m = await getMentor(Number(id));
      form.setFieldsValue(m);
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
    try {
      if (isEdit) {
        await updateMentor(Number(id), values);
        message.success('导师更新成功');
      } else {
        const created = await createMentor(values);
        message.success('导师创建成功');
        navigate(`/mentors/${created.id}/edit`, { replace: true });
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

  const eduColumns = [
    { title: '学校', dataIndex: 'school_name', key: 'school_name' },
    { title: '学位', dataIndex: 'degree', key: 'degree' },
    { title: '专业', dataIndex: 'major', key: 'major' },
    { title: '开始', dataIndex: 'start_year', key: 'start_year', width: 80 },
    { title: '结束', dataIndex: 'end_year', key: 'end_year', width: 80 },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: unknown, record: MentorEducation) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditEdu(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => handleEduDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
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
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
              <Input style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="title" label="职位" rules={[{ required: true }]}>
              <Input style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="company" label="公司">
              <Input style={{ width: 240 }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="avatar" label="头像">
              <ImageUploadField />
            </Form.Item>
            <Form.Item name="image" label="展示图">
              <ImageUploadField />
            </Form.Item>
            <Form.Item name="background_image" label="背景图">
              <ImageUploadField />
            </Form.Item>
          </Space>

          <Form.Item name="intro" label="个人介绍">
            <TextArea rows={3} placeholder="简要介绍..." />
          </Form.Item>

          <Divider orientation="left">详细信息</Divider>

          <Form.Item name="languages" label="语言">
            <StringArrayEditor placeholder="例如：英语" />
          </Form.Item>

          <Form.Item name="key_skills" label="核心技能">
            <StringArrayEditor placeholder="例如：产品管理" />
          </Form.Item>

          <Form.Item name="reviews" label="评价 (JSON)">
            <StringArrayEditor placeholder="评价内容" />
          </Form.Item>

          <Form.Item name="teaching_clips" label="教学片段 (JSON)">
            <StringArrayEditor placeholder="片段链接或描述" />
          </Form.Item>

          <Form.Item>
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
          <Form.Item name="school_name" label="学校" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="degree" label="学位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="major" label="专业">
            <Input />
          </Form.Item>
          <Space size="middle">
            <Form.Item name="start_year" label="起始年份">
              <Input type="number" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="end_year" label="结束年份">
              <Input type="number" style={{ width: 120 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
