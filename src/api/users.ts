// ═══════════════════════════════════════════════════════════════
// users — Requêtes API paginées pour les utilisateurs du cabinet
// GET /api/users
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { User, UserRole } from '@/types/user';

export interface GetUsersParams extends PaginationParams {
  role?: UserRole;
}

export async function getUsers(params: GetUsersParams): Promise<PageResponse<User>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.role) p.set('role', params.role);
  return apiClient.get<PageResponse<User>>(`/api/users?${p.toString()}`);
}

/** Récupère tous les notaires actifs du tenant */
export async function getNotaires(): Promise<User[]> {
  const res = await getUsers({ page: 0, size: 100, role: 'NOTAIRE' });
  return res.content ?? [];
}

/** Récupère tous les clercs actifs du tenant */
export async function getClercs(): Promise<User[]> {
  const res = await getUsers({ page: 0, size: 100, role: 'CLERC' });
  return res.content ?? [];
}
