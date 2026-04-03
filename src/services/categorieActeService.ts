// src/services/categorieActeService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Service CategorieActe — endpoints /api/categories-actes
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/apiClient";
import type { TypeActeDto } from "./typeActeService";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategorieActeDto {
  id: number;
  code: string;
  libelle: string;
  couleur?: string;
  icone?: string;
  ordreAffichage?: number;
  actif: boolean;
  typesActes?: TypeActeDto[];
}

export interface CreateCategorieActeDto {
  code: string;
  libelle: string;
  couleur?: string;
  icone?: string;
  ordreAffichage?: number;
}

export interface UpdateCategorieActeDto {
  libelle?: string;
  couleur?: string;
  icone?: string;
  ordreAffichage?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const categorieActeService = {
  /** Toutes les catégories du cabinet */
  getAll: () =>
    apiClient.get<CategorieActeDto[]>("/api/categories-actes"),

  /** Catégories actives avec leurs types d'actes */
  getActives: () =>
    apiClient.get<CategorieActeDto[]>("/api/categories-actes/actives"),

  getById: (id: number) =>
    apiClient.get<CategorieActeDto>(`/api/categories-actes/${id}`),

  create: (dto: CreateCategorieActeDto) =>
    apiClient.post<CategorieActeDto>("/api/categories-actes", dto),

  update: (id: number, dto: UpdateCategorieActeDto) =>
    apiClient.put<CategorieActeDto>(`/api/categories-actes/${id}`, dto),

  /** Activer / désactiver sans supprimer (recommandé pour les défauts) */
  toggleActif: (id: number) =>
    apiClient.patch<CategorieActeDto>(`/api/categories-actes/${id}/toggle-actif`),

  /** Supprimer — uniquement si la catégorie ne contient plus de types d'actes actifs */
  delete: (id: number) =>
    apiClient.delete<void>(`/api/categories-actes/${id}`),

  /** Seeder les 6 catégories par défaut + liaison automatique des types d'actes */
  initialiserDefauts: () =>
    apiClient.post<CategorieActeDto[]>("/api/categories-actes/initialiser-defauts"),

  /** Assigner un type d'acte existant à une catégorie */
  assignTypeActe: (catId: number, typeId: number) =>
    apiClient.post<void>(`/api/categories-actes/${catId}/types-actes/${typeId}`),
};
