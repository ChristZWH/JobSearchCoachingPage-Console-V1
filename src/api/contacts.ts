import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';
import { toPaginated } from './mentors';

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  industry: string;
  message: string;
  processed: boolean;
}

export async function getContacts(params?: ListParams): Promise<PaginatedResponse<ContactSubmission>> {
  const res = await client.get('/contacts', { params });
  return toPaginated<ContactSubmission>(res, params);
}

export async function markContactProcessed(id: number): Promise<void> {
  await client.put(`/admin/contacts/${id}/process`);
}
