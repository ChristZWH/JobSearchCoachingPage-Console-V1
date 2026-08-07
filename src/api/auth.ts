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
  displayName: string;
  role: 'admin' | 'operator' | 'normal';
}

// Raw response shape from backend (camelCase, wrapped in data)
interface RawLoginData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    role: 'admin' | 'operator' | 'normal';
  };
}

function transformLogin(raw: RawLoginData): LoginResponse {
  return {
    access_token: raw.accessToken,
    refresh_token: raw.refreshToken,
    user: {
      id: raw.user.id,
      username: raw.user.username,
      display_name: raw.user.displayName,
      role: raw.user.role,
    },
  };
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await client.post('/auth/login', data);
  // interceptor already unwrapped { data: {...} }, now convert camelCase → snake_case
  return transformLogin(res.data);
}

export async function refreshToken(token: string): Promise<{ access_token: string }> {
  const res = await client.post('/auth/refresh', { refresh_token: token });
  const raw = res.data;
  return { access_token: raw.accessToken ?? raw.access_token };
}

export async function getMe(): Promise<UserInfo> {
  const res = await client.get('/auth/me');
  // Backend returns camelCase via gin.H{ displayName, ... }
  return res.data as UserInfo;
}
