import client from './client';
import type { ListParams, PaginatedResponse } from './mentors';
import { toPaginated } from './mentors';

export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  action: string;
  resource: string;
  resourceId: string;
  detail: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
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
  return toPaginated<AuditLog>(res, filters);
}
