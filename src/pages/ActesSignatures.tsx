// ═══════════════════════════════════════════════════════════════
// Page Actes notariés — CRUD complet branché API
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, FileText, PenLine, CheckCircle2, DollarSign,
  MoreHorizontal, Trash2, GripVertical, Save,
  ChevronDown, ChevronRight, Edit2, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, searchMatch } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { typeActeService, type TypeActeDto } from "@/services/dossierService";

// ── Types locaux ─────────────────────────────────────────────────

interface WorkflowStep {
  key: string;
  label: string;
  description?: string;
  dureeEstimeeJours?: number;
  obligatoire?: boolean;
  // Champs requis par le WorkflowEngine backend
  icon?: string;
  time?: string;
  button?: { label: string; actionId: string };
}

// Extrait le JSON workflow d'un TypeActeDto (camelCase ou snake_case)
function getWorkflowJson(t: TypeActeDto): string | object | undefined {
  return t.workflowConfigJson ?? t.workflow_config_json;
}

// Parse le workflowConfigJson du backend (string JSON ou objet déjà parsé)
function parseWorkflowSteps(json?: string | object | null): WorkflowStep[] {
  if (!json) return [];
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    // Supporte { steps: [...] } ou [...] directement
    const steps = Array.isArray(parsed) ? parsed : (parsed as { steps?: WorkflowStep[] }).steps ?? [];
    return steps.map((s: WorkflowStep | string, i: number) =>
      typeof s === "string"
        ? { key: `step_${i}`, label: s }
        : { key: s.key ?? `step_${i}`, label: s.label ?? String(s), description: s.description, dureeEstimeeJours: s.dureeEstimeeJours, icon: s.icon, time: s.time, button: s.button }
    );
  } catch {
    return [];
  }
}

// Sérialise les étapes en JSON complet pour le backend (WorkflowEngine valide layout + button)
function serializeWorkflowSteps(steps: WorkflowStep[]): string {
  const enriched = steps.map((s, i) => ({
    key: s.key,
    label: s.label.toUpperCase(),
    icon: s.icon ?? "file",
    time: s.time ?? (s.dureeEstimeeJours ? `${s.dureeEstimeeJours} j` : "1 j"),
    description: s.description ?? s.label,
    button: s.button ?? {
      label: i === 0 ? "DÉMARRER" : "VALIDER",
      actionId: `action_${s.key.toLowerCase()}`,
    },
    ...(i > 0 ? { conditions: { required: [steps[i - 1].key] } } : {}),
  }));
  return JSON.stringify({
    steps: enriched,
    layout: { type: "horizontal", width: Math.max(800, steps.length * 200), height: 300 },
    palette: ["#2E4057", "#2AA3D6", "#F4A300", "#28A89E", "#87BF3C", "#E74C3C"],
    version: "1.0",
  });
}

const PRIORITES = ["TRES_BASSE", "BASSE", "NORMALE", "HAUTE", "TRES_HAUTE", "URGENTE"] as const;

// Libellé affiché → code enum TypeActe attendu par le backend
const CATEGORIES: { label: string; value: string }[] = [
  { label: "Vente Immobilière",              value: "VENTE_IMMOBILIERE" },
  { label: "Bail Immobilier",                value: "BAIL_IMMOBILIER" },
  { label: "Donation Immobilière",           value: "DONATION_IMMOBILIERE" },
  { label: "Hypothèque",                     value: "HYPOTHEQUE" },
  { label: "Mainlevée d'Hypothèque",         value: "MAINLEVEE_HYPOTHEQUE" },
  { label: "Création de Société",            value: "CREATION_SOCIETE" },
  { label: "Modification de Statuts",        value: "MODIFICATION_STATUTS" },
  { label: "Dissolution de Société",         value: "DISSOLUTION_SOCIETE" },
  { label: "Cession de Parts Sociales",      value: "CESSION_PARTS_SOCIALES" },
  { label: "Augmentation de Capital",        value: "AUGMENTATION_CAPITAL" },
  { label: "Testament",                      value: "TESTAMENT" },
  { label: "Donation-Partage",               value: "DONATION_PARTAGE" },
  { label: "Contrat de Mariage",             value: "CONTRAT_MARIAGE" },
  { label: "Liquidation de Régime Matrimonial", value: "LIQUIDATION_REGIME" },
  { label: "Procuration",                    value: "PROCURATION" },
  { label: "Authentification de Signature",  value: "AUTHENTIFICATION" },
  { label: "Certification Conforme",         value: "CERTIFICATION_CONFORME" },
  { label: "Prêt / Reconnaissance de Dette", value: "PRET" },
  { label: "Inventaire",                     value: "INVENTAIRE" },
  { label: "Dépôt d'Acte",                  value: "DEPOT" },
  { label: "Contrat Divers",                 value: "CONTRAT_DIVERS" },
];

// ── Composant principal ───────────────────────────────────────────

export default function ActesSignatures() {
  const { lang } = useLanguage();
  const fr = lang === "FR";

  // ── State types d'actes ──────────────────────────────────────
  const [typeActes, setTypeActes] = useState<TypeActeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");

  // ── State modals ─────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [editingType, setEditingType] = useState<TypeActeDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TypeActeDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form création/édition ────────────────────────────────────
  const [form, setForm] = useState({
    nom: "",
    code: "",
    description: "",
    categorieReference: "",
    dureeEstimeeJours: "",
    niveauComplexite: "1",
    prioriteDefaut: "NORMALE" as typeof PRIORITES[number],
    necessiteSignatureElectronique: false,
    necessitePublication: false,
    actif: true,
  });

  // ── State workflow steps ─────────────────────────────────────
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [editingStep, setEditingStep] = useState<{ typeId: number; idx: number; label: string; description: string } | null>(null);
  const [addingStepFor, setAddingStepFor] = useState<number | null>(null);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const [savingWorkflow, setSavingWorkflow] = useState(false);

  // ── Chargement ───────────────────────────────────────────────
  const loadTypeActes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await typeActeService.getAll();
      setTypeActes(data);
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur chargement des types d'actes" : "Error loading act types");
    } finally {
      setLoading(false);
    }
  }, [fr]);

  useEffect(() => { loadTypeActes(); }, [loadTypeActes]);

  // ── Filtrage ─────────────────────────────────────────────────
  const filtered = typeActes.filter(t => {
    if (filterCategorie !== "all" && t.categorieReference !== filterCategorie) return false;
    if (search) return searchMatch(t.nom ?? "", search) || searchMatch(t.code ?? "", search) || searchMatch(t.description ?? "", search);
    return true;
  });

  // ── Initialiser défauts ──────────────────────────────────────
  const handleInitDefauts = async () => {
    try {
      setLoading(true);
      const items = await typeActeService.initialiserDefauts();
      setTypeActes(items);
      toast.success(fr ? "Types par défaut initialisés" : "Default act types initialized");
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur lors de l'initialisation" : "Error initializing defaults");
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Handlers ────────────────────────────────────────────

  const resetForm = () => setForm({
    nom: "", code: "", description: "", categorieReference: "",
    dureeEstimeeJours: "", niveauComplexite: "1",
    prioriteDefaut: "NORMALE", necessiteSignatureElectronique: false,
    necessitePublication: false, actif: true,
  });

  const handleCreate = async () => {
    if (!form.nom.trim()) {
      toast.error(fr ? "Le nom est obligatoire" : "Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: TypeActeDto = {
        nom: form.nom.trim(),
        code: form.code.trim() || form.nom.trim().toUpperCase().replace(/\s+/g, "_"),
        description: form.description || undefined,
        categorieReference: form.categorieReference as TypeActeDto["categorieReference"] || undefined,
        dureeEstimeeJours: form.dureeEstimeeJours ? Number(form.dureeEstimeeJours) : undefined,
        niveauComplexite: Number(form.niveauComplexite),
        prioriteDefaut: form.prioriteDefaut as TypeActeDto["prioriteDefaut"],
        necessiteSignatureElectronique: form.necessiteSignatureElectronique,
        necessitePublication: form.necessitePublication,
        actif: form.actif,
      };
      const created = await typeActeService.create(payload);
      setTypeActes(prev => [created, ...prev]);
      setShowCreate(false);
      resetForm();
      toast.success(fr ? "Type d'acte créé avec succès" : "Act type created successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : (fr ? "Erreur lors de la création" : "Error creating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (t: TypeActeDto) => {
    setEditingType(t);
    setForm({
      nom: t.nom ?? "",
      code: t.code ?? "",
      description: t.description ?? "",
      categorieReference: t.categorieReference ?? "",
      dureeEstimeeJours: t.dureeEstimeeJours ? String(t.dureeEstimeeJours) : "",
      niveauComplexite: String(t.niveauComplexite ?? 1),
      prioriteDefaut: t.prioriteDefaut ?? "NORMALE",
      necessiteSignatureElectronique: t.necessiteSignatureElectronique ?? false,
      necessitePublication: t.necessitePublication ?? false,
      actif: t.actif ?? true,
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editingType || !form.nom.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: TypeActeDto = {
        nom: form.nom.trim(),
        code: form.code.trim(),
        description: form.description || undefined,
        categorieReference: form.categorieReference as TypeActeDto["categorieReference"] || undefined,
        dureeEstimeeJours: form.dureeEstimeeJours ? Number(form.dureeEstimeeJours) : undefined,
        niveauComplexite: Number(form.niveauComplexite),
        prioriteDefaut: form.prioriteDefaut as TypeActeDto["prioriteDefaut"],
        necessiteSignatureElectronique: form.necessiteSignatureElectronique,
        necessitePublication: form.necessitePublication,
        actif: form.actif,
      };
      const updated = await typeActeService.update(Number(editingType.id), payload);
      setTypeActes(prev => prev.map(t => t.id === editingType.id ? updated : t));
      setShowEdit(false);
      setEditingType(null);
      toast.success(fr ? "Type d'acte modifié" : "Act type updated");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : (fr ? "Erreur lors de la modification" : "Error updating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActif = async (t: TypeActeDto) => {
    try {
      const updated = t.actif
        ? await typeActeService.desactiver(Number(t.id))
        : await typeActeService.activer(Number(t.id));
      setTypeActes(prev => prev.map(x => x.id === t.id ? updated : x));
      toast.success(t.actif
        ? (fr ? `« ${t.nom} » désactivé` : `"${t.nom}" deactivated`)
        : (fr ? `« ${t.nom} » activé` : `"${t.nom}" activated`)
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (fr ? "Erreur" : "Error"));
    }
  };

  const handleDelete = async (t: TypeActeDto) => {
    try {
      await typeActeService.delete(Number(t.id));
      setTypeActes(prev => prev.filter(x => x.id !== t.id));
      setConfirmDelete(null);
      toast.success(fr ? "Type d'acte supprimé" : "Act type deleted");
    } catch (err) {
      console.error(err);
      setConfirmDelete(null);
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("utilis") || msg.toLowerCase().includes("dossier")) {
        toast.error(fr
          ? `Impossible de supprimer « ${t.nom} » : ce type est utilisé par des dossiers. Désactivez-le plutôt.`
          : `Cannot delete "${t.nom}": this type is used by existing cases. Deactivate it instead.`
        );
      } else {
        toast.error(msg || (fr ? "Erreur lors de la suppression" : "Error deleting"));
      }
    }
  };

  // ── Workflow handlers ────────────────────────────────────────

  const openWorkflow = (t: TypeActeDto) => {
    setEditingType(t);
    setWorkflowSteps(parseWorkflowSteps(getWorkflowJson(t)));
    setShowWorkflow(true);
  };

  const saveWorkflow = async () => {
    if (!editingType) return;
    setSavingWorkflow(true);
    try {
      const json = serializeWorkflowSteps(workflowSteps);
      const updated = await typeActeService.configureWorkflow(Number(editingType.id), json);
      setTypeActes(prev => prev.map(t => t.id === editingType.id ? updated : t));
      setShowWorkflow(false);
      toast.success(fr ? "Workflow enregistré" : "Workflow saved");
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur lors de la sauvegarde du workflow" : "Error saving workflow");
    } finally {
      setSavingWorkflow(false);
    }
  };

  const addWorkflowStep = () => {
    if (!newStepLabel.trim()) return;
    const newStep: WorkflowStep = {
      key: `step_${Date.now()}`,
      label: newStepLabel.trim().toUpperCase(),
      description: newStepDescription.trim() || undefined,
    };
    setWorkflowSteps(prev => [...prev, newStep]);
    setNewStepLabel("");
    setNewStepDescription("");
  };

  const removeWorkflowStep = (idx: number) => {
    if (workflowSteps.length <= 1) {
      toast.warning(fr
        ? "Un type d'acte doit avoir au moins une étape. Si ce type n'est plus nécessaire, pensez à le supprimer."
        : "An act type must have at least one step. Consider deleting this act type if it's no longer needed."
      );
      return;
    }
    setWorkflowSteps(prev => prev.filter((_, i) => i !== idx));
  };

  const updateWorkflowStep = (idx: number, label: string, description: string) => {
    if (!label.trim()) return;
    setWorkflowSteps(prev => prev.map((s, i) => i === idx ? { ...s, label: label.trim().toUpperCase(), description: description.trim() || undefined } : s));
    setEditingStep(null);
  };

  const moveWorkflowStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= workflowSteps.length) return;
    const steps = [...workflowSteps];
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    setWorkflowSteps(steps);
  };

  // ── Inline workflow toggle dans la liste ─────────────────────

  const toggleExpand = (id: number) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // ── Inline step editing dans la liste ───────────────────────

  const handleInlineAddStep = async (t: TypeActeDto) => {
    if (!newStepLabel.trim() || addingStepFor !== t.id) return;
    const currentSteps = parseWorkflowSteps(getWorkflowJson(t));
    const newStep: WorkflowStep = {
      key: `step_${Date.now()}`,
      label: newStepLabel.trim().toUpperCase(),
      description: newStepDescription.trim() || undefined,
    };
    const updated = [...currentSteps, newStep];
    const json = serializeWorkflowSteps(updated);
    try {
      const result = await typeActeService.configureWorkflow(Number(t.id), json);
      setTypeActes(prev => prev.map(x => x.id === t.id ? result : x));
      setNewStepLabel("");
      setNewStepDescription("");
      setAddingStepFor(null);
      toast.success(fr ? "Étape ajoutée" : "Step added");
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur lors de l'ajout" : "Error adding step");
    }
  };

  const handleInlineDeleteStep = async (t: TypeActeDto, idx: number) => {
    const currentSteps = parseWorkflowSteps(getWorkflowJson(t));
    if (currentSteps.length <= 1) {
      toast.warning(fr
        ? "Un acte doit avoir au moins une étape. Si vous n'en avez plus besoin, pensez à supprimer ce type d'acte."
        : "An act type must have at least one step. Consider deleting this act type if it's no longer needed."
      );
      return;
    }
    const updated = currentSteps.filter((_, i) => i !== idx);
    const json = serializeWorkflowSteps(updated);
    try {
      const result = await typeActeService.configureWorkflow(Number(t.id), json);
      setTypeActes(prev => prev.map(x => x.id === t.id ? result : x));
      toast.success(fr ? "Étape supprimée" : "Step deleted");
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting step");
    }
  };

  const handleInlineUpdateStep = async (t: TypeActeDto, idx: number, label: string, description: string) => {
    if (!label.trim()) return;
    const currentSteps = parseWorkflowSteps(getWorkflowJson(t));
    const updated = currentSteps.map((s, i) => i === idx
      ? { ...s, label: label.trim().toUpperCase(), description: description.trim() || undefined }
      : s
    );
    const json = serializeWorkflowSteps(updated);
    try {
      const result = await typeActeService.configureWorkflow(Number(t.id), json);
      setTypeActes(prev => prev.map(x => x.id === t.id ? result : x));
      setEditingStep(null);
      toast.success(fr ? "Étape mise à jour" : "Step updated");
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur" : "Error");
    }
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {fr ? "Types d'actes notariés" : "Notarial Act Types"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fr
              ? "Configurez les types d'actes et leur workflow pour votre cabinet. Chaque dossier utilisera ces étapes."
              : "Configure act types and their workflow for your office. Each case will follow these steps."}
          </p>
        </div>
        <div className="flex gap-2">
          {typeActes.length === 0 && !loading && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleInitDefauts}>
              <RefreshCw className="h-4 w-4" />
              {fr ? "Initialiser les défauts" : "Initialize defaults"}
            </Button>
          )}
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2"
            onClick={() => { resetForm(); setShowCreate(true); }}
          >
            <Plus className="h-4 w-4" />
            {fr ? "Nouveau type d'acte" : "New act type"}
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: fr ? "Total types" : "Total types", value: typeActes.length, icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: fr ? "Actifs" : "Active", value: typeActes.filter(t => t.actif).length, icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { label: fr ? "Avec workflow" : "With workflow", value: typeActes.filter(t => parseWorkflowSteps(getWorkflowJson(t)).length > 0).length, icon: PenLine, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
          { label: fr ? "Dossiers créés" : "Cases created", value: typeActes.reduce((s, t) => s + (t.nombreDossiersTotal ?? 0), 0), icon: DollarSign, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn("rounded-xl border border-border p-4 flex items-center gap-3", kpi.bg)}>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0", kpi.iconBg)}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-heading text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={fr ? "Rechercher un type d'acte..." : "Search act type..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategorie} onValueChange={setFilterCategorie}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={fr ? "Toutes catégories" : "All categories"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr ? "Toutes catégories" : "All categories"}</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">{fr ? "Aucun type d'acte trouvé" : "No act types found"}</p>
          {typeActes.length === 0 && (
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={handleInitDefauts}>
              <RefreshCw className="h-4 w-4" />
              {fr ? "Initialiser les types par défaut" : "Initialize default types"}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const steps = parseWorkflowSteps(getWorkflowJson(t));
            const isExpanded = expandedTypes.has(Number(t.id));
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
              >
                {/* Type header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                  {/* Toggle steps */}
                  <button
                    onClick={() => toggleExpand(Number(t.id))}
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{t.nom}</span>
                        {t.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.code}</span>
                        )}
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          t.actif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          {t.actif ? (fr ? "Actif" : "Active") : (fr ? "Inactif" : "Inactive")}
                        </span>
                        {t.necessiteSignatureElectronique && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {fr ? "Signature élec." : "E-signature"}
                          </span>
                        )}
                      </div>
                      {t.categorieReference && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {CATEGORIES.find(c => c.value === t.categorieReference)?.label ?? t.categorieReference}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2 text-xs text-muted-foreground">
                      <span>{steps.length} {fr ? "étapes" : "steps"}</span>
                      {t.nombreDossiersTotal !== undefined && (
                        <span>{t.nombreDossiersTotal} {fr ? "dossiers" : "cases"}</span>
                      )}
                    </div>
                  </button>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openWorkflow(t)}>
                        <PenLine className="mr-2 h-4 w-4" />
                        {fr ? "Configurer workflow" : "Configure workflow"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        {fr ? "Modifier" : "Edit"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActif(t)}>
                        {t.actif
                          ? <><span className="mr-2 h-4 w-4 inline-flex items-center justify-center">⏸</span>{fr ? "Désactiver" : "Deactivate"}</>
                          : <><span className="mr-2 h-4 w-4 inline-flex items-center justify-center">▶</span>{fr ? "Activer" : "Activate"}</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setConfirmDelete(t)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {fr ? "Supprimer" : "Delete"}
                        {(t.nombreDossiersTotal ?? 0) > 0 && (
                          <span className="ml-1 text-[10px] text-muted-foreground">({fr ? "utilisé" : "in use"})</span>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Steps inline */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/5 px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {fr ? "Étapes du workflow" : "Workflow steps"}
                    </p>

                    {steps.length === 0 && (
                      <p className="text-xs text-muted-foreground italic px-1">
                        {fr ? "Aucune étape configurée" : "No steps configured"}
                      </p>
                    )}

                    {steps.map((step, si) => (
                      <div key={step.key} className="group/step rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors">
                        {editingStep?.typeId === Number(t.id) && editingStep.idx === si ? (
                          <div className="space-y-1">
                            <Input
                              className="h-6 text-xs uppercase"
                              value={editingStep.label}
                              autoFocus
                              onChange={e => setEditingStep({ ...editingStep, label: e.target.value.toUpperCase() })}
                              onKeyDown={e => { if (e.key === "Escape") setEditingStep(null); }}
                            />
                            <Input
                              className="h-6 text-xs"
                              placeholder={fr ? "Description (optionnelle)" : "Description (optional)"}
                              value={editingStep.description}
                              onChange={e => setEditingStep({ ...editingStep, description: e.target.value })}
                              onKeyDown={e => { if (e.key === "Enter") handleInlineUpdateStep(t, si, editingStep.label, editingStep.description); if (e.key === "Escape") setEditingStep(null); }}
                            />
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => handleInlineUpdateStep(t, si, editingStep.label, editingStep.description)}>OK</Button>
                              <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => setEditingStep(null)}>✕</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0 mt-0.5">{si + 1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-foreground tracking-wide">{step.label}</span>
                              {step.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{step.description}</p>}
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/step:opacity-100 transition-opacity shrink-0">
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingStep({ typeId: Number(t.id), idx: si, label: step.label, description: step.description ?? "" })}>
                                <Edit2 className="h-2.5 w-2.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive hover:text-destructive" onClick={() => handleInlineDeleteStep(t, si)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add step inline */}
                    {addingStepFor === Number(t.id) ? (
                      <div className="space-y-1 px-2 py-1">
                        <Input
                          className="h-6 text-xs uppercase"
                          placeholder={fr ? "Nom de l'étape..." : "Step name..."}
                          value={newStepLabel}
                          autoFocus
                          onChange={e => setNewStepLabel(e.target.value.toUpperCase())}
                          onKeyDown={e => { if (e.key === "Escape") { setAddingStepFor(null); setNewStepLabel(""); setNewStepDescription(""); } }}
                        />
                        <Input
                          className="h-6 text-xs"
                          placeholder={fr ? "Description (optionnelle)" : "Description (optional)"}
                          value={newStepDescription}
                          onChange={e => setNewStepDescription(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleInlineAddStep(t); if (e.key === "Escape") { setAddingStepFor(null); setNewStepLabel(""); setNewStepDescription(""); } }}
                        />
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleInlineAddStep(t)}>{fr ? "Ajouter" : "Add"}</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => { setAddingStepFor(null); setNewStepLabel(""); setNewStepDescription(""); }}>✕</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingStepFor(Number(t.id)); setNewStepLabel(""); }}
                        className="flex items-center gap-1.5 text-[11px] text-primary hover:bg-primary/5 w-full px-2 py-1 rounded transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {fr ? "Ajouter une étape" : "Add a step"}
                      </button>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => openWorkflow(t)}>
                        <PenLine className="h-3 w-3" />
                        {fr ? "Éditer le workflow complet" : "Edit full workflow"}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal Créer ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading">{fr ? "Nouveau type d'acte" : "New act type"}</DialogTitle>
            <DialogDescription>{fr ? "Créez un type d'acte personnalisé pour votre cabinet" : "Create a custom act type for your office"}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>{fr ? "Nom *" : "Name *"}</Label>
                  <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder={fr ? "Ex: Vente immobilière" : "E.g.: Real estate sale"} />
                </div>
                <div className="space-y-2">
                  <Label>{fr ? "Code" : "Code"}</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: VENTE_IMM" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>{fr ? "Durée estimée (jours)" : "Estimated duration (days)"}</Label>
                  <Input type="number" value={form.dureeEstimeeJours} onChange={e => setForm(f => ({ ...f, dureeEstimeeJours: e.target.value }))} placeholder="30" min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Catégorie de référence" : "Reference category"}</Label>
                <Select value={form.categorieReference} onValueChange={v => setForm(f => ({ ...f, categorieReference: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Description" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={fr ? "Description de l'acte..." : "Act description..."} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{fr ? "Priorité par défaut" : "Default priority"}</Label>
                  <Select value={form.prioriteDefaut} onValueChange={v => setForm(f => ({ ...f, prioriteDefaut: v as typeof PRIORITES[number] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{fr ? "Niveau complexité (1-5)" : "Complexity level (1-5)"}</Label>
                  <Input type="number" value={form.niveauComplexite} onChange={e => setForm(f => ({ ...f, niveauComplexite: e.target.value }))} min={1} max={5} />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { key: "actif", label: fr ? "Actif" : "Active" },
                  { key: "necessiteSignatureElectronique", label: fr ? "Nécessite signature électronique" : "Requires electronic signature" },
                  { key: "necessitePublication", label: fr ? "Nécessite publication" : "Requires publication" },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[opt.key as keyof typeof form] as boolean}
                      onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.nom.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {fr ? "Créer" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Modifier ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading">
              {fr ? "Modifier le type d'acte" : "Edit act type"} — <span className="text-primary">{editingType?.nom}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>{fr ? "Nom *" : "Name *"}</Label>
                  <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>{fr ? "Durée (jours)" : "Duration (days)"}</Label>
                  <Input type="number" value={form.dureeEstimeeJours} onChange={e => setForm(f => ({ ...f, dureeEstimeeJours: e.target.value }))} min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Catégorie de référence" : "Reference category"}</Label>
                <Select value={form.categorieReference} onValueChange={v => setForm(f => ({ ...f, categorieReference: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Description" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{fr ? "Priorité par défaut" : "Default priority"}</Label>
                  <Select value={form.prioriteDefaut} onValueChange={v => setForm(f => ({ ...f, prioriteDefaut: v as typeof PRIORITES[number] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{fr ? "Complexité (1-5)" : "Complexity (1-5)"}</Label>
                  <Input type="number" value={form.niveauComplexite} onChange={e => setForm(f => ({ ...f, niveauComplexite: e.target.value }))} min={1} max={5} />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { key: "actif", label: fr ? "Actif" : "Active" },
                  { key: "necessiteSignatureElectronique", label: fr ? "Nécessite signature électronique" : "Requires electronic signature" },
                  { key: "necessitePublication", label: fr ? "Nécessite publication" : "Requires publication" },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[opt.key as keyof typeof form] as boolean}
                      onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowEdit(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEdit} disabled={isSubmitting || !form.nom.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {fr ? "Enregistrer" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Workflow complet ── */}
      <Dialog open={showWorkflow} onOpenChange={setShowWorkflow}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading">
              {fr ? "Workflow" : "Workflow"} — <span className="text-primary">{editingType?.nom}</span>
            </DialogTitle>
            <DialogDescription>
              {fr
                ? "Définissez les étapes que chaque dossier de ce type devra suivre."
                : "Define the steps each case of this type must follow."}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="space-y-2 py-2">
              {workflowSteps.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  {fr
                    ? "⚠️ Un type d'acte doit avoir au moins une étape. Si ce type n'est plus nécessaire, pensez à le supprimer."
                    : "⚠️ An act type must have at least one step. Consider deleting this act type if it's no longer needed."}
                </div>
              )}
              {workflowSteps.map((step, i) => (
                <div key={step.key} className="group rounded-lg border border-border px-3 py-2 bg-muted/10">
                  {editingStep?.typeId === -1 && editingStep.idx === i ? (
                    <div className="space-y-2">
                      <Input
                        className="h-7 text-sm uppercase"
                        value={editingStep.label}
                        autoFocus
                        onChange={e => setEditingStep({ ...editingStep, label: e.target.value.toUpperCase() })}
                        onKeyDown={e => { if (e.key === "Escape") setEditingStep(null); }}
                      />
                      <Input
                        className="h-7 text-sm"
                        placeholder={fr ? "Description (optionnelle)" : "Description (optional)"}
                        value={editingStep.description}
                        onChange={e => setEditingStep({ ...editingStep, description: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") updateWorkflowStep(i, editingStep.label, editingStep.description); if (e.key === "Escape") setEditingStep(null); }}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => updateWorkflowStep(i, editingStep.label, editingStep.description)}>OK</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingStep(null)}>✕</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{step.label}</span>
                        {step.description && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0} onClick={() => moveWorkflowStep(i, -1)}>
                          <ChevronRight className="h-3 w-3 -rotate-90" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === workflowSteps.length - 1} onClick={() => moveWorkflowStep(i, 1)}>
                          <ChevronRight className="h-3 w-3 rotate-90" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingStep({ typeId: -1, idx: i, label: step.label, description: step.description ?? "" })}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeWorkflowStep(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* Add step */}
              <div className="space-y-2 mt-2 pt-2 border-t border-border">
                <Input
                  className="h-8 text-sm uppercase"
                  placeholder={fr ? "Nom de l'étape (ex: SIGNATURE)" : "Step name (e.g.: SIGNATURE)"}
                  value={newStepLabel}
                  onChange={e => setNewStepLabel(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") addWorkflowStep(); }}
                />
                <Input
                  className="h-8 text-sm"
                  placeholder={fr ? "Description de l'étape (optionnelle)" : "Step description (optional)"}
                  value={newStepDescription}
                  onChange={e => setNewStepDescription(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addWorkflowStep(); }}
                />
                <Button size="sm" onClick={addWorkflowStep} disabled={!newStepLabel.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> {fr ? "Ajouter" : "Add"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowWorkflow(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={saveWorkflow} disabled={savingWorkflow}>
              {savingWorkflow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {fr ? "Enregistrer le workflow" : "Save workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete ── */}
      <Dialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">
              {fr ? "Supprimer ce type d'acte ?" : "Delete this act type?"}
            </DialogTitle>
            <DialogDescription>
              {fr
                ? `Le type « ${confirmDelete?.nom} » sera définitivement supprimé. Cette action est irréversible.`
                : `The type "${confirmDelete?.nom}" will be permanently deleted. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              {fr ? "Supprimer" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}