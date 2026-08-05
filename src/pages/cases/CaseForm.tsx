import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Space, message, Typography, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getCase, createCase, updateCase } from '../../api/cases';

const { Title } = Typography;
const { TextArea } = Input;

export default function CaseForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getCase(Number(id))
        .then((c) => form.setFieldsValue(c))
        .catch(() => message.error('Failed to load case'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateCase(Number(id), values);
        message.success('Case updated');
      } else {
        await createCase(values);
        message.success('Case created');
      }
      navigate('/cases');
    } catch { message.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card
      title={<Title level={4}>{isEdit ? 'Edit Case' : 'New Case'}</Title>}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>Back</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 900 }}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select options={[
            { label: 'Career Change', value: 'Career Change' },
            { label: 'Resume', value: 'Resume' },
            { label: 'Interview', value: 'Interview' },
            { label: 'Networking', value: 'Networking' },
            { label: 'Negotiation', value: 'Negotiation' },
            { label: 'General', value: 'General' },
          ]} />
        </Form.Item>
        <Form.Item name="content" label="Content" rules={[{ required: true }]}>
          <TextArea rows={8} placeholder="Main content of the case..." />
        </Form.Item>
        <Form.Item name="challenge" label="Challenge">
          <TextArea rows={4} placeholder="What challenge did the student face?" />
        </Form.Item>
        <Form.Item name="strategy" label="Strategy">
          <TextArea rows={4} placeholder="What strategy was employed?" />
        </Form.Item>
        <Form.Item name="outcome" label="Outcome">
          <TextArea rows={4} placeholder="What was the outcome?" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button onClick={() => navigate('/cases')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
