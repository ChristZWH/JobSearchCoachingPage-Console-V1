import client from './client';
import { toPaginated } from './types';
import type { ListParams, PaginatedResponse } from './types';
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
  rating?: number;
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

export interface MentorBackground {
  id: number;
  mentorId: number;
  content: string;
}

export interface MentorClip {
  id: number;
  mentorId: number;
  title: string;
  url: string;
}

export interface MentorReview {
  id: number;
  mentorId: number;
  studentName: string;
  content: string;
  rating: number;
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

// 头像上传即入库：上传成功后立即调用，只更新 avatar 一列（旧文件后端异步清理）
export async function updateMentorAvatar(id: number, avatar: string): Promise<Mentor> {
  const res = await client.put(`/admin/mentors/${id}/avatar`, { avatar });
  return res.data;
}

export async function deleteMentor(id: number): Promise<void> {
  await client.delete(`/admin/mentors/${id}`);
}

// Education CRUD
export async function getEducations(mentorId: number): Promise<MentorEducation[]> {
  const res = await client.get(`/admin/mentors/${mentorId}/educations`);
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

// Background CRUD (professional background bullets)
export async function getBackgrounds(mentorId: number): Promise<MentorBackground[]> {
  const res = await client.get(`/admin/mentors/${mentorId}/backgrounds`);
  return res.data;
}

export async function createBackground(
  mentorId: number,
  data: Partial<MentorBackground>,
): Promise<MentorBackground> {
  const res = await client.post(`/admin/mentors/${mentorId}/backgrounds`, data);
  return res.data;
}

export async function updateBackground(
  mentorId: number,
  bgId: number,
  data: Partial<MentorBackground>,
): Promise<MentorBackground> {
  const res = await client.put(`/admin/mentors/${mentorId}/backgrounds/${bgId}`, data);
  return res.data;
}

export async function deleteBackground(mentorId: number, bgId: number): Promise<void> {
  await client.delete(`/admin/mentors/${mentorId}/backgrounds/${bgId}`);
}

// Clip CRUD (teaching clips)
export async function getClips(mentorId: number): Promise<MentorClip[]> {
  const res = await client.get(`/admin/mentors/${mentorId}/clips`);
  return res.data;
}

export async function createClip(mentorId: number, data: Partial<MentorClip>): Promise<MentorClip> {
  const res = await client.post(`/admin/mentors/${mentorId}/clips`, data);
  return res.data;
}

export async function updateClip(
  mentorId: number,
  clipId: number,
  data: Partial<MentorClip>,
): Promise<MentorClip> {
  const res = await client.put(`/admin/mentors/${mentorId}/clips/${clipId}`, data);
  return res.data;
}

export async function deleteClip(mentorId: number, clipId: number): Promise<void> {
  await client.delete(`/admin/mentors/${mentorId}/clips/${clipId}`);
}

// Review CRUD (student reviews)
export async function getReviews(mentorId: number): Promise<MentorReview[]> {
  const res = await client.get(`/admin/mentors/${mentorId}/reviews`);
  return res.data;
}

export async function createReview(
  mentorId: number,
  data: Partial<MentorReview>,
): Promise<MentorReview> {
  const res = await client.post(`/admin/mentors/${mentorId}/reviews`, data);
  return res.data;
}

export async function updateReview(
  mentorId: number,
  reviewId: number,
  data: Partial<MentorReview>,
): Promise<MentorReview> {
  const res = await client.put(`/admin/mentors/${mentorId}/reviews/${reviewId}`, data);
  return res.data;
}

export async function deleteReview(mentorId: number, reviewId: number): Promise<void> {
  await client.delete(`/admin/mentors/${mentorId}/reviews/${reviewId}`);
}
