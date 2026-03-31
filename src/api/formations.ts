// ═══════════════════════════════════════════════════════════════
// formations — Requêtes API paginées pour les formations du cabinet
// GET /api/v1/formations · filtre optionnel par statut
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Formation, StatutFormation } from '@/types/formation';

export interface GetFormationsParams extends PaginationParams {
  statut?: StatutFormation;
}

export async function getFormations(params: GetFormationsParams): Promise<PageResponse<Formation>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.statut !== undefined) p.set('statut', params.statut);
  return apiClient.get<PageResponse<Formation>>(`/api/v1/formations?${p.toString()}`);
}
