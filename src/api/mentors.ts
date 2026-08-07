import client from './client';
import { toPaginated } from './types';
export { toPaginated } from './types';
export type { ListParams, PaginatedResponse } from './types';

// ── Structured sub-types (previously Record<string, unknown>[]) ──

export interface TeachingClip {
  title?: string;
  url?: string;
}

export interface Review {
  name?: string;
  content?: string;
}

// ── Mentor ──

export interface Mentor {
  id: number;
  name: string;
  title: string;
  company: string;
  department: string;
  avatar: string;
  category: string;
  region: string;
  industry: string;
  targetRole: string;
  experience: number;
  languages: string[];
  keySkills: string[];
  professionalBackground: string[];
  industrySpecialization: string[];
  bio: string;
  shortBio: string;
  teachingClips: TeachingClip[];
  reviews: Review[];
  featured: boolean;
  order: number;
  tags?: { id: number; name: string; category: string }[];
  educations?: MentorEducation[];
}

export interface MentorEducation {
  id: number;
  mentorId: number;
  schoolName: string;
  country: string;
  degree: string;
  major: string;
  graduationYear: number;
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
