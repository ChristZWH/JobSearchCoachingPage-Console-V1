import client from './client';

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundImage: string;
  subServices: string[];
}

export interface ServiceStage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  image: string;
}

// Service Categories
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await client.get('/services');
  return res.data;
}

export async function createServiceCategory(data: Partial<ServiceCategory>): Promise<ServiceCategory> {
  const res = await client.post('/admin/services', data);
  return res.data;
}

export async function updateServiceCategory(id: string, data: Partial<ServiceCategory>): Promise<ServiceCategory> {
  const res = await client.put(`/admin/services/${id}`, data);
  return res.data;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  await client.delete(`/admin/services/${id}`);
}

// Service Stages
export async function getServiceStages(): Promise<ServiceStage[]> {
  const res = await client.get('/services/stages');
  return res.data;
}

export async function createServiceStage(data: Partial<ServiceStage>): Promise<ServiceStage> {
  const res = await client.post('/admin/service-stages', data);
  return res.data;
}

export async function updateServiceStage(id: number, data: Partial<ServiceStage>): Promise<ServiceStage> {
  const res = await client.put(`/admin/service-stages/${id}`, data);
  return res.data;
}

export async function deleteServiceStage(id: number): Promise<void> {
  await client.delete(`/admin/service-stages/${id}`);
}
