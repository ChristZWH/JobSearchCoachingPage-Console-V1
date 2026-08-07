/**
 * Shared API types used across all resource modules.
 * Previously these lived in mentors.ts and were re-imported from there.
 */

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Normalise paginated backend responses into a consistent {@link PaginatedResponse}.
 *
 * The response interceptor in client.ts unwraps the outer `{ data: ... }` envelope,
 * so `res.data` here is the inner payload.  Two shapes are recognised:
 *
 * 1. Plain array  — used by endpoints that return all rows (e.g. tags, site-stats).
 * 2. Paged object — `{ items, total, page, pageSize }` from paginated endpoints.
 *
 * Any other shape triggers a console warning and returns an empty result set,
 * which is safer than crashing but should be investigated.
 */
export function toPaginated<T>(
  res: { data: unknown },
  params?: ListParams,
): PaginatedResponse<T> {
  const raw = res.data;

  // Case 1: plain array (e.g. GET /tags?page_size=200)
  if (Array.isArray(raw)) {
    return {
      data: raw as T[],
      total: raw.length,
      page: params?.page ?? 1,
      page_size: params?.page_size ?? raw.length,
    };
  }

  // Case 2: paginated object (e.g. GET /mentors?page=1&page_size=20)
  if (raw && typeof raw === 'object' && 'items' in raw) {
    const paged = raw as { items: T[]; total: number; page: number; pageSize: number };
    return {
      data: paged.items,
      total: paged.total,
      page: paged.page,
      page_size: paged.pageSize,
    };
  }

  // Unknown shape — log warning so devs notice the mismatch
  console.warn(
    '[toPaginated] Unexpected response shape (expected array or {items,total,page,pageSize}). Returning empty result.',
    { raw, params },
  );
  return { data: [], total: 0, page: params?.page ?? 1, page_size: params?.page_size ?? 20 };
}
