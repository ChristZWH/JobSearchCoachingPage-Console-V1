import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  message: string;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getContacts(params?: ListParams): Promise<PaginatedResponse<ContactSubmission>> {
  const res = await client.get('/contacts', { params });
  return res.data;
}

export async function markContactProcessed(id: number): Promise<void> {
  await client.put(`/admin/contacts/${id}/process`);
}
