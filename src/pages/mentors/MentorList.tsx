import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Typography, Tag, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMentors, deleteMentor, type Mentor } from '../../api/mentors';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function MentorList() {
  const [data, setData] = useState<Mentor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { isOperatorOrAdmin } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async (p: number = page, s: string = search) => {
    setLoading(true);
    try {
      const res = await getMentors({ page: p, page_size: 20, search: s || undefined });
      setData(res.data); setTotal(res.total);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try { await deleteMentor(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    {
      title: '头像', dataIndex: 'avatar', key: 'avatar', width: 60,
      render: (v: string) => <Avatar src={v} size="small" />,
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '职位', dataIndex: 'title', key: 'title', width: 150 },
    { title: '公司', dataIndex: 'company', key: 'company', width: 140 },
    { title: '简介', dataIndex: 'intro', key: 'intro', ellipsis: true },
    { title: '语言', dataIndex: 'languages', key: 'languages', width: 150,
      render: (v: string[]) => (Array.isArray(v) ? v.join(', ') : ''),
    },
    { title: '技能', dataIndex: 'key_skills', key: 'key_skills', width: 180,
      render: (v: string[]) => (Array.isArray(v) ? v.slice(0, 3).map((s: string) => <Tag key={s}>{s}</Tag>) : ''),
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 140, fixed: 'right' as const,
      render: (_: unknown, record: Mentor) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/mentors/${record.id}/edit`)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>导师管理</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/mentors/new')}>新增</Button>}
      </div>
      <Input.Search
        placeholder="搜索导师..."
        allowClear
        onSearch={(v) => { setPage(1); setSearch(v); load(1, v); }}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
        scroll={{ x: 1100 }}
      />
    </>
  );
}
