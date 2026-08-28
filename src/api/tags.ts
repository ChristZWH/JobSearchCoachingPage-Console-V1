import client from './client';
import type { ListParams, PaginatedResponse } from './types';
import { toPaginated } from './types';

export interface Tag {
  id: number;
  name: string;
  // 'industry' 仅被单值维度选择器（TagSelect）使用，对应 mentors.industry 列；
  // tags 表本体已按 P1 迁移至 'industrySpecialization'（多值行业专精）。
  category: 'industry' | 'industrySpecialization' | 'company' | 'department' | 'region' | 'targetRole' | 'school' | 'language' | 'skill';
  created_at: string;
  updated_at: string;
}

export async function getTags(params?: ListParams): Promise<PaginatedResponse<Tag>> {
  const res = await client.get('/tags', { params });
  return toPaginated<Tag>(res, params);
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
