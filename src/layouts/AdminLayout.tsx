import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Space, type MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  BulbOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  PictureOutlined,
  StarOutlined,
  TagsOutlined,
  MailOutlined,
  AuditOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
  operatorPlus?: boolean;
}

const menuItems: MenuItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/mentors', icon: <TeamOutlined />, label: 'Mentors' },
  { key: '/cases', icon: <FileTextOutlined />, label: 'Student Cases' },
  { key: '/insights', icon: <BulbOutlined />, label: 'Insights' },
  { key: '/services', icon: <AppstoreOutlined />, label: 'Services' },
  { key: '/site-stats', icon: <BarChartOutlined />, label: 'Site Stats' },
  { key: '/companies', icon: <PictureOutlined />, label: 'Companies' },
  { key: '/why-us', icon: <StarOutlined />, label: 'Why Us' },
  { key: '/tags', icon: <TagsOutlined />, label: 'Tags' },
  { key: '/contacts', icon: <MailOutlined />, label: 'Contacts' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs', operatorPlus: true },
  { key: '/users', icon: <UserOutlined />, label: 'Users', adminOnly: true },
];

// Role tag colors
const roleMeta: Record<string, { color: string; bg: string }> = {
  admin: { color: '#c53030', bg: '#fff5f5' },
  operator: { color: '#2b6cb0', bg: '#ebf4ff' },
  normal: { color: '#718096', bg: '#f7f8fa' },
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin, isOperatorOrAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.operatorPlus && !isOperatorOrAdmin) return false;
    return true;
  });

  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');

  const roleInfo = roleMeta[user?.role ?? ''] ?? roleMeta.normal;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.displayName || user?.username}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            <span style={{
              display: 'inline-block', padding: '1px 8px', borderRadius: 4,
              background: roleInfo.bg, color: roleInfo.color, fontSize: 11, fontWeight: 500,
            }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Sign out',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  // Brand color
  const brandColor = '#1a365d';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          background: '#0f2340',
          borderRight: 'none',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 4,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <RocketOutlined style={{ fontSize: 18, color: '#fff' }} />
          </div>
          {!collapsed && (
            <span style={{
              color: '#fff', fontWeight: 600, fontSize: 15,
              marginLeft: 12, whiteSpace: 'nowrap',
              letterSpacing: -0.3,
            }}>
              JobSearch
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            fontSize: 13,
          }}
          items={visibleItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #edf2f7',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 16 }} /> : <MenuFoldOutlined style={{ fontSize: 16 }} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#4a5568' }}
          />

          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s' }}>
              <Avatar
                size={32}
                style={{ background: brandColor, flexShrink: 0 }}
                icon={<UserOutlined />}
              >
                {user?.displayName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#2d3748', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || user?.username}
              </span>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 20, padding: 24, background: '#fff', borderRadius: 10, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
