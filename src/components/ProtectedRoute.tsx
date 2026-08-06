import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'operator';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您需要管理员权限才能访问此页面。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回
          </Button>
        }
      />
    );
  }

  if (requiredRole === 'operator' && user.role === 'normal') {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
