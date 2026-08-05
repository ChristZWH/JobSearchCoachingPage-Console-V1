import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Space, message, Typography, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, type User } from '../../api/users';

const { Title } = Typography;

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getUsers({ page: 1, page_size: 100 })
        .then((res) => {
          const u = res.data.find((u: User) => u.id === Number(id));
          if (u) {
            setUser(u);
            form.setFieldsValue({ display_name: u.display_name, role: u.role, status: u.status });
          }
        })
        .catch(() => message.error('Failed to load user'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          display_name: values.display_name,
          role: values.role,
          status: values.status,
        };
        if (values.password) {
          payload.password = values.password;
        }
        await updateUser(Number(id), payload);
        message.success('User updated');
      } else {
        await createUser(values as { username: string; password: string; display_name: string; role: string });
        message.success('User created');
      }
      navigate('/users');
    } catch { message.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card
      title={<Title level={4}>{isEdit ? 'Edit User' : 'New User'}</Title>}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>Back</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        {!isEdit && (
          <>
            <Form.Item name="username" label="Username" rules={[{ required: true, min: 3 }]}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </>
        )}

        <Form.Item name="display_name" label="Display Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Operator', value: 'operator' },
            { label: 'Normal', value: 'normal' },
          ]} />
        </Form.Item>

        {isEdit && (
          <>
            <Form.Item name="status" label="Status">
              <Select options={[
                { label: 'Active', value: 1 },
                { label: 'Disabled', value: 0 },
              ]} />
            </Form.Item>

            <Form.Item
              name="password" label="New Password"
              tooltip="Leave blank to keep current password"
              rules={[{ min: 8, message: 'Minimum 8 characters' }]}
            >
              <Input.Password placeholder="Leave blank to keep current" autoComplete="new-password" />
            </Form.Item>

            <p style={{ color: '#999' }}>
              Username: <strong>{user?.username}</strong> (cannot be changed)
            </p>
          </>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button onClick={() => navigate('/users')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
