// ═══════════════════════════════════════════════════════════════
// documentItems — Requêtes API paginées pour les documents
// GET /api/v1/documents · filtre optionnel par type de document
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/apiClient';
import type { PageResponse, PaginationParams } from '@/types/pagination';
import type { DocumentItem, TypeDocument } from '@/types/documentItem';

export interface GetDocumentItemsParams extends PaginationParams {
  typeDocument?: TypeDocument;
}

export async function getDocumentItems(params: GetDocumentItemsParams): Promise<PageResponse<DocumentItem>> {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  if (params.size !== undefined) p.set('size', String(params.size));
  if (params.search) p.set('search', params.search);
  if (params.sortBy) p.set('sortBy', params.sortBy);
  if (params.sortDir) p.set('sortDir', params.sortDir);
  if (params.typeDocument !== undefined) p.set('typeDocument', params.typeDocument);
  return apiClient.get<PageResponse<DocumentItem>>(`/api/v1/documents?${p.toString()}`);
}
