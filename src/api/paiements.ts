// ═══════════════════════════════════════════════════════════════
// paiements — Requêtes API paginées pour les paiements
// GET /api/v1/paiements · filtres par mode de paiement et statut
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Paiement, ModePaiement, StatutPaiement } from '@/types/paiement';

export interface GetPaiementsParams extends PaginationParams {
  modePaiement?: ModePaiement;
  statut?: StatutPaiement;
}

export async function getPaiements(params: GetPaiementsParams): Promise<PageResponse<Paiement>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.modePaiement !== undefined) p.set('modePaiement', params.modePaiement);
  if (params.statut !== undefined) p.set('statut', params.statut);
  return apiClient.get<PageResponse<Paiement>>(`/api/v1/paiements?${p.toString()}`);
}
