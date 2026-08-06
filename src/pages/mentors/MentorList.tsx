import { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Typography, Tag, Avatar, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMentors, deleteMentor, type Mentor } from '../../api/mentors';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function MentorList() {
  const [data, setData] = useState<Mentor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('new');
  const { isOperatorOrAdmin } = useAuth();
  const navigate = useNavigate();

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, setSearchParams]);

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

  const columns: TableColumnsType<Mentor> = [
    {
      title: '头像', dataIndex: 'avatar', key: 'avatar', width: 60,
      render: (v: string) => <Avatar src={v} size="small" />,
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '职位', dataIndex: 'title', key: 'title', width: 130, ellipsis: true },
    { title: '公司', dataIndex: 'company', key: 'company', width: 120 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '领域', dataIndex: 'category', key: 'category', width: 80,
      render: (v: string) => v ? <Tag>{v}</Tag> : null,
    },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 100, ellipsis: true },
    { title: '地区', dataIndex: 'region', key: 'region', width: 80 },
    { title: '经验(年)', dataIndex: 'experience', key: 'experience', width: 80 },
    { title: '推荐', dataIndex: 'featured', key: 'featured', width: 70,
      render: (v: boolean) => v ? <Tag color="gold">是</Tag> : null,
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 100, fixed: 'right' as const,
      render: (_: unknown, record: Mentor) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/mentors/${record.id}/edit`)} />
          </Tooltip>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
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
        rowClassName={(record) =>
          highlightId && String(record.id) === highlightId
            ? 'mentor-row-highlight'
            : ''
        }
      />
    </>
  );
}
