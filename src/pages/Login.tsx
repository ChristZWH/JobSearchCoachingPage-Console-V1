import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Login successful');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      message.error(axiosError?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left — branding */}
      <div
        style={{
          flex: '0 0 480px',
          background: 'linear-gradient(160deg, #0f2340 0%, #1a365d 40%, #2a4a7f 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 64,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <RocketOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', marginBottom: 12, fontWeight: 600, letterSpacing: -0.5 }}>
            JobSearch Admin
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.6 }}>
            Career coaching platform
            <br />
            management console
          </Text>
        </div>

        <div style={{
          position: 'absolute', bottom: 48, textAlign: 'center',
          color: 'rgba(255,255,255,0.35)', fontSize: 12,
        }}>
          &copy; {new Date().getFullYear()} JobSearch Coaching. All rights reserved.
        </div>
      </div>

      {/* Right — login form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f7f8fa',
          padding: 48,
        }}
      >
        <div style={{ width: 380 }}>
          <div style={{ marginBottom: 40 }}>
            <Title level={3} style={{ marginBottom: 8, fontWeight: 600 }}>
              Sign in
            </Title>
            <Text type="secondary">Enter your credentials to access the console</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#a0aec0' }} />}
                placeholder="Username"
                autoComplete="username"
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#a0aec0' }} />}
                placeholder="Password"
                autoComplete="current-password"
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48, borderRadius: 8, fontSize: 15, fontWeight: 500,
                  background: '#1a365d', borderColor: '#1a365d',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Default credentials: admin / Admin@123
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
