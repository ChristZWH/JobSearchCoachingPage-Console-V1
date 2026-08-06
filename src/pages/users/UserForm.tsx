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
        .catch(() => message.error('加载用户失败'))
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
        message.success('用户更新成功');
      } else {
        await createUser(values as { username: string; password: string; display_name: string; role: string });
        message.success('用户创建成功');
      }
      navigate('/users');
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card
      title={<Title level={4}>{isEdit ? '编辑用户' : '新增用户'}</Title>}
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>返回</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        {!isEdit && (
          <>
            <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3 }]}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, min: 8 }]}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </>
        )}

        <Form.Item name="display_name" label="显示名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="role" label="角色" rules={[{ required: true }]}>
          <Select options={[
            { label: '管理员', value: 'admin' },
            { label: '运营', value: 'operator' },
            { label: '普通', value: 'normal' },
          ]} />
        </Form.Item>

        {isEdit && (
          <>
            <Form.Item name="status" label="状态">
              <Select options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]} />
            </Form.Item>

            <Form.Item
              name="password" label="新密码"
              tooltip="留空则保持当前密码"
              rules={[{ min: 8, message: '最少8个字符' }]}
            >
              <Input.Password placeholder="留空则保持当前密码" autoComplete="new-password" />
            </Form.Item>

            <p style={{ color: '#999' }}>
              用户名: <strong>{user?.username}</strong> (不可修改)
            </p>
          </>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/users')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
