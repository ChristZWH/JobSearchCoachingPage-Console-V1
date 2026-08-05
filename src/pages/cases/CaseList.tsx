import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCases, deleteCase, type StudentCase } from '../../api/cases';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function CaseList() {
  const [data, setData] = useState<StudentCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { isOperatorOrAdmin } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async (p: number = page, s: string = search) => {
    setLoading(true);
    try {
      const res = await getCases({ page: p, page_size: 20, search: s || undefined });
      setData(res.data); setTotal(res.total);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try { await deleteCase(id); message.success('Deleted'); load(); }
    catch { message.error('Failed to delete'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true, width: 300,
      render: (v: string) => v?.substring(0, 100) ?? '',
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: 'Actions', key: 'actions', width: 140,
      render: (_: unknown, record: StudentCase) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/cases/${record.id}/edit`)}>Edit</Button>
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Student Cases</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/cases/new')}>Add</Button>}
      </div>
      <Input.Search
        placeholder="Search cases..."
        allowClear
        onSearch={(v) => { setPage(1); setSearch(v); load(1, v); }}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
      />
    </>
  );
}
