import client from './client';
import type { ListParams, PaginatedResponse } from './types';
import { toPaginated } from './types';

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  industry: string;
  message: string;
  processed: boolean;
  createdAt: string;
}

export async function getContacts(params?: ListParams): Promise<PaginatedResponse<ContactSubmission>> {
  const res = await client.get('/contacts', { params });
  return toPaginated<ContactSubmission>(res, params);
}

export async function markContactProcessed(id: number): Promise<void> {
  await client.put(`/admin/contacts/${id}/process`);
}
