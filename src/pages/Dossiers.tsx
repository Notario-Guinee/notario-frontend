// ═══════════════════════════════════════════════════════════════
// Page Dossiers — Gestion complète des dossiers notariaux
// Inclut : liste/grille, CRUD, détail tiroir avec workflow,
// gestion des parties prenantes, filtres, export CSV/PDF
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchMatch } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";
import { Plus, Download, Search, FolderOpen, Clock, PenLine, CheckCircle2, DollarSign, MoreHorizontal, X, Trash2, Edit, FileText, List, LayoutGrid, Archive, Receipt, UserPlus, Users, FileDown, CalendarDays, Upload, GitBranch, FileSignature, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { formatGNF, rolesParties, currentUser, type Dossier, type PartiePrenanteEntry } from "@/data/mockData";
import { getUsers } from "@/api/users";
import type { User } from "@/types/user";
import { dossierService, clientService, type DossierDto, type ClientDto, type PartiePrenanteDto, type DocumentDossierDto, type HistoriqueEntreeDto, statutLabel, statutValue, prioriteLabel, roleLabel, roleValue, type CreateDossierDto } from "@/services/dossierService";
import { type CatalogueCategorie } from "@/services/typeActeService";
import { categorieActeService } from "@/services/categorieActeService";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
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
import { workflowTemplates, WORKFLOW_PALETTE, type WorkflowConfig, type WorkflowStep } from "@/components/workflow/workflow-types";
import { useDossierTabs } from "@/context/DossierTabsContext";
import { useActeSteps } from "@/context/ActeStepsContext";


// Helper pour convertir base64 en Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

const statuts: Dossier["statut"][] = ["Brouillon", "En Cours", "En Attente", "En Attente de Signature", "En Attente de Validation", "Prêt pour Signature", "Signé", "Enregistré", "Suspendu", "Clôturé", "Annulé", "Archivé"];
const priorites: Dossier["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];

const PAGE_SIZE = 20;

// ─── Combobox avec recherche ────────────────────────────────────
function SearchCombobox({
  options, value, onValueChange, placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…", emptyText = "Aucun résultat", disabled = false,
}: {
  options: string[]; value: string; onValueChange: (v: string) => void;
  placeholder?: string; searchPlaceholder?: string; emptyText?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  // Reset search when closed
  useEffect(() => { if (!open) setQ(""); }, [open]);
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={q} onValueChange={setQ} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-56 overflow-auto">
            {filtered.map(opt => (
              <CommandItem key={opt} value={opt} onSelect={() => { onValueChange(opt === value ? "" : opt); setOpen(false); }}>
                <CheckIcon className={cn("mr-2 h-4 w-4 shrink-0", value === opt ? "opacity-100" : "opacity-0")} />
                {opt}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Mapping des libellés UI vers codes API ──
function mapDtoToLocal(dto: DossierDto): Dossier {
  const parties: PartiePrenanteEntry[] = (dto.parties ?? []).map(p => ({
    clientCode: p.clientCode ?? String(p.clientId),
    id: p.id,
    clientId: p.clientId,
    nom: p.nomComplet ?? ([p.clientNom, p.nom].filter(Boolean).join(" ") || String(p.clientId)),
    telephone: p.telephone,
    role: roleLabel(p.role) as PartiePrenanteEntry["role"],
  }));
  const dateStr = (dto.dateOuverture ?? dto.createdAt ?? dto.dateCreation ?? "").slice(0, 10);
  return {
    id: String(dto.id),
    code: dto.numeroDossier ?? dto.code ?? String(dto.id),
    typeActe: dto.typeActeLibelle ?? dto.typeActeNom ?? (typeof dto.typeActe === "object" ? (dto.typeActe?.nom ?? dto.typeActe?.libelle ?? "") : (dto.typeActe || "")),
    objet: dto.objet ?? "",
    clients: parties.map(p => p.nom),
    clientDate: dateStr,
    montant: dto.montantTotal ?? dto.montant ?? 0,        // ← LIGNE À MODIFIER
    montantVerse: dto.montantPaye ?? 0,                   // ← LIGNE À MODIFIER
    statut: statutLabel(dto.statut) as Dossier["statut"],
    priorite: prioriteLabel(dto.priorite) as Dossier["priorite"],
    avancement: dto.pourcentageAvancement ?? dto.avancement ?? 0,
    nbActes: dto.nbDocuments ?? 0,
    nbPieces: 0,
    date: dateStr,
    notaire: dto.notaireChargeNom ?? dto.notaireNom ?? "",
    clerc: dto.clercNom ?? dto.assistantChargeNom,
    parties,
    description: dto.description,
    dateEcheance: dto.dateEcheance,
    dateSignature: dto.dateSignature,
    dateEnregistrement: dto.dateEnregistrement,
    notaireChargeId: dto.notaireChargeId ?? dto.notaireId,
    assistantChargeId: dto.assistantChargeId ?? dto.clercId,
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
    urgent: dto.urgent,
    confidentiel: dto.confidentiel,
  };
}

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

/** Résout le nom d'affichage d'un client — évite les valeurs placeholder comme "string" */
// Dans le fichier Dossiers.tsx, remplacez la fonction resolveClientName par celle-ci :

/** Résout le nom d'affichage d'un client — évite les valeurs placeholder comme "string" */
function resolveClientName(c: ClientDto): string {
  // Fonction pour vérifier si une valeur est un placeholder invalide
  const isPlaceholder = (v?: string | null): boolean => {
    if (!v) return true;
    const trimmed = v.trim();
    // Liste des valeurs placeholder à ignorer
    const placeholders = ["string", "null", "undefined", "", "none", "aucun", "inconnu"];
    return placeholders.some(p => trimmed.toLowerCase() === p.toLowerCase());
  };

  // Pour les personnes morales, priorité à la dénomination sociale
  if (c.typeClient === "Personne Morale") {
    const denomination = c.denominationSociale;
    if (!isPlaceholder(denomination)) {
      return denomination ?? c.codeClient ?? `Client #${c.id}`;
    }
    // Fallback: utiliser le code client si la dénomination est invalide
    return c.codeClient || `Client #${c.id}`;
  }

  // Pour les personnes physiques
  const candidates = [
    c.nomComplet,
    c.nomAffichage,
    c.nom && c.prenom ? `${c.nom} ${c.prenom}` : null,
    c.nom,
    c.prenom,
  ];
  
  const resolved = candidates.find(v => !isPlaceholder(v));
  
  // Fallback final
  if (resolved) return resolved;
  
  // Utiliser le code client ou l'ID comme dernier recours
  return c.codeClient || `Client #${c.id}`;
}

export default function Dossiers() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const { announce } = useAnnouncer();
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");
  const [filterTypeActe, setFilterTypeActe] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { openTabs, activeTabId, setActiveTabId, openTab, closeTab, setTabDetailSubTab } = useDossierTabs();
  const { getSteps, getStepLabels } = useActeSteps();

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

  // Parties prenantes modal
  const [showPartiesModal, setShowPartiesModal] = useState(false);
  const [partiesDossier, setPartiesDossier] = useState<Dossier | null>(null);
  const [partiesList, setPartiesList] = useState<PartiePrenanteEntry[]>([]);
  const [newPartie, setNewPartie] = useState({ clientSearch: "", role: "Acheteur" as PartiePrenanteEntry["role"] });
  const [clientSuggestions, setClientSuggestions] = useState<ClientDto[]>([]);

  // Modal ajout signataire — sélection depuis la liste des clients
  const [showAddSignataireModal, setShowAddSignataireModal] = useState(false);
  const [allClients, setAllClients] = useState<ClientDto[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientFilterText, setClientFilterText] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [signatRoleValue, setSignatRoleValue] = useState<string>("ACHETEUR");
  const [notairesList, setNotairesList] = useState<User[]>([]);
  const [clercsList, setClercsList] = useState<User[]>([]);
  const [catalogue, setCatalogue] = useState<CatalogueCategorie[]>([]);
  const categoriesActes = catalogue;

  // Generate facture modal
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [factureDossier, setFactureDossier] = useState<Dossier | null>(null);
  const [factureForm, setFactureForm] = useState({ montant: "", description: "", echeance: "" });

  // ═══ Commentaires sur les dossiers ═══
  const [dossierComments, setDossierComments] = useState<Record<string, { user: string; text: string; date: string }[]>>({});
  const [newComment, setNewComment] = useState("");

  // ═══ Pièces jointes par dossier ═══
  const [dossierPieces, setDossierPieces] = useState<Record<string, Array<{nom: string, date: string, taille: string}>>>({});
  const pieceInputRef = useRef<HTMLInputElement>(null);
  const factureImportRef = useRef<HTMLInputElement>(null);

  // ═══ Données des onglets de détail (chargées à la demande) ═══
  const [tabParties, setTabParties] = useState<PartiePrenanteDto[]>([]);
  const [tabDocuments, setTabDocuments] = useState<DocumentDossierDto[]>([]);
  const [tabHistorique, setTabHistorique] = useState<HistoriqueEntreeDto[]>([]);
  const [tabStats, setTabStats] = useState<{ montantTotal: number; montantPaye: number; montantRestant: number; tauxPaiement: number; nombreDocuments: number; nombreParties: number; joursEcoules: number; joursRestants: number; enRetard: boolean; solde: boolean } | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const acteInputRef = useRef<HTMLInputElement>(null);
  const [signatureEnCours, setSignatureEnCours] = useState(false);

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

  // ═══ Workflows par dossier (persistés en localStorage) ═══
  const [dossierWorkflows, setDossierWorkflows] = useState<Record<string, WorkflowConfig>>(() => {
    try {
      const saved = localStorage.getItem("dossierWorkflows");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Persister les workflows dans localStorage à chaque changement
  useEffect(() => {
    try { localStorage.setItem("dossierWorkflows", JSON.stringify(dossierWorkflows)); } catch { /* quota */ }
  }, [dossierWorkflows]);

  // ── Chargement des dossiers depuis l'API ──────────────────────
  const loadDossiers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dossierService.getAll({ page: 0, size: 200 });
      const items = ((response as unknown as { content?: DossierDto[] }).content ?? [])
        .filter(d => !d.deleted);
      setDossiers(items.map(mapDtoToLocal));
    } catch {
      toast.error(fr ? "Erreur lors du chargement des dossiers" : "Error loading cases");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadDossiers(); }, [loadDossiers]);
  useEffect(() => {
  loadStaff();
}, []); 

// Ajoute ce useEffect pour vérifier les étapes après chargement
useEffect(() => {
  if (catalogue.length > 0) {
    console.log("=== CATALOGUE CHARGÉ ===");
    console.log("Catalogue:", catalogue);
    
    // Test pour un type d'acte spécifique
    const testActe = "Vente immobilière";
    const steps = getStepLabels(testActe);
    console.log(`Étapes pour "${testActe}":`, steps);
  }
}, [catalogue, getStepLabels]);

const loadStaff = useCallback(async () => {
  try {
    const [usersPage, cats] = await Promise.all([
      getUsers({ page: 0, size: 200 }),
      categorieActeService.getActives(),
    ]);
    const allUsers = usersPage.content ?? [];
    // Filtrer par rôle côté client (filet de sécurité si le backend ignore le param)
    setNotairesList(allUsers.filter(u => u.role === 'NOTAIRE'));
    setClercsList(allUsers.filter(u => u.role === 'CLERC' || u.role === 'STAGIAIRE'));
    // Mapper les catégories réelles de la DB vers le format CatalogueCategorie
    setCatalogue(cats.map(c => ({
      categorie: c.code,
      label: c.libelle,
      actes: (c.typesActes ?? []).map(t => ({
        value: t.code ?? '',
        label: t.nom ?? t.libelle ?? '',
      })),
    })));
  } catch (error) {
    console.error("Erreur chargement catalogue/staff:", error);
  }
}, []);

  // Chargement des données selon l'onglet actif
  useEffect(() => {
    if (!selectedDossier) return;
    const id = Number(selectedDossier.id);
    if (isNaN(id)) return;
    setTabLoading(true);
    const load = async () => {
      try {
        if (detailTab === "parties" || detailTab === "signataires") {
          setTabParties(await dossierService.getParties(id));
        } else if (detailTab === "actes" || detailTab === "pieces") {
          setTabDocuments(await dossierService.getDocuments(id));
        } else if (detailTab === "finances") {
          setTabStats(await dossierService.getStatistiquesDetail(id));
        } else if (detailTab === "historique") {
          setTabHistorique(await dossierService.getHistorique(id));
        }
      } catch { /* erreur silencieuse, l'UI affiche un état vide */ }
      finally { setTabLoading(false); }
    };
    load();
  }, [selectedDossier?.id, detailTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDossierTab = (d: Dossier, tab: "details" | "workflow") => {
    openTab({ id: d.id, code: d.code, objet: d.objet }, tab);
  };

  const getWorkflow = (dossier: Dossier): WorkflowConfig | null => {
    const steps = getSteps(dossier.typeActe); // WorkflowStepData[] avec label + description
    const savedWf = dossierWorkflows[dossier.id];
    const templateWf = workflowTemplates[dossier.typeActe];

    const configSteps: WorkflowStep[] = steps.map((stepData, i) => {
      const label = stepData.label;
      const key = label.toLowerCase().replace(/[\s/(),']+/g, "_").replace(/_+/g, "_");
      const savedStep = savedWf?.steps.find(s => s.key === key) ?? savedWf?.steps[i];
      const templateStep = templateWf?.steps[i] ?? templateWf?.steps.find(s => s.label === label);
      return {
        key,
        label,
        // Priorité : description configurée > description template > vide
        description: stepData.description || templateStep?.description || "",
        icon: templateStep?.icon ?? "FileText",
        time: templateStep?.time ?? "1 j",
        status: savedStep?.status ?? "pending",
        startedAt: savedStep?.startedAt,
        completedAt: savedStep?.completedAt,
        button: { actionId: `start_${key}` },
      };
    });

    return {
      layout: "horizontal",
      palette: WORKFLOW_PALETTE,
      steps: configSteps,
    };
  };

  const handleWorkflowStart = (dossierId: string, stepKey: string) => {
    setDossierWorkflows(prev => {
      const base = prev[dossierId] ?? getWorkflow(dossiers.find(d => d.id === dossierId)!);
      if (!base) return prev;
      const stepIndex = base.steps.findIndex(s => s.key === stepKey);
      if (stepIndex > 0 && base.steps[stepIndex - 1].status !== "completed") return prev;
      if (base.steps.some(s => s.status === "active")) return prev;
      const now = new Date().toISOString();
      return { ...prev, [dossierId]: { ...base, steps: base.steps.map((s, i) => i === stepIndex ? { ...s, status: "active" as const, startedAt: now } : s) } };
    });
    toast.success(fr ? `Étape "${stepKey}" démarrée` : `Step "${stepKey}" started`);
  };

  const handleWorkflowRevert = (dossierId: string, stepKey: string) => {
    setDossierWorkflows(prev => {
      const base = prev[dossierId] ?? getWorkflow(dossiers.find(d => d.id === dossierId)!);
      if (!base) return prev;
      const stepIndex = base.steps.findIndex(s => s.key === stepKey);
      const now = new Date().toISOString();
      return { ...prev, [dossierId]: { ...base, steps: base.steps.map((s, i) => {
        if (i < stepIndex) return s;
        if (i === stepIndex) return { ...s, status: "active" as const, startedAt: now, completedAt: undefined };
        return { ...s, status: "pending" as const, startedAt: undefined, completedAt: undefined };
      }) } };
    });
    toast.info(fr ? `Étape "${stepKey}" rouverte` : `Step "${stepKey}" reopened`);
  };

  const handleWorkflowComplete = (dossierId: string, stepKey: string) => {
    setDossierWorkflows(prev => {
      const base = prev[dossierId] ?? getWorkflow(dossiers.find(d => d.id === dossierId)!);
      if (!base) return prev;
      const now = new Date().toISOString();
      const updated = base.steps.map(s => s.key === stepKey && s.status === "active" ? { ...s, status: "completed" as const, completedAt: now } : s);
      return { ...prev, [dossierId]: { ...base, steps: updated } };
    });
    toast.success(fr ? `Étape "${stepKey}" complétée` : `Step "${stepKey}" completed`);
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

  const handlePieceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDossier || !e.target.files) return;
    const files = Array.from(e.target.files).map(f => ({
      nom: f.name,
      date: new Date().toLocaleDateString(fr ? "fr-FR" : "en-US"),
      taille: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(f.size / 1024)} Ko`,
    }));
    setDossierPieces(prev => ({ ...prev, [selectedDossier.id]: [...(prev[selectedDossier.id] || []), ...files] }));
    toast.success(fr ? `${files.length} pièce(s) importée(s)` : `${files.length} document(s) imported`);
    e.target.value = "";
  };

  const handleFactureFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    toast.success(fr ? `Facture « ${file.name} » importée avec succès` : `Invoice "${file.name}" imported successfully`);
    e.target.value = "";
  };

  // Form state
  const [form, setForm] = useState({
    categorieActe: "", typeActe: "", objet: "", clients: "", montant: "", montantVerse: "", statut: "En Cours" as Dossier["statut"],
    priorite: "Normale" as Dossier["priorite"], notaireId: "", clercId: "", notes: "",
  });

  const resetForm = useCallback(() => setForm({ categorieActe: "", typeActe: "", objet: "", clients: "", montant: "", montantVerse: "", statut: "En Cours", priorite: "Normale", notaireId: "", clercId: "", notes: "" }), []);

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
    enCours: dossiers.filter(d => d.statut === "En Cours").length,
    enSignature: dossiers.filter(d => d.statut === "En Attente de Signature" || d.statut === "Prêt pour Signature").length,
    enAttente: dossiers.filter(d => d.statut === "En Attente").length,
    termines: dossiers.filter(d => d.statut === "Clôturé" || d.statut === "Signé" || d.statut === "Enregistré").length,
    totalMontant: dossiers.reduce((s, d) => s + d.montant, 0),
  }), [dossiers]);

const handleCreate = useCallback(async () => {
  if (!form.typeActe?.trim()) {
    toast.error(fr ? "Le type d'acte est obligatoire." : "Deed type is required.");
    return;
  }
  setIsSubmitting(true);
  try {
    const payload: CreateDossierDto = {
      typeActe: form.typeActe,
      objet: form.objet || form.typeActe,
      description: form.notes || undefined,
      // ✅ CORRECTION : Envoyer montantTotal et montantPaye
      montantTotal: form.montant ? Number(form.montant) : undefined,
      montantPaye: form.montantVerse ? Number(form.montantVerse) : undefined,
      priorite: { Basse: 0, Normale: 1, Haute: 2, Urgente: 3 }[form.priorite] ?? 1,
      notaireChargeId: form.notaireId ? Number(form.notaireId) : undefined,
      assistantChargeId: form.clercId ? Number(form.clercId) : undefined,
      urgent: false,
    };

    console.log("📤 Envoi du payload:", payload); // Debug
    const response = await dossierService.create(payload);
    console.log("📥 Réponse reçue:", response); // Debug
    
    await loadDossiers();
    setShowCreateModal(false);
    resetForm();
    toast.success(fr ? "Dossier créé avec succès" : "Case created successfully");
    announce(fr ? "Dossier créé" : "Case created");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const isDuplicate = msg.toLowerCase().includes("dupliqu") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("existe déjà") || msg.toLowerCase().includes("already exists");
    toast.error(isDuplicate
      ? (fr ? "Un dossier avec ce numéro existe déjà — problème de séquençage côté serveur, réessayez." : "A case with this number already exists — server-side sequencing issue, please retry.")
      : (fr ? "Erreur lors de la création" : "Error creating case")
    );
  } finally {
    setIsSubmitting(false);
  }
}, [form, fr, loadDossiers, announce, resetForm]);

  const handleEdit = useCallback(async () => {
    if (!editingDossier) return;
    try {
      await dossierService.update(Number(editingDossier.id), {
        objet: form.objet || editingDossier.objet,
        statut: statutValue(form.statut),
        honorairesHT: form.montant ? Number(form.montant) : undefined,
        notesInternes: form.notes || undefined,
      });
      await loadDossiers();
      setShowEditModal(false);
      toast.success(fr ? "Dossier modifié avec succès" : "Case updated successfully");
    } catch {
      toast.error(fr ? "Erreur lors de la modification" : "Error updating case");
    }
  }, [editingDossier, form, fr, loadDossiers]);

  const handleDelete = useCallback(async () => {
    if (!editingDossier) return;
    try {
      await dossierService.delete(Number(editingDossier.id));
      await loadDossiers();
      setShowDeleteDialog(false);
      setEditingDossier(null);
      toast.success(fr ? "Dossier supprimé" : "Case deleted");
      announce(fr ? "Dossier supprimé" : "Case deleted");
    } catch {
      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting case");
    }
  }, [editingDossier, fr, loadDossiers, announce]);

  const handleArchive = useCallback(async (d: Dossier) => {
    try {
      await dossierService.archiver(Number(d.id));
      await loadDossiers();
      toast.success(fr ? `Dossier ${d.code} archivé` : `Case ${d.code} archived`);
      announce(fr ? "Dossier archivé" : "Case archived");
    } catch {
      toast.error(fr ? "Erreur lors de l'archivage" : "Error archiving case");
    }
  }, [fr, loadDossiers, announce]);

  const openEdit = useCallback((d: Dossier) => {
    loadStaff();
    setEditingDossier(d);
    const acteItem = catalogue.flatMap(c => c.actes).find(a => a.label === d.typeActe || a.value === d.typeActe);
    const catItem = catalogue.find(c => c.actes.some(a => a.label === d.typeActe || a.value === d.typeActe));
    setForm({
      categorieActe: catItem?.label || "", typeActe: acteItem?.value || d.typeActe, objet: d.objet, clients: d.clients.join(", "),
      montant: String(d.montant), montantVerse: String(d.montantVerse ?? 0), statut: d.statut, priorite: d.priorite,
      notaireId: d.notaireChargeId ? String(d.notaireChargeId) : "",
      clercId: d.assistantChargeId ? String(d.assistantChargeId) : "",
      notes: d.notesInternes || "",
    });
    setShowEditModal(true);
  }, [loadStaff, catalogue]);

  const openDelete = useCallback((d: Dossier) => {
    setEditingDossier(d);
    setShowDeleteDialog(true);
  }, []);

  // Parties prenantes
// APRÈS
const openPartiesModal = async (d: Dossier) => {
  setPartiesDossier(d);
  setPartiesList(d.parties || []);
  setNewPartie({ clientSearch: "", role: "Acheteur" });
  setClientSuggestions([]);
  setShowPartiesModal(true);
  if (allClients.length === 0) {
    setClientsLoading(true);
    try {
      const clients = await clientService.getAllActifs();
      setAllClients(clients);
    } catch {
      toast.error(fr ? "Erreur chargement clients" : "Error loading clients");
    } finally {
      setClientsLoading(false);
    }
  }
};

// Chargement des clients
const openAddSignataireModal = async () => {
  setSelectedClientId(null);
  setClientFilterText("");
  setSignatRoleValue("ACHETEUR");
  setShowAddSignataireModal(true);
  if (allClients.length === 0) {
    setClientsLoading(true);
    try {
      const clients = await clientService.getAllActifs(); // ✅ Récupère les clients du tenant
      setAllClients(clients);
    } catch { toast.error(fr ? "Erreur chargement clients" : "Error loading clients"); }
    finally { setClientsLoading(false); }
  }
};

  const confirmAddSignataire = async () => {
    if (!selectedDossier || !selectedClientId) return;
    const client = allClients.find(c => c.id === selectedClientId);
    if (!client) return;
    // Vérifier si déjà présent
    if (tabParties.some(p => p.clientId === selectedClientId)) {
      toast.error(fr ? "Ce client est déjà signataire" : "This client is already a signatory");
      return;
    }
    try {
      const added = await dossierService.addPartie(Number(selectedDossier.id), {
        clientId: selectedClientId,
        rolePartie: signatRoleValue as import("@/services/dossierService").RolePartie,
      });
      setTabParties(prev => [...prev, added]);
      setShowAddSignataireModal(false);
      toast.success(fr ? "Signataire ajouté" : "Signatory added");
    } catch { toast.error(fr ? "Erreur lors de l'ajout" : "Error adding signatory"); }
  };

  const searchClients = async (query: string) => {
    setNewPartie(p => ({ ...p, clientSearch: query }));
    if (query.length < 2) { setClientSuggestions([]); return; }
    try {
      const response = await clientService.getAll({ search: query, size: 5 });
      const items = (response as unknown as { content?: ClientDto[] }).content ?? [];
      setClientSuggestions(items);
    } catch {
      setClientSuggestions([]);
    }
  };

  const addPartie = (client: ClientDto) => {
    const code = client.codeClient;
    const nom = resolveClientName(client);
    if (partiesList.some(p => p.clientCode === code)) {
      toast.error(fr ? "Ce client est déjà associé" : "This client is already linked");
      return;
    }
    setPartiesList(prev => [...prev, { clientCode: code, clientId: client.id, nom, role: newPartie.role }]);
    setNewPartie({ clientSearch: "", role: "Acheteur" });
    setClientSuggestions([]);
  };

  const removePartie = (code: string) => {
    setPartiesList(prev => prev.filter(p => p.clientCode !== code));
  };

  const saveParties = async () => {
    if (!partiesDossier) return;
    const dossierId = Number(partiesDossier.id);
    const original = partiesDossier.parties ?? [];
    try {
      const removed = original.filter(op => !partiesList.some(np => np.clientCode === op.clientCode));
      const added = partiesList.filter(np => !original.some(op => op.clientCode === np.clientCode));
      await Promise.all(removed.map(p => p.id ? dossierService.removePartie(dossierId, p.id) : Promise.resolve()));
      await Promise.all(added.filter(p => p.clientId).map(p =>
        dossierService.addPartie(dossierId, { clientId: p.clientId!, rolePartie: roleValue(p.role) })
      ));
      await loadDossiers();
      setShowPartiesModal(false);
      toast.success(fr ? "Parties prenantes mises à jour" : "Stakeholders updated");
    } catch {
      toast.error(fr ? "Erreur lors de la mise à jour des parties" : "Error updating stakeholders");
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

  const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    "CREATION": "📄",
    "MODIFICATION": "✏️",
    "SUPPRESSION": "🗑️",
    "CHANGEMENT_STATUT": "🔄",
    "AJOUT_PARTIE": "👥",
    "SUPPRESSION_PARTIE": "❌",
    "AJOUT_DOCUMENT": "📎",
    "SUPPRESSION_DOCUMENT": "🗑️",
    "VALIDATION_DOCUMENT": "✅",
    "SIGNATURE_DOCUMENT": "✍️",
    "BLOCAGE": "🔒",
    "DEBLOCAGE": "🔓",
    "ALERTE_ACTIVEE": "⚠️",
    "ASSIGNATION_NOTAIRE": "⚖️",
    "ASSIGNATION_ASSISTANT": "👨‍💼",
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
    "AJOUT_DOCUMENT": { fr: "Document ajouté", en: "Document added" },
    "SUPPRESSION_DOCUMENT": { fr: "Document supprimé", en: "Document deleted" },
    "VALIDATION_DOCUMENT": { fr: "Document validé", en: "Document validated" },
    "SIGNATURE_DOCUMENT": { fr: "Document signé", en: "Document signed" },
    "BLOCAGE": { fr: "Dossier bloqué", en: "Case blocked" },
    "DEBLOCAGE": { fr: "Dossier débloqué", en: "Case unblocked" },
    "ALERTE_ACTIVEE": { fr: "Alerte activée", en: "Alert activated" },
    "ASSIGNATION_NOTAIRE": { fr: "Notaire assigné", en: "Notary assigned" },
    "ASSIGNATION_ASSISTANT": { fr: "Assistant assigné", en: "Assistant assigned" },
  };
  return labels[type]?.[fr ? "fr" : "en"] || type;
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
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => { resetForm(); loadStaff(); setShowCreateModal(true); }}>
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
<Select value={form.categorieActe} onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}>
  <SelectTrigger>
    <SelectValue placeholder={fr ? "Sélectionner une catégorie" : "Select a category"} />
  </SelectTrigger>
  <SelectContent>
    {catalogue.length === 0 ? (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-xs">{fr ? "Chargement..." : "Loading..."}</span>
      </div>
    ) : (
      catalogue.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)
    )}
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
{loading ? (
  <div className="flex justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
) : viewMode === "list" ? (
  <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Client" : "Client"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Objet" : "Subject"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{fr ? "Montant total" : "Total amount"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{fr ? "Montant payé" : "Paid amount"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{fr ? "Reste à payer" : "Remaining"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Statut" : "Status"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Date</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleDossiers.map((d) => {
            const montantRestant = d.montant - (d.montantVerse || 0);
            return (
              <tr key={d.id}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-4">
                  <span className="text-sm font-mono font-medium text-primary cursor-pointer hover:underline" onClick={() => openDossierTab(d, "details")}>
                    {d.code}
                  </span>
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
                <td className="px-4 py-4 text-sm font-medium text-emerald-600 hidden md:table-cell font-mono">{formatGNF(d.montantVerse || 0)}</td>
                <td className="px-4 py-4 text-sm font-medium text-destructive hidden md:table-cell font-mono">{formatGNF(montantRestant)}</td>
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
                      <DropdownMenuItem onClick={() => navigate(`/documents/dossier/${d.id}`)}><FolderOpen className="mr-2 h-4 w-4" /> {fr ? "Documents" : "Documents"}</DropdownMenuItem>
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
            );
          })}
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
  {visibleDossiers.map((d, i) => {
    const montantRestant = d.montant - (d.montantVerse || 0);
    const pourcentagePaye = d.montant > 0 ? ((d.montantVerse || 0) / d.montant) * 100 : 0;
    
    return (
      <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => openDossierTab(d, "details")}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-mono font-medium text-primary">{d.code}</span>
          <StatusBadge status={d.statut} />
        </div>
        <h3 className="font-heading font-semibold text-foreground mb-1">{d.objet}</h3>
        <p className="text-xs text-muted-foreground mb-1">{d.typeActe}</p>
        <p className="text-xs text-muted-foreground mb-1">{fr ? "suivi par" : "handled by"} {d.notaire}{d.clerc ? ` · ${d.clerc}` : ""}</p>
        <p className="text-sm text-muted-foreground mb-3">{d.clients.join(", ")}</p>
        
        {/* Section financière */}
        <div className="space-y-2 mb-3 p-3 rounded-lg bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{fr ? "Total" : "Total"}</span>
            <span className="text-sm font-mono font-semibold text-foreground">{formatGNF(d.montant)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{fr ? "Payé" : "Paid"}</span>
            <span className="text-sm font-mono font-semibold text-emerald-600">{formatGNF(d.montantVerse || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{fr ? "Reste à payer" : "Remaining"}</span>
            <span className="text-sm font-mono font-semibold text-destructive">{formatGNF(montantRestant)}</span>
          </div>
          {/* Barre de progression du paiement */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{fr ? "Taux de paiement" : "Payment rate"}</span>
              <span>{Math.round(pourcentagePaye)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${pourcentagePaye}%` }}
              />
            </div>
          </div>
        </div>
        
        <ProgressBar value={d.avancement} className="mb-3" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{d.nbActes} {fr ? "actes" : "deeds"} · {d.nbPieces} {fr ? "pièces" : "docs"}</span>
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
              <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/documents/dossier/${d.id}`); }}><FolderOpen className="mr-2 h-4 w-4" /> {fr ? "Documents" : "Documents"}</DropdownMenuItem>
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
    );
  })}
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
    {/* Informations générales */}
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

    {/* Personnel en charge */}
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

    {/* Références notariales */}
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

    {/* Bien immobilier */}
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

    {/* Honoraires */}
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

    {/* Notes & Observations */}
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

    {/* Commentaires */}
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

    {/* Boutons actions */}
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


{/* ═══════════════════════════════════════════════════════════════ */}
{/* TAB: PARTIES */}
{/* ═══════════════════════════════════════════════════════════════ */}

{detailTab === "parties" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">
        {tabParties.length} {fr ? "partie(s) prenante(s)" : "stakeholder(s)"}
      </p>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => openPartiesModal(selectedDossier)}>
        <UserPlus className="h-4 w-4" />
        {fr ? "Associer" : "Link"}
      </Button>
    </div>

    {tabLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : tabParties.length > 0 ? (
      <div className="space-y-2">
        {tabParties.map((p) => {
          const nom = p.nomComplet ?? [p.clientNom, p.prenom].filter(Boolean).join(" ") ?? p.nom ?? `Client #${p.clientId}`;
          const roleLib = roleLabel(p.role);
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{nom}</p>
                <p className="text-xs text-muted-foreground">{p.clientCode ?? `#${p.clientId}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {roleLib}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    try {
                      await dossierService.removePartie(Number(selectedDossier.id), p.id);
                      setTabParties(prev => prev.filter(x => x.id !== p.id));
                      toast.success(fr ? "Partie supprimée" : "Stakeholder removed");
                    } catch {
                      toast.error(fr ? "Erreur lors de la suppression" : "Error removing stakeholder");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <EmptyState
        icon={Users}
        title={fr ? "Aucune partie prenante" : "No stakeholders"}
        description={fr ? "Associez des clients à ce dossier" : "Link clients to this case"}
        action={
          <Button variant="outline" size="sm" onClick={() => openPartiesModal(selectedDossier)}>
            <UserPlus className="h-4 w-4 mr-1" />
            {fr ? "Associer des parties" : "Link stakeholders"}
          </Button>
        }
      />
    )}
  </div>
)}


{/* ═══════════════════════════════════════════════════════════════ */}
{/* TAB: SIGNATAIRES */}
{/* ═══════════════════════════════════════════════════════════════ */}

{detailTab === "signataires" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">
        {tabParties.length + (selectedDossier.notaire ? 1 : 0)} {fr ? "signataire(s)" : "signatory(ies)"}
      </p>
      <Button variant="outline" size="sm" className="gap-1" onClick={openAddSignataireModal}>
        <UserPlus className="h-4 w-4" />
        {fr ? "Ajouter" : "Add"}
      </Button>
    </div>

    {tabLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : tabParties.length > 0 || selectedDossier.notaire ? (
      <div className="space-y-2">
        {/* Parties prenantes */}
        {tabParties.map((p) => {
          const nom = p.nomComplet ?? [p.clientNom, p.prenom].filter(Boolean).join(" ") ?? `Client #${p.clientId}`;
          // Vérifier si un document signé existe pour cette partie
          const hasSigned = tabDocuments.some(doc => doc.signe && doc.signeParNom === nom);
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{nom}</p>
                <p className="text-xs text-muted-foreground">{roleLabel(p.role)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasSigned ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {fr ? "Signé" : "Signed"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                    <Clock className="h-3.5 w-3.5" /> {fr ? "En attente" : "Pending"}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    // Ouvrir le modal de signature
                    toast.info(fr ? "Fonctionnalité à venir" : "Coming soon");
                  }}
                >
                  <FileSignature className="h-3.5 w-3.5 mr-1" />
                  {fr ? "Inviter" : "Invite"}
                </Button>
              </div>
            </div>
          );
        })}

        {/* Notaire (toujours signataire) */}
        {selectedDossier.notaire && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 font-bold text-sm shrink-0">
              {selectedDossier.notaire.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{selectedDossier.notaire}</p>
              <p className="text-xs text-muted-foreground">{fr ? "Notaire instrumentaire" : "Officiant notary"}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full shrink-0">
              <PenLine className="h-3.5 w-3.5" /> {fr ? "Officiant" : "Officiant"}
            </span>
          </div>
        )}
      </div>
    ) : (
      <EmptyState
        icon={FileSignature}
        title={fr ? "Aucun signataire" : "No signatories"}
        description={fr ? "Ajoutez des parties prenantes pour définir les signataires" : "Add stakeholders to define signatories"}
        action={
          <Button variant="outline" size="sm" onClick={openAddSignataireModal}>
            <UserPlus className="h-4 w-4 mr-1" />
            {fr ? "Ajouter un signataire" : "Add a signatory"}
          </Button>
        }
      />
    )}
  </div>
)}


{/* ═══════════════════════════════════════════════════════════════ */}
{/* TAB: ACTES */}
{/* ═══════════════════════════════════════════════════════════════ */}

{detailTab === "actes" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">
        {tabDocuments.filter(d => d.typeDocument === "ACTE" || d.typeDocument === "ACTE_AUTHENTIQUE" || d.typeDocument === "MINUTE").length} {fr ? "acte(s)" : "deed(s)"}
      </p>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => acteInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-1" />
        {fr ? "Ajouter un acte" : "Add deed"}
      </Button>
    </div>

    {/* Input caché pour l'upload des actes */}
  <input
  ref={acteInputRef}
  type="file"
  accept=".pdf"
  className="hidden"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // 1. Upload du document
      await dossierService.addDocument(Number(selectedDossier.id), file, {
        nomDocument: file.name,
        typeDocument: "ACTE",
        signatureRequise: true,
      });
      
      // 2. Recharger TOUS les documents depuis l'API
      const docs = await dossierService.getDocuments(Number(selectedDossier.id));
      setTabDocuments(docs);
      
      toast.success(fr ? "Acte ajouté avec succès" : "Deed added successfully");
    } catch {
      toast.error(fr ? "Erreur lors de l'ajout de l'acte" : "Error adding deed");
    }
    e.target.value = "";
  }}
/>

    {tabLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : tabDocuments.filter(d => d.typeDocument === "ACTE" || d.typeDocument === "ACTE_AUTHENTIQUE" || d.typeDocument === "MINUTE").length > 0 ? (
      <div className="space-y-2">
        {tabDocuments
          .filter(doc => doc.typeDocument === "ACTE" || doc.typeDocument === "ACTE_AUTHENTIQUE" || doc.typeDocument === "MINUTE")
          .map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{doc.nomDocument}</p>
                  <StatusBadge
                    status={
                      doc.signe ? "Signé" :
                      doc.valideParNom ? "Validé" :
                      "Brouillon"
                    }
                  />
                  {doc.version > 1 && (
                    <span className="text-xs text-muted-foreground">v{doc.version}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {fr ? "Ajouté le" : "Added on"} {new Date(doc.dateAjout).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                  {doc.valideParNom && ` · ${fr ? "Validé par" : "Validated by"} ${doc.valideParNom}`}
                  {doc.signeParNom && ` · ${fr ? "Signé par" : "Signed by"} ${doc.signeParNom}`}
                  {doc.dateSignature && ` · ${new Date(doc.dateSignature).toLocaleDateString(fr ? "fr-FR" : "en-US")}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Bouton Valider */}
                {!doc.valideParNom && doc.statut !== "VALIDE" && !doc.signe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={async () => {
                      try {
                        await dossierService.validerDocument(Number(selectedDossier.id), doc.id);
                        const docs = await dossierService.getDocuments(Number(selectedDossier.id));
                        setTabDocuments(docs);
                        toast.success(fr ? "Document validé" : "Document validated");
                      } catch {
                        toast.error(fr ? "Erreur lors de la validation" : "Error validating document");
                      }
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {fr ? "Valider" : "Validate"}
                  </Button>
                )}
                
                {/* Bouton Signer - avec appel API réel */}
{/* Bouton Signer */}
{doc.valideParNom && doc.signatureRequise && !doc.signe && (
  <Button
    variant="default"
    size="sm"
    className="h-7 text-xs bg-primary"
    onClick={async () => {
      try {
        setSignatureEnCours(true);
        
        const response = await dossierService.signerDocument(Number(selectedDossier.id), doc.id);
        
        const result = response;
        
        // ✅ Si la signature a réussi (même sans PDF retourné)
        if (result.success || result.pdfSigne || result.urlSignature) {
          if (result.urlSignature) {
            window.open(result.urlSignature, "_blank");
            toast.info(fr ? "Redirection vers la plateforme de signature..." : "Redirecting to signature platform...");
          } else if (result.pdfSigne) {
            // Télécharger le PDF signé
            const link = document.createElement("a");
            const blob = base64ToBlob(result.pdfSigne, "application/pdf");
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `document_signe_${doc.id}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(fr ? "Document signé avec succès" : "Document signed successfully");
          } else {
            // ✅ Cas où seul le statut est mis à jour (pas de PDF retourné)
            toast.success(fr ? "Document signé avec succès" : "Document signed successfully");
          }
          
          // ✅ Recharger les documents pour voir le nouveau statut
          const docs = await dossierService.getDocuments(Number(selectedDossier.id));
          setTabDocuments(docs);
          
        } else {
          toast.error(result.message || (fr ? "Erreur lors de la signature" : "Error during signature"));
        }
        
      } catch (error) {
        console.error("Erreur signature:", error);
        
        // ✅ Même en cas d'erreur, on recharge pour vérifier si le document a été signé
        const docs = await dossierService.getDocuments(Number(selectedDossier.id));
        setTabDocuments(docs);
        
        // Vérifier si le document est maintenant signé
        const updatedDoc = docs.find(d => d.id === doc.id);
        if (updatedDoc?.signe) {
          toast.success(fr ? "Document signé avec succès" : "Document signed successfully");
        } else {
          toast.error(fr ? "Erreur lors de la signature" : "Error during signature");
        }
      } finally {
        setSignatureEnCours(false);
      }
    }}
    disabled={signatureEnCours}
  >
    {signatureEnCours ? (
      <>
        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
        {fr ? "Signature..." : "Signing..."}
      </>
    ) : (
      <>
        <FileSignature className="h-3.5 w-3.5 mr-1" />
        {fr ? "Signer" : "Sign"}
      </>
    )}
  </Button>
)}
                
                {/* Télécharger */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async () => {
                    try {
                      const { url } = await dossierService.getDocumentUrl(Number(selectedDossier.id), doc.id);
                      window.open(url, "_blank");
                    } catch {
                      toast.error(fr ? "Erreur lors du téléchargement" : "Error downloading document");
                    }
                  }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                </Button>
                
                {/* Supprimer */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={async () => {
                    try {
                      await dossierService.removeDocument(Number(selectedDossier.id), doc.id);
                      setTabDocuments(prev => prev.filter(d => d.id !== doc.id));
                      toast.success(fr ? "Document supprimé" : "Document deleted");
                    } catch {
                      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting document");
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
      <EmptyState
        icon={FileText}
        title={fr ? "Aucun acte" : "No deeds"}
        description={fr ? "Ajoutez un acte notarial à ce dossier" : "Add a notarial deed to this case"}
        action={
          <Button variant="outline" size="sm" onClick={() => acteInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            {fr ? "Ajouter un acte" : "Add a deed"}
          </Button>
        }
      />
    )}
  </div>
)}


{/* ═══════════════════════════════════════════════════════════════ */}
{/* TAB: PIÈCES */}
{/* ═══════════════════════════════════════════════════════════════ */}

{detailTab === "pieces" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">
        {tabDocuments.length} {fr ? "document(s)" : "document(s)"}
      </p>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => pieceInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-1" />
        {fr ? "Ajouter" : "Add"}
      </Button>
    </div>

    <input
      ref={pieceInputRef}
      type="file"
      multiple
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      className="hidden"
      onChange={async (e) => {
        const files = Array.from(e.target.files ?? []);
        
        for (const file of files) {
          try {
            // Upload du document
            await dossierService.addDocument(Number(selectedDossier.id), file, {
              nomDocument: file.name,
              typeDocument: "PIECE_JUSTIFICATIVE",
            });
          } catch (error) {
            console.error(`Erreur upload ${file.name}:`, error);
            toast.error(fr ? `Erreur : ${file.name}` : `Error: ${file.name}`);
          }
        }
        
        // ✅ Recharger TOUS les documents après l'upload
        const docs = await dossierService.getDocuments(Number(selectedDossier.id));
        setTabDocuments(docs);
        
        if (files.length) {
          toast.success(fr ? `${files.length} pièce(s) ajoutée(s)` : `${files.length} document(s) added`);
        }
        e.target.value = "";
      }}
    />

    {tabLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : tabDocuments.length > 0 ? (
      <div className="space-y-2">
        {tabDocuments.map((doc) => {
          // ✅ Formater la date correctement
          const formatDate = (dateStr?: string) => {
            if (!dateStr) return "";
            try {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return "";
              return date.toLocaleDateString(fr ? "fr-FR" : "en-US");
            } catch {
              return "";
            }
          };
          
          return (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{doc.nomDocument}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.typeDocument} · {doc.tailleFichierFormatee ?? ""}
                  {doc.dateAjout && ` · ${formatDate(doc.dateAjout)}`}
                  {doc.valideParNom && ` · ${fr ? "Validé par" : "Validated by"} ${doc.valideParNom}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <StatusBadge
                  status={
                    doc.signe ? "Signé" :
                    doc.valideParNom ? "Validé" :
                    "Brouillon"
                  }
                />
                
                {/* Bouton Valider */}
                {!doc.valideParNom && doc.statut !== "VALIDE" && !doc.signe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={async () => {
                      try {
                        await dossierService.validerDocument(Number(selectedDossier.id), doc.id);
                        const docs = await dossierService.getDocuments(Number(selectedDossier.id));
                        setTabDocuments(docs);
                        toast.success(fr ? "Document validé" : "Document validated");
                      } catch {
                        toast.error(fr ? "Erreur lors de la validation" : "Error validating document");
                      }
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {fr ? "Valider" : "Validate"}
                  </Button>
                )}
                
                {/* Télécharger */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async () => {
                    try {
                      const { url } = await dossierService.getDocumentUrl(Number(selectedDossier.id), doc.id);
                      window.open(url, "_blank");
                    } catch {
                      toast.error(fr ? "Erreur lors du téléchargement" : "Error downloading document");
                    }
                  }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                </Button>
                
                {/* Supprimer */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={async () => {
                    try {
                      await dossierService.removeDocument(Number(selectedDossier.id), doc.id);
                      setTabDocuments(prev => prev.filter(d => d.id !== doc.id));
                      toast.success(fr ? "Document supprimé" : "Document deleted");
                    } catch {
                      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting document");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <EmptyState
        icon={FileDown}
        title={fr ? "Aucun document" : "No documents"}
        description={fr ? "Ajoutez des documents à ce dossier" : "Add documents to this case"}
        action={
          <Button variant="outline" size="sm" onClick={() => pieceInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            {fr ? "Ajouter un document" : "Add a document"}
          </Button>
        }
      />
    )}
  </div>
)}


{/* ═══════════════════════════════════════════════════════════════ */}
{/* TAB: FINANCES */}
{/* ═══════════════════════════════════════════════════════════════ */}

{detailTab === "finances" && (
  <div className="space-y-4">
    {tabLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">{fr ? "Montant total" : "Total amount"}</p>
            <p className="text-lg font-bold text-foreground font-mono">
              {formatGNF(tabStats?.montantTotal ?? selectedDossier.montant)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">{fr ? "Payé" : "Paid"}</p>
            <p className="text-lg font-bold text-emerald-500 font-mono">
              {formatGNF(tabStats?.montantPaye ?? 0)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">{fr ? "Reste à payer" : "Remaining"}</p>
          <p className="text-lg font-bold text-destructive font-mono">
            {formatGNF(tabStats?.montantRestant ?? selectedDossier.montant)}
          </p>
        </div>

        {tabStats && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">{fr ? "Taux de paiement" : "Payment rate"}</p>
              <p className="font-bold">{Math.round(tabStats.tauxPaiement)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">{fr ? "Jours restants" : "Days remaining"}</p>
              <p className={cn("font-bold", tabStats.enRetard ? "text-destructive" : "text-foreground")}>
                {tabStats.enRetard ? (fr ? "En retard" : "Overdue") : tabStats.joursRestants}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => openFactureModal(selectedDossier)}>
            <Receipt className="h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => factureImportRef.current?.click()}>
            <Upload className="h-4 w-4" /> {fr ? "Importer" : "Import"}
          </Button>
        </div>

        <input ref={factureImportRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFactureFileImport} />
      </>
    )}
  </div>
)}


{/* ═══════════════════════════════════════════════════════════════ */}
{/* TAB: HISTORIQUE */}
{/* ═══════════════════════════════════════════════════════════════ */}

{detailTab === "historique" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">
        {tabHistorique.length} {fr ? "événement(s)" : "event(s)"}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => {
          // Ouvrir modal d'ajout d'événement
          toast.info(fr ? "Fonctionnalité à venir" : "Coming soon");
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        {fr ? "Ajouter" : "Add"}
      </Button>
    </div>

    {tabLoading ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : tabHistorique.length > 0 ? (
      <div className="space-y-2">
        {tabHistorique.map((h) => (
          <div key={h.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm shrink-0">
              {getEventIcon(h.typeEvenement)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">
                  {getEventLabel(h.typeEvenement, fr)}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(h.dateEvenement).toLocaleString(fr ? "fr-FR" : "en-US")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
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
      <EmptyState
        icon={CalendarDays}
        title={fr ? "Aucun historique" : "No history"}
        description={fr ? "Les actions sur ce dossier apparaîtront ici" : "Actions on this case will appear here"}
      />
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
        selectedDossier ? (() => {
          const wf = dossierWorkflows[selectedDossier.id] ?? getWorkflow(selectedDossier);
          return wf ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">{selectedDossier.objet}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedDossier.code} · {selectedDossier.typeActe}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {wf.steps.filter(s => s.status === "completed").length}/{wf.steps.length} {fr ? "étapes" : "steps"}
                </span>
              </div>
              <div className="rounded-xl bg-muted/10 border border-border overflow-x-auto p-4">
                <WorkflowProcedural
                  config={wf}
                  onStart={(_actionId, stepKey) => handleWorkflowStart(selectedDossier.id, stepKey)}
                  onRevert={(stepKey) => handleWorkflowRevert(selectedDossier.id, stepKey)}
                  onComplete={(stepKey) => handleWorkflowComplete(selectedDossier.id, stepKey)}
                  stepComments={stepComments[selectedDossier.id] ?? {}}
                  onAddComment={(stepKey, text) => handleAddStepComment(selectedDossier.id, stepKey, text)}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{fr ? "Aucun workflow défini pour ce type d'acte" : "No workflow defined for this deed type"}</p>
            </div>
          );
        })() : (
          <div className="text-center py-20 text-muted-foreground">
            <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{fr ? "Sélectionnez un dossier dans la liste pour voir son workflow" : "Select a case from the list to view its workflow"}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTabId("dossiers")}>{fr ? "Aller à la liste" : "Go to list"}</Button>
          </div>
        )
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouveau dossier" : "New Case"}</DialogTitle>
            <DialogDescription>{fr ? "Remplissez les informations pour créer un nouveau dossier" : "Fill in the information to create a new case"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{fr ? "Catégorie d'acte *" : "Act category *"}</Label>
              <SearchCombobox
                options={categoriesActes.map(c => c.label)}
                value={form.categorieActe}
                onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}
                placeholder={fr ? "Sélectionner une catégorie" : "Select a category"}
                searchPlaceholder={fr ? "Rechercher une catégorie…" : "Search category…"}
                emptyText={fr ? "Aucune catégorie trouvée" : "No category found"}
              />
              <Select value={form.categorieActe} onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner une catégorie" : "Select a category"} /></SelectTrigger>
                <SelectContent>
                  {catalogue.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.categorieActe && (
              <div className="space-y-2">
                <Label>{fr ? "Acte spécifique *" : "Specific act *"}</Label>
                <SearchCombobox
                  options={categoriesActes.find(c => c.label === form.categorieActe)?.actes ?? []}
                  value={form.typeActe}
                  onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}
                  placeholder={fr ? "Sélectionner un acte" : "Select an act"}
                  searchPlaceholder={fr ? "Rechercher un acte…" : "Search act…"}
                  emptyText={fr ? "Aucun acte trouvé" : "No act found"}
                />
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un acte" : "Select an act"} /></SelectTrigger>
                  <SelectContent>
                    {(catalogue.find(c => c.label === form.categorieActe)?.actes ?? []).map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{fr ? "Priorité" : "Priority"}</Label>
              <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Objet du dossier" : "Case subject"}</Label>
              <Input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))} placeholder={fr ? "Ex: Vente villa Kipé" : "E.g.: Villa sale Kipé"} />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Client(s) *" : "Client(s) *"} <span className="text-xs text-muted-foreground">({fr ? "codes ou noms séparés par des virgules" : "codes or names separated by commas"})</span></Label>
              <Input value={form.clients} onChange={e => setForm(f => ({ ...f, clients: e.target.value }))} placeholder={fr ? "C-1201, C-1203 ou Bah Oumar, Diallo" : "C-1201, C-1203 or Bah Oumar, Diallo"} />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Montant total (GNF)" : "Total amount (GNF)"}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={form.montant ? new Intl.NumberFormat("fr-FR").format(Number(form.montant)) : ""}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value.replace(/[^0-9]/g, "") }))}
                placeholder="0"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Montant versé (GNF)" : "Paid amount (GNF)"}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={form.montantVerse ? new Intl.NumberFormat("fr-FR").format(Number(form.montantVerse)) : ""}
                onChange={e => setForm(f => ({ ...f, montantVerse: e.target.value.replace(/[^0-9]/g, "") }))}
                placeholder="0"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {form.montant !== "" && form.montantVerse !== "" && (
              <div className="space-y-2">
                <Label>{fr ? "Reste à payer (GNF)" : "Remaining (GNF)"}</Label>
                <div className={`flex items-center h-9 px-3 rounded-md border text-sm font-mono font-semibold bg-muted/40 ${
                  Number(form.montant) - Number(form.montantVerse) < 0
                    ? "border-destructive text-destructive"
                    : Number(form.montant) - Number(form.montantVerse) === 0
                      ? "border-green-400 text-green-600 dark:text-green-400"
                      : "border-border text-foreground"
                }`}>
                  {new Intl.NumberFormat("fr-FR").format(Math.max(0, Number(form.montant) - Number(form.montantVerse)))} GNF
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{fr ? "Notaire responsable *" : "Responsible notary *"}</Label>
              <Select value={form.notaireId || "__none__"} onValueChange={v => setForm(f => ({ ...f, notaireId: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "— Sélectionner —" : "— Select —"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{fr ? "— Sélectionner —" : "— Select —"}</SelectItem>
                  {notairesList.map(n => <SelectItem key={n.id} value={n.id}>{n.prenom} {n.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Clerc en charge" : "Clerk in charge"}</Label>
              <Select value={form.clercId || "__none__"} onValueChange={v => setForm(f => ({ ...f, clercId: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "— Aucun —" : "— None —"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{fr ? "— Aucun —" : "— None —"}</SelectItem>
                  {clercsList.map(c => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={fr ? "Notes internes..." : "Internal notes..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.typeActe?.trim() || !form.clients?.trim()}>
              {isSubmitting ? (fr ? "Création..." : "Creating...") : (fr ? "Créer le dossier" : "Create case")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Modifier le dossier" : "Edit Case"}</DialogTitle>
            <DialogDescription>{fr ? `Modifiez les informations du dossier ${editingDossier?.code}` : `Edit case ${editingDossier?.code} information`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{fr ? "Catégorie d'acte" : "Act category"}</Label>
              <SearchCombobox
                options={categoriesActes.map(c => c.label)}
                value={form.categorieActe}
                onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}
                placeholder={fr ? "Sélectionner une catégorie" : "Select a category"}
                searchPlaceholder={fr ? "Rechercher une catégorie…" : "Search category…"}
                emptyText={fr ? "Aucune catégorie trouvée" : "No category found"}
              />
              <Select value={form.categorieActe} onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner une catégorie" : "Select a category"} /></SelectTrigger>
                <SelectContent>
                  {catalogue.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.categorieActe && (
              <div className="space-y-2">
                <Label>{fr ? "Acte spécifique" : "Specific act"}</Label>
                <SearchCombobox
                  options={categoriesActes.find(c => c.label === form.categorieActe)?.actes ?? []}
                  value={form.typeActe}
                  onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}
                  placeholder={fr ? "Sélectionner un acte" : "Select an act"}
                  searchPlaceholder={fr ? "Rechercher un acte…" : "Search act…"}
                  emptyText={fr ? "Aucun acte trouvé" : "No act found"}
                />
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un acte" : "Select an act"} /></SelectTrigger>
                  <SelectContent>
                    {(catalogue.find(c => c.label === form.categorieActe)?.actes ?? []).map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{fr ? "Statut" : "Status"}</Label>
              <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v as Dossier["statut"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statuts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Objet" : "Subject"}</Label>
              <Input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Client(s)" : "Client(s)"} <span className="text-xs text-muted-foreground">({fr ? "codes ou noms séparés par des virgules" : "codes or names separated by commas"})</span></Label>
              <Input value={form.clients} onChange={e => setForm(f => ({ ...f, clients: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Montant total (GNF)" : "Total amount (GNF)"}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={form.montant ? new Intl.NumberFormat("fr-FR").format(Number(form.montant)) : ""}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value.replace(/[^0-9]/g, "") }))}
                placeholder="0"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Montant versé (GNF)" : "Paid amount (GNF)"}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={form.montantVerse ? new Intl.NumberFormat("fr-FR").format(Number(form.montantVerse)) : ""}
                onChange={e => setForm(f => ({ ...f, montantVerse: e.target.value.replace(/[^0-9]/g, "") }))}
                placeholder="0"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {form.montant !== "" && form.montantVerse !== "" && (
              <div className="space-y-2">
                <Label>{fr ? "Reste à payer (GNF)" : "Remaining (GNF)"}</Label>
                <div className={`flex items-center h-9 px-3 rounded-md border text-sm font-mono font-semibold bg-muted/40 ${
                  Number(form.montant) - Number(form.montantVerse) < 0
                    ? "border-destructive text-destructive"
                    : Number(form.montant) - Number(form.montantVerse) === 0
                      ? "border-green-400 text-green-600 dark:text-green-400"
                      : "border-border text-foreground"
                }`}>
                  {new Intl.NumberFormat("fr-FR").format(Math.max(0, Number(form.montant) - Number(form.montantVerse)))} GNF
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{fr ? "Priorité" : "Priority"}</Label>
              <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                <Select value={form.notaireId || "__none__"} onValueChange={v => setForm(f => ({ ...f, notaireId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "— Sélectionner —" : "— Select —"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{fr ? "— Sélectionner —" : "— Select —"}</SelectItem>
                    {notairesList.map(n => <SelectItem key={n.id} value={n.id}>{n.prenom} {n.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Clerc en charge" : "Clerk in charge"}</Label>
                <Select value={form.clercId || "__none__"} onValueChange={v => setForm(f => ({ ...f, clercId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "— Aucun —" : "— None —"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{fr ? "— Aucun —" : "— None —"}</SelectItem>
                    {clercsList.map(c => <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEdit}>{fr ? "Enregistrer" : "Save"}</Button>
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

      {/* ── Modal : Ajouter un signataire (sélection depuis la liste clients) ── */}
      <Dialog open={showAddSignataireModal} onOpenChange={setShowAddSignataireModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Ajouter un signataire" : "Add a signatory"}</DialogTitle>
            <DialogDescription>{fr ? "Sélectionnez un client du cabinet" : "Select a client from the firm"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Filtre */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={fr ? "Filtrer par nom ou code..." : "Filter by name or code..."}
                value={clientFilterText}
                onChange={e => setClientFilterText(e.target.value)}
              />
            </div>
            {/* Liste des clients */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {clientsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (() => {
                const q = clientFilterText.toLowerCase();
                const filtered = allClients.filter(c =>
                  !q ||
                  (c.nomComplet ?? c.denominationSociale ?? `${c.nom ?? ""} ${c.prenom ?? ""}`.trim()).toLowerCase().includes(q) ||
                  c.codeClient?.toLowerCase().includes(q)
                );
                return filtered.length > 0 ? filtered.map(c => {
                  const nom = resolveClientName(c);
                  const selected = selectedClientId === c.id;
                  // Déjà signataire ?
                  const alreadyAdded = tabParties.some(p => p.clientId === c.id);
                  return (
                    <button
                      key={c.id}
                      disabled={alreadyAdded}
                      onClick={() => setSelectedClientId(selected ? null : c.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                        selected ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/50",
                        alreadyAdded ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{nom}</p>
                        <p className="text-xs text-muted-foreground">{c.codeClient} · {c.typeClient}</p>
                      </div>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      {alreadyAdded && <span className="text-xs text-muted-foreground shrink-0">{fr ? "Déjà ajouté" : "Already added"}</span>}
                    </button>
                  );
                }) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {fr ? "Aucun client trouvé" : "No clients found"}
                  </div>
                );
              })()}
            </div>
            {/* Rôle */}
            <div className="space-y-1.5">
              <Label className="text-sm">{fr ? "Rôle dans l'acte" : "Role in deed"}</Label>
              <Select value={signatRoleValue} onValueChange={setSignatRoleValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["ACHETEUR","VENDEUR","BENEFICIAIRE","MANDANT","MANDATAIRE","PRENEUR","BAILLEUR","DONATEUR","DONATAIRE","HERITIER","AUTRE"] as const).map(r => (
                    <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSignataireModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={confirmAddSignataire} disabled={!selectedClientId}>
              {fr ? "Ajouter" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Associer Parties Modal */}
      <Dialog open={showPartiesModal} onOpenChange={setShowPartiesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Associer des parties prenantes" : "Link Stakeholders"}</DialogTitle>
            <DialogDescription>{fr ? "Dossier" : "Case"} <strong>{partiesDossier?.code}</strong> — {partiesDossier?.objet}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Current parties */}
            {partiesList.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{fr ? `Parties associées (${partiesList.length})` : `Linked stakeholders (${partiesList.length})`}</Label>
                {partiesList.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {p.nom.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.nom}</p>
                      <p className="text-xs text-muted-foreground">{p.clientCode} · {p.role}</p>
                    </div>
                    <button onClick={() => removePartie(p.clientCode)} className="text-destructive hover:text-destructive/80 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new party */}
            <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
              <Label className="text-sm font-medium">{fr ? "Ajouter une partie" : "Add a stakeholder"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">{fr ? "Rechercher client" : "Search client"}</Label>
                  <Input
                    value={newPartie.clientSearch}
                    onChange={e => searchClients(e.target.value)}
                    placeholder={fr ? "Code ou nom du client..." : "Client code or name..."}
                  />
                  {clientSuggestions.length > 0 && (
                    <div className="border border-border rounded-lg bg-card shadow-lg max-h-40 overflow-y-auto">
                      {clientSuggestions.map(c => (
                        <button key={c.id} onClick={() => addPartie(c)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border last:border-0">
                          <span className="text-xs font-mono text-primary">{c.codeClient}</span>
                        <span className="text-sm text-foreground">{resolveClientName(c)}</span>                        
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{fr ? "Rôle" : "Role"}</Label>
                  <Select value={newPartie.role} onValueChange={v => setNewPartie(p => ({ ...p, role: v as PartiePrenanteEntry["role"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {rolesParties.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartiesModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
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
    </div>
  );
}