import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, theme, type MenuProps } from 'antd';
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

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin, isOperatorOrAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const visibleItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.operatorPlus && !isOperatorOrAdmin) return false;
    return true;
  });

  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'role',
      label: `Role: ${user?.role?.toUpperCase()}`,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 48,
            margin: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 16,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? 'JC' : 'JobSearch Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={visibleItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {user?.displayName || user?.username}
            </Button>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
