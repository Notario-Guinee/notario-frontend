/**
 * TypeScript interfaces matching backend entities.
 */

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "GERANT" | "STANDARD" | "LECTURE_SEULE" | "ADMIN_GLOBAL";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: UserRole | string;
  actif: boolean;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: UserRole | string;
  password: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">>;

// ─── Client ──────────────────────────────────────────────────────────────────

export type TypeClient = "PHYSIQUE" | "MORALE";

export interface Client {
  id: number;
  tenantId: string;
  typeClient: TypeClient;
  // Natural person (PHYSIQUE)
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroCni?: string;
  // Legal entity (MORALE)
  raisonSociale?: string;
  numeroRccm?: string;
  nif?: string;
  formeJuridique?: string;
  // Common
  email?: string;
  telephone: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  actif: boolean;
  vip?: boolean;
  notes?: string;
  createdAt?: string;
}

export type CreateClientPayload = Omit<Client, "id" | "tenantId" | "createdAt">;
export type UpdateClientPayload = Partial<CreateClientPayload>;

// ─── Dossier ─────────────────────────────────────────────────────────────────

export type DossierStatut =
  | "EN_COURS"
  | "EN_SIGNATURE"
  | "EN_ATTENTE_PIECES"
  | "TERMINE"
  | "SUSPENDU"
  | "ARCHIVE";

export type DossierPriorite = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";

export interface Dossier {
  id: number;
  tenantId: string;
  code: string;
  typeActe: string;
  objet: string;
  statut: DossierStatut;
  priorite: DossierPriorite;
  montant?: number;
  avancement?: number;
  dateCreation: string;
  dateEcheance?: string;
  notaireId?: number;
  assistantId?: number;
  clientIds?: number[];
  clients?: Client[];
  createdAt?: string;
}

export interface CreateDossierPayload {
  typeActe: string;
  objet: string;
  statut?: DossierStatut;
  priorite?: DossierPriorite;
  montant?: number;
  dateEcheance?: string;
  notaireId?: number;
  assistantId?: number;
  clientIds?: number[];
}

export type UpdateDossierPayload = Partial<CreateDossierPayload>;

export interface ChangerStatutPayload {
  statut: DossierStatut;
}

// ─── Facture ─────────────────────────────────────────────────────────────────

export type FactureStatut =
  | "BROUILLON"
  | "EMISE"
  | "PAYEE"
  | "EN_RETARD"
  | "ANNULEE";

export interface Facture {
  id: number;
  tenantId: string;
  numero: string;
  dossierId?: number;
  clientId: number;
  client?: Client;
  montantHT: number;
  montantTVA?: number;
  montantTTC: number;
  statut: FactureStatut;
  dateEmission?: string;
  dateEcheance?: string;
  dateCreation: string;
}

export interface CreateFacturePayload {
  dossierId?: number;
  clientId: number;
  montantHT: number;
  montantTVA?: number;
  montantTTC: number;
  dateEcheance?: string;
}

export type UpdateFacturePayload = Partial<CreateFacturePayload>;

// ─── Paiement ────────────────────────────────────────────────────────────────

export type ModePaiement =
  | "ESPECES"
  | "VIREMENT"
  | "CHEQUE"
  | "MOBILE_MONEY"
  | "CARTE";

export type PaiementStatut =
  | "EN_ATTENTE"
  | "VALIDE"
  | "REJETE"
  | "REMBOURSE";

export interface Paiement {
  id: number;
  tenantId: string;
  reference: string;
  factureId?: number;
  clientId: number;
  client?: Client;
  montant: number;
  modePaiement: ModePaiement;
  statut: PaiementStatut;
  dateTransaction: string;
  numerTransaction?: string;
  notes?: string;
}

export interface CreatePaiementPayload {
  factureId?: number;
  clientId: number;
  montant: number;
  modePaiement: ModePaiement;
  dateTransaction: string;
  numerTransaction?: string;
  notes?: string;
}

export interface UpdatePaiementStatutPayload {
  statut: PaiementStatut;
}

// ─── Agenda / Rendez-vous ────────────────────────────────────────────────────

export type RendezVousStatut =
  | "PLANIFIE"
  | "CONFIRME"
  | "EN_COURS"
  | "TERMINE"
  | "ANNULE";

export interface RendezVous {
  id: number;
  tenantId: string;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  statut: RendezVousStatut;
  typeRendezVous?: string;
  notaireId?: number;
  clientId?: number;
  dossierId?: number;
  lieu?: string;
}

export interface CreateRendezVousPayload {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  statut?: RendezVousStatut;
  typeRendezVous?: string;
  notaireId?: number;
  clientId?: number;
  dossierId?: number;
  lieu?: string;
}

export type UpdateRendezVousPayload = Partial<CreateRendezVousPayload>;

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  tenantId: string;
  userId: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  createdAt: string;
}

// ─── Dashboard / Statistics ──────────────────────────────────────────────────

export interface DashboardStats {
  totalDossiers?: number;
  dossiersEnCours?: number;
  totalClients?: number;
  chiffreAffaires?: number;
  paiementsEnAttente?: number;
  rendezVousAujourdhui?: number;
  [key: string]: unknown;
}

export interface RevenueByMonth {
  mois: string;
  montant: number;
  [key: string]: unknown;
}

export interface TopClient {
  clientId: number;
  nom: string;
  totalFacture: number;
  [key: string]: unknown;
}

// ─── Kanban ──────────────────────────────────────────────────────────────────

export interface KanbanBoard {
  id: number;
  tenantId: string;
  nom: string;
  description?: string;
  colonnes?: KanbanColonne[];
  createdAt?: string;
}

export interface KanbanColonne {
  id: number;
  nom: string;
  ordre: number;
  couleur?: string;
}

export interface KanbanTask {
  id: number;
  tenantId: string;
  boardId: number;
  colonneId: number;
  titre: string;
  description?: string;
  priorite?: DossierPriorite;
  assigneId?: number;
  dossierId?: number;
  dateEcheance?: string;
  ordre?: number;
  createdAt?: string;
}

export interface CreateKanbanTaskPayload {
  boardId: number;
  colonneId: number;
  titre: string;
  description?: string;
  priorite?: DossierPriorite;
  assigneId?: number;
  dossierId?: number;
  dateEcheance?: string;
}

export type UpdateKanbanTaskPayload = Partial<CreateKanbanTaskPayload>;

export interface MoveKanbanTaskPayload {
  colonneId: number;
  ordre?: number;
}

// ─── Cabinet configuration ───────────────────────────────────────────────────

export interface CabinetConfig {
  nom?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logo?: string;
  numeroAgrement?: string;
  devise?: string;
  tauxTVA?: number;
  [key: string]: unknown;
}
