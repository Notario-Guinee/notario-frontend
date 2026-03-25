// ─────────────────────────────────────────────────────────────────────────────
// Service Cabinet — consomme les endpoints /api/cabinet/config et /api/auth
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CabinetConfig {
  id: number;
  nomCabinet: string;
  logoUrl: string | null;
  devise: string;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  numeroInscription: string | null;
  chambreRattachement: string | null;
  configurationFactureJson: string | null;
  themeCouleur: string | null;
  langueDefaut: string | null;
  fuseauHoraire: string | null;
  maxUtilisateurs: number | null;
  maxStockageGo: number | null;
  notificationsSmsActives: boolean;
  notificationsEmailActives: boolean;
  actif: boolean;
  configurationComplete: boolean;
  pourcentageCompletion: number;
  version: number;
  dateCreation: string;
  derniereMiseAJour: string | null;
  dateModification: string | null;
  modifiePar: string | null;
}

export interface CreateCabinetConfigDto {
  tenantId: string;
  sousDomaine: string;
  nomCabinet: string;
  devise: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  numeroInscription?: string;
  dateInscription?: string;
  chambreRattachement?: string;
  configurationFactureJson?: string;
  themeCouleur?: string;
  langueDefaut?: string;
  fuseauHoraire?: string;
  maxUtilisateurs?: number;
  maxStockageMo?: number;
  notificationsSmsActives?: boolean;
  notificationsEmailActives?: boolean;
}

export interface UpdateCabinetContactDto {
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

export interface UpdateCabinetDeviseDto {
  devise: string;
}

export interface UpdateCabinetLogoDto {
  logoUrl: string;
}

export interface UpdateCabinetConfigDto {
  version: number;
  nomCabinet?: string;
  logoUrl?: string;
  devise?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  numeroInscription?: string;
  chambreRattachement?: string;
  configurationFactureJson?: string;
  themeCouleur?: string;
  langueDefaut?: string;
  fuseauHoraire?: string;
  maxUtilisateurs?: number;
  maxStockageMo?: number;
  notificationsSmsActives?: boolean;
  notificationsEmailActives?: boolean;
}

export interface UpdateUserProfileDto {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
}

export interface UserDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  nomComplet: string;
  initiales: string;
  telephone?: string;
}

export interface ChangePasswordDto {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

// ── Appels API ────────────────────────────────────────────────────────────────

export interface CabinetResume {
  id: number;
  tenantId: string;
  nomCabinet: string;
  logoUrl: string | null;
  devise: string;
  ville: string | null;
  email: string | null;
  configurationComplete: boolean;
  pourcentageCompletion: number;
  derniereMiseAJour: string | null;
  actif: boolean;
}

export const cabinetService = {
  // Récupère la liste de tous les cabinets (admin uniquement)
  getAllConfigs: () =>
    apiClient.get<CabinetResume[]>("/api/cabinet/configs"),

  // Récupère la configuration complète du cabinet (tenantId pour admin cross-tenant)
  getConfig: (tenantId?: string) =>
    apiClient.get<CabinetConfig>("/api/cabinet/config", tenantId ? { "X-Tenant-ID": tenantId } : undefined),

  // Met à jour les coordonnées du cabinet
  updateContact: (dto: UpdateCabinetContactDto, tenantId?: string) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config/contact", dto, tenantId ? { "X-Tenant-ID": tenantId } : undefined),

  // Met à jour la devise
  updateDevise: (devise: string, tenantId?: string) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config/devise", { devise }, tenantId ? { "X-Tenant-ID": tenantId } : undefined),

  // Met à jour le logo
  updateLogo: (logoUrl: string, tenantId?: string) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config/logo", { logoUrl }, tenantId ? { "X-Tenant-ID": tenantId } : undefined),

  // Crée la configuration initiale du cabinet
  // L'admin passe le tenantId du nouveau cabinet via X-Tenant-ID pour que le backend crée pour ce tenant
  createConfig: (dto: CreateCabinetConfigDto) =>
    apiClient.post<CabinetConfig>("/api/cabinet/config", dto, { "X-Tenant-ID": dto.tenantId }),

  // Met à jour la configuration complète du cabinet (PUT avec version pour le verrou optimiste)
  updateConfig: (dto: UpdateCabinetConfigDto, tenantId?: string) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config", dto, tenantId ? { "X-Tenant-ID": tenantId } : undefined),

  // Désactive le cabinet (actif → false)
  toggleActif: (tenantId: string) =>
    apiClient.delete<void>("/api/cabinet/config", { "X-Tenant-ID": tenantId }),

  // Réactive le cabinet (actif → true) — nécessite PATCH /api/cabinet/config/reactiver côté backend
  reactiverConfig: (tenantId: string) =>
    apiClient.patch<void>("/api/cabinet/config/reactiver", undefined, { "X-Tenant-ID": tenantId }),
};

export const authService = {
  // Met à jour le profil de l'utilisateur connecté
  updateProfile: (dto: UpdateUserProfileDto) =>
    apiClient.put<UserDto>("/api/auth/profile", dto),

  // Change le mot de passe de l'utilisateur connecté
  changePassword: (dto: ChangePasswordDto) =>
    apiClient.post<void>("/api/auth/change-password", dto),
};
