// ═══════════════════════════════════════════════════════════════
// Page Dossiers — Gestion complète des dossiers notariaux
// Inclut : liste/grille, CRUD, détail tiroir avec workflow,
// gestion des parties prenantes, filtres, export CSV/PDF
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { searchMatch } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";
import { dossierService } from "@/services/dossierService";
import { normalizeDossier } from "@/lib/dataUtils";
import { Plus, Download, Search, FolderOpen, Clock, PenLine, CheckCircle2, DollarSign, MoreHorizontal, X, Trash2, Edit, FileText, List, LayoutGrid, Archive, Receipt, UserPlus, Users, FileDown, CalendarDays, Upload, GitBranch, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { mockDossiers, mockClients, mockNotaires, mockClercs, formatGNF, rolesParties, currentUser, type Dossier, type PartiePrenanteEntry } from "@/data/mockData";
import { CATEGORIES_ACTES, TYPES_ACTE } from "@/data/constants";
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
import { workflowTemplates, WORKFLOW_PALETTE, type WorkflowConfig, type WorkflowStep } from "@/components/workflow/workflow-types";
import { useDossierTabs } from "@/context/DossierTabsContext";
import { useActeSteps } from "@/context/ActeStepsContext";

const categoriesActes = CATEGORIES_ACTES;
const statuts: Dossier["statut"][] = ["En cours", "En signature", "En attente pièces", "Terminé", "Suspendu", "Archivé"];
const priorites: Dossier["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];

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
  const [dossiers, setDossiers] = useState<Dossier[]>(mockDossiers);

  useEffect(() => {
    let cancelled = false;
    dossierService.getAll(0, 100).then(page => {
      if (!cancelled && page.content.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDossiers(page.content.map(normalizeDossier) as any);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");
  const [filterTypeActe, setFilterTypeActe] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { openTabs, activeTabId, setActiveTabId, openTab, closeTab, setTabDetailSubTab } = useDossierTabs();
  const { getSteps } = useActeSteps();

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
  const [clientSuggestions, setClientSuggestions] = useState<typeof mockClients>([]);

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

  // ═══ Workflows par dossier ═══
  const [dossierWorkflows, setDossierWorkflows] = useState<Record<string, WorkflowConfig>>({});

  const openDossierTab = (d: Dossier, tab: "details" | "workflow") => {
    openTab({ id: d.id, code: d.code, objet: d.objet }, tab);
  };

  const getWorkflow = (dossier: Dossier): WorkflowConfig | null => {
    const steps = getSteps(dossier.typeActe);
    const savedWf = dossierWorkflows[dossier.id];
    const templateWf = workflowTemplates[dossier.typeActe];

    const configSteps: WorkflowStep[] = steps.map((label, i) => {
      const key = label.toLowerCase().replace(/[\s/(),']+/g, "_").replace(/_+/g, "_");
      const savedStep = savedWf?.steps.find(s => s.key === key) ?? savedWf?.steps[i];
      const templateStep = templateWf?.steps[i] ?? templateWf?.steps.find(s => s.label === label);
      return {
        key,
        label,
        description: templateStep?.description ?? "",
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
    categorieActe: "", typeActe: "", objet: "", clients: "", montant: "", statut: "En cours" as Dossier["statut"],
    priorite: "Normale" as Dossier["priorite"], notaire: mockNotaires[0], clerc: "", notes: "",
  });

  const resetForm = useCallback(() => setForm({ categorieActe: "", typeActe: "", objet: "", clients: "", montant: "", statut: "En cours", priorite: "Normale", notaire: mockNotaires[0], clerc: "", notes: "" }), []);

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
    enCours: dossiers.filter(d => d.statut === "En cours").length,
    enSignature: dossiers.filter(d => d.statut === "En signature").length,
    enAttente: dossiers.filter(d => d.statut === "En attente pièces").length,
    termines: dossiers.filter(d => d.statut === "Terminé").length,
    totalMontant: dossiers.reduce((s, d) => s + d.montant, 0),
  }), [dossiers]);

  const handleCreate = useCallback(async () => {
    if (!form.typeActe?.trim()) {
      toast.error(fr ? "Le type d'acte est obligatoire." : "Deed type is required.");
      return;
    }
    if (!form.clients?.trim()) {
      toast.error(fr ? "Le ou les clients sont obligatoires." : "At least one client is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const clientNames = form.clients.split(",").map(c => c.trim()).filter(Boolean);
      const newDossier: Dossier = {
        id: String(Date.now()),
        code: `N-2025-${(107 + dossiers.length).toString().padStart(3, "0")}`,
        typeActe: form.typeActe,
        objet: form.objet || form.typeActe,
        clients: clientNames,
        clientDate: new Date().toLocaleDateString("fr-FR"),
        montant: Number(form.montant) || 0,
        statut: form.statut,
        priorite: form.priorite,
        avancement: 0,
        nbActes: 0,
        nbPieces: 0,
        date: new Date().toISOString().slice(0, 10),
        notaire: form.notaire,
        clerc: form.clerc || undefined,
        parties: [],
      };
      setDossiers(prev => [newDossier, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast.success(fr ? "Dossier créé avec succès" : "Case created successfully");
      announce(fr ? "Dossier créé" : "Case created");
      // Sync with backend (fire-and-forget, UI already updated)
      dossierService.create({
        typeActe: form.typeActe,
        objet: form.objet || form.typeActe,
        montant: Number(form.montant) || 0,
      }).then(created => {
        // Replace the optimistic entry with the real one from the server
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDossiers(prev => [normalizeDossier(created) as any, ...prev.slice(1)]);
      }).catch(() => {/* keep optimistic entry */});
    } catch (err) {
      toast.error(fr ? "Erreur lors de la création" : "Error creating case");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, fr, dossiers.length, announce, resetForm]);

  const handleEdit = useCallback(() => {
    if (!editingDossier) return;
    setDossiers(prev => prev.map(d => d.id === editingDossier.id ? {
      ...editingDossier,
      typeActe: form.typeActe || editingDossier.typeActe,
      objet: form.objet || editingDossier.objet,
      clients: form.clients ? form.clients.split(",").map(c => c.trim()).filter(Boolean) : editingDossier.clients,
      montant: form.montant ? Number(form.montant) : editingDossier.montant,
      statut: form.statut,
      priorite: form.priorite,
      notaire: form.notaire || editingDossier.notaire,
      clerc: form.clerc || undefined,
    } : d));
    setShowEditModal(false);
    toast.success(fr ? "Dossier modifié avec succès" : "Case updated successfully");
  }, [editingDossier, form, fr]);

  const handleDelete = useCallback(() => {
    if (!editingDossier) return;
    try {
      setDossiers(prev => prev.filter(d => d.id !== editingDossier.id));
      setShowDeleteDialog(false);
      const deletedId = editingDossier.id;
      setEditingDossier(null);
      toast.success(fr ? "Dossier supprimé" : "Case deleted");
      announce(fr ? "Dossier supprimé" : "Case deleted");
      // Sync with backend (fire-and-forget, UI already updated)
      const numericId = Number(deletedId);
      if (!isNaN(numericId)) {
        dossierService.delete(numericId).catch(() => {/* silent */});
      }
    } catch (err) {
      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting case");
      console.error(err);
    }
  }, [editingDossier, fr, announce]);

  const handleArchive = useCallback((d: Dossier) => {
    setDossiers(prev => prev.map(dos => dos.id === d.id ? { ...dos, statut: "Archivé" as Dossier["statut"] } : dos));
    toast.success(fr ? `Dossier ${d.code} archivé` : `Case ${d.code} archived`);
    announce(fr ? "Dossier archivé" : "Case archived");
    // Sync with backend (fire-and-forget, UI already updated)
    const numericId = Number(d.id);
    if (!isNaN(numericId)) {
      dossierService.changeStatut(numericId, "ARCHIVE").catch(() => {/* silent */});
    }
  }, [fr, announce]);

  const openEdit = useCallback((d: Dossier) => {
    setEditingDossier(d);
    const cat = categoriesActes.find(c => c.actes.includes(d.typeActe));
    setForm({
      categorieActe: cat?.label || "", typeActe: d.typeActe, objet: d.objet, clients: d.clients.join(", "),
      montant: String(d.montant), statut: d.statut, priorite: d.priorite,
      notaire: d.notaire, clerc: d.clerc || "", notes: "",
    });
    setShowEditModal(true);
  }, []);

  const openDelete = useCallback((d: Dossier) => {
    setEditingDossier(d);
    setShowDeleteDialog(true);
  }, []);

  // Parties prenantes
  const openPartiesModal = (d: Dossier) => {
    setPartiesDossier(d);
    setPartiesList(d.parties || []);
    setNewPartie({ clientSearch: "", role: "Acheteur" });
    setClientSuggestions([]);
    setShowPartiesModal(true);
  };

  const searchClients = (query: string) => {
    setNewPartie(p => ({ ...p, clientSearch: query }));
    if (query.length < 2) { setClientSuggestions([]); return; }
    const q = query.toLowerCase();
    setClientSuggestions(mockClients.filter(c =>
      c.code.toLowerCase().includes(q) || c.nom.toLowerCase().includes(q) || c.prenom.toLowerCase().includes(q)
    ).slice(0, 5));
  };

  const addPartie = (client: typeof mockClients[0]) => {
    if (partiesList.some(p => p.clientCode === client.code)) {
      toast.error(fr ? "Ce client est déjà associé" : "This client is already linked");
      return;
    }
    setPartiesList(prev => [...prev, {
      clientCode: client.code,
      nom: `${client.nom} ${client.prenom}`.trim(),
      role: newPartie.role,
    }]);
    setNewPartie({ clientSearch: "", role: "Acheteur" });
    setClientSuggestions([]);
  };

  const removePartie = (code: string) => {
    setPartiesList(prev => prev.filter(p => p.clientCode !== code));
  };

  const saveParties = () => {
    if (!partiesDossier) return;
    setDossiers(prev => prev.map(d => d.id === partiesDossier.id ? {
      ...d,
      parties: partiesList,
      clients: partiesList.map(p => p.nom),
    } : d));
    if (selectedDossier?.id === partiesDossier.id) {
      // selectedDossier is derived from dossiers state; updating dossiers above is sufficient
    }
    setShowPartiesModal(false);
    toast.success(fr ? "Parties prenantes mises à jour" : "Stakeholders updated");
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
                <div className="space-y-4">
                  {[
                    { label: fr ? "Code dossier" : "Case code", value: selectedDossier.code },
                    { label: fr ? "Type d'acte" : "Deed type", value: selectedDossier.typeActe },
                    { label: fr ? "Objet" : "Subject", value: selectedDossier.objet },
                    { label: "Client(s)", value: selectedDossier.clients.join(", ") },
                    { label: fr ? "Notaire responsable" : "Responsible notary", value: selectedDossier.notaire },
                    ...(selectedDossier.clerc ? [{ label: fr ? "Clerc" : "Clerk", value: selectedDossier.clerc }] : []),
                    { label: fr ? "Date de création" : "Creation date", value: new Date(selectedDossier.date).toLocaleDateString(fr ? "fr-FR" : "en-US") },
                    { label: fr ? "Montant" : "Amount", value: formatGNF(selectedDossier.montant) },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                    </div>
                  ))}
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
                    <p className="text-sm font-medium text-foreground">{(selectedDossier.parties || []).length} {fr ? "partie(s) prenante(s)" : "stakeholder(s)"}</p>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                      <UserPlus className="h-3.5 w-3.5" /> {fr ? "Associer parties" : "Link stakeholders"}
                    </Button>
                  </div>
                  {(selectedDossier.parties || []).length > 0 ? (selectedDossier.parties || []).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">{p.nom.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{p.nom}</p>
                        <p className="text-xs text-muted-foreground">{p.clientCode} · {p.role}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{p.role}</span>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{fr ? "Aucune partie prenante associée" : "No stakeholders linked"}</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                        <UserPlus className="h-4 w-4" /> {fr ? "Associer des parties" : "Link stakeholders"}
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
                              {p.nom.charAt(0)}
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
                          {selectedDossier.notaire.charAt(0)}
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{selectedDossier.nbActes} {fr ? "acte(s)" : "deed(s)"}</p>
                    <Button variant="outline" size="sm" className="text-xs gap-1"><Plus className="h-3.5 w-3.5" />{fr ? "Ajouter un acte" : "Add deed"}</Button>
                  </div>
                  {selectedDossier.nbActes > 0 ? Array.from({ length: selectedDossier.nbActes }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{fr ? "Acte" : "Deed"} {i + 1} — {selectedDossier.typeActe}</p>
                        <p className="text-xs text-muted-foreground">{fr ? "Créé le" : "Created on"} {selectedDossier.clientDate}</p>
                      </div>
                      <StatusBadge status={i === 0 ? (fr ? "En cours" : "In progress") : (fr ? "Terminé" : "Completed")} />
                    </div>
                  )) : <div className="text-center py-8 text-muted-foreground text-sm">{fr ? "Aucun acte créé" : "No deeds created"}</div>}
                </div>
              )}
              {detailTab === "pieces" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{(dossierPieces[selectedDossier.id]?.length ?? selectedDossier.nbPieces)} {fr ? "pièce(s)" : "document(s)"}</p>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => pieceInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" />{fr ? "Importer" : "Import"}
                    </Button>
                  </div>
                  <input ref={pieceInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handlePieceImport} />
                  {(dossierPieces[selectedDossier.id]?.length ?? 0) > 0 ? dossierPieces[selectedDossier.id].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nom}</p>
                        <p className="text-xs text-muted-foreground">{p.date} · {p.taille}</p>
                      </div>
                    </div>
                  )) : selectedDossier.nbPieces > 0 ? Array.from({ length: selectedDossier.nbPieces }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{fr ? "Pièce" : "Document"} {i + 1}</p>
                        <p className="text-xs text-muted-foreground">{fr ? "Ajoutée le" : "Added on"} {selectedDossier.clientDate}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{fr ? "Aucune pièce jointe" : "No documents attached"}</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => pieceInputRef.current?.click()}>
                        <Upload className="h-4 w-4" />{fr ? "Importer une pièce" : "Import a document"}
                      </Button>
                    </div>
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
                <div className="space-y-3">
                  {[
                    { action: fr ? "Dossier créé" : "Case created", date: selectedDossier.clientDate, user: selectedDossier.notaire },
                    { action: fr ? "Pièces ajoutées" : "Documents added", date: selectedDossier.clientDate, user: "Aïssatou Conté" },
                    { action: fr ? "Parties associées" : "Stakeholders linked", date: selectedDossier.clientDate, user: selectedDossier.notaire },
                    { action: (fr ? "Statut modifié → " : "Status changed → ") + selectedDossier.statut, date: new Date().toLocaleDateString(fr ? "fr-FR" : "en-US"), user: selectedDossier.notaire },
                  ].map((h, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{h.action}</p>
                        <p className="text-xs text-muted-foreground">{h.date} · {h.user}</p>
                      </div>
                    </div>
                  ))}
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
              <Select value={form.categorieActe} onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner une catégorie" : "Select a category"} /></SelectTrigger>
                <SelectContent>
                  {categoriesActes.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.categorieActe && (
              <div className="space-y-2">
                <Label>{fr ? "Acte spécifique *" : "Specific act *"}</Label>
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un acte" : "Select an act"} /></SelectTrigger>
                  <SelectContent>
                    {(categoriesActes.find(c => c.label === form.categorieActe)?.actes ?? []).map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF)" : "Amount (GNF)"}</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Notaire responsable *" : "Responsible notary *"}</Label>
                <Select value={form.notaire} onValueChange={v => setForm(f => ({ ...f, notaire: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{mockNotaires.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Clerc en charge" : "Clerk in charge"}</Label>
              <Select value={form.clerc || "__none__"} onValueChange={v => setForm(f => ({ ...f, clerc: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "— Aucun —" : "— None —"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{fr ? "— Aucun —" : "— None —"}</SelectItem>
                  {mockClercs.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
              <Select value={form.categorieActe} onValueChange={v => setForm(f => ({ ...f, categorieActe: v, typeActe: "" }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner une catégorie" : "Select a category"} /></SelectTrigger>
                <SelectContent>
                  {categoriesActes.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.categorieActe && (
              <div className="space-y-2">
                <Label>{fr ? "Acte spécifique" : "Specific act"}</Label>
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un acte" : "Select an act"} /></SelectTrigger>
                  <SelectContent>
                    {(categoriesActes.find(c => c.label === form.categorieActe)?.actes ?? []).map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF)" : "Amount (GNF)"}</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Priorité" : "Priority"}</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                <Select value={form.notaire} onValueChange={v => setForm(f => ({ ...f, notaire: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{mockNotaires.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Clerc en charge" : "Clerk in charge"}</Label>
                <Select value={form.clerc || "__none__"} onValueChange={v => setForm(f => ({ ...f, clerc: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "— Aucun —" : "— None —"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{fr ? "— Aucun —" : "— None —"}</SelectItem>
                    {mockClercs.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                          <span className="text-xs font-mono text-primary">{c.code}</span>
                          <span className="text-sm text-foreground">{c.nom} {c.prenom}</span>
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
