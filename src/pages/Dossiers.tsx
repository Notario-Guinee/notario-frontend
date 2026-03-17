// ═══════════════════════════════════════════════════════════════
// Page Dossiers — Gestion complète des dossiers notariaux
// Inclut : liste/grille, CRUD, détail tiroir avec workflow,
// gestion des parties prenantes, filtres, export CSV/PDF
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import { searchMatch } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";
import { FocusTrap } from "@/components/ui/focus-trap";
import { Plus, Download, Search, FolderOpen, Clock, PenLine, CheckCircle2, DollarSign, MoreHorizontal, X, Trash2, Edit, Eye, Share2, FileText, List, LayoutGrid, Archive, Receipt, UserPlus, Users, FileDown, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { mockDossiers, mockClients, formatGNF, rolesParties, currentUser, type Dossier, type PartiePrenanteEntry } from "@/data/mockData";
import { TYPES_ACTE } from "@/data/constants";
import { motion, AnimatePresence } from "framer-motion";
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

const typesActe = TYPES_ACTE;
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
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");
  const [filterTypeActe, setFilterTypeActe] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [drawerTab, setDrawerTab] = useState("details");
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

  // Form state
  const [form, setForm] = useState({
    typeActe: "", objet: "", clients: "", montant: "", statut: "En cours" as Dossier["statut"],
    priorite: "Normale" as Dossier["priorite"], notaire: "Maître Notario", notes: "",
  });

  const resetForm = useCallback(() => setForm({ typeActe: "", objet: "", clients: "", montant: "", statut: "En cours", priorite: "Normale", notaire: "Maître Notario", notes: "" }), []);

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

  const handleCreate = useCallback(() => {
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
        parties: [],
      };
      setDossiers(prev => [newDossier, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast.success(fr ? "Dossier créé avec succès" : "Case created successfully");
      announce(fr ? "Dossier créé" : "Case created");
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
    } : d));
    setShowEditModal(false);
    setSelectedDossier(null);
    toast.success(fr ? "Dossier modifié avec succès" : "Case updated successfully");
  }, [editingDossier, form, fr]);

  const handleDelete = useCallback(() => {
    if (!editingDossier) return;
    try {
      setDossiers(prev => prev.filter(d => d.id !== editingDossier.id));
      setShowDeleteDialog(false);
      setSelectedDossier(null);
      setEditingDossier(null);
      toast.success(fr ? "Dossier supprimé" : "Case deleted");
      announce(fr ? "Dossier supprimé" : "Case deleted");
    } catch (err) {
      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting case");
      console.error(err);
    }
  }, [editingDossier, fr, announce]);

  const handleArchive = useCallback((d: Dossier) => {
    setDossiers(prev => prev.map(dos => dos.id === d.id ? { ...dos, statut: "Archivé" as Dossier["statut"] } : dos));
    toast.success(fr ? `Dossier ${d.code} archivé` : `Case ${d.code} archived`);
    announce(fr ? "Dossier archivé" : "Case archived");
  }, [fr, announce]);

  const openEdit = useCallback((d: Dossier) => {
    setEditingDossier(d);
    setForm({
      typeActe: d.typeActe, objet: d.objet, clients: d.clients.join(", "),
      montant: String(d.montant), statut: d.statut, priorite: d.priorite,
      notaire: d.notaire, notes: "",
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
      setSelectedDossier(prev => prev ? { ...prev, parties: partiesList, clients: partiesList.map(p => p.nom) } : null);
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
            {typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                      <span className="text-sm font-mono font-medium text-primary cursor-pointer hover:underline" onClick={() => { setSelectedDossier(d); setDrawerTab("details"); }}>
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
                        <p className="text-xs text-muted-foreground">{d.nbActes} {fr ? "actes" : "deeds"}, {d.nbPieces} {fr ? "pièces" : "documents"}</p>
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
                          <DropdownMenuItem onClick={() => { setSelectedDossier(d); setDrawerTab("details"); }}><Eye className="mr-2 h-4 w-4" /> {fr ? "Voir détails" : "View details"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(d)}><Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPartiesModal(d)}><UserPlus className="mr-2 h-4 w-4" /> {fr ? "Associer parties" : "Link stakeholders"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openFactureModal(d)}><Receipt className="mr-2 h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}</DropdownMenuItem>
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
              onClick={() => { setSelectedDossier(d); setDrawerTab("details"); }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-mono font-medium text-primary">{d.code}</span>
                <StatusBadge status={d.statut} />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{d.objet}</h3>
              <p className="text-xs text-muted-foreground mb-1">{d.typeActe}</p>
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
                     <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(d); }}>{fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openPartiesModal(d); }}>{fr ? "Associer parties" : "Link stakeholders"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); openFactureModal(d); }}>{fr ? "Générer facture" : "Generate invoice"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); handleArchive(d); }}>{fr ? "Archiver" : "Archive"}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); openDelete(d); }}>{fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
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

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedDossier && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedDossier(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl border-l border-border bg-card shadow-2xl overflow-y-auto scrollbar-thin">
              <FocusTrap active={!!selectedDossier}>
              <div className="p-6">
                {/* Drawer Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono font-medium text-primary">{selectedDossier.code}</span>
                      <StatusBadge status={selectedDossier.statut} />
                      <StatusBadge status={selectedDossier.priorite} showIcon />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-foreground">{selectedDossier.objet}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedDossier.typeActe} · {selectedDossier.notaire}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => openEdit(selectedDossier)}>
                       <Edit className="mr-1 h-3.5 w-3.5" /> {fr ? "Modifier" : "Edit"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" aria-label={fr ? "Supprimer le dossier" : "Delete case"} onClick={() => openDelete(selectedDossier)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <button aria-label={fr ? "Fermer" : "Close"} onClick={() => setSelectedDossier(null)} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border">
                   <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{fr ? "Avancement global" : "Overall progress"}</span>
                    <span className="text-sm font-bold text-foreground">{selectedDossier.avancement}%</span>
                  </div>
                  <ProgressBar value={selectedDossier.avancement} />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg bg-muted p-1 mb-6 overflow-x-auto">
                  {[
                    { key: "details", label: fr ? "Détails" : "Details" },
                    { key: "parties", label: fr ? "Parties" : "Stakeholders" },
                    { key: "actes", label: fr ? "Actes & Pièces" : "Deeds & Docs" },
                    { key: "finances", label: fr ? "Finances" : "Finances" },
                    { key: "historique", label: fr ? "Historique" : "History" },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
                      className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${drawerTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div key={drawerTab}>
                    {drawerTab === "details" && (
                      <div className="space-y-4">
                        {[
                          { label: fr ? "Code dossier" : "Case code", value: selectedDossier.code },
                          { label: fr ? "Type d'acte" : "Deed type", value: selectedDossier.typeActe },
                          { label: fr ? "Objet" : "Subject", value: selectedDossier.objet },
                          { label: "Client(s)", value: selectedDossier.clients.join(", ") },
                          { label: fr ? "Notaire" : "Notary", value: selectedDossier.notaire },
                          { label: fr ? "Date de création" : "Creation date", value: new Date(selectedDossier.date).toLocaleDateString(fr ? "fr-FR" : "en-US") },
                          { label: fr ? "Montant" : "Amount", value: formatGNF(selectedDossier.montant) },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
                          </div>
                        ))}

                        {/* ═══ Section commentaires du dossier ═══ */}
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
                            <Input
                              value={newComment}
                              onChange={e => setNewComment(e.target.value)}
                              placeholder={fr ? "Ex: En attente de la pièce d'identité du vendeur..." : "E.g.: Waiting for seller's ID document..."}
                              className="flex-1"
                              onKeyDown={e => e.key === "Enter" && addComment(selectedDossier.id)}
                            />
                            <Button size="sm" onClick={() => addComment(selectedDossier.id)} disabled={!newComment.trim()}>
                              {fr ? "Ajouter" : "Add"}
                            </Button>
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

                    {drawerTab === "parties" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">{(selectedDossier.parties || []).length} {fr ? "partie(s) prenante(s)" : "stakeholder(s)"}</p>
                          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => openPartiesModal(selectedDossier)}>
                            <UserPlus className="h-3.5 w-3.5" /> {fr ? "Associer parties" : "Link stakeholders"}
                          </Button>
                        </div>
                        {(selectedDossier.parties || []).length > 0 ? (selectedDossier.parties || []).map((p, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {p.nom.charAt(0)}
                            </div>
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

                    {drawerTab === "actes" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">{selectedDossier.nbActes} {fr ? "acte(s)" : "deed(s)"} · {selectedDossier.nbPieces} {fr ? "pièce(s)" : "document(s)"}</p>
                          <Button variant="outline" size="sm" className="text-xs">{fr ? "+ Ajouter pièce" : "+ Add document"}</Button>
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
                        )) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">{fr ? "Aucun acte créé" : "No deeds created"}</div>
                        )}
                      </div>
                    )}

                    {drawerTab === "finances" && (
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
                          <p className="text-lg font-bold text-destructive font-mono">
                            {formatGNF(selectedDossier.montant - Math.round(selectedDossier.montant * selectedDossier.avancement / 100))}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => openFactureModal(selectedDossier)}>
                          <Receipt className="h-4 w-4" /> {fr ? "Générer une facture" : "Generate an invoice"}
                        </Button>
                      </div>
                    )}

                    {drawerTab === "historique" && (
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
              </FocusTrap>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouveau dossier" : "New Case"}</DialogTitle>
            <DialogDescription>{fr ? "Remplissez les informations pour créer un nouveau dossier" : "Fill in the information to create a new case"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Type d'acte *" : "Deed type *"}</Label>
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner" : "Select"} /></SelectTrigger>
                  <SelectContent>{typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Priorité" : "Priority"}</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
                <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                <Input value={form.notaire} onChange={e => setForm(f => ({ ...f, notaire: e.target.value }))} />
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Type d'acte" : "Deed type"}</Label>
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Statut" : "Status"}</Label>
                <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v as Dossier["statut"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
