import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';
import { toPaginated } from './mentors';

export interface StudentCase {
  id: number;
  title: string;
  category: string;
  content: string;
  challenge: string;
  strategy: string;
  outcome: string;
  created_at: string;
  updated_at: string;
}

export async function getCases(params?: ListParams): Promise<PaginatedResponse<StudentCase>> {
  const res = await client.get('/cases', { params });
  return toPaginated<StudentCase>(res, params);
}

export async function getCase(id: number): Promise<StudentCase> {
  const res = await client.get(`/cases/${id}`);
  return res.data;
}

export async function createCase(data: Partial<StudentCase>): Promise<StudentCase> {
  const res = await client.post('/admin/cases', data);
  return res.data;
}

export async function updateCase(id: number, data: Partial<StudentCase>): Promise<StudentCase> {
  const res = await client.put(`/admin/cases/${id}`, data);
  return res.data;
}

export async function deleteCase(id: number): Promise<void> {
  await client.delete(`/admin/cases/${id}`);
}
