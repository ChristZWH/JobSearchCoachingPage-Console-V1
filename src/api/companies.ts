import client from './client';

export interface CompanyLogo {
  id: number;
  name: string;
  logo: string;
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

// Logo 上传即入库：上传成功后立即调用，只更新 logo 一列（旧文件后端异步清理）
export async function updateCompanyLogoImage(id: number, logo: string): Promise<CompanyLogo> {
  const res = await client.put(`/admin/companies/${id}/logo`, { logo });
  return res.data;
}

export async function deleteCompanyLogo(id: number): Promise<void> {
  await client.delete(`/admin/companies/${id}`);
}
