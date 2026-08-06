import client from './client';

export interface Mentor {
  id: number;
  name: string;
  title: string;
  company: string;
  avatar: string;
  image: string;
  background_image: string;
  intro: string;
  languages: string[];
  key_skills: string[];
  reviews: Record<string, unknown>[];
  teaching_clips: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface MentorEducation {
  id: number;
  mentor_id: number;
  school_name: string;
  degree: string;
  major: string;
  start_year: number;
  end_year: number;
  created_at: string;
  updated_at: string;
}

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

export function toPaginated<T>(res: { data: unknown }, params?: ListParams): PaginatedResponse<T> {
  const raw = res.data;
  // Case 1: backend returns plain array { data: [...] } → interceptor unwrapped to [...]
  if (Array.isArray(raw)) {
    return { data: raw as T[], total: raw.length, page: params?.page ?? 1, page_size: params?.page_size ?? raw.length };
  }
  // Case 2: backend returns paginated object { data: { items: [...], total, page, pageSize } } → interceptor unwrapped
  if (raw && typeof raw === 'object' && 'items' in raw) {
    const paged = raw as { items: T[]; total: number; page: number; pageSize: number };
    return { data: paged.items, total: paged.total, page: paged.page, page_size: paged.pageSize };
  }
  return { data: [], total: 0, page: params?.page ?? 1, page_size: params?.page_size ?? 20 };
}

// Public read
export async function getMentors(params?: ListParams): Promise<PaginatedResponse<Mentor>> {
  const res = await client.get('/mentors', { params });
  return toPaginated<Mentor>(res, params);
}

export async function getMentor(id: number): Promise<Mentor> {
  const res = await client.get(`/mentors/${id}`);
  return res.data;
}

// Admin write
export async function createMentor(data: Partial<Mentor>): Promise<Mentor> {
  const res = await client.post('/admin/mentors', data);
  return res.data;
}

export async function updateMentor(id: number, data: Partial<Mentor>): Promise<Mentor> {
  const res = await client.put(`/admin/mentors/${id}`, data);
  return res.data;
}

export async function deleteMentor(id: number): Promise<void> {
  await client.delete(`/admin/mentors/${id}`);
}

// Education CRUD
export async function getEducations(mentorId: number): Promise<MentorEducation[]> {
  const res = await client.get(`/mentors/${mentorId}/educations`);
  return res.data;
}

export async function createEducation(
  mentorId: number,
  data: Partial<MentorEducation>,
): Promise<MentorEducation> {
  const res = await client.post(`/admin/mentors/${mentorId}/educations`, data);
  return res.data;
}

export async function updateEducation(
  mentorId: number,
  eduId: number,
  data: Partial<MentorEducation>,
): Promise<MentorEducation> {
  const res = await client.put(`/admin/mentors/${mentorId}/educations/${eduId}`, data);
  return res.data;
}

export async function deleteEducation(mentorId: number, eduId: number): Promise<void> {
  await client.delete(`/admin/mentors/${mentorId}/educations/${eduId}`);
}
