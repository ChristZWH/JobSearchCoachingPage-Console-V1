import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    display_name: string;
    role: 'admin' | 'operator' | 'normal';
  };
}

export interface UserInfo {
  id: number;
  username: string;
  display_name: string;
  role: 'admin' | 'operator' | 'normal';
  status: number;
  last_login_at: string;
  created_at: string;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await client.post('/auth/login', data);
  return res.data;
}

export async function refreshToken(token: string): Promise<{ access_token: string }> {
  const res = await client.post('/auth/refresh', { refresh_token: token });
  return res.data;
}

export async function getMe(): Promise<UserInfo> {
  const res = await client.get('/auth/me');
  return res.data;
}
