import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource: string;
  resource_id: string;
  detail: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}

export interface AuditLogFilters extends ListParams {
  user_id?: number;
  action?: string;
  resource?: string;
  start_date?: string;
  end_date?: string;
}

export async function getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
  const res = await client.get('/admin/audit-logs', { params: filters });
  return res.data;
}
