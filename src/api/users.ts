import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';
import { toPaginated } from './mentors';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'operator' | 'normal';
  status: number;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUsers(params?: ListParams): Promise<PaginatedResponse<User>> {
  const res = await client.get('/admin/users', { params });
  return toPaginated<User>(res, params);
}

export async function createUser(data: {
  username: string;
  password: string;
  displayName: string;
  role: string;
}): Promise<User> {
  const res = await client.post('/admin/users', data);
  return res.data;
}

export async function updateUser(
  id: number,
  data: {
    displayName?: string;
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
