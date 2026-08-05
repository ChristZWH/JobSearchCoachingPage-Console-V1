import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Typography } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  BulbOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { getMentors } from '../api/mentors';
import { getCases } from '../api/cases';
import { getInsights } from '../api/insights';
import { getAuditLogs, type AuditLog } from '../api/auditLogs';

const { Title } = Typography;

export default function Dashboard() {
  const [mentorCount, setMentorCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [insightCount, setInsightCount] = useState(0);
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
        setMentorCount(mentors.total);
        setCaseCount(cases.total);
        setInsightCount(insights.total);
        setRecentLogs(logs.data || []);
      } catch {
        // API not ready yet — show zeros
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const logColumns = [
    { title: 'User', dataIndex: 'username', key: 'username', width: 120 },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 100 },
    { title: 'Resource', dataIndex: 'resource', key: 'resource', width: 140 },
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
  ];

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Mentors" value={mentorCount} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Student Cases" value={caseCount} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Insights" value={insightCount} prefix={<BulbOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Contacts" value={0} prefix={<MailOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Activity" style={{ marginTop: 24 }}>
        <Table
          dataSource={recentLogs}
          columns={logColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </Spin>
  );
}
