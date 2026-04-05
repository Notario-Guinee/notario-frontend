// src/services/archiveNumeriqueService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Service Archives Numériques — endpoints /api/archives-numeriques/fichiers
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/apiClient";

// ── Types génériques (conservés pour compatibilité) ───────────────────────────

export interface ApiResponse<T> {
  error: boolean;
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  numberOfElements: number;
  empty: boolean;
  sort?: SortInfo;
}

export interface SortInfo {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
  orders?: SortOrder[];
}

export interface SortOrder {
  property: string;
  direction: "ASC" | "DESC";
}

// ── Types métier ──────────────────────────────────────────────────────────────

export interface FichierNumeriqueDto {
  id: number;
  nomFichier: string;
  nomOriginal?: string;
  typeDocument?: string;
  mimeType?: string;
  tailleFichier?: number;
  tailleFichierFormatee?: string;
  cheminFichier?: string;
  url?: string;
  statut?: "EN_TRAITEMENT" | "INDEXE" | "ERREUR" | "ARCHIVE";
  dossierId?: number;
  numeroDossier?: string;
  clientNom?: string;
  description?: string;
  tags?: string[];
  version?: number;
  starred?: boolean;
  deleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadedByNom?: string;
}

export interface UpdateFichierDto {
  nomFichier?: string;
  typeDocument?: string;
  description?: string;
  tags?: string[];
  statut?: string;
  starred?: boolean;
}

export interface DeplacerBoiteDto {
  dossierId?: number | null;
  numeroDossier?: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Helpers multipart ─────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

function decodeTenantFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.tenantId ?? payload.tenant_id ?? payload.tenant ?? null;
  } catch {
    return null;
  }
}

function multipartHeaders(): HeadersInit {
  const token = getToken();
  const tenantId = token ? decodeTenantFromJwt(token) : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
  };
}

async function parseRaw<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return undefined as T;
  }
  let json: unknown;
  try { json = JSON.parse(text); } catch { return text as unknown as T; }
  if (json !== null && typeof json === "object" && "success" in json) {
    const w = json as { success: boolean; data: T; message?: string };
    if (!res.ok || !w.success) throw new Error(w.message || `Erreur ${res.status}`);
    return w.data;
  }
  if (!res.ok) throw new Error((json as { message?: string })?.message || `Erreur ${res.status}`);
  return json as T;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const archiveNumeriqueService = {
  /** Liste paginée des fichiers */
  getAll: async (page = 0, size = 200): Promise<FichierNumeriqueDto[]> => {
    const res = await apiClient.get<Page<FichierNumeriqueDto> | FichierNumeriqueDto[]>(
      `/api/archives-numeriques/fichiers?page=${page}&size=${size}`
    );
    if (Array.isArray(res)) return res;
    return (res as Page<FichierNumeriqueDto>).content ?? [];
  },

  getById: (id: number) =>
    apiClient.get<FichierNumeriqueDto>(`/api/archives-numeriques/fichiers/${id}`),

  /** Upload d'un fichier (multipart/form-data) */
  upload: async (
    file: File,
    meta?: { dossierId?: number | null; description?: string; typeDocument?: string }
  ): Promise<FichierNumeriqueDto> => {
    const form = new FormData();
    form.append("file", file);
    if (meta?.dossierId != null) form.append("dossierId", String(meta.dossierId));
    if (meta?.description)  form.append("description",  meta.description);
    if (meta?.typeDocument) form.append("typeDocument", meta.typeDocument);

    const res = await fetch("/api/archives-numeriques/fichiers", {
      method: "POST",
      headers: multipartHeaders(),
      body: form,
    });
    return parseRaw<FichierNumeriqueDto>(res);
  },

  /** Crée une nouvelle version d'un fichier existant */
  nouvelleVersion: async (
    id: number,
    file: File,
    meta?: { description?: string }
  ): Promise<FichierNumeriqueDto> => {
    const form = new FormData();
    form.append("file", file);
    if (meta?.description) form.append("description", meta.description);

    const res = await fetch(`/api/archives-numeriques/fichiers/${id}/nouvelle-version`, {
      method: "POST",
      headers: multipartHeaders(),
      body: form,
    });
    return parseRaw<FichierNumeriqueDto>(res);
  },

  /** Met à jour les métadonnées d'un fichier */
  updateMetadonnees: (id: number, dto: UpdateFichierDto) =>
    apiClient.put<FichierNumeriqueDto>(`/api/archives-numeriques/fichiers/${id}`, dto),

  /** Suppression douce (corbeille) */
  delete: (id: number) =>
    apiClient.delete<void>(`/api/archives-numeriques/fichiers/${id}`),

  /** Restaure un fichier depuis la corbeille */
  restaurer: (id: number) =>
    apiClient.put<FichierNumeriqueDto>(`/api/archives-numeriques/fichiers/${id}/restaurer`),

  /** Déplace un fichier vers un autre dossier (ou racine si dossierId=null) */
  deplacerBoite: (id: number, dto: DeplacerBoiteDto) =>
    apiClient.put<FichierNumeriqueDto>(`/api/archives-numeriques/fichiers/${id}/deplacer-boite`, dto),

  /** URL de téléchargement direct */
  getDownloadUrl: (id: number) =>
    `/api/archives-numeriques/fichiers/${id}/download`,
};
