// ═══════════════════════════════════════════════════════════════
// users — Requêtes API paginées pour les utilisateurs du cabinet
// GET /api/v1/users
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { User } from '@/types/user';

export interface GetUsersParams extends PaginationParams {}

export async function getUsers(params: GetUsersParams): Promise<PageResponse<User>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  return apiClient.get<PageResponse<User>>(`/api/v1/users?${p.toString()}`);
}
