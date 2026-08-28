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

// 背景图上传即入库：上传成功后立即调用，只更新 backgroundImage 一列（旧文件后端异步清理）
export async function updateServiceCategoryBackgroundImage(id: string, image: string): Promise<ServiceCategory> {
  const res = await client.put(`/admin/services/${id}/background-image`, { backgroundImage: image });
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

// 背景图上传即入库：上传成功后立即调用，只更新 image 一列（旧文件后端异步清理）
export async function updateServiceStageImage(id: number, image: string): Promise<ServiceStage> {
  const res = await client.put(`/admin/service-stages/${id}/image`, { image });
  return res.data;
}

export async function deleteServiceStage(id: number): Promise<void> {
  await client.delete(`/admin/service-stages/${id}`);
}
