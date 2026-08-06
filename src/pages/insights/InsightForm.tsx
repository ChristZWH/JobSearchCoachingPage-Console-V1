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
        .catch(() => message.error('加载洞察失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateInsight(Number(id), values);
        message.success('洞察更新成功');
      } else {
        await createInsight(values);
        message.success('洞察创建成功');
      }
      navigate('/insights');
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card
      title={<Title level={4}>{isEdit ? '编辑洞察' : '新增洞察'}</Title>}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/insights')}>返回</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 900 }}>
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="slug" label="别名"
          rules={[{ required: true, message: '请输入URL友好的唯一标识' }]}
          tooltip="URL友好的唯一标识（例如：'my-insight-post'）"
        >
          <Input disabled={isEdit} />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true }]}>
          <TextArea rows={12} placeholder="Markdown或HTML格式的完整内容..." />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/insights')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
