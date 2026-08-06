import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tag, Space, message, Typography, Modal } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import { getContacts, markContactProcessed, type ContactSubmission } from '../../api/contacts';
import { useAuth } from '../../hooks/useAuth';

const { Title, Paragraph } = Typography;

export default function ContactList() {
  const [data, setData] = useState<ContactSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<ContactSubmission | null>(null);
  const { isOperatorOrAdmin } = useAuth();

  const load = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const res = await getContacts({ page: p, page_size: 20 });
      setData(res.data); setTotal(res.total);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async (id: number) => {
    try {
      await markContactProcessed(id);
      message.success('已标记为已处理');
      load();
    } catch { message.error('处理失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '留言', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '状态', dataIndex: 'processed', key: 'processed', width: 100,
      render: (v: boolean) => v ? <Tag color="green">已处理</Tag> : <Tag color="orange">待处理</Tag>,
    },
    { title: '日期', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作', key: 'actions', width: 140,
      render: (_: unknown, record: ContactSubmission) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setViewing(record)}>查看</Button>
          {isOperatorOrAdmin && !record.processed && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleProcess(record.id)}>处理</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 16 }}>咨询管理</Title>
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
      />

      <Modal title="留言详情" open={!!viewing} onCancel={() => setViewing(null)} footer={null} width={600}>
        {viewing && (
          <>
            <p><strong>来自:</strong> {viewing.name} ({viewing.email})</p>
            <p><strong>日期:</strong> {new Date(viewing.created_at).toLocaleString()}</p>
            <Paragraph style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{viewing.message}</Paragraph>
          </>
        )}
      </Modal>
    </>
  );
}
