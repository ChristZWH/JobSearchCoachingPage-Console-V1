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
          <Form.Item name="industry" label="行业">
            <Input style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="company" label="目标公司">
            <Input style={{ width: 200 }} />
          </Form.Item>
        </Space>
        <Space size="middle">
          <Form.Item name="studentName" label="学员姓名">
            <Input style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="result" label="成果">
            <Input style={{ width: 300 }} placeholder="e.g. 获得 Goldman Sachs Offer" />
          </Form.Item>
          <Form.Item name="image" label="展示图URL">
            <Input style={{ width: 280 }} placeholder="https://..." />
          </Form.Item>
        </Space>
        <Form.Item name="description" label="简介">
          <TextArea rows={2} placeholder="案例简要描述..." />
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
