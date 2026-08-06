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
        .catch(() => message.error('加载案例失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values: Record<string, unknown>) => {
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
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category" label="分类" rules={[{ required: true }]}>
          <Select options={[
            { label: '职业转型', value: 'Career Change' },
            { label: '简历', value: 'Resume' },
            { label: '面试', value: 'Interview' },
            { label: '人脉拓展', value: 'Networking' },
            { label: '薪资谈判', value: 'Negotiation' },
            { label: '综合', value: 'General' },
          ]} />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true }]}>
          <TextArea rows={8} placeholder="案例主要内容..." />
        </Form.Item>
        <Form.Item name="challenge" label="挑战">
          <TextArea rows={4} placeholder="学员面临的挑战是什么？" />
        </Form.Item>
        <Form.Item name="strategy" label="策略">
          <TextArea rows={4} placeholder="采取了什么策略？" />
        </Form.Item>
        <Form.Item name="outcome" label="结果">
          <TextArea rows={4} placeholder="结果如何？" />
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
