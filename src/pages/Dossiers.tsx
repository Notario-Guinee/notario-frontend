// ═══════════════════════════════════════════════════════════════
// Page Dossiers — Gestion complète des dossiers notariaux
// Inclut : liste/grille, CRUD, détail tiroir avec workflow,
// gestion des parties prenantes, filtres, export CSV/PDF
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { searchMatch } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";
import { Plus, Download, Search, FolderOpen, Clock, PenLine, CheckCircle2, DollarSign, MoreHorizontal, X, Trash2, Edit, FileText, List, LayoutGrid, Archive, Receipt, UserPlus, Users, FileDown, CalendarDays, Upload, GitBranch, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { mockClients, formatGNF, rolesParties, currentUser, type Dossier, type PartiePrenanteEntry } from "@/data/mockData";
import {
  dossierService, typeActeService, clientService,
  statutLabel, statutValue, prioriteLabel, roleLabel, roleValue,
  STATUT_TRANSITIONS, STATUTS_TERMINAUX,
  type DossierDto, 
  type TypeActeDto, 
  type StatutDossier,
  type DocumentDossierDto,
  type CreateDocumentDto, 
  type WorkflowEtapeDto,  
  type UpdateDossierDto,    
  type HistoriqueEntreeDto,  
  type ClientDto,
  
} from "@/services/dossierService";
import { TYPES_ACTE } from "@/data/constants";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WorkflowProcedural from "@/components/workflow/WorkflowProcedural";
import { WORKFLOW_PALETTE } from "@/components/workflow/workflow-types";
import { useDossierTabs } from "@/context/DossierTabsContext";
import { useAuth } from "@/context/AuthContext";
import { getTypeActeCode } from "@/constants/typeActeMapping";

// categoriesActes est défini dans le composant pour pouvoir accéder à typeActes
// La constante statique reste disponible comme fallback
const statuts: Dossier["statut"][] = [
  "Brouillon", "En Cours", "En Attente", "En Attente de Signature",
  "En Attente de Validation", "Prêt pour Signature", "Signé",
  "Enregistré", "Suspendu", "Clôturé", "Annulé", "Archivé",
];
const priorites: Dossier["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];


/** Convertit un DossierDto (API) en Dossier local (UI).
 *  Gère les deux conventions de nommage possibles du backend. */
function mapDtoToLocal(dto: DossierDto): Dossier {
  const code: string = dto.numeroDossier ?? dto.code ?? String(dto.id);

  const typeActeLibelle: string =
    dto.typeActeLibelle ??
    dto.typeActeNom ??
    (typeof dto.typeActe === "object" && dto.typeActe !== null
      ? (dto.typeActe.nom ?? dto.typeActe.libelle ?? "")
      : typeof dto.typeActe === "string"
      ? dto.typeActe
      : "");

  const montant: number = dto.montantTotal ?? dto.montant ?? 0;
  const avancement: number = dto.pourcentageAvancement ?? dto.avancement ?? 0;

  const dateRaw: string = dto.dateOuverture ?? dto.createdAt ?? dto.dateCreation ?? "";
  const dateLocale: string = dateRaw ? new Date(dateRaw).toLocaleDateString("fr-FR") : "";

  const notaire: string = dto.notaireChargeNom ?? dto.notaireNom ?? "";
  const clerc: string | undefined = dto.assistantChargeNom ?? dto.clercNom;

  // ✅ Mapper les parties correctement
  const partiesMappees = dto.parties?.map(p => ({
    id: p.id,
    clientCode: p.clientCode ?? "",
    nom: p.nomComplet ?? p.clientNom ?? 
        ([p.prenom, p.nom].filter(Boolean).join(" ") || "?"),
    role: roleLabel(p.role) as PartiePrenanteEntry["role"],
    clientId: p.clientId,
    telephone: p.telephone,  // ✅
  })) ?? [];

  return {
    id: String(dto.id),
    code,
    typeActe: typeActeLibelle,
    objet: dto.objet ?? dto.description ?? "",
    clients: partiesMappees.map(p => p.nom),
    clientDate: dateLocale,
    montant,
    statut: statutLabel(dto.statut) as Dossier["statut"],
    priorite: prioriteLabel(dto.priorite) as Dossier["priorite"],
    avancement,
    nbActes: 0,
    nbPieces: dto.nbDocuments ?? 0,
    date: dateRaw,
    notaire,
    clerc,
    parties: partiesMappees,  // ✅
    deleted: dto.deleted ?? false,
    description: dto.description,
    dateEcheance: dto.dateEcheance,
    dateSignature: dto.dateSignature,
    dateEnregistrement: dto.dateEnregistrement,
    notaireChargeId: dto.notaireChargeId,
    assistantChargeId: dto.assistantChargeId,
    honorairesHT: dto.honorairesHT,
    tva: dto.tva,
    prixBien: dto.prixBien,
    bienDescription: dto.bienDescription,
    bienAdresse: dto.bienAdresse,
    bienVille: dto.bienVille,
    superficie: dto.superficie,
    referenceCadastrale: dto.referenceCadastrale,
    titreFoncier: dto.titreFoncier,
    numeroRepertoire: dto.numeroRepertoire,
    numeroMinute: dto.numeroMinute,
    lieuSignature: dto.lieuSignature,
    notesInternes: dto.notesInternes,
    observations: dto.observations,
    urgent: dto.urgent ?? false,
    confidentiel: dto.confidentiel ?? false,
  };
}

const PAGE_SIZE = 20;

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-primary" : value >= 30 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

export default function Dossiers() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const { announce } = useAnnouncer();
  const { user } = useAuth();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeActes, setTypeActes] = useState<TypeActeDto[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");
  const [filterTypeActe, setFilterTypeActe] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { openTabs, activeTabId, setActiveTabId, openTab, closeTab, setTabDetailSubTab } = useDossierTabs();


  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);

  // Derived from active tab
  const activeTab = openTabs.find(t => t.id === activeTabId);
  const selectedDossier = activeTab ? dossiers.find(d => d.id === activeTab.dossierId) ?? null : null;
  const detailTab = activeTab?.detailSubTab ?? "details";
  const setDetailTab = (st: string) => { if (activeTab) setTabDetailSubTab(activeTab.id, st); };
  const pageTab = activeTabId === "dossiers" ? "dossiers" : (activeTab?.type ?? "dossiers");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [workflowEtapes, setWorkflowEtapes] = useState<WorkflowEtapeDto[]>([]);
  const [currentEtape, setCurrentEtape] = useState<WorkflowEtapeDto | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // ═══ Documents ═══
  const [documents, setDocuments] = useState<DocumentDossierDto[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState<CreateDocumentDto>({
    nomDocument: "",
    typeDocument: "AUTRE",
    description: "",
    signatureRequise: false,
    obligatoire: false,
    confidentiel: false,
  });

  // ═══ Signature électronique ═══
  const [signatureEnCours, setSignatureEnCours] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [documentASigner, setDocumentASigner] = useState<DocumentDossierDto | null>(null);

  // ═══ Historique ═══
  const [historique, setHistorique] = useState<HistoriqueEntreeDto[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);

  // ═══ Ajout manuel d'événement à l'historique ═══
  const [showAddHistoriqueModal, setShowAddHistoriqueModal] = useState(false);
  const [newHistoriqueEvent, setNewHistoriqueEvent] = useState({
    typeEvenement: "COMMENTAIRE",
    description: "",
  });
  const [isAddingHistorique, setIsAddingHistorique] = useState(false);

  // ═══ Clients pour le select ═══
  const [clientsList, setClientsList] = useState<ClientDto[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [uploadContext, setUploadContext] = useState<"pieces" | "actes">("pieces");
  


    // ═══ Chargement initial depuis l'API ═══
  const loadDossiers = useCallback(async () => {
    try {
      setLoading(true);
      const page = await dossierService.getAll({ page: 0, size: 100 });
      console.log("✅ Réponse dossiers:", page);
      console.log("✅ Type:", typeof page, Array.isArray(page));
      console.log("✅ Clés:", page ? Object.keys(page) : "null");

      // Gère les 3 formats possibles
    const raw = page as { content?: DossierDto[]; data?: DossierDto[]; dossiers?: DossierDto[] };
    const items: DossierDto[] = Array.isArray(page)
      ? (page as DossierDto[])
      : raw.content ?? raw.data ?? raw.dossiers ?? [];

    console.log("✅ Items extraits:", items.length);
    setDossiers(
      items
        .filter((d) => !d.deleted)
        .map(mapDtoToLocal)
    );
    } catch (err) {
      console.error("❌ Erreur complète:", err);
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  // ═══ Chargement du workflow depuis l'API ═══
  const loadWorkflow = useCallback(async (dossierId: number) => {
    try {
      setWorkflowLoading(true);
      // Réinitialise après activation du spinner
      setWorkflowEtapes([]);
      setCurrentEtape(null);
      const etapes = await dossierService.getWorkflowEtapes(dossierId);
      setWorkflowEtapes(etapes);
      // getCurrentEtape peut renvoyer 404 si aucune étape active — on l'ignore
      try {
        const current = await dossierService.getCurrentEtape(dossierId);
        setCurrentEtape(current);
      } catch {
        // Pas d'étape active (workflow pas encore démarré ou toutes complétées)
        setCurrentEtape(null);
      }
    } catch (error) {
      console.error("Erreur chargement workflow:", error);
      // Pas de toast — certains dossiers n'ont pas encore d'étapes initialisées
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  // ═══ Chargement des documents ═══
  const loadDocuments = useCallback(async (dossierId: number) => {
    try {
      setDocumentsLoading(true);
      const docs = await dossierService.getDocuments(dossierId);
      setDocuments(docs);
    } catch (error) {
      console.error("Erreur chargement documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  // ═══ Chargement de l'historique ═══
  const loadHistorique = useCallback(async (dossierId: number) => {
    try {
      setHistoriqueLoading(true);
      const data = await dossierService.getHistorique(dossierId);
      setHistorique(data);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setHistoriqueLoading(false);
    }
  }, []);

  // ═══ Chargement des clients ═══
// ═══ Chargement des clients ═══
// ═══ Chargement des clients ═══
const loadClients = useCallback(async () => {
  try {
    setClientsLoading(true);
    // Utiliser getAllActifs qui retourne un tableau de clients
    const clients = await clientService.getAllActifs();
    setClientsList(clients);
  } catch (error) {
    console.error("Erreur chargement clients:", error);
    toast.error(fr ? "Erreur chargement des clients" : "Error loading clients");
    setClientsList([]);
  } finally {
    setClientsLoading(false);
  }
}, [fr]);

// Charger les documents quand on est sur l'onglet "pieces" ou "signataires"
useEffect(() => {
  if (selectedDossier && (detailTab === "pieces" || detailTab === "signataires")) {
    loadDocuments(Number(selectedDossier.id));
  }
}, [selectedDossier, detailTab, loadDocuments]);

// Charger l'historique quand on est sur l'onglet historique
useEffect(() => {
  if (selectedDossier && detailTab === "historique") {
    loadHistorique(Number(selectedDossier.id));
  }
}, [selectedDossier, detailTab, loadHistorique]);

 const openSignatureModal = (document: DocumentDossierDto) => {
    setDocumentASigner(document);
    setShowSignatureModal(true);
  };

  /** Signer un document */
  const handleSignerDocument = async (documentId: number) => {
    if (!selectedDossier) return;
    
    try {
      setSignatureEnCours(true);
      
      const response = await dossierService.signerDocument(
        Number(selectedDossier.id), 
        documentId
      );
      
      // ✅ Si la réponse est enveloppée dans un objet "data"
      const result = response.data || response;
      
      if (result.success) {
        if (result.urlSignature) {
          window.open(result.urlSignature, "_blank");
          toast.info(
            fr 
              ? "Redirection vers la plateforme de signature..." 
              : "Redirecting to signature platform..."
          );
        } else if (result.pdfSigne) {
          const link = document.createElement("a");
          const base64Data = result.pdfSigne;
          const blob = base64ToBlob(base64Data, "application/pdf");
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.download = `document_signe_${documentId}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast.success(fr ? "Document signé avec succès" : "Document signed successfully");
        }
        
        await loadDocuments(Number(selectedDossier.id));
        setShowSignatureModal(false);
        setDocumentASigner(null);
      } else {
        toast.error(result.message || (fr ? "Erreur lors de la signature" : "Error during signature"));
      }
      
    } catch (error) {
      console.error("Erreur signature:", error);
      toast.error(fr ? "Erreur lors de la signature" : "Error during signature");
    } finally {
      setSignatureEnCours(false);
    }
  };

  

  /** Helper: convertir base64 en Blob */
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

// ═══ Gestion des documents ═══

/** Sélection d'un fichier pour upload */
/** Sélection d'un fichier pour upload */
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setUploadFile(e.target.files[0]);
    
    // ✅ Configurer les métadonnées selon le contexte
    const isActe = uploadContext === "actes";
    
    setUploadMetadata({
      nomDocument: e.target.files[0].name,
      typeDocument: isActe ? "ACTE" : "AUTRE",
      description: "",
      signatureRequise: isActe ? true : false,
      obligatoire: false,
      confidentiel: false,
    });
    setShowUploadModal(true);
  }
  e.target.value = "";
};

/** Upload du document */
/** Upload du document */
const handleUploadDocument = async () => {
  if (!selectedDossier || !uploadFile) return;
  
  try {
    setDocumentsLoading(true);
    
    // Upload avec les métadonnées (toutes optionnelles)
    const newDoc = await dossierService.addDocument(
      Number(selectedDossier.id),
      uploadFile,
      {
        nomDocument: uploadMetadata.nomDocument || undefined, // si vide, le backend utilise le nom du fichier
        typeDocument: uploadMetadata.typeDocument !== "AUTRE" ? uploadMetadata.typeDocument : undefined,
        description: uploadMetadata.description || undefined,
        signatureRequise: uploadMetadata.signatureRequise,
        confidentiel: uploadMetadata.confidentiel,
        obligatoire: uploadMetadata.obligatoire,
      }
    );
    
    setDocuments(prev => [newDoc, ...prev]);
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadMetadata({
      nomDocument: "",
      typeDocument: "AUTRE",
      description: "",
      signatureRequise: false,
      obligatoire: false,
      confidentiel: false,
    });
    
    toast.success(fr ? "Document ajouté avec succès" : "Document added successfully");
  } catch (error) {
    console.error("Erreur upload:", error);
    toast.error(fr ? "Erreur lors de l'upload" : "Error uploading document");
  } finally {
    setDocumentsLoading(false);
  }
};

/** Validation d'un document (notaire) */
const handleValiderDocument = async (documentId: number) => {
  if (!selectedDossier) return;
  
  try {
    await dossierService.validerDocument(Number(selectedDossier.id), documentId);
    await loadDocuments(Number(selectedDossier.id));
    toast.success(fr ? "Document validé" : "Document validated");
  } catch (error) {
    console.error("Erreur validation:", error);
    toast.error(fr ? "Erreur lors de la validation" : "Error validating document");
  }
};

/** Téléchargement d'un document */
const handleDownloadDocument = async (documentId: number, _nom: string) => {
  if (!selectedDossier) return;
  
  try {
    const { url } = await dossierService.getDocumentUrl(Number(selectedDossier.id), documentId);
    window.open(url, "_blank");
  } catch (error) {
    console.error("Erreur téléchargement:", error);
    toast.error(fr ? "Erreur lors du téléchargement" : "Error downloading document");
  }
};

/** Suppression d'un document */
const handleDeleteDocument = async (documentId: number) => {
  if (!selectedDossier) return;
  
  try {
    await dossierService.removeDocument(Number(selectedDossier.id), documentId);
    setDocuments(prev => prev.filter(d => d.id !== documentId));
    toast.success(fr ? "Document supprimé" : "Document deleted");
  } catch (error) {
    console.error("Erreur suppression:", error);
    toast.error(fr ? "Erreur lors de la suppression" : "Error deleting document");
  }
};

// ═══ Ajouter un événement à l'historique ═══
const handleAddHistoriqueEvent = async () => {
  if (!selectedDossier) return;
  
  if (!newHistoriqueEvent.description.trim()) {
    toast.error(fr ? "Veuillez saisir une description" : "Please enter a description");
    return;
  }
  
  try {
    setIsAddingHistorique(true);
    
    await dossierService.addHistoriqueEvent(Number(selectedDossier.id), {
      typeEvenement: newHistoriqueEvent.typeEvenement,
      description: newHistoriqueEvent.description,
      userNom: user?.prenom + " " + user?.nom || currentUser.name,
      userRole: user?.role,
    });
    
    // Recharger l'historique
    await loadHistorique(Number(selectedDossier.id));
    
    toast.success(fr ? "Événement ajouté à l'historique" : "Event added to history");
    setShowAddHistoriqueModal(false);
    setNewHistoriqueEvent({
      typeEvenement: "COMMENTAIRE",
      description: "",
    });
    
  } catch (error) {
    console.error("Erreur ajout historique:", error);
    toast.error(fr ? "Erreur lors de l'ajout" : "Error adding event");
  } finally {
    setIsAddingHistorique(false);
  }
};

// ═══ Helpers pour l'historique ═══
const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    "CREATION": "📄",
    "MODIFICATION": "✏️",
    "SUPPRESSION": "🗑️",
    "CHANGEMENT_STATUT": "🔄",
    "AJOUT_PARTIE": "👥",
    "SUPPRESSION_PARTIE": "❌",
    "MODIFICATION_PARTIE": "✏️",
    "AJOUT_DOCUMENT": "📎",
    "SUPPRESSION_DOCUMENT": "🗑️",
    "MODIFICATION_DOCUMENT": "✏️",
    "VALIDATION_DOCUMENT": "✅",
    "SIGNATURE_DOCUMENT": "✍️",
    "BLOCAGE": "🔒",
    "DEBLOCAGE": "🔓",
    "ALERTE_ACTIVEE": "⚠️",
    "ASSIGNATION_NOTAIRE": "⚖️",
    "ASSIGNATION_ASSISTANT": "👨‍💼",
    "AVANCEMENT_ETAPE": "⏩",
    "RETOUR_ETAPE": "⏪",
    "COMPLETION_ETAPE": "✅",
    "MODIFICATION_ETAPE": "✏️",
    "COMMENTAIRE": "💬",
  };
  return icons[type] || "📌";
};

const getEventLabel = (type: string, fr: boolean): string => {
  const labels: Record<string, { fr: string; en: string }> = {
    "CREATION": { fr: "Dossier créé", en: "Case created" },
    "MODIFICATION": { fr: "Dossier modifié", en: "Case updated" },
    "SUPPRESSION": { fr: "Dossier supprimé", en: "Case deleted" },
    "CHANGEMENT_STATUT": { fr: "Changement de statut", en: "Status changed" },
    "AJOUT_PARTIE": { fr: "Partie ajoutée", en: "Stakeholder added" },
    "SUPPRESSION_PARTIE": { fr: "Partie retirée", en: "Stakeholder removed" },
    "MODIFICATION_PARTIE": { fr: "Partie modifiée", en: "Stakeholder updated" },
    "AJOUT_DOCUMENT": { fr: "Document ajouté", en: "Document added" },
    "SUPPRESSION_DOCUMENT": { fr: "Document supprimé", en: "Document deleted" },
    "MODIFICATION_DOCUMENT": { fr: "Document modifié", en: "Document updated" },
    "VALIDATION_DOCUMENT": { fr: "Document validé", en: "Document validated" },
    "SIGNATURE_DOCUMENT": { fr: "Document signé", en: "Document signed" },
    "BLOCAGE": { fr: "Dossier bloqué", en: "Case blocked" },
    "DEBLOCAGE": { fr: "Dossier débloqué", en: "Case unblocked" },
    "ALERTE_ACTIVEE": { fr: "Alerte activée", en: "Alert activated" },
    "ASSIGNATION_NOTAIRE": { fr: "Notaire assigné", en: "Notary assigned" },
    "ASSIGNATION_ASSISTANT": { fr: "Assistant assigné", en: "Assistant assigned" },
    "AVANCEMENT_ETAPE": { fr: "Étape suivante", en: "Next step" },
    "RETOUR_ETAPE": { fr: "Étape précédente", en: "Previous step" },
    "COMPLETION_ETAPE": { fr: "Étape complétée", en: "Step completed" },
    "MODIFICATION_ETAPE": { fr: "Étape modifiée", en: "Step updated" },
    "COMMENTAIRE": { fr: "Commentaire", en: "Comment" },
    "RELANCE": { fr: "Relance client", en: "Client follow-up" },
    "RENDEZ_VOUS": { fr: "Rendez-vous", en: "Appointment" },
    "NOTE_INTERNE": { fr: "Note interne", en: "Internal note" },
  };
  return labels[type]?.[fr ? "fr" : "en"] || type;
};

// Passer à l'étape suivante
const handleNextStep = useCallback(async (dossierId: number) => {
  try {
    const nouvelleEtape = await dossierService.nextEtape(dossierId);
    console.log("✅ nextEtape réponse:", nouvelleEtape);
    setCurrentEtape(nouvelleEtape);
    await loadWorkflow(dossierId);
    toast.success(fr ? "Étape suivante atteinte" : "Next step reached");
  } catch (error) {
    console.error("❌ nextEtape erreur:", error);
    toast.error(fr ? "Impossible de passer à l'étape suivante" : "Cannot go to next step");
  }
}, [fr, loadWorkflow]);

// Revenir à l'étape précédente
const handlePreviousStep = useCallback(async (dossierId: number) => {
  try {
    const etapePrecedente = await dossierService.previousEtape(dossierId);
    console.log("✅ previousEtape réponse:", etapePrecedente);
    setCurrentEtape(etapePrecedente);
    await loadWorkflow(dossierId);
    toast.info(fr ? "Retour à l'étape précédente" : "Back to previous step");
  } catch (error) {
    console.error("❌ previousEtape erreur:", error);
    toast.error(fr ? "Impossible de revenir en arrière" : "Cannot go back");
  }
}, [fr, loadWorkflow]);



useEffect(() => {
  loadDossiers();
  typeActeService.getActifs()
    .then(data => setTypeActes(data))
    .catch(() => {});
}, [loadDossiers]);

// Charger le workflow quand on est sur l'onglet workflow et qu'un dossier est sélectionné
useEffect(() => {
  if (selectedDossier && pageTab === "workflow") {
    loadWorkflow(Number(selectedDossier.id));
  }
}, [selectedDossier, pageTab, loadWorkflow]);

  // Parties prenantes modal
  const [showPartiesModal, setShowPartiesModal] = useState(false);
  const [partiesDossier, setPartiesDossier] = useState<Dossier | null>(null);
  const [partiesList, setPartiesList] = useState<PartiePrenanteEntry[]>([]);
  const [newPartie, setNewPartie] = useState({ 
    clientId: "",
    clientCode: "",
    clientNom: "",
    role: "Acheteur" as PartiePrenanteEntry["role"] 
  });
  const [clientSuggestions, setClientSuggestions] = useState<typeof mockClients>([]);

  // Generate facture modal
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [factureDossier, setFactureDossier] = useState<Dossier | null>(null);
  const [factureForm, setFactureForm] = useState({ montant: "", description: "", echeance: "" });

  // ═══ Commentaires sur les dossiers ═══
  const [dossierComments, setDossierComments] = useState<Record<string, { user: string; text: string; date: string }[]>>({});
  const [newComment, setNewComment] = useState("");

  const pieceInputRef = useRef<HTMLInputElement>(null);
  const factureImportRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ═══ Commentaires par étape de workflow (dossierId → stepKey → []) ═══
  const [stepComments, setStepComments] = useState<Record<string, Record<string, { user: string; text: string; date: string }[]>>>({});

  const handleAddStepComment = (dossierId: string, stepKey: string, text: string) => {
    if (!text.trim()) return;
    const entry = {
      user: currentUser.name,
      text: text.trim(),
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setStepComments(prev => ({
      ...prev,
      [dossierId]: {
        ...(prev[dossierId] ?? {}),
        [stepKey]: [...(prev[dossierId]?.[stepKey] ?? []), entry],
      },
    }));
    toast.success(fr ? "Commentaire ajouté à l'étape" : "Comment added to step");
  };

  const openDossierTab = (d: Dossier, tab: "details" | "workflow") => {
    openTab({ id: d.id, code: d.code, objet: d.objet }, tab);
  };


  const addComment = (dossierId: string) => {
    if (!newComment.trim()) return;
    setDossierComments(prev => ({
      ...prev,
      [dossierId]: [...(prev[dossierId] || []), {
        user: currentUser.name,
        text: newComment,
        date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }],
    }));
    setNewComment("");
    toast.success(fr ? "Commentaire ajouté" : "Comment added");
  };


  const handleFactureFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    toast.success(fr ? `Facture « ${file.name} » importée avec succès` : `Invoice "${file.name}" imported successfully`);
    e.target.value = "";
  };

  // Form state
  const [form, setForm] = useState({
    categorieActe: "", typeActe: "", objet: "", description: "",
    dateEcheance: "", dateSignature: "", dateEnregistrement: "",
    clients: "",
    notaireChargeId: "", assistantChargeId: "",
    honorairesHT: "", tva: "",
    bienDescription: "", bienAdresse: "", bienVille: "",
    referenceCadastrale: "", titreFoncier: "",
    superficie: "", prixBien: "",
    numeroRepertoire: "", numeroMinute: "", lieuSignature: "",
    statut: "Brouillon" as Dossier["statut"],
    priorite: "Normale" as Dossier["priorite"],
    urgent: false, confidentiel: false,
    notesInternes: "", observations: "",
  });

  const resetForm = useCallback(() => setForm({
    categorieActe: "", typeActe: "", objet: "", description: "",
    dateEcheance: "", dateSignature: "", dateEnregistrement: "",
    clients: "",
    notaireChargeId: user?.id ? String(user.id) : "", assistantChargeId: "",
    honorairesHT: "", tva: "",
    bienDescription: "", bienAdresse: "", bienVille: "",
    referenceCadastrale: "", titreFoncier: "",
    superficie: "", prixBien: "",
    numeroRepertoire: "", numeroMinute: "", lieuSignature: "",
    statut: "Brouillon", priorite: "Normale",
    urgent: false, confidentiel: false,
    notesInternes: "", observations: "",
  }), [user]);

  const filtered = useMemo(() => dossiers.filter((d) => {
    if (filterStatut !== "all" && d.statut !== filterStatut) return false;
    if (filterPriorite !== "all" && d.priorite !== filterPriorite) return false;
    if (filterTypeActe !== "all" && d.typeActe !== filterTypeActe) return false;
    if (filterDate && d.date < filterDate) return false;
    if (search) {
      const fields = [d.code, d.objet, d.typeActe, d.notaire, String(d.montant), d.clientDate, ...d.clients];
      return fields.some(f => searchMatch(f, search));
    }
    return true;
  }), [dossiers, filterStatut, filterPriorite, filterTypeActe, filterDate, search]);

  const visibleDossiers = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

const stats = useMemo(() => ({
  total: dossiers.length,
  // ✅ Correction : utiliser les bons libellés
  enCours: dossiers.filter(d => d.statut === "En Cours").length,        // "En Cours" (avec C majuscule)
  enSignature: dossiers.filter(d => d.statut === "En Attente de Signature").length,  // "En Attente de Signature"
  enAttente: dossiers.filter(d => d.statut === "En Attente").length,    // "En Attente"
  termines: dossiers.filter(d => d.statut === "Clôturé").length,        // "Clôturé"
  totalMontant: dossiers.reduce((s, d) => s + d.montant, 0),
}), [dossiers]);

// ═══ Filtrage des actes (documents de type acte) ═══
const actes = useMemo(() => {
  return documents.filter(doc => 
    doc.typeDocument === "ACTE" || 
    doc.typeDocument === "ACTE_NOTARIAL" ||
    doc.typeDocument === "PROCURATION" ||
    doc.typeDocument === "CONTRAT"
  );
}, [documents]);

// Optionnel : filtrer les pièces (tout sauf les actes)
const pieces = useMemo(() => {
  return documents.filter(doc => 
    doc.typeDocument !== "ACTE" && 
    doc.typeDocument !== "ACTE_NOTARIAL" &&
    doc.typeDocument !== "PROCURATION" &&
    doc.typeDocument !== "CONTRAT"
  );
}, [documents]);

const handleCreate = useCallback(async () => {
  if (!form.typeActe?.trim()) {
    toast.error(fr ? "Le type d'acte est obligatoire." : "Deed type is required.");
    return;
  }
  if (!form.objet?.trim()) {
    toast.error(fr ? "L'objet du dossier est obligatoire." : "Case subject is required.");
    return;
  }
  setIsSubmitting(true);
  try {
    // ✅ Convertir le libellé UI en code backend
    const typeActeCode = getTypeActeCode(form.typeActe);
    
    const prioriteOrdinal: Record<string, number> = { Basse: 0, Normale: 1, Haute: 2, Urgente: 3 };
    const payload: CreateDossierDto = {
      typeActe: typeActeCode,  // ← Utiliser le code converti
      objet: form.objet,
      ...(form.description && { description: form.description }),
      ...(form.dateEcheance && { dateEcheance: form.dateEcheance }),
      ...(form.notaireChargeId && { notaireChargeId: Number(form.notaireChargeId) }),
      ...(form.assistantChargeId && { assistantChargeId: Number(form.assistantChargeId) }),
      ...(form.honorairesHT && { honorairesHT: Number(form.honorairesHT) }),
      ...(form.tva && { tva: Number(form.tva) }),
      ...(form.bienDescription && { bienDescription: form.bienDescription }),
      ...(form.bienAdresse && { bienAdresse: form.bienAdresse }),
      ...(form.bienVille && { bienVille: form.bienVille }),
      ...(form.referenceCadastrale && { referenceCadastrale: form.referenceCadastrale }),
      ...(form.titreFoncier && { titreFoncier: form.titreFoncier }),
      ...(form.superficie && { superficie: Number(form.superficie) }),
      ...(form.prixBien && { prixBien: Number(form.prixBien) }),
      priorite: prioriteOrdinal[form.priorite] ?? 1,
      urgent: form.urgent,
      confidentiel: form.confidentiel,
      ...(form.notesInternes && { notesInternes: form.notesInternes }),
      ...(form.observations && { observations: form.observations }),
    };
    
    const created = await dossierService.create(payload);
    setDossiers(prev => [mapDtoToLocal(created), ...prev]);
    setShowCreateModal(false);
    resetForm();
    toast.success(fr ? "Dossier créé avec succès" : "Case created successfully");
    announce(fr ? "Dossier créé" : "Case created");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : (fr ? "Erreur lors de la création" : "Error creating case"));
    console.error(err);
  } finally {
    setIsSubmitting(false);
  }
}, [form, fr, announce, resetForm]);

const handleEdit = useCallback(async () => {
  if (!editingDossier) return;
  setIsSubmitting(true);
  try {
    const prioriteOrdinal: Record<string, number> = { Basse: 0, Normale: 1, Haute: 2, Urgente: 3 };
    const payload: UpdateDossierDto = {
      objet: form.objet?.trim() || editingDossier.objet,
      ...(form.description && { description: form.description }),
      statut: statutValue(form.statut),
      ...(form.dateEcheance && { dateEcheance: form.dateEcheance }),
      ...(form.dateSignature && { dateSignature: form.dateSignature }),
      ...(form.dateEnregistrement && { dateEnregistrement: form.dateEnregistrement }),
      ...(form.notaireChargeId && { notaireChargeId: Number(form.notaireChargeId) }),
      ...(form.assistantChargeId && { assistantChargeId: Number(form.assistantChargeId) }),
      ...(form.honorairesHT && { honorairesHT: Number(form.honorairesHT) }),
      ...(form.tva && { tva: Number(form.tva) }),
      ...(form.numeroRepertoire && { numeroRepertoire: form.numeroRepertoire }),
      ...(form.numeroMinute && { numeroMinute: form.numeroMinute }),
      ...(form.lieuSignature && { lieuSignature: form.lieuSignature }),
      ...(form.bienDescription && { bienDescription: form.bienDescription }),
      ...(form.bienAdresse && { bienAdresse: form.bienAdresse }),
      ...(form.bienVille && { bienVille: form.bienVille }),
      ...(form.referenceCadastrale && { referenceCadastrale: form.referenceCadastrale }),
      ...(form.titreFoncier && { titreFoncier: form.titreFoncier }),
      ...(form.superficie && { superficie: Number(form.superficie) }),
      ...(form.prixBien && { prixBien: Number(form.prixBien) }),
      priorite: prioriteOrdinal[form.priorite] ?? 1,
      urgent: form.urgent,
      confidentiel: form.confidentiel,
      ...(form.notesInternes && { notesInternes: form.notesInternes }),
      ...(form.observations && { observations: form.observations }),
    };

    const updated = await dossierService.update(Number(editingDossier.id), payload);
    setDossiers(prev => prev.map(d => d.id === editingDossier.id ? mapDtoToLocal(updated) : d));
    setShowEditModal(false);
    toast.success(fr ? "Dossier modifié avec succès" : "Case updated successfully");
  } catch (err) {
    console.error("❌ Erreur modification:", err);
    toast.error(err instanceof Error ? err.message : (fr ? "Erreur lors de la modification" : "Error updating case"));
  } finally {
    setIsSubmitting(false);
  }
}, [editingDossier, form, fr]);

const handleDelete = useCallback(async () => {
  if (!editingDossier) return;
  try {
    await dossierService.delete(Number(editingDossier.id));

    // Retire immédiatement de l'UI sans recharger
    setDossiers(prev => prev.filter(d => d.id !== editingDossier.id));

    // Ferme les onglets ouverts sur ce dossier
    closeTab(`${editingDossier.id}-details`);
    closeTab(`${editingDossier.id}-workflow`);
    setActiveTabId("dossiers");

    setShowDeleteDialog(false);
    setEditingDossier(null);
    toast.success(fr ? "Dossier supprimé" : "Case deleted");
    announce(fr ? "Dossier supprimé" : "Case deleted");
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    // Le backend retourne "Dossier supprimé" si déjà soft-deleted
    // → on traite ça comme un succès côté UI
    if (message === "Dossier supprimé" || message.toLowerCase().includes("supprim")) {
      setDossiers(prev => prev.filter(d => d.id !== editingDossier.id));
      closeTab(`${editingDossier.id}-details`);
      closeTab(`${editingDossier.id}-workflow`);
      setActiveTabId("dossiers");
      setShowDeleteDialog(false);
      setEditingDossier(null);
      toast.success(fr ? "Dossier supprimé" : "Case deleted");
      return;
    }

    console.error("❌ Erreur suppression:", err);
    toast.error(message || (fr ? "Erreur lors de la suppression" : "Error deleting case"));
  } finally {
    // Recharge la liste pour être en sync avec le backend
    loadDossiers();
  }
}, [editingDossier, fr, announce, closeTab, setActiveTabId, loadDossiers]);

  const handleArchive = useCallback(async (d: Dossier) => {
    try {
      const updated = await dossierService.archiver(Number(d.id));
      setDossiers(prev => prev.map(dos => dos.id === d.id ? mapDtoToLocal(updated) : dos));
      toast.success(fr ? `Dossier ${d.code} archivé` : `Case ${d.code} archived`);
      announce(fr ? "Dossier archivé" : "Case archived");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (fr ? "Erreur lors de l'archivage" : "Error archiving case"));
      console.error(err);
    }
  }, [fr, announce]);

  const openEdit = useCallback((d: Dossier) => {
    setEditingDossier(d);
    setForm({
      categorieActe: "",
      typeActe: "",
      objet: d.objet,
      description: d.description || "",
      dateEcheance: d.dateEcheance || "",
      dateSignature: d.dateSignature || "",
      dateEnregistrement: d.dateEnregistrement || "",
      clients: d.clients.join(", "),
      notaireChargeId: d.notaireChargeId ? String(d.notaireChargeId) : "",
      assistantChargeId: d.assistantChargeId ? String(d.assistantChargeId) : "",
      honorairesHT: d.honorairesHT ? String(d.honorairesHT) : "",
      tva: d.tva ? String(d.tva) : "",
      bienDescription: d.bienDescription || "",
      bienAdresse: d.bienAdresse || "",
      bienVille: d.bienVille || "",
      referenceCadastrale: d.referenceCadastrale || "",
      titreFoncier: d.titreFoncier || "",
      superficie: d.superficie ? String(d.superficie) : "",
      prixBien: d.prixBien ? String(d.prixBien) : "",
      numeroRepertoire: d.numeroRepertoire || "",
      numeroMinute: d.numeroMinute || "",
      lieuSignature: d.lieuSignature || "",
      statut: d.statut,
      priorite: d.priorite,
      urgent: d.urgent ?? false,
      confidentiel: d.confidentiel ?? false,
      notesInternes: d.notesInternes || "",
      observations: d.observations || "",
    });
    setShowEditModal(true);
  }, []);

  const openDelete = useCallback((d: Dossier) => {
    setEditingDossier(d);
    setShowDeleteDialog(true);
  }, []);

  // Parties prenantes
  const openPartiesModal = async (d: Dossier) => {
    setPartiesDossier(d);
    // ✅ S'assurer que l'ID est bien présent
    setPartiesList(d.parties?.map(p => ({
      ...p,
      id: p.id,  // L'ID est déjà dans p
      clientCode: p.clientCode,
      nom: p.nom,
      role: p.role,
      clientId: p.clientId,
    })) || []);
    setNewPartie({ clientId: "", clientCode: "", clientNom: "", role: "Acheteur" });
    setShowPartiesModal(true);
    await loadClients();
  };

  const searchClients = (query: string) => {
    setNewPartie(p => ({ ...p, clientSearch: query }));
    if (query.length < 2) { setClientSuggestions([]); return; }
    const q = query.toLowerCase();
    setClientSuggestions(mockClients.filter(c =>
      c.code.toLowerCase().includes(q) || c.nom.toLowerCase().includes(q) || c.prenom.toLowerCase().includes(q)
    ).slice(0, 5));
  };

  const addPartie = (client: ClientDto) => {
    const clientCode = client.codeClient;
    const clientNom = client.nomComplet || client.denominationSociale || `${client.prenom} ${client.nom}`.trim();
    
    if (partiesList.some(p => p.clientCode === clientCode)) {
      toast.error(fr ? "Ce client est déjà associé" : "This client is already linked");
      return;
    }
    
    setPartiesList(prev => [...prev, {
      clientCode: clientCode,
      nom: clientNom,
      role: newPartie.role,
      clientId: client.id,  
    }]);
    
    // Réinitialiser la sélection
    setNewPartie({ clientId: "", clientCode: "", clientNom: "", role: "Acheteur" });
  };

  const removePartie = (partieId: number) => {
    setPartiesList(prev => prev.filter(p => p.id !== partieId));
  };

const saveParties = async () => {
  if (!partiesDossier) return;
  
  try {
    const existingParties = partiesDossier.parties || [];
    const newParties = partiesList.filter(
      p => !existingParties.some(e => e.clientCode === p.clientCode)
    );
    
    for (const partie of newParties) {
      if (!partie.clientId) {
        toast.error(fr ? "Erreur: client non identifié" : "Error: client not identified");
        return;
      }
      await dossierService.addPartie(Number(partiesDossier.id), {
        clientId: partie.clientId,
        rolePartie: roleValue(partie.role),
      });
    }

    // Charger les parties fraîches depuis l'API
    const partiesFraîches = await dossierService.getParties(Number(partiesDossier.id));
    
    // Mettre à jour le dossier dans le state local directement
    setDossiers(prev => prev.map(d => {
      if (d.id !== partiesDossier.id) return d;
      return {
        ...d,
        parties: partiesFraîches.map(p => ({
          clientCode: p.clientCode ?? "",
          nom: p.nomComplet ?? p.clientNom ?? ([p.prenom, p.nom].filter(Boolean).join(" ") || "?"),
          role: roleLabel(p.role) as PartiePrenanteEntry["role"],
          clientId: p.clientId,
        })),
        clients: partiesFraîches.map(p =>
          p.nomComplet ?? p.clientNom ?? ([p.prenom, p.nom].filter(Boolean).join(" ") || "?")
        ),
      };
    }));

    setShowPartiesModal(false);
    toast.success(fr ? "Parties prenantes enregistrées" : "Stakeholders saved successfully");

  } catch (error) {
    console.error("Erreur sauvegarde parties:", error);
    toast.error(fr ? "Erreur lors de l'enregistrement" : "Error saving stakeholders");
  }
};

  // Generate facture from dossier
  const openFactureModal = (d: Dossier) => {
    setFactureDossier(d);
    setFactureForm({
      montant: String(d.montant),
      description: `${d.typeActe} — ${d.objet}`,
      echeance: "",
    });
    setShowFactureModal(true);
  };

  const handleCreateFacture = () => {
    if (!factureDossier) return;
    toast.success(fr ? `Facture générée pour le dossier ${factureDossier.code} — ${formatGNF(Number(factureForm.montant))}` : `Invoice generated for case ${factureDossier.code} — ${formatGNF(Number(factureForm.montant))}`);
    setShowFactureModal(false);
  };

  const exportCSV = () => {
    const headers = fr
      ? ["Code", "Type d'acte", "Objet", "Client(s)", "Montant", "Statut", "Priorité", "Date", "Notaire"]
      : ["Code", "Deed Type", "Subject", "Client(s)", "Amount", "Status", "Priority", "Date", "Notary"];
    const rows = filtered.map(d => [d.code, d.typeActe, d.objet, d.clients.join(" / "), String(d.montant), d.statut, d.priorite, d.date, d.notaire]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dossiers.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(fr ? "Export CSV téléchargé" : "CSV export downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Dossiers" : "Cases"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{fr ? "Gestion des dossiers, pièces et échanges avec les clients" : "Manage cases, documents and client communications"}</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> {fr ? "Exporter" : "Export"}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportCSV}><FileDown className="mr-2 h-4 w-4" /> {fr ? "Exporter CSV" : "Export CSV"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(fr ? "Export PDF en cours..." : "PDF export in progress...")}><FileText className="mr-2 h-4 w-4" /> {fr ? "Exporter PDF" : "Export PDF"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="h-4 w-4" /> {fr ? "Nouveau dossier" : "New Case"}
          </Button>
        </div>
      </div>

      {/* Page-level tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTabId("dossiers")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
            activeTabId === "dossiers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FolderOpen className="h-4 w-4" />
          {fr ? "Dossiers" : "Cases"}
        </button>
        {openTabs.map(tab => {
          const isActive = activeTabId === tab.id;
          const Icon = tab.type === "details" ? FileText : GitBranch;
          const label = tab.type === "details" ? (fr ? "Détail" : "Detail") : "Workflow";
          return (
            <div key={tab.id} className={cn(
              "flex items-center border-b-2 -mb-px transition-colors shrink-0",
              isActive ? "border-primary" : "border-transparent"
            )}>
              <button
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center gap-2 pl-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className="text-xs font-mono text-muted-foreground">{tab.dossierCode}</span>
              </button>
              <button
                onClick={() => closeTab(tab.id)}
                className="px-2 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={fr ? "Fermer" : "Close"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Tab: Dossiers ──────────────────────────────────────── */}
      {pageTab === "dossiers" && (<>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && (<>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: FolderOpen, value: stats.total, label: fr ? "Total dossiers" : "Total cases", bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { icon: Clock, value: stats.enCours, label: fr ? "En cours" : "In progress", bg: "bg-cyan-50 dark:bg-cyan-900/20", iconBg: "bg-cyan-500" },
          { icon: PenLine, value: stats.enSignature, label: fr ? "En signature" : "Signing", bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
          { icon: Clock, value: stats.enAttente, label: fr ? "En attente" : "Waiting", bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
          { icon: DollarSign, value: formatGNF(stats.totalMontant), label: fr ? "Total montant" : "Total amount", bg: "bg-rose-50 dark:bg-rose-900/20", iconBg: "bg-rose-500" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn("rounded-xl border border-border p-5 flex items-center gap-4", kpi.bg)}>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", kpi.iconBg)}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div>
              <p className={`font-heading font-bold text-foreground ${typeof kpi.value === 'string' ? 'text-lg' : 'text-2xl'}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label={fr ? "Rechercher un dossier" : "Search a case"} placeholder={fr ? "Rechercher par numéro, client, objet ou type d'acte..." : "Search by number, client, subject or deed type..."} value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} className="pl-10" />
        </div>
        <Select value={filterTypeActe} onValueChange={v => { setFilterTypeActe(v); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={fr ? "Type d'acte" : "Deed type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr ? "Tous types d'acte" : "All deed types"}</SelectItem>
            {TYPES_ACTE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={v => { setFilterStatut(v); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={fr ? "Statut" : "Status"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr ? "Tous les statuts" : "All statuses"}</SelectItem>
            {statuts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriorite} onValueChange={v => { setFilterPriorite(v); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={fr ? "Priorité" : "Priority"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr ? "Toutes priorités" : "All priorities"}</SelectItem>
            {priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setVisibleCount(PAGE_SIZE); }} className="pl-10 w-[160px]" />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "list" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Client" : "Client"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Objet" : "Subject"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{fr ? "Montant" : "Amount"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Statut" : "Status"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDossiers.map((d) => (
                  <tr key={d.id}
                    className={cn("border-b border-border last:border-0 hover:bg-muted/20 transition-colors", d.deleted && "opacity-50 bg-muted/30")}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-mono font-medium cursor-pointer hover:underline", d.deleted ? "text-muted-foreground line-through" : "text-primary")} onClick={() => openDossierTab(d, "details")}>
                          {d.code}
                        </span>
                        {d.deleted && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/15 text-destructive">{fr ? "Supprimé" : "Deleted"}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.clients.join(", ")}</p>
                        <p className="text-xs text-muted-foreground">{d.typeActe}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-foreground">{d.objet}</p>
                        <p className="text-xs text-muted-foreground">{fr ? "suivi par" : "handled by"} {d.notaire}{d.clerc ? ` · ${d.clerc}` : ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-foreground hidden md:table-cell font-mono">{formatGNF(d.montant)}</td>
                    <td className="px-4 py-4"><StatusBadge status={d.statut} /></td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-muted-foreground">{d.clientDate}</td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDossierTab(d, "details")}><FileText className="mr-2 h-4 w-4" /> {fr ? "Voir détail" : "View detail"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDossierTab(d, "workflow")}><GitBranch className="mr-2 h-4 w-4" /> {fr ? "Voir workflow" : "View workflow"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(d)}><Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPartiesModal(d)}><UserPlus className="mr-2 h-4 w-4" /> {fr ? "Associer parties" : "Link stakeholders"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openFactureModal(d)}><Receipt className="mr-2 h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { openDossierTab(d, "details"); setTabDetailSubTab(`${d.id}-details`, "actes"); }}><FileSignature className="mr-2 h-4 w-4" /> {fr ? "Signer" : "Sign"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(d)}><Archive className="mr-2 h-4 w-4" /> {fr ? "Archiver" : "Archive"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDelete(d)}><Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <EmptyState
                icon={FolderOpen}
                title={fr ? "Aucun dossier trouvé" : "No cases found"}
                description={search ? (fr ? "Aucun dossier ne correspond à votre recherche." : "No case matches your search.") : (fr ? "Commencez par créer votre premier dossier." : "Start by creating your first case.")}
              />
            )}
          </div>
          {hasMore && (
            <div className="flex justify-center py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                {fr ? `Charger plus (${filtered.length - visibleCount} restants)` : `Load more (${filtered.length - visibleCount} remaining)`}
              </Button>
            </div>
          )}
          {!hasMore && filtered.length > 0 && (
            <div className="text-center py-3 text-xs text-muted-foreground border-t border-border">
              {filtered.length} {fr ? `dossier${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}` : `case${filtered.length > 1 ? "s" : ""} displayed`}
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDossiers.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer", d.deleted && "opacity-50 border-dashed")}
              onClick={() => openDossierTab(d, "details")}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-mono font-medium", d.deleted ? "text-muted-foreground line-through" : "text-primary")}>{d.code}</span>
                  {d.deleted && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/15 text-destructive">{fr ? "Supprimé" : "Deleted"}</span>}
                </div>
                <StatusBadge status={d.statut} />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{d.objet}</h3>
              <p className="text-xs text-muted-foreground mb-1">{d.typeActe}</p>
              <p className="text-xs text-muted-foreground mb-1">{fr ? "suivi par" : "handled by"} {d.notaire}{d.clerc ? ` · ${d.clerc}` : ""}</p>
              <p className="text-sm text-muted-foreground mb-3">{d.clients.join(", ")}</p>
              <ProgressBar value={d.avancement} className="mb-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{d.nbActes} {fr ? "actes" : "deeds"} · {d.nbPieces} {fr ? "pièces" : "docs"}</span>
                <span className="font-mono font-medium text-foreground">{formatGNF(d.montant)}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <StatusBadge status={d.priorite} showIcon />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openDossierTab(d, "details"); }}><FileText className="mr-2 h-4 w-4" /> {fr ? "Voir détail" : "View detail"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openDossierTab(d, "workflow"); }}><GitBranch className="mr-2 h-4 w-4" /> {fr ? "Voir workflow" : "View workflow"}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(d); }}><Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openPartiesModal(d); }}><UserPlus className="mr-2 h-4 w-4" /> {fr ? "Associer parties" : "Link stakeholders"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openDossierTab(d, "details"); setTabDetailSubTab(`${d.id}-details`, "actes"); }}><FileSignature className="mr-2 h-4 w-4" /> {fr ? "Signer" : "Sign"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openFactureModal(d); }}><Receipt className="mr-2 h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); handleArchive(d); }}><Archive className="mr-2 h-4 w-4" /> {fr ? "Archiver" : "Archive"}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); openDelete(d); }}><Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
          {hasMore && (
            <div className="col-span-full flex justify-center py-4">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                {fr ? `Charger plus (${filtered.length - visibleCount} restants)` : `Load more (${filtered.length - visibleCount} remaining)`}
              </Button>
            </div>
          )}
        </div>
      )}

      </>)}

      </>)}

      {/* ── Tab: Voir détail ───────────────────────────────────── */}
      {pageTab === "details" && (
        selectedDossier ? (
          <div className="space-y-6">
            {/* Detail Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono font-medium text-primary">{selectedDossier.code}</span>
                  <StatusBadge status={selectedDossier.statut} />
                  <StatusBadge status={selectedDossier.priorite} showIcon />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">{selectedDossier.objet}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedDossier.typeActe} · {fr ? "suivi par" : "handled by"} {selectedDossier.notaire}{selectedDossier.clerc ? ` · ${selectedDossier.clerc}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(selectedDossier)}>
                  <Edit className="mr-1 h-3.5 w-3.5" /> {fr ? "Modifier" : "Edit"}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openDelete(selectedDossier)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{fr ? "Avancement global" : "Overall progress"}</span>
                <span className="text-sm font-bold text-foreground">{selectedDossier.avancement}%</span>
              </div>
              <ProgressBar value={selectedDossier.avancement} />
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
              {[
                { key: "details", label: fr ? "Détails" : "Details" },
                { key: "parties", label: fr ? "Parties" : "Stakeholders" },
                { key: "signataires", label: fr ? "Signataires" : "Signatories" },
                { key: "actes", label: fr ? "Actes" : "Deeds" },
                { key: "pieces", label: fr ? "Pièces" : "Documents" },
                { key: "finances", label: fr ? "Finances" : "Finances" },
                { key: "historique", label: fr ? "Historique" : "History" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                  className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${detailTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-tab Content */}
            <div key={detailTab}>
              {detailTab === "details" && (
                <div className="space-y-5">

                  {/* ── Informations générales ── */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Informations générales" : "General information"}</p>
                    <div className="space-y-0 divide-y divide-border">
                      {[
                        { label: fr ? "Code dossier" : "Case code", value: selectedDossier.code },
                        { label: fr ? "Type d'acte" : "Deed type", value: selectedDossier.typeActe },
                        { label: fr ? "Objet" : "Subject", value: selectedDossier.objet },
                        ...(selectedDossier.description ? [{ label: fr ? "Description" : "Description", value: selectedDossier.description }] : []),
                        { label: fr ? "Priorité" : "Priority", value: selectedDossier.priorite },
                        ...(selectedDossier.urgent ? [{ label: fr ? "Urgent" : "Urgent", value: fr ? "Oui" : "Yes" }] : []),
                        ...(selectedDossier.confidentiel ? [{ label: fr ? "Confidentiel" : "Confidential", value: fr ? "Oui" : "Yes" }] : []),
                        { label: fr ? "Date de création" : "Creation date", value: new Date(selectedDossier.date).toLocaleDateString(fr ? "fr-FR" : "en-US") },
                        ...(selectedDossier.dateEcheance ? [{ label: fr ? "Date d'échéance" : "Due date", value: new Date(selectedDossier.dateEcheance).toLocaleDateString(fr ? "fr-FR" : "en-US") }] : []),
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-start py-2.5 gap-4">
                          <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                          <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Personnel ── */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Personnel en charge" : "Assigned staff"}</p>
                    <div className="space-y-0 divide-y divide-border">
                      {[
                        { label: fr ? "Notaire responsable" : "Responsible notary", value: selectedDossier.notaire },
                        ...(selectedDossier.clerc ? [{ label: fr ? "Clerc / Assistant" : "Clerk / Assistant", value: selectedDossier.clerc }] : []),
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-start py-2.5 gap-4">
                          <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                          <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Références notariales ── */}
                  {(selectedDossier.numeroRepertoire || selectedDossier.numeroMinute || selectedDossier.lieuSignature || selectedDossier.dateSignature || selectedDossier.dateEnregistrement) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Références notariales" : "Notarial references"}</p>
                      <div className="space-y-0 divide-y divide-border">
                        {[
                          ...(selectedDossier.numeroRepertoire ? [{ label: fr ? "N° Répertoire" : "Repertory N°", value: selectedDossier.numeroRepertoire }] : []),
                          ...(selectedDossier.numeroMinute ? [{ label: fr ? "N° Minute" : "Minute N°", value: selectedDossier.numeroMinute }] : []),
                          ...(selectedDossier.lieuSignature ? [{ label: fr ? "Lieu de signature" : "Signing location", value: selectedDossier.lieuSignature }] : []),
                          ...(selectedDossier.dateSignature ? [{ label: fr ? "Date de signature" : "Signing date", value: new Date(selectedDossier.dateSignature).toLocaleDateString(fr ? "fr-FR" : "en-US") }] : []),
                          ...(selectedDossier.dateEnregistrement ? [{ label: fr ? "Date d'enregistrement" : "Registration date", value: new Date(selectedDossier.dateEnregistrement).toLocaleDateString(fr ? "fr-FR" : "en-US") }] : []),
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-start py-2.5 gap-4">
                            <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                            <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Bien immobilier ── */}
                  {(selectedDossier.bienDescription || selectedDossier.bienAdresse || selectedDossier.bienVille || selectedDossier.superficie || selectedDossier.referenceCadastrale || selectedDossier.titreFoncier || selectedDossier.prixBien) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Bien immobilier" : "Property"}</p>
                      <div className="space-y-0 divide-y divide-border">
                        {[
                          ...(selectedDossier.bienDescription ? [{ label: fr ? "Description" : "Description", value: selectedDossier.bienDescription }] : []),
                          ...(selectedDossier.bienAdresse ? [{ label: fr ? "Adresse" : "Address", value: selectedDossier.bienAdresse }] : []),
                          ...(selectedDossier.bienVille ? [{ label: fr ? "Ville" : "City", value: selectedDossier.bienVille }] : []),
                          ...(selectedDossier.superficie ? [{ label: fr ? "Superficie (m²)" : "Area (m²)", value: String(selectedDossier.superficie) }] : []),
                          ...(selectedDossier.referenceCadastrale ? [{ label: fr ? "Réf. cadastrale" : "Cadastral ref.", value: selectedDossier.referenceCadastrale }] : []),
                          ...(selectedDossier.titreFoncier ? [{ label: fr ? "Titre foncier" : "Land title", value: selectedDossier.titreFoncier }] : []),
                          ...(selectedDossier.prixBien ? [{ label: fr ? "Prix du bien" : "Property price", value: formatGNF(selectedDossier.prixBien) }] : []),
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-start py-2.5 gap-4">
                            <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                            <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Honoraires ── */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Honoraires & Montants" : "Fees & Amounts"}</p>
                    <div className="space-y-0 divide-y divide-border">
                      {[
                        { label: fr ? "Montant total" : "Total amount", value: formatGNF(selectedDossier.montant) },
                        ...(selectedDossier.honorairesHT ? [{ label: fr ? "Honoraires HT" : "Fees excl. tax", value: formatGNF(selectedDossier.honorairesHT) }] : []),
                        ...(selectedDossier.tva ? [{ label: "TVA (%)", value: String(selectedDossier.tva) + "%" }] : []),
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-start py-2.5 gap-4">
                          <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                          <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Notes & Observations ── */}
                  {(selectedDossier.notesInternes || selectedDossier.observations) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Notes & Observations" : "Notes & Observations"}</p>
                      <div className="space-y-3">
                        {selectedDossier.notesInternes && (
                          <div className="rounded-lg bg-muted/30 border border-border p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{fr ? "Notes internes" : "Internal notes"}</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{selectedDossier.notesInternes}</p>
                          </div>
                        )}
                        {selectedDossier.observations && (
                          <div className="rounded-lg bg-muted/30 border border-border p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{fr ? "Observations" : "Observations"}</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{selectedDossier.observations}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">💬 {fr ? "Commentaires" : "Comments"}</h4>
                    {(dossierComments[selectedDossier.id] || []).length > 0 ? (
                      (dossierComments[selectedDossier.id] || []).map((c, i) => (
                        <div key={i} className="rounded-lg bg-muted/30 border border-border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{c.user}</span>
                            <span className="text-[10px] text-muted-foreground">{c.date}</span>
                          </div>
                          <p className="text-sm text-foreground">{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">{fr ? "Aucun commentaire pour ce dossier" : "No comments for this case"}</p>
                    )}
                    <div className="flex gap-2">
                      <Input value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder={fr ? "Ex: En attente de la pièce d'identité du vendeur..." : "E.g.: Waiting for seller's ID document..."}
                        className="flex-1" onKeyDown={e => e.key === "Enter" && addComment(selectedDossier.id)} />
                      <Button size="sm" onClick={() => addComment(selectedDossier.id)} disabled={!newComment.trim()}>{fr ? "Ajouter" : "Add"}</Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                      <UserPlus className="h-4 w-4" /> {fr ? "Associer parties" : "Link stakeholders"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => openFactureModal(selectedDossier)}>
                      <Receipt className="h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}
                    </Button>
                  </div>
                </div>
              )}

              {detailTab === "parties" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {(selectedDossier.parties || []).length} {fr ? "partie(s) prenante(s)" : "stakeholder(s)"}
                    </p>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                      <UserPlus className="h-3.5 w-3.5" /> 
                      {fr ? "Associer parties" : "Link stakeholders"}
                    </Button>
                  </div>
                  
                  {(selectedDossier.parties || []).length > 0 ? (
                    <div className="space-y-2">
                      {(selectedDossier.parties || []).map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {(p.nom ?? "?").charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{p.nom}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.clientCode} · {p.role}
                              {p.telephone && ` · ${p.telephone}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                              {p.role}
                            </span>
                            {/* ✅ Bouton de suppression directe */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={async () => {
                                if (p.id && confirm(fr ? "Supprimer cette partie ?" : "Delete this stakeholder?")) {
                                  try {
                                    await dossierService.removePartie(Number(selectedDossier.id), p.id);
                                    await loadDossiers(); // Recharger les dossiers
                                    toast.success(fr ? "Partie supprimée" : "Stakeholder removed");
                                  } catch (error) {
                                    console.error("Erreur suppression:", error);
                                    toast.error(fr ? "Erreur lors de la suppression" : "Error removing stakeholder");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{fr ? "Aucune partie prenante associée" : "No stakeholders linked"}</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                        <UserPlus className="h-4 w-4" /> 
                        {fr ? "Associer des parties" : "Link stakeholders"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {detailTab === "signataires" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {(selectedDossier.parties || []).length} {fr ? "signataire(s)" : "signatory(ies)"}
                    </p>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                      <UserPlus className="h-3.5 w-3.5" /> {fr ? "Ajouter signataire" : "Add signatory"}
                    </Button>
                  </div>
                  {(selectedDossier.parties || []).length > 0 ? (
                    <div className="space-y-3">
                      {(selectedDossier.parties || []).map((p, i) => {
                        const signed = i % 2 === 0; // mock: alternating signed/pending
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {(p.nom ?? "?").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{p.nom}</p>
                              <p className="text-xs text-muted-foreground">{p.clientCode} · {p.role}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {signed ? (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {fr ? "Signé" : "Signed"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                                  <Clock className="h-3.5 w-3.5" /> {fr ? "En attente" : "Pending"}
                                </span>
                              )}
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setDetailTab("actes"); }}>
                                <FileSignature className="h-3.5 w-3.5" /> {fr ? "Signer" : "Sign"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 font-bold text-sm shrink-0">
                          {(selectedDossier.notaire ?? "?").charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{selectedDossier.notaire}</p>
                          <p className="text-xs text-muted-foreground">{fr ? "Notaire instrumentaire" : "Officiant notary"}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full shrink-0">
                          <PenLine className="h-3.5 w-3.5" /> {fr ? "Officiant" : "Officiant"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileSignature className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{fr ? "Aucun signataire défini" : "No signatories defined"}</p>
                      <p className="text-xs mt-1">{fr ? "Associez des parties prenantes pour définir les signataires" : "Link stakeholders to define signatories"}</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                        <UserPlus className="h-4 w-4" /> {fr ? "Associer des parties" : "Link stakeholders"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

{detailTab === "actes" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">
        {actes.length} {fr ? "acte(s)" : "deed(s)"}
      </p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          setUploadContext("actes");
          fileInputRef.current?.click();
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        {fr ? "Ajouter un acte" : "Add deed"}
      </Button>
    </div>
    
    {documentsLoading ? (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ) : actes.length > 0 ? (
      <div className="space-y-2">
        {actes.map((acte) => (
          <div key={acte.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground truncate">{acte.nomDocument}</p>
                <StatusBadge 
                  status={
                    acte.signe ? "Signé" : 
                    acte.valideParNom ? "Validé" : 
                    "Brouillon"
                  } 
                />
                {acte.version > 1 && (
                  <span className="text-xs text-muted-foreground">v{acte.version}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {fr ? "Créé le" : "Created on"} {new Date(acte.dateAjout).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                {acte.valideParNom && ` · ${fr ? "Validé par" : "Validated by"} ${acte.valideParNom}`}
                {acte.signeParNom && ` · ${fr ? "Signé par" : "Signed by"} ${acte.signeParNom}`}
                {acte.dateSignature && ` · ${new Date(acte.dateSignature).toLocaleDateString(fr ? "fr-FR" : "en-US")}`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Validation (notaire) - visible si non validé et non signé */}
              {!acte.valideParNom && acte.statut !== "VALIDE" && !acte.signe && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => handleValiderDocument(acte.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {fr ? "Valider" : "Validate"}
                </Button>
              )}
              
              {/* Signature électronique - visible si validé, signature requise, et non signé */}
              {acte.valideParNom && acte.signatureRequise && !acte.signe && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-7 text-xs bg-primary"
                  onClick={() => openSignatureModal(acte)}
                >
                  <FileSignature className="h-3.5 w-3.5 mr-1" />
                  {fr ? "Signer" : "Sign"}
                </Button>
              )}
              
              {/* Télécharger */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleDownloadDocument(acte.id, acte.nomDocument)}
              >
                <FileDown className="h-3.5 w-3.5" />
              </Button>
              
              {/* Supprimer - seulement si non signé */}
              {!acte.signe && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDeleteDocument(acte.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={FileText}
        title={fr ? "Aucun acte" : "No deeds"}
        description={fr ? "Ajoutez un acte notarial au dossier" : "Add a notarial deed to the case"}
        action={
          <Button variant="outline" size="sm" onClick={() => {
            setUploadContext("actes");
            fileInputRef.current?.click();
          }}>
            <Plus className="h-4 w-4 mr-1" />
            {fr ? "Ajouter un acte" : "Add a deed"}
          </Button>
        }
      />
    )}
  </div>
)}

              {detailTab === "pieces" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {documents.length} {fr ? "document(s)" : "document(s)"}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setUploadContext("pieces");
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {fr ? "Ajouter" : "Add"}
                    </Button>
                  </div>
                  
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                  />
                  
                  {documentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground truncate">{doc.nomDocument}</p>
                              {doc.tailleFichierFormatee && (
                                <span className="text-xs text-muted-foreground">({doc.tailleFichierFormatee})</span>
                              )}
                              <StatusBadge 
                                status={
                                  doc.signe ? "Signé" : 
                                  doc.valideParNom ? "Validé" : 
                                  "Brouillon"
                                } 
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {fr ? "Ajouté le" : "Added on"} {new Date(doc.dateAjout).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                              {doc.valideParNom && ` · ${fr ? "Validé par" : "Validated by"} ${doc.valideParNom}`}
                              {doc.signeParNom && ` · ${fr ? "Signé par" : "Signed by"} ${doc.signeParNom}`}
                              {doc.dateSignature && ` · ${new Date(doc.dateSignature).toLocaleDateString(fr ? "fr-FR" : "en-US")}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Bouton Valider - visible si non validé et non signé */}
                            {!doc.valideParNom && doc.statut !== "VALIDE" && !doc.signe && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => handleValiderDocument(doc.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                {fr ? "Valider" : "Validate"}
                              </Button>
                            )}
                            
                            {/* Bouton Signer - visible si validé, signature requise, et non signé */}
                            {doc.valideParNom && doc.signatureRequise && !doc.signe && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="h-7 text-xs bg-primary"
                                onClick={() => openSignatureModal(doc)}
                              >
                                <FileSignature className="h-3.5 w-3.5 mr-1" />
                                {fr ? "Signer" : "Sign"}
                              </Button>
                            )}
                            
                            {/* Bouton Télécharger */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => handleDownloadDocument(doc.id, doc.nomDocument)}
                            >
                              <FileDown className="h-3.5 w-3.5" />
                            </Button>
                            
                            {/* Bouton Supprimer */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileDown}
                      title={fr ? "Aucun document" : "No documents"}
                      description={fr ? "Commencez par ajouter un document" : "Start by adding a document"}
                      action={
                        <Button variant="outline" size="sm" onClick={() => {
                          setUploadContext("pieces");
                          fileInputRef.current?.click();
                        }}>
                          <Upload className="h-4 w-4 mr-1" />
                          {fr ? "Ajouter un document" : "Add a document"}
                        </Button>
                      }
                    />
                  )}
                </div>
              )}
              {detailTab === "finances" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground">{fr ? "Montant total" : "Total amount"}</p>
                      <p className="text-lg font-bold text-foreground font-mono">{formatGNF(selectedDossier.montant)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground">{fr ? "Payé" : "Paid"}</p>
                      <p className="text-lg font-bold text-emerald-500 font-mono">{formatGNF(Math.round(selectedDossier.montant * selectedDossier.avancement / 100))}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">{fr ? "Reste à payer" : "Remaining"}</p>
                    <p className="text-lg font-bold text-destructive font-mono">{formatGNF(selectedDossier.montant - Math.round(selectedDossier.montant * selectedDossier.avancement / 100))}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => openFactureModal(selectedDossier)}>
                      <Receipt className="h-4 w-4" /> {fr ? "Générer" : "Generate"}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => factureImportRef.current?.click()}>
                      <Upload className="h-4 w-4" /> {fr ? "Importer" : "Import"}
                    </Button>
                  </div>
                  <input ref={factureImportRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFactureFileImport} />
                </div>
              )}

            {detailTab === "historique" && (
              <div className="space-y-4">
                {/* En-tête avec bouton */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {historique.length} {fr ? "événement(s)" : "event(s)"}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => setShowAddHistoriqueModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {fr ? "Ajouter un événement" : "Add event"}
                  </Button>
                </div>

                {/* Liste des événements */}
                {historiqueLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : historique.length > 0 ? (
                  <div className="space-y-2">
                    {historique.map((h) => (
                      <div key={h.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm shrink-0">
                          {getEventIcon(h.typeEvenement)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">
                              {getEventLabel(h.typeEvenement, fr)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(h.dateEvenement).toLocaleString(fr ? "fr-FR" : "en-US")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            {h.description}
                            {h.userNom && ` · ${fr ? "par" : "by"} ${h.userNom}`}
                            {h.userRole && ` (${h.userRole})`}
                          </p>
                          {h.ancienStatut && h.nouveauStatut && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {fr ? "Statut" : "Status"} : {h.ancienStatut} → {h.nouveauStatut}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{fr ? "Aucun historique pour ce dossier" : "No history for this case"}</p>
                    <p className="text-xs mt-1">
                      {fr ? "Ajoutez un premier événement" : "Add a first event"}
                    </p>
                  </div>
                )}
              </div>
            )}

            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{fr ? "Sélectionnez un dossier dans la liste pour voir son détail" : "Select a case from the list to view its detail"}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTabId("dossiers")}>{fr ? "Aller à la liste" : "Go to list"}</Button>
          </div>
        )
      )}
 
      {/* ── Tab: Workflow ──────────────────────────────────────── */}
      {pageTab === "workflow" && (
        selectedDossier ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">{selectedDossier.objet}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedDossier.code} · {selectedDossier.typeActe}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePreviousStep(Number(selectedDossier.id))}
                  disabled={workflowLoading || !currentEtape?.numeroEtape || currentEtape.numeroEtape <= 1}
                >
                  {fr ? "Étape précédente" : "Previous"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNextStep(Number(selectedDossier.id))}
                  disabled={workflowLoading}
                >
                  {fr ? "Étape suivante" : "Next"}
                </Button>
              </div>
            </div>

            {workflowLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : workflowEtapes.length > 0 ? (
              <div className="space-y-3">
                {/* Barre de progression calculée depuis les étapes réelles */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {fr ? "Avancement du workflow" : "Workflow progress"} —{" "}
                      {workflowEtapes.filter(e => e.validee || (currentEtape && e.numeroEtape < currentEtape.numeroEtape)).length}
                      /{workflowEtapes.length} {fr ? "étape(s)" : "step(s)"}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {Math.round(workflowEtapes.filter(e => e.validee || (currentEtape && e.numeroEtape < currentEtape.numeroEtape)).length / workflowEtapes.length * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={Math.round(workflowEtapes.filter(e => e.validee || (currentEtape && e.numeroEtape < currentEtape.numeroEtape)).length / workflowEtapes.length * 100)} />
                </div>
                <div className="rounded-xl bg-muted/10 border border-border overflow-x-auto p-4">
                  <WorkflowProcedural
                    config={{
                      layout: "horizontal",
                      palette: WORKFLOW_PALETTE,
                      steps: workflowEtapes.map(etape => {
                        const isBeforeCurrent = currentEtape ? etape.numeroEtape < currentEtape.numeroEtape : false;
                        const isCompleted = etape.validee || isBeforeCurrent;
                        const isActive = !isCompleted && currentEtape?.id === etape.id;
                        const status = isCompleted ? "completed" as const : isActive ? "active" as const : "pending" as const;
                        return {
                          key: `step_${etape.id}`,
                          label: etape.nomEtape,
                          description: etape.description,
                          icon: "FileText",
                          status,
                          startedAt: etape.dateDebut ?? (isActive ? new Date().toISOString() : undefined),
                          completedAt: etape.dateFin,
                          time: etape.dureeEstimeeJours ? `${etape.dureeEstimeeJours} j` : undefined,
                          button: isActive ? { actionId: `complete_${etape.id}` } : undefined,
                        };
                      }),
                    }}
                    onStart={(_actionId, _stepKey) => { handleNextStep(Number(selectedDossier!.id)); }}
                    onRevert={(_stepKey) => handlePreviousStep(Number(selectedDossier!.id))}
                    onComplete={(_stepKey) => { handleNextStep(Number(selectedDossier!.id)); }}
                    stepComments={stepComments[selectedDossier.id] ?? {}}
                    onAddComment={(stepKey, text) => handleAddStepComment(selectedDossier.id, stepKey, text)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{fr ? "Aucune étape de workflow définie pour ce dossier" : "No workflow steps defined for this case"}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{fr ? "Sélectionnez un dossier dans la liste pour voir son workflow" : "Select a case from the list to view its workflow"}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTabId("dossiers")}>{fr ? "Aller à la liste" : "Go to list"}</Button>
          </div>
        )
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading">{fr ? "Nouveau dossier" : "New Case"}</DialogTitle>
            <DialogDescription>{fr ? "Remplissez les informations pour créer un nouveau dossier" : "Fill in the information to create a new case"}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="space-y-6 py-2">

              {/* ── Acte ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Type d'acte" : "Deed type"}</p>
                <div className="space-y-2">
                  <Label>{fr ? "Type d'acte *" : "Deed type *"}</Label>
                  <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                    <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un type d'acte" : "Select deed type"} /></SelectTrigger>
                    <SelectContent>
                      {typeActes.map(t => (
                        <SelectItem key={t.id} value={t.nom ?? t.libelle ?? t.code}>{t.nom ?? t.libelle ?? t.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Informations générales ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Informations générales" : "General information"}</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Objet du dossier *" : "Case subject *"}</Label>
                    <Input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))} placeholder={fr ? "Ex: Vente villa Kipé" : "E.g.: Villa sale Kipé"} />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "Description" : "Description"}</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={fr ? "Description détaillée..." : "Detailed description..."} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Priorité" : "Priority"}</Label>
                      <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Date d'échéance" : "Due date"}</Label>
                      <Input type="date" value={form.dateEcheance} onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.urgent} onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))} className="accent-destructive w-4 h-4" />
                      <span className="text-sm">{fr ? "Urgent" : "Urgent"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.confidentiel} onChange={e => setForm(f => ({ ...f, confidentiel: e.target.checked }))} className="accent-primary w-4 h-4" />
                      <span className="text-sm">{fr ? "Confidentiel" : "Confidential"}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Personnel ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Personnel en charge" : "Assigned staff"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                    <Input
                      value={user ? `${user.prenom} ${user.nom}` : ""}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "ID Assistant en charge" : "Assistant in charge ID"}</Label>
                    <Input type="number" value={form.assistantChargeId} onChange={e => setForm(f => ({ ...f, assistantChargeId: e.target.value }))} placeholder="Ex: 2" min={0} />
                  </div>
                </div>
              </div>

              {/* ── Bien immobilier ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Bien immobilier" : "Property"}</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Description du bien" : "Property description"}</Label>
                    <Textarea value={form.bienDescription} onChange={e => setForm(f => ({ ...f, bienDescription: e.target.value }))} placeholder={fr ? "Ex: Villa 4 pièces..." : "E.g.: 4-room villa..."} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Adresse" : "Address"}</Label>
                      <Input value={form.bienAdresse} onChange={e => setForm(f => ({ ...f, bienAdresse: e.target.value }))} placeholder={fr ? "Ex: Rue KA-025, Kipé" : "E.g.: Rue KA-025, Kipé"} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Ville" : "City"}</Label>
                      <Input value={form.bienVille} onChange={e => setForm(f => ({ ...f, bienVille: e.target.value }))} placeholder="Conakry" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Référence cadastrale" : "Cadastral ref."}</Label>
                      <Input value={form.referenceCadastrale} onChange={e => setForm(f => ({ ...f, referenceCadastrale: e.target.value }))} placeholder="RC-XXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Titre foncier" : "Land title"}</Label>
                      <Input value={form.titreFoncier} onChange={e => setForm(f => ({ ...f, titreFoncier: e.target.value }))} placeholder="TF-XXXX" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Superficie (m²)" : "Area (m²)"}</Label>
                      <Input type="number" value={form.superficie} onChange={e => setForm(f => ({ ...f, superficie: e.target.value }))} placeholder="0" min={0} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Prix du bien (GNF)" : "Property price (GNF)"}</Label>
                      <Input type="number" value={form.prixBien} onChange={e => setForm(f => ({ ...f, prixBien: e.target.value }))} placeholder="0" min={0} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Honoraires ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Honoraires" : "Fees"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Honoraires HT (GNF)" : "Fees excl. tax (GNF)"}</Label>
                    <Input type="number" value={form.honorairesHT} onChange={e => setForm(f => ({ ...f, honorairesHT: e.target.value }))} placeholder="0" min={0} />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "TVA (%)" : "VAT (%)"}</Label>
                    <Input type="number" value={form.tva} onChange={e => setForm(f => ({ ...f, tva: e.target.value }))} placeholder="0" min={0} max={100} />
                  </div>
                </div>
              </div>

              {/* ── Notes ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notes</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Notes internes" : "Internal notes"}</Label>
                    <Textarea value={form.notesInternes} onChange={e => setForm(f => ({ ...f, notesInternes: e.target.value }))} placeholder={fr ? "Notes internes..." : "Internal notes..."} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "Observations" : "Observations"}</Label>
                    <Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} placeholder={fr ? "Observations..." : "Observations..."} rows={2} />
                  </div>
                </div>
              </div>

            </div>
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.typeActe?.trim() || !form.objet?.trim()}>
              {isSubmitting ? (fr ? "Création..." : "Creating...") : (fr ? "Créer le dossier" : "Create case")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading">{fr ? "Modifier le dossier" : "Edit Case"} — <span className="text-primary">{editingDossier?.code}</span></DialogTitle>
            <DialogDescription>{editingDossier?.objet}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="space-y-6 py-2">

              {/* ── Statut & Priorité ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Statut & Priorité" : "Status & Priority"}</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Statut" : "Status"}</Label>
                      {(() => {
                        const currentBackend = statutValue(form.statut);
                        const isTerminal = STATUTS_TERMINAUX.includes(currentBackend);
                        const allowed: StatutDossier[] = isTerminal
                          ? [currentBackend]
                          : [currentBackend, ...(STATUT_TRANSITIONS[currentBackend] ?? [])];
                        return (
                          <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v as Dossier["statut"] }))} disabled={isTerminal}>
                            <SelectTrigger>
                              <SelectValue />
                              {isTerminal && <span className="ml-1 text-[10px] text-muted-foreground">{fr ? "(terminal)" : "(terminal)"}</span>}
                            </SelectTrigger>
                            <SelectContent>
                              {allowed.map(s => (
                                <SelectItem key={s} value={statutLabel(s)}>{statutLabel(s)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Priorité" : "Priority"}</Label>
                      <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Informations générales ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Informations générales" : "General information"}</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Objet *" : "Subject *"}</Label>
                    <Input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "Description" : "Description"}</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Date échéance" : "Due date"}</Label>
                      <Input type="date" value={form.dateEcheance} onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Date signature" : "Sign date"}</Label>
                      <Input type="date" value={form.dateSignature} onChange={e => setForm(f => ({ ...f, dateSignature: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Date enregistrement" : "Reg. date"}</Label>
                      <Input type="date" value={form.dateEnregistrement} onChange={e => setForm(f => ({ ...f, dateEnregistrement: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.urgent} onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))} className="accent-destructive w-4 h-4" />
                      <span className="text-sm">{fr ? "Urgent" : "Urgent"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.confidentiel} onChange={e => setForm(f => ({ ...f, confidentiel: e.target.checked }))} className="accent-primary w-4 h-4" />
                      <span className="text-sm">{fr ? "Confidentiel" : "Confidential"}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Références ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Références" : "References"}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>{fr ? "N° Répertoire" : "Repertory No."}</Label>
                    <Input value={form.numeroRepertoire} onChange={e => setForm(f => ({ ...f, numeroRepertoire: e.target.value }))} placeholder="REP-XXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "N° Minute" : "Minute No."}</Label>
                    <Input value={form.numeroMinute} onChange={e => setForm(f => ({ ...f, numeroMinute: e.target.value }))} placeholder="MIN-XXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "Lieu de signature" : "Signing location"}</Label>
                    <Input value={form.lieuSignature} onChange={e => setForm(f => ({ ...f, lieuSignature: e.target.value }))} placeholder="Conakry" />
                  </div>
                </div>
              </div>

              {/* ── Personnel ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Personnel en charge" : "Assigned staff"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                    <Input
                      value={editingDossier?.notaire || (user ? `${user.prenom} ${user.nom}` : "")}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "ID Assistant" : "Assistant ID"}</Label>
                    <Input type="number" value={form.assistantChargeId} onChange={e => setForm(f => ({ ...f, assistantChargeId: e.target.value }))} placeholder="Ex: 2" min={0} />
                  </div>
                </div>
              </div>

              {/* ── Bien immobilier ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Bien immobilier" : "Property"}</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Description du bien" : "Property description"}</Label>
                    <Textarea value={form.bienDescription} onChange={e => setForm(f => ({ ...f, bienDescription: e.target.value }))} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Adresse" : "Address"}</Label>
                      <Input value={form.bienAdresse} onChange={e => setForm(f => ({ ...f, bienAdresse: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Ville" : "City"}</Label>
                      <Input value={form.bienVille} onChange={e => setForm(f => ({ ...f, bienVille: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Référence cadastrale" : "Cadastral ref."}</Label>
                      <Input value={form.referenceCadastrale} onChange={e => setForm(f => ({ ...f, referenceCadastrale: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Titre foncier" : "Land title"}</Label>
                      <Input value={form.titreFoncier} onChange={e => setForm(f => ({ ...f, titreFoncier: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{fr ? "Superficie (m²)" : "Area (m²)"}</Label>
                      <Input type="number" value={form.superficie} onChange={e => setForm(f => ({ ...f, superficie: e.target.value }))} min={0} />
                    </div>
                    <div className="space-y-2">
                      <Label>{fr ? "Prix du bien (GNF)" : "Property price (GNF)"}</Label>
                      <Input type="number" value={form.prixBien} onChange={e => setForm(f => ({ ...f, prixBien: e.target.value }))} min={0} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Honoraires ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Honoraires" : "Fees"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Honoraires HT (GNF)" : "Fees excl. tax (GNF)"}</Label>
                    <Input type="number" value={form.honorairesHT} onChange={e => setForm(f => ({ ...f, honorairesHT: e.target.value }))} min={0} />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "TVA (%)" : "VAT (%)"}</Label>
                    <Input type="number" value={form.tva} onChange={e => setForm(f => ({ ...f, tva: e.target.value }))} min={0} max={100} />
                  </div>
                </div>
              </div>

              {/* ── Notes ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notes</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{fr ? "Notes internes" : "Internal notes"}</Label>
                    <Textarea value={form.notesInternes} onChange={e => setForm(f => ({ ...f, notesInternes: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>{fr ? "Observations" : "Observations"}</Label>
                    <Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} />
                  </div>
                </div>
              </div>

            </div>
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? (fr ? "Enregistrement..." : "Saving...") : (fr ? "Enregistrer" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Supprimer ce dossier ?" : "Delete this case?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {fr
                ? <>Le dossier <strong>{editingDossier?.code}</strong> — {editingDossier?.objet} sera supprimé définitivement.</>
                : <>Case <strong>{editingDossier?.code}</strong> — {editingDossier?.objet} will be permanently deleted.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{fr ? "Supprimer" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Associer Parties Modal */}
{/* Associer Parties Modal */}
<Dialog open={showPartiesModal} onOpenChange={setShowPartiesModal}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle className="font-heading">{fr ? "Associer des parties prenantes" : "Link Stakeholders"}</DialogTitle>
      <DialogDescription>
        {fr ? "Dossier" : "Case"} <strong>{partiesDossier?.code}</strong> — {partiesDossier?.objet}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-2">
      {/* Liste des parties déjà associées */}
      {partiesList.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {fr ? `Parties associées (${partiesList.length})` : `Linked stakeholders (${partiesList.length})`}
          </Label>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {partiesList.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                  {(p.nom ?? "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.nom}</p>
                  <p className="text-xs text-muted-foreground">{p.clientCode} · {p.role}</p>
                </div>
              <button 
                onClick={() => {
                  if (p.id) {
                    removePartie(p.id);
                  }
                }} 
                className="text-destructive hover:text-destructive/80 p-1 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ajout d'une nouvelle partie */}
      <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
        <Label className="text-sm font-medium">{fr ? "Ajouter une partie" : "Add a stakeholder"}</Label>
        
        <div className="space-y-3">
          {/* Select client */}
          <div className="space-y-2">
            <Label className="text-xs">{fr ? "Client" : "Client"} *</Label>
            <Select 
              value={newPartie.clientId} 
              onValueChange={(value) => {
                const client = clientsList.find(c => String(c.id) === value);
                if (client) {
                  setNewPartie({ 
                    clientId: String(client.id), 
                    clientCode: client.codeClient,
                    clientNom: client.nomComplet || client.denominationSociale || `${client.prenom} ${client.nom}`.trim(),
                    role: newPartie.role
                  });
                }
              }}
              disabled={clientsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={fr ? "Sélectionner un client" : "Select a client"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {clientsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : clientsList.length > 0 ? (
                  clientsList.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {client.nomComplet || client.denominationSociale || `${client.prenom} ${client.nom}`.trim()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {client.codeClient} · {client.typeClient === "Personne Physique" ? "Personne physique" : "Personne morale"}
                          {client.email && ` · ${client.email}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-client" disabled>
                    {fr ? "Aucun client trouvé" : "No client found"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection du rôle */}
          <div className="space-y-2">
            <Label className="text-xs">{fr ? "Rôle" : "Role"} *</Label>
            <Select 
              value={newPartie.role} 
              onValueChange={v => setNewPartie(p => ({ ...p, role: v as PartiePrenanteEntry["role"] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={fr ? "Sélectionner un rôle" : "Select a role"} />
              </SelectTrigger>
              <SelectContent>
                {rolesParties.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bouton ajouter */}
          <Button 
            className="w-full mt-2"
            onClick={() => {
              const client = clientsList.find(c => String(c.id) === newPartie.clientId);
              if (client) {
                addPartie(client);
              }
            }}
            disabled={!newPartie.clientId || !newPartie.role}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {fr ? "Ajouter cette partie" : "Add this stakeholder"}
          </Button>
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowPartiesModal(false)}>
        {fr ? "Annuler" : "Cancel"}
      </Button>
      <Button className="bg-primary text-primary-foreground" onClick={saveParties}>
        {fr ? "Enregistrer les parties" : "Save stakeholders"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Generate Facture Modal */}
      <Dialog open={showFactureModal} onOpenChange={setShowFactureModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Générer une facture" : "Generate Invoice"}</DialogTitle>
            <DialogDescription>
              {fr ? "Facture pour le dossier" : "Invoice for case"} <strong>{factureDossier?.code}</strong> — {factureDossier?.clients.join(", ")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Pre-filled info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fr ? "Dossier" : "Case"}</span>
                <span className="font-mono font-medium text-foreground">{factureDossier?.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fr ? "Type d'acte" : "Deed type"}</span>
                <span className="text-foreground">{factureDossier?.typeActe}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Client(s)</span>
                <span className="text-foreground">{factureDossier?.clients.join(", ")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF) *" : "Amount (GNF) *"}</Label>
                <Input type="number" value={factureForm.montant} onChange={e => setFactureForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Date d'échéance" : "Due date"}</Label>
                <Input type="date" value={factureForm.echeance} onChange={e => setFactureForm(f => ({ ...f, echeance: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={factureForm.description} onChange={e => setFactureForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFactureModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreateFacture} disabled={!factureForm.montant}>
              {fr ? "Créer la facture" : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'upload de document */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Ajouter un document" : "Add document"}</DialogTitle>
            <DialogDescription>
              {fr ? "Renseignez les informations du document" : "Fill in the document information"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/30 border border-border p-3">
              <p className="text-sm font-medium truncate">{uploadFile?.name}</p>
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>{fr ? "Nom du document" : "Document name"} *</Label>
              <Input 
                value={uploadMetadata.nomDocument}
                onChange={e => setUploadMetadata(prev => ({ ...prev, nomDocument: e.target.value }))}
                placeholder={fr ? "Ex: Acte de vente" : "E.g.: Sale deed"}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{fr ? "Type de document" : "Document type"}</Label>
              <Select 
                value={uploadMetadata.typeDocument} 
                onValueChange={v => setUploadMetadata(prev => ({ ...prev, typeDocument: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fr ? "Sélectionner" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTE">{fr ? "Acte notarial" : "Notarial deed"}</SelectItem>
                  <SelectItem value="PROCURATION">Procuration</SelectItem>
                  <SelectItem value="PIECE_IDENTITE">{fr ? "Pièce d'identité" : "ID document"}</SelectItem>
                  <SelectItem value="TITRE_PROPRIETE">{fr ? "Titre de propriété" : "Property title"}</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{fr ? "Description" : "Description"}</Label>
              <Textarea 
                value={uploadMetadata.description}
                onChange={e => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder={fr ? "Description du document..." : "Document description..."}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={uploadMetadata.signatureRequise}
                  onChange={e => setUploadMetadata(prev => ({ ...prev, signatureRequise: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">{fr ? "Nécessite une signature électronique" : "Requires electronic signature"}</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={uploadMetadata.obligatoire}
                  onChange={e => setUploadMetadata(prev => ({ ...prev, obligatoire: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">{fr ? "Document obligatoire" : "Mandatory document"}</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={uploadMetadata.confidentiel}
                  onChange={e => setUploadMetadata(prev => ({ ...prev, confidentiel: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">{fr ? "Document confidentiel" : "Confidential document"}</span>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button 
              className="bg-primary text-primary-foreground"
              onClick={handleUploadDocument}
              disabled={!uploadFile || !uploadMetadata.nomDocument}
            >
              {fr ? "Ajouter" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de signature électronique */}
<Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="font-heading">{fr ? "Signature électronique" : "Electronic Signature"}</DialogTitle>
      <DialogDescription>
        {fr 
          ? `Vous allez signer le document : ${documentASigner?.nomDocument}`
          : `You are about to sign: ${documentASigner?.nomDocument}`}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="rounded-lg bg-muted/30 border border-border p-4 text-center">
        <FileSignature className="h-12 w-12 mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">
          {fr 
            ? "En cliquant sur \"Signer\", vous apposez votre signature électronique sur ce document."
            : "By clicking \"Sign\", you apply your electronic signature to this document."}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {fr 
            ? "La signature est juridiquement valable et équivaut à une signature manuscrite."
            : "The signature is legally valid and equivalent to a handwritten signature."}
        </p>
      </div>
      
      {documentASigner?.observations && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            {documentASigner.observations}
          </p>
        </div>
      )}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowSignatureModal(false)}>
        {fr ? "Annuler" : "Cancel"}
      </Button>
      <Button 
        className="bg-primary text-primary-foreground"
        onClick={() => documentASigner && handleSignerDocument(documentASigner.id)}
        disabled={signatureEnCours}
      >
        {signatureEnCours ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            {fr ? "Signature..." : "Signing..."}
          </>
        ) : (
          <>{fr ? "Signer" : "Sign"}</>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Modal d'ajout d'événement à l'historique */}
<Dialog open={showAddHistoriqueModal} onOpenChange={setShowAddHistoriqueModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="font-heading">
        {fr ? "Ajouter un événement" : "Add event"}
      </DialogTitle>
      <DialogDescription>
        {fr 
          ? "Ajoutez un événement manuellement à l'historique du dossier"
          : "Add an event manually to the case history"}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>{fr ? "Type d'événement" : "Event type"}</Label>
        <Select 
          value={newHistoriqueEvent.typeEvenement} 
          onValueChange={v => setNewHistoriqueEvent(prev => ({ ...prev, typeEvenement: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={fr ? "Sélectionner" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COMMENTAIRE">💬 {fr ? "Commentaire" : "Comment"}</SelectItem>
            <SelectItem value="ALERTE_ACTIVEE">⚠️ {fr ? "Alerte" : "Alert"}</SelectItem>
            <SelectItem value="MODIFICATION">✏️ {fr ? "Modification" : "Modification"}</SelectItem>
            <SelectItem value="RELANCE">📞 {fr ? "Relance client" : "Client follow-up"}</SelectItem>
            <SelectItem value="RENDEZ_VOUS">📅 {fr ? "Rendez-vous" : "Appointment"}</SelectItem>
            <SelectItem value="NOTE_INTERNE">📝 {fr ? "Note interne" : "Internal note"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{fr ? "Description" : "Description"} *</Label>
        <Textarea 
          value={newHistoriqueEvent.description}
          onChange={e => setNewHistoriqueEvent(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder={fr 
            ? "Ex: Appel téléphonique avec le client, accord sur le compromis..."
            : "E.g.: Phone call with client, agreement on the deed..."}
        />
      </div>
      
      <div className="rounded-lg bg-muted/30 border border-border p-3">
        <p className="text-xs text-muted-foreground">
          {fr 
            ? "Cet événement sera ajouté à l'historique avec la date et l'heure actuelles."
            : "This event will be added to the history with the current date and time."}
        </p>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowAddHistoriqueModal(false)}>
        {fr ? "Annuler" : "Cancel"}
      </Button>
      <Button 
        className="bg-primary text-primary-foreground"
        onClick={handleAddHistoriqueEvent}
        disabled={isAddingHistorique || !newHistoriqueEvent.description.trim()}
      >
        {isAddingHistorique ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            {fr ? "Ajout..." : "Adding..."}
          </>
        ) : (
          <>{fr ? "Ajouter" : "Add"}</>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}
