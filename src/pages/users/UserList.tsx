import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser, type User } from '../../api/users';

const { Title } = Typography;

const roleColors: Record<string, string> = {
  admin: 'red',
  operator: 'blue',
  normal: 'default',
};

export default function UserList() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const load = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const res = await getUsers({ page: p, page_size: 20 });
      setData(res.data); setTotal(res.total);
    } catch { message.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try { await deleteUser(id); message.success('User deleted/disabled'); load(); }
    catch { message.error('Failed to delete user'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Display Name', dataIndex: 'display_name', key: 'display_name' },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 110,
      render: (v: string) => <Tag color={roleColors[v] || 'default'}>{v?.toUpperCase()}</Tag>,
    },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 90,
      render: (v: number) => v === 1 ? <Tag color="green">Active</Tag> : <Tag color="red">Disabled</Tag>,
    },
    { title: 'Last Login', dataIndex: 'last_login_at', key: 'last_login_at', width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : 'Never',
    },
    {
      title: 'Actions', key: 'actions', width: 140,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/users/${record.id}/edit`)}>Edit</Button>
          <Popconfirm title="Delete/Disable this user?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Users</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>Add User</Button>
      </div>
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
      />
    </>
  );
}
