import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Card, Space, message, Typography, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getInsight, createInsight, updateInsight } from '../../api/insights';

const { Title } = Typography;
const { TextArea } = Input;

export default function InsightForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getInsight(Number(id))
        .then((c) => form.setFieldsValue(c))
        .catch(() => message.error('Failed to load insight'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateInsight(Number(id), values);
        message.success('Insight updated');
      } else {
        await createInsight(values);
        message.success('Insight created');
      }
      navigate('/insights');
    } catch { message.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card
      title={<Title level={4}>{isEdit ? 'Edit Insight' : 'New Insight'}</Title>}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/insights')}>Back</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 900 }}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="slug" label="Slug"
          rules={[{ required: true, message: 'URL-friendly unique slug' }]}
          tooltip="URL-friendly unique identifier (e.g. 'my-insight-post')"
        >
          <Input disabled={isEdit} />
        </Form.Item>
        <Form.Item name="content" label="Content" rules={[{ required: true }]}>
          <TextArea rows={12} placeholder="Full content in markdown or HTML..." />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button onClick={() => navigate('/insights')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
