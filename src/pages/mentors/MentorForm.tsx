import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Button, Card, Space, message, Typography, Spin,
  Table, Modal, Popconfirm, Tabs, Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import {
  getMentor, createMentor, updateMentor,
  getEducations, createEducation, updateEducation, deleteEducation,
  type MentorEducation,
} from '../../api/mentors';
import { getTags, type Tag as TagType } from '../../api/tags';
import { StringArrayEditor } from '../../components/JsonEditor';

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
    } catch { message.error('Failed to load mentor'); }
    finally { setLoading(false); }
  };

  const loadEducations = async () => {
    if (!id) return;
    setEduLoading(true);
    try { const list = await getEducations(Number(id)); setEducations(list); }
    catch { message.error('Failed to load educations'); }
    finally { setEduLoading(false); }
  };

  useEffect(() => { loadMentor(); }, [id, isEdit]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateMentor(Number(id), values);
        message.success('Mentor updated');
      } else {
        const created = await createMentor(values);
        message.success('Mentor created');
        navigate(`/mentors/${created.id}/edit`, { replace: true });
        return;
      }
      navigate('/mentors');
    } catch { message.error('Failed to save'); }
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
        message.success('Education updated');
      } else {
        await createEducation(Number(id), values);
        message.success('Education added');
      }
      setEduModalOpen(false);
      loadEducations();
    } catch { message.error('Failed to save education'); }
  };

  const handleEduDelete = async (eduId: number) => {
    try {
      await deleteEducation(Number(id), eduId);
      message.success('Education deleted');
      loadEducations();
    } catch { message.error('Failed to delete education'); }
  };

  const eduColumns = [
    { title: 'School', dataIndex: 'school_name', key: 'school_name' },
    { title: 'Degree', dataIndex: 'degree', key: 'degree' },
    { title: 'Major', dataIndex: 'major', key: 'major' },
    { title: 'Start', dataIndex: 'start_year', key: 'start_year', width: 80 },
    { title: 'End', dataIndex: 'end_year', key: 'end_year', width: 80 },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: MentorEducation) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditEdu(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleEduDelete(record.id)}>
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
        title={<Title level={4}>{isEdit ? 'Edit Mentor' : 'New Mentor'}</Title>}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mentors')}>Back</Button>}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 900 }}>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="company" label="Company">
              <Input style={{ width: 240 }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="avatar" label="Avatar URL">
              <Input style={{ width: 280 }} placeholder="https://..." />
            </Form.Item>
            <Form.Item name="image" label="Image URL">
              <Input style={{ width: 280 }} placeholder="https://..." />
            </Form.Item>
            <Form.Item name="background_image" label="Background Image URL">
              <Input style={{ width: 280 }} placeholder="https://..." />
            </Form.Item>
          </Space>

          <Form.Item name="intro" label="Introduction">
            <TextArea rows={3} placeholder="Brief introduction..." />
          </Form.Item>

          <Divider orientation="left">Details</Divider>

          <Form.Item name="languages" label="Languages">
            <StringArrayEditor placeholder="e.g. English" />
          </Form.Item>

          <Form.Item name="key_skills" label="Key Skills">
            <StringArrayEditor placeholder="e.g. Product Management" />
          </Form.Item>

          <Form.Item name="reviews" label="Reviews (JSON)">
            <StringArrayEditor placeholder="Review content" />
          </Form.Item>

          <Form.Item name="teaching_clips" label="Teaching Clips (JSON)">
            <StringArrayEditor placeholder="Clip URL or description" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button onClick={() => navigate('/mentors')} style={{ marginLeft: 8 }}>Cancel</Button>
          </Form.Item>
        </Form>
      </Card>

      {isEdit && (
        <Card title="Educations" style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddEdu} style={{ marginBottom: 16 }}>Add Education</Button>
          <Table dataSource={educations} columns={eduColumns} rowKey="id" loading={eduLoading} pagination={false} />
        </Card>
      )}

      <Modal
        title={editingEdu ? 'Edit Education' : 'Add Education'}
        open={eduModalOpen}
        onOk={handleEduOk}
        onCancel={() => setEduModalOpen(false)}
        destroyOnClose
      >
        <Form form={eduForm} layout="vertical">
          <Form.Item name="school_name" label="School" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="degree" label="Degree" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="major" label="Major">
            <Input />
          </Form.Item>
          <Space size="middle">
            <Form.Item name="start_year" label="Start Year">
              <Input type="number" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="end_year" label="End Year">
              <Input type="number" style={{ width: 120 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
