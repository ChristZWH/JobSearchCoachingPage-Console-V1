import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Typography, Select, DatePicker, Space, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { getAuditLogs, type AuditLog, type AuditLogFilters } from '../../api/auditLogs';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const actionColors: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'purple',
  LOGOUT: 'orange',
};

export default function AuditLogList() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [detailModal, setDetailModal] = useState<AuditLog | null>(null);

  const load = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ ...filters, page: p, page_size: 20 });
      setData(res.data); setTotal(res.total);
    } catch { message.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'User', dataIndex: 'username', key: 'username', width: 120 },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 100,
      render: (v: string) => <Tag color={actionColors[v] || 'default'}>{v}</Tag>,
    },
    { title: 'Resource', dataIndex: 'resource', key: 'resource', width: 140 },
    { title: 'Resource ID', dataIndex: 'resource_id', key: 'resource_id', width: 100 },
    { title: 'IP', dataIndex: 'ip_address', key: 'ip_address', width: 130 },
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'Detail', key: 'detail', width: 80,
      render: (_: unknown, record: AuditLog) => (
        record.detail ? <a onClick={() => setDetailModal(record)}>View</a> : <span style={{ color: '#ccc' }}>—</span>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 16 }}>Audit Logs</Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by Action"
          allowClear
          style={{ width: 150 }}
          onChange={(v) => { setFilters((f) => ({ ...f, action: v })); setPage(1); }}
          options={[
            { label: 'CREATE', value: 'CREATE' },
            { label: 'UPDATE', value: 'UPDATE' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'LOGIN', value: 'LOGIN' },
            { label: 'LOGOUT', value: 'LOGOUT' },
          ]}
        />
        <Select
          placeholder="Filter by Resource"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => { setFilters((f) => ({ ...f, resource: v })); setPage(1); }}
          options={[
            { label: 'Mentors', value: 'mentors' },
            { label: 'Cases', value: 'student_cases' },
            { label: 'Insights', value: 'industry_insights' },
            { label: 'Services', value: 'service_categories' },
            { label: 'Stages', value: 'service_stages' },
            { label: 'Site Stats', value: 'site_stats' },
            { label: 'Companies', value: 'company_logos' },
            { label: 'Why Us', value: 'why_us_features' },
            { label: 'Tags', value: 'tags' },
            { label: 'Contacts', value: 'contact_submissions' },
            { label: 'Users', value: 'users' },
          ]}
        />
        <RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setFilters((f) => ({
                ...f,
                start_date: dates[0]!.format('YYYY-MM-DD'),
                end_date: dates[1]!.format('YYYY-MM-DD'),
              }));
            } else {
              setFilters((f) => ({ ...f, start_date: undefined, end_date: undefined }));
            }
            setPage(1);
          }}
        />
      </Space>

      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); load(p); } }}
      />

      <Modal
        title="Audit Detail"
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={700}
      >
        {detailModal?.detail && (
          <Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', maxHeight: 400 }}>
              {JSON.stringify(detailModal.detail, null, 2)}
            </pre>
          </Paragraph>
        )}
      </Modal>
    </>
  );
}
