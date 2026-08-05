import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';

export interface Tag {
  id: number;
  name: string;
  category: 'industry' | 'company' | 'department' | 'school';
  created_at: string;
  updated_at: string;
}

export async function getTags(params?: ListParams): Promise<PaginatedResponse<Tag>> {
  const res = await client.get('/tags', { params });
  return res.data;
}

export async function createTag(data: Partial<Tag>): Promise<Tag> {
  const res = await client.post('/admin/tags', data);
  return res.data;
}

export async function updateTag(id: number, data: Partial<Tag>): Promise<Tag> {
  const res = await client.put(`/admin/tags/${id}`, data);
  return res.data;
}

export async function deleteTag(id: number): Promise<void> {
  await client.delete(`/admin/tags/${id}`);
}
