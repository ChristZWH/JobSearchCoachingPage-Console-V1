import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Spin, Typography } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  BulbOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getMentors } from '../api/mentors';
import { getCases } from '../api/cases';
import { getInsights } from '../api/insights';
import { getAuditLogs, type AuditLog } from '../api/auditLogs';

const { Title } = Typography;

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon, color, bg }: StatCardProps) {
  return (
    <Card
      style={{ borderRadius: 10, border: '1px solid #edf2f7', boxShadow: 'none' }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 8, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1a202c', lineHeight: 1 }}>
            {value.toLocaleString()}
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 22, color }}>{icon}</span>
        </div>
      </div>
    </Card>
  );
}

const statCards = [
  { label: '导师', key: 'mentors' as const, icon: <TeamOutlined />, color: '#2b6cb0', bg: '#ebf4ff' },
  { label: '学员案例', key: 'cases' as const, icon: <FileTextOutlined />, color: '#2f855a', bg: '#f0fff4' },
  { label: '行业洞察', key: 'insights' as const, icon: <BulbOutlined />, color: '#c05621', bg: '#fffaf0' },
  { label: '咨询', key: 'contacts' as const, icon: <MailOutlined />, color: '#6b46c1', bg: '#faf5ff' },
];

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({ mentors: 0, cases: 0, insights: 0, contacts: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mentors, cases, insights, logs] = await Promise.all([
          getMentors({ page_size: 1 }),
          getCases({ page_size: 1 }),
          getInsights({ page_size: 1 }),
          getAuditLogs({ page_size: 10, page: 1 }),
        ]);
        setCounts({
          mentors: mentors.total,
          cases: cases.total,
          insights: insights.total,
          contacts: 0,
        });
        setRecentLogs(logs.data || []);
      } catch {
        // API not ready yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const actionColors: Record<string, string> = {
    CREATE: '#2f855a', UPDATE: '#2b6cb0', DELETE: '#c53030',
    LOGIN: '#6b46c1', LOGOUT: '#718096',
  };

  const logColumns = [
    {
      title: '用户', dataIndex: 'username', key: 'username', width: 130,
      render: (v: string) => <span style={{ fontWeight: 500, color: '#2d3748' }}>{v}</span>,
    },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 100,
      render: (v: string) => (
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: 4,
          background: (actionColors[v] || '#edf2f7') + '1a',
          color: actionColors[v] || '#718096', fontSize: 12, fontWeight: 500,
        }}>
          {v}
        </span>
      ),
    },
    { title: '资源', dataIndex: 'resource', key: 'resource', width: 150,
      render: (v: string) => <span style={{ color: '#4a5568' }}>{v}</span>,
    },
    { title: '时间', dataIndex: 'createdAt', key: 'created_at', width: 180,
      render: (v: string) => <span style={{ color: '#a0aec0', fontSize: 12 }}>{v ? new Date(v).toLocaleString() : '-'}</span>,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 28 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1a202c' }}>仪表盘</Title>
        <div style={{ fontSize: 13, color: '#a0aec0', marginTop: 4 }}>平台概览</div>
      </div>

      <Row gutter={[16, 16]}>
        {statCards.map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.key}>
            <StatCard label={s.label} value={counts[s.key]} icon={s.icon} color={s.color} bg={s.bg} />
          </Col>
        ))}
      </Row>

      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: '#718096' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>近期动态</span>
          </span>
        }
        style={{ marginTop: 24, borderRadius: 10, border: '1px solid #edf2f7' }}
        styles={{ body: { padding: '12px 24px' } }}
      >
        <Table
          dataSource={recentLogs}
          columns={logColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          showHeader={false}
          style={{ marginTop: -4 }}
        />
      </Card>
    </Spin>
  );
}
