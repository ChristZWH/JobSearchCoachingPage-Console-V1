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
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async (id: number) => {
    try {
      await markContactProcessed(id);
      message.success('Marked as processed');
      load();
    } catch { message.error('Failed'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 120 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: 'Status', dataIndex: 'processed', key: 'processed', width: 100,
      render: (v: boolean) => v ? <Tag color="green">Processed</Tag> : <Tag color="orange">Pending</Tag>,
    },
    { title: 'Date', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: 'Actions', key: 'actions', width: 140,
      render: (_: unknown, record: ContactSubmission) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setViewing(record)}>View</Button>
          {isOperatorOrAdmin && !record.processed && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleProcess(record.id)}>Done</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 16 }}>Contact Submissions</Title>
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
      />

      <Modal title="Message Detail" open={!!viewing} onCancel={() => setViewing(null)} footer={null} width={600}>
        {viewing && (
          <>
            <p><strong>From:</strong> {viewing.name} ({viewing.email})</p>
            <p><strong>Date:</strong> {new Date(viewing.created_at).toLocaleString()}</p>
            <Paragraph style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{viewing.message}</Paragraph>
          </>
        )}
      </Modal>
    </>
  );
}
