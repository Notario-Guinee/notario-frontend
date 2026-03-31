// ═══════════════════════════════════════════════════════════════
// dossiers — Requêtes API paginées pour les dossiers notariaux
// GET /api/v1/dossiers · filtre optionnel par statut
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Dossier, StatutDossier } from '@/types/dossier';

export interface GetDossiersParams extends PaginationParams {
  statut?: StatutDossier;
}

export async function getDossiers(params: GetDossiersParams): Promise<PageResponse<Dossier>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.statut !== undefined) p.set('statut', params.statut);
  return apiClient.get<PageResponse<Dossier>>(`/api/v1/dossiers?${p.toString()}`);
}
