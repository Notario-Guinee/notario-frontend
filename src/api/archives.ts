// ═══════════════════════════════════════════════════════════════
// archives — Requêtes API paginées pour les archives notariales
// GET /api/v1/archives · filtres par type d'archive et année
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { Archive, TypeArchive } from '@/types/archive';

export interface GetArchivesParams extends PaginationParams {
  typeArchive?: TypeArchive;
  annee?: number;
}

export async function getArchives(params: GetArchivesParams): Promise<PageResponse<Archive>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.typeArchive !== undefined) p.set('typeArchive', params.typeArchive);
  if (params.annee !== undefined) p.set('annee', String(params.annee));
  return apiClient.get<PageResponse<Archive>>(`/api/v1/archives?${p.toString()}`);
}
