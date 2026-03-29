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
  nom: string;
  categorieReference?: string;
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

export interface HistoriqueEntreeDto {
  id: number;
  typeEvenement: string;
  description: string;
  dateEvenement: string;
  userNom?: string;
  userRole?: string;
  ancienStatut?: string;
  nouveauStatut?: string;
  referenceId?: number;
  referenceType?: string;
  ipAddress?: string;
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

export const STATUT_TRANSITIONS: Record<StatutDossier, StatutDossier[]> = {
  BROUILLON: ["EN_COURS", "ANNULE"],
  EN_COURS: ["EN_ATTENTE", "EN_ATTENTE_VALIDATION", "PRET_SIGNATURE", "SUSPENDU", "ANNULE"],
  EN_ATTENTE: ["EN_COURS", "EN_ATTENTE_SIGNATURE", "ANNULE"],
  EN_ATTENTE_SIGNATURE: ["SIGNE", "EN_COURS", "ANNULE"],
  EN_ATTENTE_VALIDATION: ["PRET_SIGNATURE", "EN_COURS", "ANNULE"],
  PRET_SIGNATURE: ["SIGNE", "EN_COURS", "ANNULE"],
  SIGNE: ["ENREGISTRE", "CLOTURE"],
  ENREGISTRE: ["CLOTURE"],
  SUSPENDU: ["EN_COURS", "ANNULE"],
  CLOTURE: ["ARCHIVE"],
  ANNULE: [],
  ARCHIVE: [],
};

export const STATUTS_TERMINAUX: StatutDossier[] = ["CLOTURE", "ANNULE", "ARCHIVE"];
export type PrioriteDossier = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";

// ── Types Documents (UN SEUL) ─────────────────────────────────────────────────

export interface DocumentDossierDto {
  id: number;
  dossierId: number;
  nomDocument: string;
  typeDocument: string;
  description?: string;
  cheminFichier?: string;
  mimeType?: string;
  tailleFichier?: number;
  tailleFichierFormatee?: string;
  extension?: string;
  hashFichier?: string;
  statut: "BROUILLON" | "VALIDE" | "SIGNE" | "REJETE";
  dateAjout: string;
  dateValidation?: string;
  dateSignature?: string;
  valideParId?: number;
  valideParNom?: string;
  signeParId?: number;
  signeParNom?: string;
  signatureRequise: boolean;
  signe: boolean;
  obligatoire: boolean;
  original: boolean;
  version: number;
  observations?: string;
  confidentiel?: boolean;
  url?: string;
}

export interface CreateDocumentDto {
  nomDocument: string;
  typeDocument: string;
  description?: string;
  signatureRequise?: boolean;
  obligatoire?: boolean;
  confidentiel?: boolean;
}

export interface UpdateDocumentDto {
  nomDocument?: string;
  description?: string;
  typeDocument?: string;
  observations?: string;
  confidentiel?: boolean;
}

export interface SignatureResponse {
  success: boolean;
  urlSignature?: string;
  pdfSigne?: string;
  message?: string;
}

//Clients

export interface ClientDto {
  id: number;
  codeClient: string;
  typeClient: "Personne Physique" | "Personne Morale";
  nom?: string;
  prenom?: string;
  denominationSociale?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  actif: boolean;
  nomComplet?: string;
  nomAffichage?: string;
}

// ── Types Workflow ────────────────────────────────────────────────────────────

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

// ── Autres types ──────────────────────────────────────────────────────────────

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
  clientCode?: string;
  clientNom?: string;   
  nom?: string;         
  prenom?: string;     
  nomComplet?: string;  
  telephone?: string;
  role: RolePartie;
}

export interface CommentaireDto {
  id: number;
  texte: string;
  auteur: string;
  dateCreation: string;
}

export interface DossierDto {
  id: number;
  numeroDossier?: string;
  code?: string;
  typeActe?: { id: number; nom?: string; libelle?: string; categorieReference?: string } | string;
  typeActeId?: number;
  typeActeLibelle?: string;
  typeActeNom?: string;
  objet?: string;
  description?: string;
  statut: StatutDossier;
  priorite: PrioriteDossier;
  pourcentageAvancement?: number;
  avancement?: number;
  montantTotal?: number;
  montant?: number;
  dateOuverture?: string;
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
  rolePartie: RolePartie;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

export function statutLabel(s: StatutDossier): string {
  const map: Record<StatutDossier, string> = {
    BROUILLON: "Brouillon",
    EN_COURS: "En Cours",
    EN_ATTENTE: "En Attente",
    EN_ATTENTE_SIGNATURE: "En Attente de Signature",
    EN_ATTENTE_VALIDATION: "En Attente de Validation",
    PRET_SIGNATURE: "Prêt pour Signature",
    SIGNE: "Signé",
    ENREGISTRE: "Enregistré",
    SUSPENDU: "Suspendu",
    CLOTURE: "Clôturé",
    ANNULE: "Annulé",
    ARCHIVE: "Archivé",
  };
  return map[s] ?? s;
}

export function statutValue(label: string): StatutDossier {
  const map: Record<string, StatutDossier> = {
    "Brouillon": "BROUILLON",
    "En Cours": "EN_COURS",
    "En Attente": "EN_ATTENTE",
    "En Attente de Signature": "EN_ATTENTE_SIGNATURE",
    "En Attente de Validation": "EN_ATTENTE_VALIDATION",
    "Prêt pour Signature": "PRET_SIGNATURE",
    "Signé": "SIGNE",
    "Enregistré": "ENREGISTRE",
    "Suspendu": "SUSPENDU",
    "Clôturé": "CLOTURE",
    "Annulé": "ANNULE",
    "Archivé": "ARCHIVE",
  };
  return map[label] ?? "BROUILLON";
}

export function prioriteLabel(p: PrioriteDossier): string {
  const map: Record<PrioriteDossier, string> = {
    BASSE: "Basse",
    NORMALE: "Normale",
    HAUTE: "Haute",
    URGENTE: "Urgente",
  };
  return map[p] ?? p;
}

export function prioriteValue(label: string): PrioriteDossier {
  const map: Record<string, PrioriteDossier> = {
    Basse: "BASSE",
    Normale: "NORMALE",
    Haute: "HAUTE",
    Urgente: "URGENTE",
  };
  return map[label] ?? "NORMALE";
}

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

// ── Service Client ──────────────────────────────────────────────────────────

export const clientService = {
  /** Récupérer tous les clients du cabinet (paginé) */
  getAll: (params?: { page?: number; size?: number; search?: string; actif?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set("page", String(params.page));
    if (params?.size !== undefined) qs.set("size", String(params.size));
    if (params?.search) qs.set("search", params.search);
    if (params?.actif !== undefined) qs.set("actif", String(params.actif));
    return apiClient.get<Page<ClientDto>>(`/api/clients?${qs.toString()}`);
  },

  /** Récupérer tous les clients actifs (pour les selects) - utilise l'endpoint paginé */
  getAllActifs: async () => {
    const response = await clientService.getAll({ size: 100, actif: true });
    // La réponse est une Page<ClientDto>, on extrait le contenu
    return response.content || response.data || response;
  },
};

// ── Service TypeActe ──────────────────────────────────────────────────────────

export const typeActeService = {
  getAll: (page = 0, size = 100) =>
    apiClient.get<Page<TypeActeDto>>(`/api/types-actes?page=${page}&size=${size}`),
  getActifs: () => apiClient.get<TypeActeDto[]>("/api/types-actes/actifs"),
  getCategories: () => apiClient.get<string[]>("/api/types-actes/categories"),
  search: (q: string) => apiClient.get<TypeActeDto[]>(`/api/types-actes/search?q=${encodeURIComponent(q)}`),
  getById: (id: number) => apiClient.get<TypeActeDto>(`/api/types-actes/${id}`),
  create: (dto: CreateTypeActeDto) => apiClient.post<TypeActeDto>("/api/types-actes", dto),
  update: (id: number, dto: UpdateTypeActeDto) => apiClient.put<TypeActeDto>(`/api/types-actes/${id}`, dto),
  activer: (id: number) => apiClient.patch<TypeActeDto>(`/api/types-actes/${id}/activer`),
  desactiver: (id: number) => apiClient.patch<TypeActeDto>(`/api/types-actes/${id}/desactiver`),
  delete: (id: number) => apiClient.delete<void>(`/api/types-actes/${id}`),
};

// ── Service Dossier ───────────────────────────────────────────────────────────

export const dossierService = {
  // CRUD
  getAll: (params?: { page?: number; size?: number; statut?: StatutDossier; priorite?: PrioriteDossier; typeActeId?: number; search?: string; dateDebut?: string; dateFin?: string }) => {
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
  search: (q: string, page = 0, size = 20) => apiClient.get<Page<DossierDto>>(`/api/dossiers/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),
  getById: (id: number) => apiClient.get<DossierDto>(`/api/dossiers/${id}`),
  create: (dto: CreateDossierDto) => apiClient.post<DossierDto>("/api/dossiers", dto),
  update: (id: number, dto: UpdateDossierDto) => apiClient.put<DossierDto>(`/api/dossiers/${id}`, dto),
  delete: (id: number) => apiClient.delete<void>(`/api/dossiers/${id}`),

  // Statut
  changerStatut: (id: number, statut: StatutDossier) => apiClient.put<DossierDto>(`/api/dossiers/${id}/statut?statut=${statut}`),
  archiver: (id: number) => apiClient.patch<DossierDto>(`/api/dossiers/${id}/archiver`),
  suspendre: (id: number) => apiClient.patch<DossierDto>(`/api/dossiers/${id}/suspendre`),

  // Avancement
  getAvancement: (id: number) => apiClient.get<{ avancement: number }>(`/api/dossiers/${id}/avancement`),
  updateAvancement: (id: number, avancement: number) => apiClient.patch<DossierDto>(`/api/dossiers/${id}/avancement`, { avancement }),

  // Parties prenantes
  getParties: (id: number) => apiClient.get<PartiePrenanteDto[]>(`/api/dossiers/${id}/parties`),
  addPartie: (id: number, dto: AddPartieDto) => apiClient.post<PartiePrenanteDto>(`/api/dossiers/${id}/parties`, dto),
  updatePartie: (id: number, partieId: number, dto: UpdatePartieDto) => apiClient.put<PartiePrenanteDto>(`/api/dossiers/${id}/parties/${partieId}`, dto),
  removePartie: (id: number, partieId: number) => apiClient.delete<void>(`/api/dossiers/${id}/parties/${partieId}`),
  searchParties: (id: number, q: string) => apiClient.get<{ id: number; code: string; nom: string; prenom: string }[]>(`/api/dossiers/${id}/parties/search?q=${encodeURIComponent(q)}`),

  // Documents
  getDocuments: (id: number) => apiClient.get<DocumentDossierDto[]>(`/api/dossiers/${id}/documents`),
  getDocument: (dossierId: number, documentId: number) => apiClient.get<DocumentDossierDto>(`/api/dossiers/${dossierId}/documents/${documentId}`),
  addDocument: (dossierId: number, file: File, metadata: CreateDocumentDto) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nomDocument", metadata.nomDocument);
    formData.append("typeDocument", metadata.typeDocument);
    if (metadata.description) formData.append("description", metadata.description);
    if (metadata.signatureRequise !== undefined) formData.append("signatureRequise", String(metadata.signatureRequise));
    if (metadata.obligatoire !== undefined) formData.append("obligatoire", String(metadata.obligatoire));
    if (metadata.confidentiel !== undefined) formData.append("confidentiel", String(metadata.confidentiel));
    const token = localStorage.getItem("accessToken");
    return fetch(`/api/dossiers/${dossierId}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json()) as Promise<DocumentDossierDto>;
  },
  updateDocument: (dossierId: number, documentId: number, data: UpdateDocumentDto) => apiClient.put<DocumentDossierDto>(`/api/dossiers/${dossierId}/documents/${documentId}`, data),
  removeDocument: (dossierId: number, documentId: number) => apiClient.delete<void>(`/api/dossiers/${dossierId}/documents/${documentId}`),
  validerDocument: (dossierId: number, documentId: number, commentaire?: string) => apiClient.post<DocumentDossierDto>(`/api/dossiers/${dossierId}/documents/${documentId}/valider`, commentaire ? { commentaire } : {}),
  getDocumentUrl: (dossierId: number, documentId: number) => apiClient.get<{ url: string; nom: string }>(`/api/dossiers/${dossierId}/documents/${documentId}/url`),

  // Signature
  signerDocument: (dossierId: number, documentId: number) => apiClient.post<SignatureResponse>(`/api/dossiers/${dossierId}/documents/${documentId}/signer`),
  getStatutSignature: (dossierId: number, documentId: number) => apiClient.get<{ signe: boolean; signeParId?: number; signeParNom?: string; dateSignature?: string }>(`/api/dossiers/${dossierId}/documents/${documentId}/signature`),

  // Workflow
  getWorkflow: (id: number) => apiClient.get<WorkflowDossierDto>(`/api/dossiers/${id}/workflow`),
  getWorkflowEtapes: (id: number) => apiClient.get<WorkflowEtapeDto[]>(`/api/dossiers/${id}/workflow/etapes`),
  getCurrentEtape: (id: number) => apiClient.get<WorkflowEtapeDto>(`/api/dossiers/${id}/workflow/current`),
  nextEtape: (id: number) => apiClient.post<WorkflowEtapeDto>(`/api/dossiers/${id}/workflow/next`),
  previousEtape: (id: number) => apiClient.post<WorkflowEtapeDto>(`/api/dossiers/${id}/workflow/previous`),
  completeEtapeById: (dossierId: number, etapeId: number) => apiClient.post<WorkflowEtapeDto>(`/api/dossiers/${dossierId}/workflow/etapes/${etapeId}/complete`),

  // Commentaires
  getCommentaires: (id: number) => apiClient.get<CommentaireDto[]>(`/api/dossiers/${id}/commentaires`),
  addCommentaire: (id: number, dto: AddCommentaireDto) => apiClient.post<CommentaireDto>(`/api/dossiers/${id}/commentaires`, dto),

  // Historique
  getHistorique: (id: number) => apiClient.get<HistoriqueEntreeDto[]>(`/api/dossiers/${id}/historique`),

  // Actions spéciales
  generateFacture: (id: number, dto: GenerateFactureDto) => apiClient.post<{ factureId: number; numero: string }>(`/api/dossiers/${id}/facture`, dto),
  exportCsv: (params?: { statut?: StatutDossier; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.statut) qs.set("statut", params.statut);
    if (params?.search) qs.set("search", params.search);
    return apiClient.get<string>(`/api/dossiers/export?${qs.toString()}`);
  },
  getStats: () => apiClient.get<DossierStatsDto>("/api/dossiers/statistiques"),

  // Assignation
  assignerNotaire: (id: number, notaireId: number) => apiClient.put<DossierDto>(`/api/dossiers/${id}/assigner-notaire?notaireId=${notaireId}`),
  assignerAssistant: (id: number, assistantId: number) => apiClient.put<DossierDto>(`/api/dossiers/${id}/assigner-assistant?assistantId=${assistantId}`),

  // Blocage / Alertes
  bloquer: (id: number, raison: string) => apiClient.post<DossierDto>(`/api/dossiers/${id}/bloquer?raison=${encodeURIComponent(raison)}`),
  debloquer: (id: number) => apiClient.post<DossierDto>(`/api/dossiers/${id}/debloquer`),
  activerAlerte: (id: number, message: string) => apiClient.post<void>(`/api/dossiers/${id}/activer-alerte?message=${encodeURIComponent(message)}`),
  desactiverAlerte: (id: number) => apiClient.delete<void>(`/api/dossiers/${id}/desactiver-alerte`),

  // Calculs
  calculerHonoraires: (id: number) => apiClient.post<void>(`/api/dossiers/${id}/calculer-honoraires`),
  /** Ajouter un événement manuel à l'historique */
  addHistoriqueEvent: (id: number, data: {
    typeEvenement: string;
    description: string;
    userNom?: string;
    userRole?: string;
    ancienStatut?: string;
    nouveauStatut?: string;
    referenceId?: number;
    referenceType?: string;
  }) => apiClient.post<HistoriqueEntreeDto>(`/api/dossiers/${id}/historique`, data),

  // Statistiques détaillées
  getStatistiquesDetail: (id: number) => apiClient.get<{
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

  // Recherches avancées
  getEnRetard: (page = 0, size = 20) => apiClient.get<Page<DossierDto>>(`/api/dossiers/en-retard?page=${page}&size=${size}`),
  getRecents: (days = 7) => apiClient.get<DossierDto[]>(`/api/dossiers/recent?days=${days}`),
  getByClient: (clientId: number, page = 0, size = 20) => apiClient.get<Page<DossierDto>>(`/api/dossiers/client/${clientId}?page=${page}&size=${size}`),
  getByTypeActe: (typeActe: string, page = 0, size = 20) => apiClient.get<Page<DossierDto>>(`/api/dossiers/by-type/${encodeURIComponent(typeActe)}?page=${page}&size=${size}`),
  getByStatut: (statut: StatutDossier, page = 0, size = 20) => apiClient.get<Page<DossierDto>>(`/api/dossiers/by-statut/${statut}?page=${page}&size=${size}`),
  advancedSearch: (params: { typeActe?: string; statut?: StatutDossier; notaireId?: number; urgent?: boolean; query?: string; page?: number; size?: number }) => {
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