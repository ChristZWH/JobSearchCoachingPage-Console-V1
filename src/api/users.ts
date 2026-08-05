import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: 'admin' | 'operator' | 'normal';
  status: number;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}

export async function getUsers(params?: ListParams): Promise<PaginatedResponse<User>> {
  const res = await client.get('/admin/users', { params });
  return res.data;
}

export async function createUser(data: {
  username: string;
  password: string;
  display_name: string;
  role: string;
}): Promise<User> {
  const res = await client.post('/admin/users', data);
  return res.data;
}

export async function updateUser(
  id: number,
  data: {
    display_name?: string;
    role?: string;
    password?: string;
    status?: number;
  },
): Promise<User> {
  const res = await client.put(`/admin/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/admin/users/${id}`);
}
