// ═══════════════════════════════════════════════════════════════
// Page Actes notariés — Gestion des actes et catalogue personnalisable
// Inclut : liste avec workflow procédural, et catalogue des types
// d'actes personnalisables par catégorie (ajout/renommage/suppression)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Plus, Search, FileText, PenLine, CheckCircle2, DollarSign, Eye, X, MoreHorizontal, Receipt, Settings2, Trash2, GripVertical, Save, FolderPlus, ChevronDown, ChevronRight, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, searchMatch } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatGNF, mockDossiers } from "@/data/mockData";
import WorkflowProcedural from "@/components/workflow/WorkflowProcedural";
import { workflowTemplates, type WorkflowConfig } from "@/components/workflow/workflow-types";
import { useLanguage } from "@/context/LanguageContext";
import { type CategorieActe } from "@/data/constants";
import { useActeSteps } from "@/context/ActeStepsContext";
import { typeActeService } from "@/services/typeActeService";
import { categorieActeService, type CategorieActeDto } from "@/services/categorieActeService";
import type { TypeActeDto } from "@/services/typeActeService";

interface Acte {
  id: string;
  ref: string;
  dossier: string;
  dateDossier: string;
  type: string;
  etat: "Brouillon" | "En signature" | "Signé" | "Annulé";
  signataires: { nom: string; signe: boolean }[];
  montant: number;
  workflow?: WorkflowConfig;
}

const initialActes: Acte[] = [
  {
    id: "1", ref: "A-8842", dossier: "N-2025-101", dateDossier: "15/08/2024", type: "Vente immobilière", etat: "En signature",
    signataires: [{ nom: "Bah Oumar", signe: true }, { nom: "Fam. Diallo", signe: false }], montant: 3200000,
    workflow: {
      ...workflowTemplates["Vente immobilière"],
      steps: workflowTemplates["Vente immobilière"].steps.map((s, i) =>
        i < 2
          ? { ...s, status: "completed" as const, startedAt: new Date(Date.now() - (12 - i * 5) * 86400000).toISOString(), completedAt: new Date(Date.now() - (7 - i * 5) * 86400000).toISOString() }
          : i === 2
            ? { ...s, status: "active" as const, startedAt: new Date(Date.now() - 2 * 86400000).toISOString() }
            : s
      ),
    },
  },
  {
    id: "2", ref: "A-8843", dossier: "N-2025-103", dateDossier: "12/08/2024", type: "Création de société (statuts)", etat: "En signature",
    signataires: [{ nom: "SARL Nimba", signe: true }, { nom: "Diallo M.", signe: false }], montant: 200000,
    workflow: workflowTemplates["Constitution société"] ? {
      ...workflowTemplates["Constitution société"],
      steps: workflowTemplates["Constitution société"].steps.map((s, i) =>
        i < 3
          ? { ...s, status: "completed" as const, startedAt: new Date(Date.now() - (15 - i * 4) * 86400000).toISOString(), completedAt: new Date(Date.now() - (11 - i * 4) * 86400000).toISOString() }
          : i === 3
            ? { ...s, status: "active" as const, startedAt: new Date(Date.now() - 1 * 86400000).toISOString() }
            : s
      ),
    } : undefined,
  },
  {
    id: "3", ref: "A-8844", dossier: "N-2025-105", dateDossier: "10/08/2024", type: "Donation entre époux", etat: "Signé",
    signataires: [{ nom: "Camara Aïssatou", signe: true }, { nom: "Bah Oumar", signe: true }], montant: 800000,
    workflow: workflowTemplates["Donation"] ? {
      ...workflowTemplates["Donation"],
      steps: workflowTemplates["Donation"].steps.map((s, i) => ({
        ...s, status: "completed" as const,
        startedAt: new Date(Date.now() - (30 - i * 5) * 86400000).toISOString(),
        completedAt: new Date(Date.now() - (25 - i * 5) * 86400000).toISOString(),
      })),
    } : undefined,
  },
];

const etatColors: Record<string, string> = {
  Brouillon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "En signature": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Signé: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Annulé: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function ActesSignatures() {
  const { t, lang } = useLanguage();
  const fr = lang === "FR";

  // ── Actes state ──────────────────────────────────────────────
  const [actes, setActes] = useState<Acte[]>(initialActes);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEtat, setFilterEtat] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedActeId, setSelectedActeId] = useState<string | null>(null);
  const [form, setForm] = useState({ categorieActe: "", type: "" });

  // ── Steps per act (catalogue) ─────────────────────────────────
  const { acteSteps, setActeSteps, getSteps: getStepsFromContext } = useActeSteps();
  const [expandedActeSteps, setExpandedActeSteps] = useState<Set<string>>(new Set());
  const [editingStep, setEditingStep] = useState<{ 
    key: string; 
    idx: number; 
    label: string; 
    description: string 
  } | null>(null);
  const [addStepFor, setAddStepFor] = useState<string | null>(null);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");

  const getSteps = (acteLabel: string) => getStepsFromContext(acteLabel);

  const toggleActeSteps = (key: string) => {
    setExpandedActeSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  /** Trouve le TypeActeDto correspondant à un libellé dans le catalogue chargé */
  const findTypeActeByLabel = (acteLabel: string) => {
    for (const cat of categories) {
      const found = (cat.typesActes ?? []).find(t => (t.nom ?? t.libelle) === acteLabel);
      if (found) return found;
    }
    return undefined;
  };

  /** Persiste les étapes du template via PUT /api/types-actes/{id} (workflowConfigJson) */
const persistSteps = async (acteLabel: string, steps: WorkflowStepData[]) => {
  const dto = findTypeActeByLabel(acteLabel);
  if (!dto?.id) return;
  
  console.log("=== PERSIST STEPS ===");
  console.log("acteLabel:", acteLabel);
  console.log("steps à sauvegarder:", steps);
  
  const existingType = await typeActeService.getById(dto.id);
  
  const workflowConfigJson = {
    steps: steps.map((step, i) => ({
      key: step.label.toLowerCase().replace(/\s+/g, "_"),
      label: step.label,
      description: step.description || "",
      icon: "FileText",
      time: "1 j",
      status: "pending"
    })),
  };
  
  console.log("workflowConfigJson à envoyer:", workflowConfigJson);
  
  try {
    await typeActeService.update(dto.id, { 
      code: existingType.code,
      nom: existingType.nom || acteLabel,
      workflowConfigJson: JSON.stringify(workflowConfigJson)
    });
    console.log("✅ Sauvegarde réussie");
  } catch (error) {
    console.error("❌ Erreur sauvegarde:", error);
  }
};

  const moveStep = async (acteLabel: string, idx: number, dir: -1 | 1) => {
    const steps = [...getSteps(acteLabel)];
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const stepLabel = steps[idx].label;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    setActeSteps(prev => ({ ...prev, [acteLabel]: steps }));
    await persistSteps(acteLabel, steps);
    
  
    toast.info(fr ? `Étape "${stepLabel}" déplacée avec succès` : `Step "${stepLabel}" moved`);
  };

const renameStep = async (acteLabel: string, idx: number, label: string, description?: string) => {
  if (!label.trim()) return;
  const steps = [...getSteps(acteLabel)];
  const oldLabel = steps[idx].label;
  steps[idx] = {
    label: label.trim().toUpperCase(),
    description: description?.trim() || steps[idx].description
  };
  setActeSteps(prev => ({ ...prev, [acteLabel]: steps }));
  setEditingStep(null);
  await persistSteps(acteLabel, steps);
  
  toast.success(fr ? `Étape renommée de "${oldLabel}" à "${label.trim().toUpperCase()}"` : `Etape mis à jour à "${oldLabel}" to "${label.trim().toUpperCase()}"`);
};

  const [confirmDeleteStep, setConfirmDeleteStep] = useState<{ acteLabel: string; idx: number; label: string } | null>(null);

  const deleteStep = async (acteLabel: string, idx: number) => {
    const steps = getSteps(acteLabel).filter((_, i) => i !== idx);
    const deletedLabel = getSteps(acteLabel)[idx]?.label;
    setActeSteps(prev => ({ ...prev, [acteLabel]: steps }));
    setConfirmDeleteStep(null);
    await persistSteps(acteLabel, steps);
    
    
    toast.success(fr ? `Étape "${deletedLabel}" supprimée avec succès` : `Step "${deletedLabel}" deleted`);
  };

    const addStep = async (acteLabel: string) => {
      if (!newStepLabel.trim()) return;
      const steps = [...getSteps(acteLabel)];
      steps.push({
        label: newStepLabel.trim().toUpperCase(),
        description: newStepDescription.trim() || undefined
      });
      setActeSteps(prev => ({ ...prev, [acteLabel]: steps }));
      setNewStepLabel("");
      setNewStepDescription("");
      setAddStepFor(null);
      await persistSteps(acteLabel, steps);
      
      toast.success(fr ? `Étape "${newStepLabel.trim().toUpperCase()}" ajoutée avec succès` : `Step "${newStepLabel.trim().toUpperCase()}" added`);
    };

  // ── Catalogue state ───────────────────────────────────────────
  const [activeTab] = useState<"catalogue">("catalogue");
  const [catalogue, setCatalogue] = useState<CategorieActe[]>([]);
  const [categories, setCategories] = useState<CategorieActeDto[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set([0]));
  const [editingCat, setEditingCat] = useState<{ idx: number; label: string } | null>(null);
  const [editingActe, setEditingActe] = useState<{ catIdx: number; acteIdx: number; label: string } | null>(null);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [newActeLabel, setNewActeLabel] = useState("");
  const [addActeForCat, setAddActeForCat] = useState<number | null>(null);

  const selectedActe = selectedActeId ? actes.find(a => a.id === selectedActeId) || null : null;
  const setSelectedActe = (a: Acte | null) => setSelectedActeId(a?.id || null);

  // ── Chargement du catalogue depuis l'API ─────────────────────
    const loadCatalogue = async () => {
      setCatalogueLoading(true);
      try {
        // Charger les catégories ET tous les types d'actes complets en parallèle
        const [cats, allTypes] = await Promise.all([
          categorieActeService.getActives(),
          typeActeService.getAll()  // ← Charge les types complets avec workflowConfigJson
        ]);
        
        setCategories(cats);
        
        // Créer un Map pour accéder rapidement aux types complets par ID
        const typesMap = new Map<number, TypeActeDto>();
        allTypes.forEach(t => {
          if (t.id) typesMap.set(t.id, t);
        });
        
        // Enrichir les catégories avec les types complets
        const enrichedCats = cats.map(cat => ({
          ...cat,
          typesActes: (cat.typesActes ?? []).map(t => {
            const fullType = t.id ? typesMap.get(t.id) : null;
            return fullType || t;  // Utiliser le type complet s'il existe
          })
        }));
        
        setCategories(enrichedCats);
        
        // Transformer pour l'affichage catalogue (simple)
        setCatalogue(enrichedCats.map(c => ({
          label: c.libelle,
          actes: (c.typesActes ?? []).map(t => t.nom ?? t.libelle ?? ""),
        })));
        
        // Charger les étapes depuis workflowConfigJson des types complets
        const stepsFromApi: Record<string, string[]> = {};
        enrichedCats.forEach(cat => {
          (cat.typesActes ?? []).forEach(t => {
            const name = t.nom ?? t.libelle ?? "";
            if (!name) return;
            
            // Récupérer le workflow depuis le type complet
            const workflowConfig = t.workflowConfigJson;
            if (!workflowConfig) return;
            
            try {
              const wf = typeof workflowConfig === "string"
                ? JSON.parse(workflowConfig)
                : workflowConfig;
              if (Array.isArray((wf as { steps?: string[] }).steps)) {
                stepsFromApi[name] = (wf as { steps: string[] }).steps;
              }
            } catch {
              // JSON malformé — on ignore
            }
          });
        });
        
        if (Object.keys(stepsFromApi).length > 0) {
          setActeSteps(prev => ({ ...prev, ...stepsFromApi }));
        }
        
      } catch (error) {
        console.error("Erreur chargement catalogue:", error);
        toast.error(fr ? "Erreur lors du chargement du catalogue" : "Error loading catalogue");
      } finally {
        setCatalogueLoading(false);
      }
    };




  useEffect(() => { loadCatalogue(); }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const saveCatalogue = async () => {
  try {
    // Recharger le catalogue depuis l'API pour sauvegarder les modifications
    await loadCatalogue();
    toast.success(fr ? "Catalogue enregistré avec succès" : "Catalogue saved successfully");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du catalogue:", error);
    toast.error(fr ? "Erreur lors de la sauvegarde du catalogue" : "Error saving catalogue");
  }
};

  // All types from current catalogue (flat)
  const allTypes = catalogue.flatMap(c => c.actes);

  const filtered = actes.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterEtat !== "all" && a.etat !== filterEtat) return false;
    if (search) return [a.ref, a.dossier, a.type].some(f => searchMatch(f, search));
    return true;
  });

  const stats = {
    total: actes.length,
    brouillons: actes.filter(a => a.etat === "Brouillon").length,
    enSignature: actes.filter(a => a.etat === "En signature").length,
    signes: actes.filter(a => a.etat === "Signé").length,
    totalMontant: actes.reduce((s, a) => s + a.montant, 0),
  };

  // ── Acte handlers ────────────────────────────────────────────
const handleCreate = () => {
  if (!form.type) return;
  
  // getSteps retourne maintenant des objets WorkflowStepData[]
  const stepsData = getSteps(form.type);
  
  const template = workflowTemplates[form.type] ?? workflowTemplates["Vente immobilière"];
  const workflow: WorkflowConfig = {
    ...(template ?? { name: form.type, description: "" }),
    name: form.type,
    steps: stepsData.map((step, i) => {
      const existing = template?.steps[i];
      return {
        key: step.label.toLowerCase().replace(/\s+/g, "_"),
        label: step.label,
        // ✅ Correction : utiliser ?? avec parenthèses ou séparer
        description: step.description || (existing?.description ?? ""),
        icon: existing?.icon ?? "FileText",
        time: existing?.time ?? "1 j",
        status: "pending" as const,
        button: { actionId: `start_${step.label.toLowerCase()}` },
      };
    }),
  };
  
  const newActe: Acte = {
    id: String(Date.now()),
    ref: `A-${8844 + actes.length}`,
    dossier: "N-2025-XXX",
    dateDossier: new Date().toLocaleDateString("fr-FR"),
    type: form.type,
    etat: "Brouillon",
    signataires: [],
    montant: 0,
    workflow,
  };
  setActes(prev => [newActe, ...prev]);
  setShowCreate(false);
  setForm({ categorieActe: "", type: "" });
  toast.success(t("actes.toast.created"));
};

  const handleWorkflowStart = (acte: Acte, _actionId: string, stepKey: string) => {
    const now = new Date().toISOString();
    setActes(prev => prev.map(a => {
      if (a.id !== acte.id || !a.workflow) return a;
      const stepIndex = a.workflow.steps.findIndex(s => s.key === stepKey);
      if (stepIndex > 0 && a.workflow.steps[stepIndex - 1].status !== "completed") return a;
      if (a.workflow.steps.some(s => s.status === "active")) return a;
      const updated = a.workflow.steps.map((s, i) =>
        i === stepIndex ? { ...s, status: "active" as const, startedAt: now } : s
      );
      return { ...a, workflow: { ...a.workflow, steps: updated } };
    }));
    toast.success(`${t("actes.toast.stepStarted")} "${stepKey}" ${acte.ref}`);
  };

  const handleWorkflowRevert = (acte: Acte, stepKey: string) => {
    const now = new Date().toISOString();
    setActes(prev => prev.map(a => {
      if (a.id !== acte.id || !a.workflow) return a;
      const stepIndex = a.workflow.steps.findIndex(s => s.key === stepKey);
      const updated = a.workflow.steps.map((s, i) => {
        if (i < stepIndex) return s;
        if (i === stepIndex) return { ...s, status: "active" as const, startedAt: now, completedAt: undefined };
        return { ...s, status: "pending" as const, startedAt: undefined, completedAt: undefined };
      });
      return { ...a, workflow: { ...a.workflow, steps: updated } };
    }));
    toast.info(`${t("actes.toast.stepReverted")} "${stepKey}" ${acte.ref}`);
  };

  const handleWorkflowComplete = (acte: Acte, stepKey: string) => {
    const now = new Date().toISOString();
    setActes(prev => prev.map(a => {
      if (a.id !== acte.id || !a.workflow) return a;
      const updated = a.workflow.steps.map(s =>
        s.key === stepKey && s.status === "active" ? { ...s, status: "completed" as const, completedAt: now } : s
      );
      return { ...a, workflow: { ...a.workflow, steps: updated } };
    }));
    const isLast = acte.workflow?.steps[acte.workflow.steps.length - 1]?.key === stepKey;
    toast.success(isLast ? `${t("actes.toast.workflowDone")} ${acte.ref} ! 🎉` : `${t("actes.toast.stepCompleted")} "${stepKey}" ${acte.ref}`);
  };

  const handleAction = (acte: Acte) => {
    if (acte.etat === "Brouillon") {
      setActes(prev => prev.map(a => a.id === acte.id ? { ...a, etat: "En signature" as const } : a));
      toast.success(`${acte.ref} ${t("actes.toast.sentSignature")}`);
    } else if (acte.etat === "En signature") {
      setActes(prev => prev.map(a => a.id === acte.id ? { ...a, etat: "Signé" as const, signataires: a.signataires.map(s => ({ ...s, signe: true })) } : a));
      toast.success(`${acte.ref} ${t("actes.toast.signed")}`);
    } else if (acte.etat === "Signé") {
      toast.success(`${t("actes.toast.downloading")} ${acte.ref}...`);
    }
  };

  const actionLabel = (etat: Acte["etat"]) => {
    if (etat === "Brouillon") return t("actes.action.sendSignature");
    if (etat === "En signature") return t("actes.action.sign");
    if (etat === "Signé") return t("actes.action.download");
    return "";
  };

  const etatLabel = (etat: Acte["etat"]) => {
    if (etat === "Brouillon") return t("actes.etat.brouillon");
    if (etat === "En signature") return t("actes.etat.enSignature");
    if (etat === "Signé") return t("actes.etat.signe");
    if (etat === "Annulé") return t("actes.etat.annule");
    return etat;
  };

  // ── Catalogue handlers ────────────────────────────────────────
  const toggleCat = (idx: number) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const saveCategory = (idx: number, label: string) => {
    // Renommage local uniquement (les catégories sont des codes fixes côté backend)
    if (!label.trim()) return;
    setCatalogue(prev => prev.map((c, i) => i === idx ? { ...c, label: label.trim() } : c));
    setEditingCat(null);
  };

  const [confirmDeleteCat, setConfirmDeleteCat] = useState<{ idx: number; label: string; acteCount: number } | null>(null);

  const deleteCategory = async (idx: number) => {
    const cat = categories[idx];
    if (!cat?.id) { setConfirmDeleteCat(null); return; }
    try {
      await categorieActeService.delete(cat.id);
      await loadCatalogue();
      toast.success(fr ? "Catégorie supprimée" : "Category deleted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg || (fr ? "Erreur lors de la suppression" : "Error deleting category"));
    }
    setConfirmDeleteCat(null);
  };

  const addCategory = async () => {
    if (!newCatLabel.trim()) return;
    const code = newCatLabel.trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_");
    try {
      await categorieActeService.create({ code, libelle: newCatLabel.trim() });
      await loadCatalogue();
      toast.success(fr ? "Catégorie ajoutée" : "Category added");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg || (fr ? "Erreur lors de l'ajout" : "Error adding category"));
    }
    setNewCatLabel("");
    setShowAddCat(false);
  };

const saveActe = async (catIdx: number, acteIdx: number, label: string) => {
  if (!label.trim()) return;
  
  const acte = categories[catIdx]?.typesActes?.[acteIdx];
  
  // 🔍 Debug - voir ce qui est vraiment dans l'objet
  console.log("=== DÉBOGAGE SAVE ACTE ===");
  console.log("catIdx:", catIdx, "acteIdx:", acteIdx);
  console.log("acte:", acte);
  console.log("acte.id:", acte?.id);
  console.log("acte.code:", acte?.code);
  console.log("acte.nom:", acte?.nom);
  console.log("label à sauvegarder:", label);
  
  if (!acte?.id) {
    toast.error(fr ? "Impossible de modifier : type d'acte introuvable" : "Cannot update: act type not found");
    setEditingActe(null);
    return;
  }
  
  // ✅ Générer un code si absent
  const codeToSend = acte.code || label.trim().toUpperCase().replace(/\s+/g, "_");
  console.log("code à envoyer:", codeToSend);
  
  try {
    await typeActeService.update(acte.id, { 
      code: codeToSend,
      nom: label.trim()
    });
    await loadCatalogue();
    toast.success(fr ? "Acte modifié" : "Act updated");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.error("Erreur modification acte:", e);
    toast.error(msg || (fr ? "Erreur lors de la modification" : "Error updating act"));
  }
  setEditingActe(null);
};

  const [confirmDeleteActe, setConfirmDeleteActe] = useState<{ catIdx: number; acteIdx: number; label: string } | null>(null);

  const deleteActe = async (catIdx: number, acteIdx: number) => {
    const acte = categories[catIdx]?.typesActes?.[acteIdx];
    if (acte?.id) {
      try {
        await typeActeService.delete(acte.id);
        await loadCatalogue();
        toast.success(fr ? "Acte supprimé" : "Act deleted");
      } catch {
        toast.error(fr ? "Erreur lors de la suppression" : "Error deleting act");
      }
    } else {
      setCatalogue(prev => prev.map((c, i) =>
        i === catIdx ? { ...c, actes: c.actes.filter((_, j) => j !== acteIdx) } : c
      ));
    }
    setConfirmDeleteActe(null);
  };

  const addActe = async (catIdx: number) => {
    if (!newActeLabel.trim()) return;
    const cat = categories[catIdx];
    const code = newActeLabel.trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_");
    try {
      let typeId: number | undefined;
      try {
        // Tenter de créer un nouveau type d'acte
        const created = await typeActeService.create({ code, nom: newActeLabel.trim() });
        typeId = created?.id;
      } catch {
        // Code déjà existant — chercher l'existant par code
        const allTypes = await typeActeService.getAll();
        const existing = allTypes.find(t => t.code === code || t.nom === newActeLabel.trim());
        typeId = existing?.id;
      }
      if (typeId && cat?.id) {
        await categorieActeService.assignTypeActe(cat.id, typeId);
        await loadCatalogue();
        toast.success(fr ? "Acte ajouté" : "Act added");
      } else {
        toast.error(fr ? "Type d'acte introuvable" : "Act type not found");
      }
    } catch {
      toast.error(fr ? "Erreur lors de l'ajout" : "Error adding act");
    }
    setNewActeLabel("");
    setAddActeForCat(null);
  };

  const handleInitDefauts = async () => {
    try {
      await categorieActeService.initialiserDefauts();
      await loadCatalogue();
      toast.success(fr ? "Catégories et types d'actes initialisés !" : "Categories and act types initialized!");
    } catch {
      toast.error(fr ? "Erreur lors de l'initialisation" : "Initialization error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("actes.pageTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("actes.subtitle")}</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> {t("actes.newActe")}
        </Button>
      </div>

      {/* ── Catalogue ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {fr
                ? "Personnalisez les catégories et les actes notariés proposés dans votre cabinet. Ces modifications s'appliqueront lors de la création de nouveaux dossiers."
                : "Customize the categories and notarial acts offered by your office. These changes will apply when creating new cases."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="gap-2" onClick={handleInitDefauts}>
              {fr ? "Initialiser les défauts" : "Initialize defaults"}
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground gap-2" onClick={saveCatalogue}>
              <Save className="h-4 w-4" /> {fr ? "Actualiser" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {catalogue.map((cat, catIdx) => (
            <div key={catIdx} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <button onClick={() => toggleCat(catIdx)} className="flex items-center gap-2 flex-1 text-left">
                  {expandedCats.has(catIdx)
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  {editingCat?.idx === catIdx ? (
                    <Input
                      className="h-7 text-sm w-64"
                      value={editingCat.label}
                      autoFocus
                      onChange={e => setEditingCat({ idx: catIdx, label: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveCategory(catIdx, editingCat.label);
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">({cat.actes.length} {fr ? "actes" : "acts"})</span>
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  {editingCat?.idx === catIdx ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => saveCategory(catIdx, editingCat.label)}>{fr ? "OK" : "OK"}</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingCat(null)}>{fr ? "Annuler" : "Cancel"}</Button>
                    </>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCat({ idx: catIdx, label: cat.label })}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteCat({ idx: catIdx, label: cat.label, acteCount: cat.actes.length })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Acts list */}
              {expandedCats.has(catIdx) && (
                <div className="p-3 space-y-1.5">
                  {cat.actes.map((acte, acteIdx) => {
                    const stepKey = `${catIdx}-${acteIdx}`;
                    const stepsOpen = expandedActeSteps.has(stepKey);
                    const steps = getSteps(acte);
                    return (
                      <div key={acteIdx} className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden">
                        {/* Act row */}
                        <div className="flex items-center gap-2 group px-3 py-2 hover:bg-muted/30 transition-colors">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {editingActe?.catIdx === catIdx && editingActe?.acteIdx === acteIdx ? (
                            <Input
                              className="h-7 text-sm flex-1"
                              value={editingActe.label}
                              autoFocus
                              onChange={e => setEditingActe({ catIdx, acteIdx, label: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === "Enter") saveActe(catIdx, acteIdx, editingActe.label);
                                if (e.key === "Escape") setEditingActe(null);
                              }}
                            />
                          ) : (
                            <span className="text-sm text-foreground flex-1">{acte}</span>
                          )}
                          <div className="flex items-center gap-1">
                            {/* Steps toggle */}
                            <button
                              onClick={() => toggleActeSteps(stepKey)}
                              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded transition-colors"
                              title={fr ? "Gérer les étapes" : "Manage steps"}
                            >
                              {stepsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <span>{steps.length} {fr ? "étapes" : "steps"}</span>
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingActe?.catIdx === catIdx && editingActe?.acteIdx === acteIdx ? (
                                <>
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => saveActe(catIdx, acteIdx, editingActe.label)}>OK</Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingActe(null)}>✕</Button>
                                </>
                              ) : (
                                <>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingActe({ catIdx, acteIdx, label: acte })}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteActe({ catIdx, acteIdx, label: acte })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Steps editor */}
                        {stepsOpen && (
                          <div className="border-t border-border/50 bg-muted/5 px-4 py-3 space-y-1.5">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              {fr ? "Étapes du workflow" : "Workflow steps"}
                            </p>

                           {steps.map((step, si) => {
  const stepData = typeof step === 'string' ? { label: step, description: undefined } : step;
  return (
    <div key={si} className="flex items-start gap-2 group/step rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors">
      <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0 mt-0.5">{si + 1}</span>
      
      {editingStep?.key === stepKey && editingStep.idx === si ? (
        <div className="flex-1 space-y-1">
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
            onKeyDown={e => { if (e.key === "Enter") renameStep(acte, si, editingStep.label, editingStep.description); }}
          />
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" 
              onClick={() => renameStep(acte, si, editingStep.label, editingStep.description)}>OK</Button>
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" 
              onClick={() => setEditingStep(null)}>✕</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <span className="text-xs font-medium text-foreground tracking-wide">{stepData.label}</span>
            {stepData.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{stepData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover/step:opacity-100 transition-opacity shrink-0">
            <Button size="icon" variant="ghost" className="h-5 w-5" 
              onClick={() => setEditingStep({ key: stepKey, idx: si, label: stepData.label, description: stepData.description || "" })}>
              <Edit2 className="h-2.5 w-2.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5" disabled={si === 0} 
              onClick={() => moveStep(acte, si, -1)}>
              <ChevronRight className="h-3 w-3 -rotate-90" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5" disabled={si === steps.length - 1} 
              onClick={() => moveStep(acte, si, 1)}>
              <ChevronRight className="h-3 w-3 rotate-90" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive hover:text-destructive" 
              onClick={() => setConfirmDeleteStep({ acteLabel: acte, idx: si, label: stepData.label })}>
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
                            })}

                            {/* Add step */}
                              {addStepFor === stepKey ? (
                                <div className="space-y-1 px-2 py-1">
                                  <Input
                                    className="h-6 text-xs uppercase"
                                    placeholder={fr ? "Nom de l'étape (ex: SIGNATURE)" : "Step name (e.g. SIGNATURE)"}
                                    value={newStepLabel}
                                    autoFocus
                                    onChange={e => setNewStepLabel(e.target.value.toUpperCase())}
                                    onKeyDown={e => { if (e.key === "Escape") { setAddStepFor(null); setNewStepLabel(""); setNewStepDescription(""); } }}
                                  />
                                  <Input
                                    className="h-6 text-xs"
                                    placeholder={fr ? "Description (optionnelle)" : "Description (optional)"}
                                    value={newStepDescription}
                                    onChange={e => setNewStepDescription(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") addStep(acte); }}
                                  />
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => addStep(acte)}>
                                      {fr ? "Ajouter" : "Add"}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" 
                                      onClick={() => { setAddStepFor(null); setNewStepLabel(""); setNewStepDescription(""); }}>
                                      ✕
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                              <button
                                onClick={() => { setAddStepFor(stepKey); setNewStepLabel(""); }}
                                className="flex items-center gap-1.5 text-[11px] text-primary hover:bg-primary/5 w-full px-2 py-1 rounded transition-colors"
                              >
                                <Plus className="h-3 w-3" /> {fr ? "Ajouter une étape" : "Add a step"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add act */}
                  {addActeForCat === catIdx ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input
                        className="h-7 text-sm flex-1"
                        placeholder={fr ? "Nom de l'acte..." : "Act name..."}
                        value={newActeLabel}
                        autoFocus
                        onChange={e => setNewActeLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") addActe(catIdx);
                          if (e.key === "Escape") { setAddActeForCat(null); setNewActeLabel(""); }
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addActe(catIdx)}>{fr ? "Ajouter" : "Add"}</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setAddActeForCat(null); setNewActeLabel(""); }}>✕</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddActeForCat(catIdx); setNewActeLabel(""); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {fr ? "Ajouter un acte" : "Add an act"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add category */}
        {showAddCat ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
            <FolderPlus className="h-4 w-4 text-primary shrink-0" />
            <Input
              className="h-8 text-sm flex-1"
              placeholder={fr ? "Nom de la catégorie..." : "Category name..."}
              value={newCatLabel}
              autoFocus
              onChange={e => setNewCatLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") addCategory();
                if (e.key === "Escape") { setShowAddCat(false); setNewCatLabel(""); }
              }}
            />
            <Button size="sm" onClick={addCategory}>{fr ? "Créer" : "Create"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddCat(false); setNewCatLabel(""); }}>✕</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCat(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            {fr ? "Ajouter une catégorie" : "Add a category"}
          </button>
        )}

        <div className="flex justify-end pt-2">
          <Button className="bg-primary text-primary-foreground gap-2" onClick={saveCatalogue}>
            <Save className="h-4 w-4" /> {fr ? "Enregistrer le catalogue" : "Save catalogue"}
          </Button>
        </div>
      </div>

      {/* ── Detail Drawer with Workflow ───────────────────────── */}
      <AnimatePresence>
        {selectedActe && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedActe(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-5xl border-l border-border bg-card shadow-2xl overflow-y-auto scrollbar-thin">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono font-medium text-primary">{selectedActe.ref}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", etatColors[selectedActe.etat])}>{etatLabel(selectedActe.etat)}</span>
                    </div>
                    <h2 className="font-heading text-xl font-bold text-foreground">{selectedActe.type}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t("actes.drawer.dossier")} {selectedActe.dossier} · {selectedActe.dateDossier}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedActe.etat !== "Annulé" && selectedActe.etat !== "Signé" && (
                      <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { handleAction(selectedActe); setSelectedActe(null); }}>
                        {actionLabel(selectedActe.etat)}
                      </Button>
                    )}
                    <button onClick={() => setSelectedActe(null)} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">{t("actes.drawer.montant")}</p>
                    <p className="text-lg font-bold text-foreground font-mono">{formatGNF(selectedActe.montant)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">{t("actes.drawer.signataires")}</p>
                    <p className="text-lg font-bold text-foreground">{selectedActe.signataires.length}</p>
                    <p className="text-xs text-muted-foreground">{selectedActe.signataires.filter(s => s.signe).length} {t("actes.drawer.signed")}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">{t("actes.drawer.progress")}</p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedActe.workflow
                        ? `${Math.round((selectedActe.workflow.steps.filter(s => s.status === "completed").length / selectedActe.workflow.steps.length) * 100)}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">{t("actes.drawer.signataires")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedActe.signataires.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{s.nom.charAt(0)}</div>
                        <span className="text-sm text-foreground">{s.nom}</span>
                        <span className={cn("h-2.5 w-2.5 rounded-full", s.signe ? "bg-emerald-500" : "bg-amber-400")} />
                      </div>
                    ))}
                  </div>
                </div>

                {selectedActe.workflow && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4">{t("actes.drawer.workflow")}</h3>
                    <div className="p-4 rounded-xl bg-muted/10 border border-border overflow-x-auto">
                      <WorkflowProcedural
                        config={selectedActe.workflow}
                        onStart={(actionId, stepKey) => handleWorkflowStart(selectedActe, actionId, stepKey)}
                        onRevert={(stepKey) => handleWorkflowRevert(selectedActe, stepKey)}
                        onComplete={(stepKey) => handleWorkflowComplete(selectedActe, stepKey)}
                      />
                    </div>
                  </div>
                )}
                {!selectedActe.workflow && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("actes.drawer.noWorkflow")}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Create Acte Modal ──────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("actes.create.title")}</DialogTitle>
            <DialogDescription>{t("actes.create.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{fr ? "Catégorie d'acte" : "Act category"} *</Label>
              <Select value={form.categorieActe} onValueChange={v => setForm(p => ({ ...p, categorieActe: v, type: "" }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner une catégorie" : "Select a category"} /></SelectTrigger>
                <SelectContent>
                  {catalogue.map(c => <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.categorieActe && (
              <div className="space-y-2">
                <Label>{t("actes.create.typeLabel")} *</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un acte" : "Select an act"} /></SelectTrigger>
                  <SelectContent>
                    {(catalogue.find(c => c.label === form.categorieActe)?.actes ?? []).map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
{form.type && (
  <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5">
    <p className="text-xs text-muted-foreground mb-1.5">{fr ? "Étapes du workflow associé" : "Associated workflow steps"}</p>
    <div className="flex flex-wrap gap-1.5">
      {getSteps(form.type).map((step, i) => (
        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {typeof step === 'string' ? step : step.label}
        </span>
      ))}
    </div>
  </div>
)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("actes.create.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate} disabled={!form.type}>
              {t("actes.create.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation suppression catégorie ─────────────────── */}
      <Dialog open={!!confirmDeleteCat} onOpenChange={o => !o && setConfirmDeleteCat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">
              {fr ? "Supprimer cette catégorie ?" : "Delete this category?"}
            </DialogTitle>
            <DialogDescription>
              {fr
                ? `La catégorie « ${confirmDeleteCat?.label} » et ses ${confirmDeleteCat?.acteCount} acte(s) seront définitivement supprimés du catalogue. Cette action est irréversible.`
                : `The category "${confirmDeleteCat?.label}" and its ${confirmDeleteCat?.acteCount} act(s) will be permanently removed from the catalogue. This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCat(null)}>
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteCat && deleteCategory(confirmDeleteCat.idx)}
            >
              {fr ? "Supprimer" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation suppression acte ──────────────────────── */}
      <Dialog open={!!confirmDeleteActe} onOpenChange={o => !o && setConfirmDeleteActe(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">
              {fr ? "Supprimer cet acte ?" : "Delete this act?"}
            </DialogTitle>
            <DialogDescription>
              {fr
                ? `L'acte « ${confirmDeleteActe?.label} » sera définitivement supprimé du catalogue. Cette action est irréversible.`
                : `The act "${confirmDeleteActe?.label}" will be permanently removed from the catalogue. This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteActe(null)}>
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteActe && deleteActe(confirmDeleteActe.catIdx, confirmDeleteActe.acteIdx)}
            >
              {fr ? "Supprimer" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation suppression étape ─────────────────────── */}
      <Dialog open={!!confirmDeleteStep} onOpenChange={o => !o && setConfirmDeleteStep(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">
              {fr ? "Supprimer cette étape ?" : "Delete this step?"}
            </DialogTitle>
            <DialogDescription>
              {fr
                ? `L'étape « ${confirmDeleteStep?.label} » sera supprimée du workflow de cet acte. Cette action est irréversible.`
                : `The step "${confirmDeleteStep?.label}" will be removed from this act's workflow. This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteStep(null)}>
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteStep && deleteStep(confirmDeleteStep.acteLabel, confirmDeleteStep.idx)}
            >
              {fr ? "Supprimer" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

