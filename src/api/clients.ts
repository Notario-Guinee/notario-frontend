// ═══════════════════════════════════════════════════════════════
// clients — Requêtes API paginées pour les clients du cabinet
// GET /api/v1/clients
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Client } from '@/types/client';

export interface GetClientsParams extends PaginationParams {}

export async function getClients(params: GetClientsParams): Promise<PageResponse<Client>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  return apiClient.get<PageResponse<Client>>(`/api/v1/clients?${p.toString()}`);
}
