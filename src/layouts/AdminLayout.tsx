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
  NodeIndexOutlined,
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
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/mentors', icon: <TeamOutlined />, label: '导师管理' },
  { key: '/cases', icon: <FileTextOutlined />, label: '学员案例' },
  { key: '/insights', icon: <BulbOutlined />, label: '行业洞察' },
  { key: '/service-categories', icon: <AppstoreOutlined />, label: '服务分类' },
  { key: '/service-stages', icon: <NodeIndexOutlined />, label: '服务阶段' },
  { key: '/site-stats', icon: <BarChartOutlined />, label: '网站统计' },
  { key: '/companies', icon: <PictureOutlined />, label: '合作企业' },
  { key: '/why-us', icon: <StarOutlined />, label: '为什么选择我们' },
  { key: '/tags', icon: <TagsOutlined />, label: '标签管理' },
  { key: '/contacts', icon: <MailOutlined />, label: '咨询管理' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: '操作日志', operatorPlus: true },
  { key: '/users', icon: <UserOutlined />, label: '用户管理', adminOnly: true },
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
      label: '退出登录',
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
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
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
          background: 'linear-gradient(180deg, #e2ecf8 0%, #f0f5fb 100%)',
          borderRight: '1px solid #d5e2f0',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
            borderBottom: '1px solid #d5e2f0',
            marginBottom: 4,
          }}
        >
          <span style={{
            color: brandColor,
            fontWeight: 700,
            fontSize: 22,
            whiteSpace: 'nowrap',
            letterSpacing: -0.3,
          }}>
            {collapsed ? 'ZC' : (
              <><span style={{ color: '#a07f33' }}>Z-Career</span> Console</>
            )}
          </span>
        </div>

        <Menu
          theme="light"
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

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s', height: '100%' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #d5e2f0',
            zIndex: 9,
            height: 64,
            flexShrink: 0,
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

        <Content style={{ margin: 20, padding: 20, background: '#e3eaf4', borderRadius: 12, minHeight: 280, overflowY: 'auto', flex: 1 }}>
          {/* 白色内容卡：与蓝灰内容区、浅蓝侧栏形成三层视觉区分 */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, minHeight: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
