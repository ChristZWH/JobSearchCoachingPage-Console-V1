import { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Button, Space, Input, message, Popconfirm, Typography, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getInsights, deleteInsight, type IndustryInsight } from '../../api/insights';
import { useAuth } from '../../hooks/useAuth';

const { Title } = Typography;

export default function InsightList() {
  const [data, setData] = useState<IndustryInsight[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { isOperatorOrAdmin } = useAuth();
  const navigate = useNavigate();

  const pageRef = useRef(page);
  const searchRef = useRef(search);
  pageRef.current = page;
  searchRef.current = search;

  const load = useCallback(async (p?: number, s?: string) => {
    const pageNum = p ?? pageRef.current;
    const searchVal = s ?? searchRef.current;
    setLoading(true);
    try {
      const res = await getInsights({ page: pageNum, page_size: 20, search: searchVal || undefined });
      setData(res.data); setTotal(res.total);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    try { await deleteInsight(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns: TableColumnsType<IndustryInsight> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '别名', dataIndex: 'slug', key: 'slug', width: 200 },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true, width: 300,
      render: (v: string) => v?.substring(0, 100) ?? '',
    },
  ];

  if (isOperatorOrAdmin) {
    columns.push({
      title: '操作', key: 'actions', width: 100,
      render: (_: unknown, record: IndustryInsight) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/insights/${record.id}/edit`)} />
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
        <Title level={4}>行业洞察</Title>
        {isOperatorOrAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/insights/new')}>新增</Button>}
      </div>
      <Input.Search
        placeholder="搜索洞察..."
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
