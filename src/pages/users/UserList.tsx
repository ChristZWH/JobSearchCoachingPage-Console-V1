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
    } catch { message.error('加载用户失败'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try { await deleteUser(id); message.success('用户已删除/禁用'); load(); }
    catch { message.error('删除用户失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '显示名称', dataIndex: 'display_name', key: 'display_name' },
    { title: '角色', dataIndex: 'role', key: 'role', width: 110,
      render: (v: string) => <Tag color={roleColors[v] || 'default'}>{v?.toUpperCase()}</Tag>,
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: number) => v === 1 ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>,
    },
    { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : '从未',
    },
    {
      title: '操作', key: 'actions', width: 140,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/users/${record.id}/edit`)}>编辑</Button>
          <Popconfirm title="删除/禁用该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>用户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>新增用户</Button>
      </div>
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
      />
    </>
  );
}
