import client from './client';

export interface SiteStat {
  id: number;
  label: string;
  value: string;
  suffix: string;
  created_at: string;
  updated_at: string;
}

export async function getSiteStats(): Promise<SiteStat[]> {
  const res = await client.get('/site-stats');
  return res.data;
}

export async function createSiteStat(data: Partial<SiteStat>): Promise<SiteStat> {
  const res = await client.post('/admin/site-stats', data);
  return res.data;
}

export async function updateSiteStat(id: number, data: Partial<SiteStat>): Promise<SiteStat> {
  const res = await client.put(`/admin/site-stats/${id}`, data);
  return res.data;
}

export async function deleteSiteStat(id: number): Promise<void> {
  await client.delete(`/admin/site-stats/${id}`);
}
