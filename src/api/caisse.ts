// ═══════════════════════════════════════════════════════════════
// caisse — Requêtes API paginées pour les écritures de caisse
// GET /api/v1/caisse · filtre optionnel par type d'écriture
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { EcritureCaisse, TypeEcriture } from '@/types/caisse';

export interface GetCaisseParams extends PaginationParams {
  typeEcriture?: TypeEcriture;
}

export async function getCaisse(params: GetCaisseParams): Promise<PageResponse<EcritureCaisse>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.typeEcriture !== undefined) p.set('typeEcriture', params.typeEcriture);
  return apiClient.get<PageResponse<EcritureCaisse>>(`/api/v1/caisse?${p.toString()}`);
}
