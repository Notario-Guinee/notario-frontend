// ─────────────────────────────────────────────────────────────────────────────
// Service Dossiers — consomme les endpoints /api/dossiers et /api/types-actes
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/apiClient";

// ── Types génériques ──────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Types TypeActe ────────────────────────────────────────────────────────────

export interface TypeActeDto {
  id: number;
  code: string;
  /** Nom du type d'acte — champ réel du backend */
  nom: string;
  /** Catégorie de référence — champ réel du backend */
  categorieReference?: string;
  /** Alias pour compatibilité (si le backend expose aussi 'libelle') */
  libelle?: string;
  categorie?: string;
  description?: string;
  actif: boolean;
  ordreAffichage?: number;
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
}

// ── Types Dossier ─────────────────────────────────────────────────────────────

export type StatutDossier =
  | "EN_COURS"
  | "EN_SIGNATURE"
  | "EN_ATTENTE_PIECES"
  | "TERMINE"
  | "SUSPENDU"
  | "ARCHIVE";

export type PrioriteDossier = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";

export type RolePartie =
  | "ACHETEUR"
  | "VENDEUR"
  | "BENEFICIAIRE"
  | "MANDANT"
  | "MANDATAIRE"
  | "PRENEUR"
  | "BAILLEUR"
  | "DONATEUR"
  | "DONATAIRE"
  | "HERITIER"
  | "AUTRE";

export interface PartiePrenanteDto {
  id: number;
  clientId: number;
  clientCode: string;
  clientNom: string;
  role: RolePartie;
}

export interface DocumentDossierDto {
  id: number;
  nom: string;
  type: string;
  taille: number;
  dateAjout: string;
  ajoutePar: string;
  url?: string;
}

export interface CommentaireDto {
  id: number;
  texte: string;
  auteur: string;
  dateCreation: string;
}

export interface HistoriqueEntreeDto {
  id: number;
  action: string;
  detail?: string;
  auteur: string;
  date: string;
}

export interface WorkflowEtapeDto {
  key: string;
  label: string;
  description?: string;
  statut: "pending" | "active" | "completed";
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowDossierDto {
  dossierId: number;
  etapes: WorkflowEtapeDto[];
}

export interface DossierDto {
  id: number;
  /** Numéro du dossier — champ réel backend (colonne numero_dossier) */
  numeroDossier?: string;
  /** Alias si le backend expose 'code' dans le DTO */
  code?: string;
  /** Référence à l'entité TypeActe — peut être un objet ou juste l'id */
  typeActe?: { id: number; nom?: string; libelle?: string; categorieReference?: string } | string;
  typeActeId?: number;
  typeActeLibelle?: string;
  typeActeNom?: string;
  objet?: string;
  description?: string;
  statut: StatutDossier;
  priorite: PrioriteDossier;
  /** Pourcentage d'avancement — colonne pourcentage_avancement */
  pourcentageAvancement?: number;
  /** Alias si le backend expose 'avancement' */
  avancement?: number;
  /** Montant total — colonne montant_total */
  montantTotal?: number;
  /** Alias si le backend expose 'montant' */
  montant?: number;
  /** Date d'ouverture — colonne date_ouverture */
  dateOuverture?: string;
  /** Alias si le backend expose createdAt */
  createdAt?: string;
  dateCreation?: string;
  dateEcheance?: string;
  notaireChargeId?: number;
  notaireChargeNom?: string;
  notaireId?: number;
  notaireNom?: string;
  assistantChargeId?: number;
  assistantChargeNom?: string;
  clercId?: number;
  clercNom?: string;
  nbParties?: number;
  nbDocuments?: number;
  parties?: PartiePrenanteDto[];
  deleted?: boolean;
}

export interface CreateDossierDto {
  typeActeId: number;
  objet: string;
  statut?: StatutDossier;
  priorite?: PrioriteDossier;
  montant?: number;
  dateEcheance?: string;
  notaireId?: number;
  clercId?: number;
  notes?: string;
}

export interface UpdateDossierDto {
  typeActeId?: number;
  objet?: string;
  statut?: StatutDossier;
  priorite?: PrioriteDossier;
  montant?: number;
  dateEcheance?: string;
  notaireId?: number;
  clercId?: number;
  notes?: string;
}

export interface DossierStatsDto {
  total: number;
  enCours: number;
  enSignature: number;
  enAttentePieces: number;
  termines: number;
  suspendus: number;
  archives: number;
  montantTotal: number;
}

export interface AddPartieDto {
  clientId: number;
  role: RolePartie;
}

export interface UpdatePartieDto {
  role: RolePartie;
}

export interface AddCommentaireDto {
  texte: string;
  stepKey?: string;
}

export interface GenerateFactureDto {
  montant: number;
  description?: string;
  echeance?: string;
}

// ── Helpers de conversion statut / priorité ───────────────────────────────────

/** Statut backend → label FR affiché dans l'UI */
export function statutLabel(s: StatutDossier): string {
  const map: Record<StatutDossier, string> = {
    EN_COURS: "En cours",
    EN_SIGNATURE: "En signature",
    EN_ATTENTE_PIECES: "En attente pièces",
    TERMINE: "Terminé",
    SUSPENDU: "Suspendu",
    ARCHIVE: "Archivé",
  };
  return map[s] ?? s;
}

/** Label UI → valeur backend */
export function statutValue(label: string): StatutDossier {
  const map: Record<string, StatutDossier> = {
    "En cours": "EN_COURS",
    "En signature": "EN_SIGNATURE",
    "En attente pièces": "EN_ATTENTE_PIECES",
    Terminé: "TERMINE",
    Suspendu: "SUSPENDU",
    Archivé: "ARCHIVE",
  };
  return map[label] ?? "EN_COURS";
}

/** Priorité backend → label FR */
export function prioriteLabel(p: PrioriteDossier): string {
  const map: Record<PrioriteDossier, string> = {
    BASSE: "Basse",
    NORMALE: "Normale",
    HAUTE: "Haute",
    URGENTE: "Urgente",
  };
  return map[p] ?? p;
}

/** Label UI → valeur backend */
export function prioriteValue(label: string): PrioriteDossier {
  const map: Record<string, PrioriteDossier> = {
    Basse: "BASSE",
    Normale: "NORMALE",
    Haute: "HAUTE",
    Urgente: "URGENTE",
  };
  return map[label] ?? "NORMALE";
}

/** Rôle backend → label FR */
export function roleLabel(r: RolePartie): string {
  const map: Record<RolePartie, string> = {
    ACHETEUR: "Acheteur",
    VENDEUR: "Vendeur",
    BENEFICIAIRE: "Bénéficiaire",
    MANDANT: "Mandant",
    MANDATAIRE: "Mandataire",
    PRENEUR: "Preneur",
    BAILLEUR: "Bailleur",
    DONATEUR: "Donateur",
    DONATAIRE: "Donataire",
    HERITIER: "Héritier",
    AUTRE: "Autre",
  };
  return map[r] ?? r;
}

/** Label UI → valeur backend */
export function roleValue(label: string): RolePartie {
  const map: Record<string, RolePartie> = {
    Acheteur: "ACHETEUR",
    Vendeur: "VENDEUR",
    Bénéficiaire: "BENEFICIAIRE",
    Mandant: "MANDANT",
    Mandataire: "MANDATAIRE",
    Preneur: "PRENEUR",
    Bailleur: "BAILLEUR",
    Donateur: "DONATEUR",
    Donataire: "DONATAIRE",
    Héritier: "HERITIER",
    Autre: "AUTRE",
  };
  return map[label] ?? "AUTRE";
}

// ── Service TypeActe ──────────────────────────────────────────────────────────

export const typeActeService = {
  /** Liste tous les types d'actes (paginée ou complète) */
  getAll: (page = 0, size = 100) =>
    apiClient.get<Page<TypeActeDto>>(`/api/types-actes?page=${page}&size=${size}`),

  /** Uniquement les types actifs */
  getActifs: () =>
    apiClient.get<TypeActeDto[]>("/api/types-actes/actifs"),

  /** Liste des catégories disponibles */
  getCategories: () =>
    apiClient.get<string[]>("/api/types-actes/categories"),

  /** Recherche full-text */
  search: (q: string) =>
    apiClient.get<TypeActeDto[]>(`/api/types-actes/search?q=${encodeURIComponent(q)}`),

  /** Détail d'un type d'acte */
  getById: (id: number) =>
    apiClient.get<TypeActeDto>(`/api/types-actes/${id}`),

  /** Créer un type d'acte */
  create: (dto: CreateTypeActeDto) =>
    apiClient.post<TypeActeDto>("/api/types-actes", dto),

  /** Modifier un type d'acte */
  update: (id: number, dto: UpdateTypeActeDto) =>
    apiClient.put<TypeActeDto>(`/api/types-actes/${id}`, dto),

  /** Activer un type d'acte */
  activer: (id: number) =>
    apiClient.patch<TypeActeDto>(`/api/types-actes/${id}/activer`),

  /** Désactiver un type d'acte */
  desactiver: (id: number) =>
    apiClient.patch<TypeActeDto>(`/api/types-actes/${id}/desactiver`),

  /** Supprimer un type d'acte */
  delete: (id: number) =>
    apiClient.delete<void>(`/api/types-actes/${id}`),
};

// ── Service Dossier ───────────────────────────────────────────────────────────

export const dossierService = {
  // ── CRUD de base ──────────────────────────────────────────────────────────

  /** Liste paginée avec filtres optionnels */
  getAll: (params?: {
    page?: number;
    size?: number;
    statut?: StatutDossier;
    priorite?: PrioriteDossier;
    typeActeId?: number;
    search?: string;
    dateDebut?: string;
    dateFin?: string;
  }) => {
    const p = params ?? {};
    const qs = new URLSearchParams();
    if (p.page !== undefined) qs.set("page", String(p.page));
    if (p.size !== undefined) qs.set("size", String(p.size));
    if (p.statut) qs.set("statut", p.statut);
    if (p.priorite) qs.set("priorite", p.priorite);
    if (p.typeActeId !== undefined) qs.set("typeActeId", String(p.typeActeId));
    if (p.search) qs.set("search", p.search);
    if (p.dateDebut) qs.set("dateDebut", p.dateDebut);
    if (p.dateFin) qs.set("dateFin", p.dateFin);
    return apiClient.get<Page<DossierDto>>(`/api/dossiers?${qs.toString()}`);
  },

  /** Recherche full-text */
  search: (q: string, page = 0, size = 20) =>
    apiClient.get<Page<DossierDto>>(
      `/api/dossiers/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`
    ),

  /** Détail d'un dossier (avec parties) */
  getById: (id: number) =>
    apiClient.get<DossierDto>(`/api/dossiers/${id}`),

  /** Créer un dossier */
  create: (dto: CreateDossierDto) =>
    apiClient.post<DossierDto>("/api/dossiers", dto),

  /** Modifier un dossier */
  update: (id: number, dto: UpdateDossierDto) =>
    apiClient.put<DossierDto>(`/api/dossiers/${id}`, dto),

  /** Supprimer un dossier */
  delete: (id: number) =>
    apiClient.delete<void>(`/api/dossiers/${id}`),

  // ── Statut ────────────────────────────────────────────────────────────────

  /** Changer le statut d'un dossier */
changerStatut: (id: number, statut: StatutDossier) =>
  apiClient.put<DossierDto>(`/api/dossiers/${id}/statut?statut=${statut}`),

  /** Archiver un dossier */
  archiver: (id: number) =>
    apiClient.patch<DossierDto>(`/api/dossiers/${id}/archiver`),

  /** Suspendre un dossier */
  suspendre: (id: number) =>
    apiClient.patch<DossierDto>(`/api/dossiers/${id}/suspendre`),

  // ── Avancement ────────────────────────────────────────────────────────────

  /** Récupérer l'avancement */
  getAvancement: (id: number) =>
    apiClient.get<{ avancement: number }>(`/api/dossiers/${id}/avancement`),

  /** Mettre à jour l'avancement (0–100) */
  updateAvancement: (id: number, avancement: number) =>
    apiClient.patch<DossierDto>(`/api/dossiers/${id}/avancement`, { avancement }),

  // ── Parties prenantes ─────────────────────────────────────────────────────

  /** Liste des parties d'un dossier */
  getParties: (id: number) =>
    apiClient.get<PartiePrenanteDto[]>(`/api/dossiers/${id}/parties`),

  /** Ajouter une partie prenante */
  addPartie: (id: number, dto: AddPartieDto) =>
    apiClient.post<PartiePrenanteDto>(`/api/dossiers/${id}/parties`, dto),

  /** Modifier le rôle d'une partie */
  updatePartie: (id: number, partieId: number, dto: UpdatePartieDto) =>
    apiClient.put<PartiePrenanteDto>(`/api/dossiers/${id}/parties/${partieId}`, dto),

  /** Retirer une partie prenante */
  removePartie: (id: number, partieId: number) =>
    apiClient.delete<void>(`/api/dossiers/${id}/parties/${partieId}`),

  /** Rechercher des parties possibles (clients) */
  searchParties: (id: number, q: string) =>
    apiClient.get<{ id: number; code: string; nom: string; prenom: string }[]>(
      `/api/dossiers/${id}/parties/search?q=${encodeURIComponent(q)}`
    ),

  // ── Documents ─────────────────────────────────────────────────────────────

  /** Liste des documents d'un dossier */
  getDocuments: (id: number) =>
    apiClient.get<DocumentDossierDto[]>(`/api/dossiers/${id}/documents`),

  /** Ajouter un document (multipart géré séparément via fetch natif) */
  addDocument: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("accessToken");
    return fetch(`/api/dossiers/${id}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json()) as Promise<DocumentDossierDto>;
  },

  /** Supprimer un document */
  removeDocument: (id: number, docId: number) =>
    apiClient.delete<void>(`/api/dossiers/${id}/documents/${docId}`),

  // ── Workflow ──────────────────────────────────────────────────────────────

  /** Récupérer le workflow d'un dossier */
  getWorkflow: (id: number) =>
    apiClient.get<WorkflowDossierDto>(`/api/dossiers/${id}/workflow`),

  /** Démarrer une étape */
  startEtape: (id: number, stepKey: string) =>
    apiClient.post<WorkflowDossierDto>(`/api/dossiers/${id}/workflow/steps/${stepKey}/start`),

  /** Compléter une étape */
  completeEtape: (id: number, stepKey: string) =>
    apiClient.post<WorkflowDossierDto>(`/api/dossiers/${id}/workflow/steps/${stepKey}/complete`),

  /** Annuler / rouvrir une étape */
  revertEtape: (id: number, stepKey: string) =>
    apiClient.post<WorkflowDossierDto>(`/api/dossiers/${id}/workflow/steps/${stepKey}/revert`),

  // ── Commentaires ──────────────────────────────────────────────────────────

  /** Liste des commentaires d'un dossier */
  getCommentaires: (id: number) =>
    apiClient.get<CommentaireDto[]>(`/api/dossiers/${id}/commentaires`),

  /** Ajouter un commentaire (global ou sur une étape) */
  addCommentaire: (id: number, dto: AddCommentaireDto) =>
    apiClient.post<CommentaireDto>(`/api/dossiers/${id}/commentaires`, dto),

  // ── Historique ────────────────────────────────────────────────────────────

  /** Journal d'activité d'un dossier */
  getHistorique: (id: number) =>
    apiClient.get<HistoriqueEntreeDto[]>(`/api/dossiers/${id}/historique`),

  // ── Actions spéciales ─────────────────────────────────────────────────────

  /** Générer une facture depuis un dossier */
  generateFacture: (id: number, dto: GenerateFactureDto) =>
    apiClient.post<{ factureId: number; numero: string }>(`/api/dossiers/${id}/facture`, dto),

  /** Export CSV de la liste */
  exportCsv: (params?: { statut?: StatutDossier; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.statut) qs.set("statut", params.statut);
    if (params?.search) qs.set("search", params.search);
    return apiClient.get<string>(`/api/dossiers/export?${qs.toString()}`);
  },

  // ── Statistiques ──────────────────────────────────────────────────────────

  /** Statistiques globales des dossiers du cabinet */
  getStats: () =>
    apiClient.get<DossierStatsDto>("/api/dossiers/statistiques"),
};
