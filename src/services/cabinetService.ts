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
  configurationComplete: boolean;
  pourcentageCompletion: number;
  version: number;
  dateCreation: string;
  derniereMiseAJour: string | null;
  dateModification: string | null;
  modifiePar: string | null;
}

export interface CreateCabinetConfigDto {
  nomCabinet: string;
  devise: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
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

export const cabinetService = {
  // Récupère la configuration complète du cabinet
  getConfig: () =>
    apiClient.get<CabinetConfig>("/api/cabinet/config"),

  // Met à jour les coordonnées du cabinet
  updateContact: (dto: UpdateCabinetContactDto) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config/contact", dto),

  // Met à jour la devise
  updateDevise: (devise: string) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config/devise", { devise }),

  // Met à jour le logo
  updateLogo: (logoUrl: string) =>
    apiClient.put<CabinetConfig>("/api/cabinet/config/logo", { logoUrl }),
};

export const authService = {
  // Met à jour le profil de l'utilisateur connecté
  updateProfile: (dto: UpdateUserProfileDto) =>
    apiClient.put<UserDto>("/api/auth/profile", dto),

  // Change le mot de passe de l'utilisateur connecté
  changePassword: (dto: ChangePasswordDto) =>
    apiClient.post<void>("/api/auth/change-password", dto),
};
