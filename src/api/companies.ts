import client from './client';

export interface CompanyLogo {
  id: number;
  name: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

export async function getCompanyLogos(): Promise<CompanyLogo[]> {
  const res = await client.get('/companies');
  return res.data;
}

export async function createCompanyLogo(data: Partial<CompanyLogo>): Promise<CompanyLogo> {
  const res = await client.post('/admin/companies', data);
  return res.data;
}

export async function updateCompanyLogo(id: number, data: Partial<CompanyLogo>): Promise<CompanyLogo> {
  const res = await client.put(`/admin/companies/${id}`, data);
  return res.data;
}

export async function deleteCompanyLogo(id: number): Promise<void> {
  await client.delete(`/admin/companies/${id}`);
}
