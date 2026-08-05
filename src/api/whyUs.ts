import client from './client';

export interface WhyUsFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export async function getWhyUsFeatures(): Promise<WhyUsFeature[]> {
  const res = await client.get('/why-us');
  return res.data;
}

export async function createWhyUsFeature(data: Partial<WhyUsFeature>): Promise<WhyUsFeature> {
  const res = await client.post('/admin/why-us', data);
  return res.data;
}

export async function updateWhyUsFeature(id: number, data: Partial<WhyUsFeature>): Promise<WhyUsFeature> {
  const res = await client.put(`/admin/why-us/${id}`, data);
  return res.data;
}

export async function deleteWhyUsFeature(id: number): Promise<void> {
  await client.delete(`/admin/why-us/${id}`);
}
