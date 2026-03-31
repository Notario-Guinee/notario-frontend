// ═══════════════════════════════════════════════════════════════
// factures — Requêtes API paginées pour les factures du cabinet
// GET /api/v1/factures · filtre optionnel par statut
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Facture, StatutFacture } from '@/types/facture';

export interface GetFacturesParams extends PaginationParams {
  statut?: StatutFacture;
}

export async function getFactures(params: GetFacturesParams): Promise<PageResponse<Facture>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.statut !== undefined) p.set('statut', params.statut);
  return apiClient.get<PageResponse<Facture>>(`/api/v1/factures?${p.toString()}`);
}
