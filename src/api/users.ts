// ═══════════════════════════════════════════════════════════════
// users — Requêtes API paginées pour les utilisateurs du cabinet
// GET    /api/users
// POST   /api/users
// PUT    /api/users/{id}
// DELETE /api/users/{id}
// PATCH  /api/users/{id}/activate | deactivate
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user';

export type GetUsersParams = PaginationParams;

export async function getUsers(params: GetUsersParams): Promise<PageResponse<User>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  return apiClient.get<PageResponse<User>>(`/api/users?${p.toString()}`);
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  return apiClient.post<User>('/api/users', data);
}

export async function updateUser(id: string | number, data: UpdateUserPayload): Promise<User> {
  return apiClient.put<User>(`/api/users/${id}`, data);
}

export async function deleteUser(id: string | number): Promise<void> {
  return apiClient.delete<void>(`/api/users/${id}`);
}

export async function activateUser(id: string | number): Promise<User> {
  return apiClient.patch<User>(`/api/users/${id}/activate`);
}

export async function deactivateUser(id: string | number): Promise<User> {
  return apiClient.patch<User>(`/api/users/${id}/deactivate`);
}

// ═══════════════════════════════════════════════════════════════
// Fonctions API additionnelles
// ═══════════════════════════════════════════════════════════════

export async function getUserById(id: string | number): Promise<User> {
  return apiClient.get<User>(`/api/users/${id}`);
}

export async function searchUsers(query: string, page = 0, size = 20): Promise<PageResponse<User>> {
  const p = new URLSearchParams();
  p.set('query', query);
  p.set('page', String(page));
  p.set('size', String(size));
  return apiClient.get<PageResponse<User>>(`/api/users/search?${p.toString()}`);
}

export async function getUsersByRole(role: string): Promise<User[]> {
  return apiClient.get<User[]>(`/api/users/role/${role}`);
}

export async function lockAccount(id: string | number): Promise<User> {
  return apiClient.patch<User>(`/api/users/${id}/lock`);
}

export async function unlockAccount(id: string | number): Promise<User> {
  return apiClient.patch<User>(`/api/users/${id}/unlock`);
}

export async function changeUserPassword(id: string | number, ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> {
  return apiClient.post<void>(`/api/users/${id}/change-password`, { ancienMotDePasse, nouveauMotDePasse });
}

export async function getUserPreferences(id: string | number): Promise<Record<string, unknown>> {
  return apiClient.get<Record<string, unknown>>(`/api/users/${id}/preferences`);
}

export async function updateUserPreferences(id: string | number, preferences: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiClient.put<Record<string, unknown>>(`/api/users/${id}/preferences`, preferences);
}

export async function getUserStatistics(): Promise<Record<string, number>> {
  return apiClient.get<Record<string, number>>('/api/users/statistics');
}

export async function getUserRoleDistribution(): Promise<Record<string, number>> {
  return apiClient.get<Record<string, number>>('/api/users/statistics/roles');
}

export async function getActiveUsers(): Promise<User[]> {
  return apiClient.get<User[]>('/api/users/active');
}

export async function resetUserPassword(email: string): Promise<void> {
  return apiClient.post<void>('/api/users/reset-password', { email });
}
