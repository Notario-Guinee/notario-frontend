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
  | "BROUILLON"
  | "EN_COURS"
  | "EN_ATTENTE"
  | "EN_ATTENTE_SIGNATURE"
  | "EN_ATTENTE_VALIDATION"
  | "PRET_SIGNATURE"
  | "SIGNE"
  | "ENREGISTRE"
  | "SUSPENDU"
  | "CLOTURE"
  | "ANNULE"
  | "ARCHIVE";

/** Transitions autorisées par statut (workflow) */
export const STATUT_TRANSITIONS: Record<StatutDossier, StatutDossier[]> = {
  BROUILLON:              ["EN_COURS", "ANNULE"],
  EN_COURS:               ["EN_ATTENTE", "EN_ATTENTE_VALIDATION", "PRET_SIGNATURE", "SUSPENDU", "ANNULE"],
  EN_ATTENTE:             ["EN_COURS", "EN_ATTENTE_SIGNATURE", "ANNULE"],
  EN_ATTENTE_SIGNATURE:   ["SIGNE", "EN_COURS", "ANNULE"],
  EN_ATTENTE_VALIDATION:  ["PRET_SIGNATURE", "EN_COURS", "ANNULE"],
  PRET_SIGNATURE:         ["SIGNE", "EN_COURS", "ANNULE"],
  SIGNE:                  ["ENREGISTRE", "CLOTURE"],
  ENREGISTRE:             ["CLOTURE"],
  SUSPENDU:               ["EN_COURS", "ANNULE"],
  CLOTURE:                ["ARCHIVE"],
  ANNULE:                 [],
  ARCHIVE:                [],
};

/** Statuts terminaux — aucune transition possible */
export const STATUTS_TERMINAUX: StatutDossier[] = ["CLOTURE", "ANNULE", "ARCHIVE"];

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

// À ajouter dans les types

export interface WorkflowEtapeDto {
  id: number;
  numeroEtape: number;
  nomEtape: string;
  description?: string;
  statut: string;
  obligatoire: boolean;
  dateDebut?: string;
  dateFin?: string;
  dateEcheance?: string;
  dureeEstimeeJours?: number;
  responsableId?: number;
  responsableNom?: string;
  actionsRequises?: string;
  validationRequise: boolean;
  validee: boolean;
  valideeParNom?: string;
  dateValidation?: string;
  documentsRequis?: string;
  observations?: string;
  enRetard: boolean;
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
  // Champs détaillés
  honorairesHT?: number;
  honorairesTTC?: number;
  tva?: number;
  prixBien?: number;
  bienDescription?: string;
  bienAdresse?: string;
  bienVille?: string;
  superficie?: number;
  referenceCadastrale?: string;
  titreFoncier?: string;
  numeroRepertoire?: string;
  numeroMinute?: string;
  lieuSignature?: string;
  dateSignature?: string;
  dateEnregistrement?: string;
  notesInternes?: string;
  observations?: string;
  urgent?: boolean;
  confidentiel?: boolean;
}

export interface CreateDossierDto {
  typeActe: string;
  objet: string;
  description?: string;
  dateEcheance?: string;
  notaireChargeId?: number;
  assistantChargeId?: number;
  honorairesHT?: number;
  tva?: number;
  bienDescription?: string;
  bienAdresse?: string;
  bienVille?: string;
  referenceCadastrale?: string;
  titreFoncier?: string;
  superficie?: number;
  prixBien?: number;
  priorite?: number;
  urgent?: boolean;
  confidentiel?: boolean;
  notesInternes?: string;
  observations?: string;
}

export interface UpdateDossierDto {
  objet?: string;
  description?: string;
  statut?: StatutDossier;
  dateEcheance?: string;
  dateSignature?: string;
  dateEnregistrement?: string;
  notaireChargeId?: number;
  assistantChargeId?: number;
  honorairesHT?: number;
  tva?: number;
  numeroRepertoire?: string;
  numeroMinute?: string;
  lieuSignature?: string;
  bienDescription?: string;
  bienAdresse?: string;
  bienVille?: string;
  referenceCadastrale?: string;
  titreFoncier?: string;
  superficie?: number;
  prixBien?: number;
  priorite?: number;
  urgent?: boolean;
  confidentiel?: boolean;
  notesInternes?: string;
  observations?: string;
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
    BROUILLON:             "Brouillon",
    EN_COURS:              "En Cours",
    EN_ATTENTE:            "En Attente",
    EN_ATTENTE_SIGNATURE:  "En Attente de Signature",
    EN_ATTENTE_VALIDATION: "En Attente de Validation",
    PRET_SIGNATURE:        "Prêt pour Signature",
    SIGNE:                 "Signé",
    ENREGISTRE:            "Enregistré",
    SUSPENDU:              "Suspendu",
    CLOTURE:               "Clôturé",
    ANNULE:                "Annulé",
    ARCHIVE:               "Archivé",
  };
  return map[s] ?? s;
}

/** Label UI → valeur backend */
export function statutValue(label: string): StatutDossier {
  const map: Record<string, StatutDossier> = {
    "Brouillon":                 "BROUILLON",
    "En Cours":                  "EN_COURS",
    "En Attente":                "EN_ATTENTE",
    "En Attente de Signature":   "EN_ATTENTE_SIGNATURE",
    "En Attente de Validation":  "EN_ATTENTE_VALIDATION",
    "Prêt pour Signature":       "PRET_SIGNATURE",
    "Signé":                     "SIGNE",
    "Enregistré":                "ENREGISTRE",
    "Suspendu":                  "SUSPENDU",
    "Clôturé":                   "CLOTURE",
    "Annulé":                    "ANNULE",
    "Archivé":                   "ARCHIVE",
  };
  return map[label] ?? "BROUILLON";
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




// ── Workflow avancé (selon Swagger) ──────────────────────────────────────────────

/** Récupérer toutes les étapes du workflow d'un dossier */
getWorkflowEtapes: (id: number) =>
  apiClient.get<WorkflowEtapeDto[]>(`/api/dossiers/${id}/workflow/etapes`),

/** Récupérer l'étape courante du workflow */
getCurrentEtape: (id: number) =>
  apiClient.get<WorkflowEtapeDto>(`/api/dossiers/${id}/workflow/current`),

/** Passer à l'étape suivante */
nextEtape: (id: number) =>
  apiClient.post<WorkflowEtapeDto>(`/api/dossiers/${id}/workflow/next`),

/** Revenir à l'étape précédente */
previousEtape: (id: number) =>
  apiClient.post<WorkflowEtapeDto>(`/api/dossiers/${id}/workflow/previous`),

/** Mettre à jour une étape spécifique */
updateEtape: (dossierId: number, etapeId: number, data: Partial<WorkflowEtapeDto>) =>
  apiClient.put<WorkflowEtapeDto>(`/api/dossiers/${dossierId}/workflow/etapes/${etapeId}`, data),

/** Marquer une étape comme complétée */
completeEtapeById: (dossierId: number, etapeId: number) =>
  apiClient.post<WorkflowEtapeDto>(`/api/dossiers/${dossierId}/workflow/etapes/${etapeId}/complete`),

// ── Assignation (Swagger) ───────────────────────────────────────────────────────

/** Assigner un notaire au dossier */
assignerNotaire: (id: number, notaireId: number) =>
  apiClient.put<DossierDto>(`/api/dossiers/${id}/assigner-notaire?notaireId=${notaireId}`),

/** Assigner un assistant au dossier */
assignerAssistant: (id: number, assistantId: number) =>
  apiClient.put<DossierDto>(`/api/dossiers/${id}/assigner-assistant?assistantId=${assistantId}`),

// ── Blocage / Déblocage (Swagger) ───────────────────────────────────────────────

/** Bloquer un dossier (empêche toute modification) */
bloquer: (id: number, raison: string) =>
  apiClient.post<DossierDto>(`/api/dossiers/${id}/bloquer?raison=${encodeURIComponent(raison)}`),

/** Débloquer un dossier */
debloquer: (id: number) =>
  apiClient.post<DossierDto>(`/api/dossiers/${id}/debloquer`),

// ── Alertes (Swagger) ───────────────────────────────────────────────────────────

/** Activer une alerte sur le dossier */
activerAlerte: (id: number, message: string) =>
  apiClient.post<void>(`/api/dossiers/${id}/activer-alerte?message=${encodeURIComponent(message)}`),

/** Désactiver l'alerte du dossier */
desactiverAlerte: (id: number) =>
  apiClient.delete<void>(`/api/dossiers/${id}/desactiver-alerte`),

// ── Calculs (Swagger) ───────────────────────────────────────────────────────────

/** Calculer les honoraires automatiquement selon le barème */
calculerHonoraires: (id: number) =>
  apiClient.post<void>(`/api/dossiers/${id}/calculer-honoraires`),

// ── Statistiques détaillées (Swagger) ──────────────────────────────────────────

/** Récupérer les statistiques détaillées d'un dossier */
getStatistiquesDetail: (id: number) =>
  apiClient.get<{
    dossierId: number;
    nombreParties: number;
    nombreDocuments: number;
    nombreEtapes: number;
    etapesTerminees: number;
    pourcentageAvancement: number;
    montantTotal: number;
    montantPaye: number;
    montantRestant: number;
    tauxPaiement: number;
    joursEcoules: number;
    joursRestants: number;
    dateOuverture: string;
    dateEcheance?: string;
    enRetard: boolean;
    solde: boolean;
    statutActuel: string;
  }>(`/api/dossiers/${id}/statistiques`),

// ── Recherches avancées (Swagger) ──────────────────────────────────────────────

/** Dossiers en retard */
getEnRetard: (page = 0, size = 20) =>
  apiClient.get<Page<DossierDto>>(`/api/dossiers/en-retard?page=${page}&size=${size}`),

/** Dossiers récents (N derniers jours) */
getRecents: (days = 7) =>
  apiClient.get<DossierDto[]>(`/api/dossiers/recent?days=${days}`),

/** Dossiers d'un client */
getByClient: (clientId: number, page = 0, size = 20) =>
  apiClient.get<Page<DossierDto>>(`/api/dossiers/client/${clientId}?page=${page}&size=${size}`),

/** Dossiers par type d'acte */
getByTypeActe: (typeActe: string, page = 0, size = 20) =>
  apiClient.get<Page<DossierDto>>(`/api/dossiers/by-type/${encodeURIComponent(typeActe)}?page=${page}&size=${size}`),

/** Dossiers par statut */
getByStatut: (statut: StatutDossier, page = 0, size = 20) =>
  apiClient.get<Page<DossierDto>>(`/api/dossiers/by-statut/${statut}?page=${page}&size=${size}`),

/** Recherche avancée multi-critères */
advancedSearch: (params: {
  typeActe?: string;
  statut?: StatutDossier;
  notaireId?: number;
  urgent?: boolean;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const qs = new URLSearchParams();
  if (params.typeActe) qs.set("typeActe", params.typeActe);
  if (params.statut) qs.set("statut", params.statut);
  if (params.notaireId) qs.set("notaireId", String(params.notaireId));
  if (params.urgent !== undefined) qs.set("urgent", String(params.urgent));
  if (params.query) qs.set("query", params.query);
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.size !== undefined) qs.set("size", String(params.size));
  return apiClient.get<Page<DossierDto>>(`/api/dossiers/advanced-search?${qs.toString()}`);
},
};
