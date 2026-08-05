import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';
import { toPaginated } from './mentors';

export interface IndustryInsight {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getInsights(params?: ListParams): Promise<PaginatedResponse<IndustryInsight>> {
  const res = await client.get('/insights', { params });
  return toPaginated<IndustryInsight>(res, params);
}

export async function getInsight(id: number): Promise<IndustryInsight> {
  const res = await client.get(`/insights/${id}`);
  return res.data;
}

export async function createInsight(data: Partial<IndustryInsight>): Promise<IndustryInsight> {
  const res = await client.post('/admin/insights', data);
  return res.data;
}

export async function updateInsight(id: number, data: Partial<IndustryInsight>): Promise<IndustryInsight> {
  const res = await client.put(`/admin/insights/${id}`, data);
  return res.data;
}

export async function deleteInsight(id: number): Promise<void> {
  await client.delete(`/admin/insights/${id}`);
}
