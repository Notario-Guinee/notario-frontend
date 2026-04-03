// src/services/typeActeService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Service TypeActe — endpoints /api/types-actes
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TypeActeDto {
  id?: number;
  code?: string;
  nom?: string;
  libelle?: string;
  categorie?: string;
  categorieReference?: string;
  description?: string;
  actif?: boolean;
  ordreAffichage?: number;
  dureeEstimeeJours?: number;
  niveauComplexite?: number;
  prioriteDefaut?: "TRES_BASSE" | "BASSE" | "NORMALE" | "HAUTE" | "TRES_HAUTE" | "URGENTE";
  necessiteSignatureElectronique?: boolean;
  necessitePublication?: boolean;
  nombreDossiersTotal?: number;
  nombreDossiersActifs?: number;
  workflowConfigJson?: string | object;
  workflow_config_json?: string | object;
  partiesRequisesJson?: string;
  documentsObligatoiresJson?: string;
  facturationConfigJson?: string;
  aworkflowValide?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTypeActeDto {
  code: string;
  nom: string;
  categorieReference?: string;
  description?: string;
  ordreAffichage?: number;
}

export interface UpdateTypeActeDto {
  code?: string;
  nom?: string;
  categorieReference?: string;
  description?: string;
  ordreAffichage?: number;
  workflowConfigJson?: object | string;
}

/** Réponse paginée du backend Spring (Page<T>) */
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Catalogue groupé par catégorie (endpoint /api/types-actes/catalogue) ─────

export interface CatalogueActe {
  value: string;  // code enum backend : "VENTE_IMMOBILIERE"
  label: string;  // libellé français : "Vente immobilière"
}

export interface CatalogueCategorie {
  categorie: string;  // clé backend : "IMMOBILIER"
  label: string;      // libellé : "Actes immobiliers"
  actes: CatalogueActe[];
}

// ── Service ───────────────────────────────────────────────────────────────────

export const typeActeService = {
  /** Liste paginée → extrait le contenu */
  getAll: async (page = 0, size = 100): Promise<TypeActeDto[]> => {
    const res = await apiClient.get<Page<TypeActeDto> | TypeActeDto[]>(
      `/api/types-actes?page=${page}&size=${size}`
    );
    if (Array.isArray(res)) return res;
    return (res as Page<TypeActeDto>).content ?? [];
  },

  /** Catalogue groupé par catégorie pour les selects */
  getCatalogue: () =>
    apiClient.get<CatalogueCategorie[]>("/api/types-actes/catalogue"),

  getActifs: () =>
    apiClient.get<TypeActeDto[]>("/api/types-actes/actifs"),

  getCategories: () =>
    apiClient.get<string[]>("/api/types-actes/categories"),

  search: (q: string) =>
    apiClient.get<TypeActeDto[]>(`/api/types-actes/search?q=${encodeURIComponent(q)}`),

  getById: (id: number) =>
    apiClient.get<TypeActeDto>(`/api/types-actes/${id}`),

  create: (dto: CreateTypeActeDto) =>
    apiClient.post<TypeActeDto>("/api/types-actes", dto),

  update: (id: number, dto: UpdateTypeActeDto) =>
    apiClient.put<TypeActeDto>(`/api/types-actes/${id}`, dto),

  delete: (id: number) =>
    apiClient.delete<void>(`/api/types-actes/${id}`),

  activer: (id: number) =>
    apiClient.patch<TypeActeDto>(`/api/types-actes/${id}/activer`),

  desactiver: (id: number) =>
    apiClient.patch<TypeActeDto>(`/api/types-actes/${id}/desactiver`),

  /** Configure le workflow d'un type d'acte (objet ou JSON string) */
  configureWorkflow: (id: number, workflow: object | string) =>
    apiClient.put<TypeActeDto>(
      `/api/types-actes/${id}/workflow`,
      typeof workflow === "string" ? JSON.parse(workflow) : workflow
    ),

  /** Initialise les types d'actes par défaut du cabinet */
  initialiserDefauts: () =>
    apiClient.post<TypeActeDto[]>("/api/types-actes/initialiser-defauts"),
};
