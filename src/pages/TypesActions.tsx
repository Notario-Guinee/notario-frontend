// ═══════════════════════════════════════════════════════════════
// Page Types d'Actions — Référentiel des types d'actes notariaux
// Gestion des catégories d'actes (vente, succession, donation…)
// avec activation/désactivation, statistiques et personnalisation
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, Search, FileText, CheckCircle2, XCircle, Clock, TrendingUp, Edit, Archive, GitBranch, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, searchMatch } from "@/lib/utils";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatGNF } from "@/data/mockData";
import { useLanguage } from "@/context/LanguageContext";

interface WorkflowStep {
  id: string;
  libelle: string;
}

interface ActionType {
  id: string;
  libelle: string;
  description: string;
  categorie: string;
  prix: number;
  duree: string;
  etat: "actif" | "inactif" | "brouillon";
  utilisations: number;
  workflow: WorkflowStep[];
}

const categories = ["Vente", "Donation", "Entreprise", "Succession", "Bail", "Sûreté"];

const initialActions: ActionType[] = [
  { id: "1", libelle: "Acte de dépôt", description: "Dépôt d'actes sous seing privé, dépôt de documents officiels", categorie: "Vente", prix: 80000, duree: "1 jour", etat: "actif", utilisations: 18, workflow: ["Réception des documents", "Vérification de conformité", "Rédaction de l'acte", "Signature des parties", "Enregistrement"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "2", libelle: "Acte de notoriété", description: "Attestation de notoriété successorale, qualité d'héritier", categorie: "Succession", prix: 100000, duree: "1-2 jours", etat: "actif", utilisations: 31, workflow: ["Réception de la demande", "Vérification des héritiers", "Rédaction de l'attestation", "Signature notariale", "Délivrance"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "3", libelle: "Bail", description: "Bail d'habitation, bail commercial, bail professionnel", categorie: "Bail", prix: 100000, duree: "1-2 jours", etat: "actif", utilisations: 14, workflow: ["Réception des parties", "Vérification d'identité", "Rédaction du contrat", "Lecture & approbation", "Signature", "Enregistrement"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "4", libelle: "Cession de parts & nouveaux statuts", description: "Cession de parts sociales et mise à jour des statuts de la société", categorie: "Entreprise", prix: 220000, duree: "3-5 jours", etat: "actif", utilisations: 9, workflow: ["Dépôt du dossier", "Vérification juridique", "Rédaction de l'acte de cession", "Mise à jour des statuts", "Signature", "Publication légale"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "5", libelle: "Cession de succession", description: "Cession de droits successoraux entre cohéritiers ou à un tiers", categorie: "Succession", prix: 180000, duree: "2-4 jours", etat: "actif", utilisations: 6, workflow: ["Ouverture du dossier", "Inventaire successoral", "Évaluation des biens", "Rédaction de l'acte", "Signature des cohéritiers", "Enregistrement"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "6", libelle: "Création de la société", description: "Constitution de sociétés (SARL, SA, SNC, SCS…), rédaction des statuts", categorie: "Entreprise", prix: 250000, duree: "3-5 jours", etat: "actif", utilisations: 12, workflow: ["Réception du projet", "Vérification de la dénomination", "Rédaction des statuts", "Assemblée constitutive", "Signature", "Dépôt du capital", "Immatriculation"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "7", libelle: "Donation", description: "Donation entre vifs, donation-partage, donation avec réserve d'usufruit", categorie: "Donation", prix: 150000, duree: "1-2 jours", etat: "actif", utilisations: 23, workflow: ["Réception de la demande", "Évaluation des biens donnés", "Rédaction de l'acte", "Information fiscale", "Signature", "Publication"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "8", libelle: "Mainlevée", description: "Mainlevée d'hypothèque, mainlevée de saisie, mainlevée de gage", categorie: "Sûreté", prix: 130000, duree: "1-2 jours", etat: "actif", utilisations: 7, workflow: ["Réception de la demande", "Vérification du remboursement", "Rédaction de la mainlevée", "Signature du créancier", "Radiation au registre"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
  { id: "9", libelle: "Procuration", description: "Procuration générale ou spéciale, mandat notarié", categorie: "Vente", prix: 60000, duree: "1 jour", etat: "actif", utilisations: 41, workflow: ["Réception de la demande", "Vérification d'identité", "Rédaction de la procuration", "Lecture & acceptation", "Signature", "Remise de l'original"].map((l, i) => ({ id: String(i + 1), libelle: l })) },
];

const catColors: Record<string, string> = {
  Vente: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Donation: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Entreprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Succession: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Bail: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  Sûreté: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const etatColors: Record<string, string> = {
  actif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  inactif: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  brouillon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export default function TypesActions() {
  const { t, lang } = useLanguage();
  const fr = lang === "FR";
  const [actions, setActions] = useState<ActionType[]>(initialActions);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all-categories");
  const [filterEtat, setFilterEtat] = useState("all-statuses");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ActionType | null>(null);
  const [form, setForm] = useState({ libelle: "", description: "", categorie: "Vente", prix: "", duree: "", etat: "actif" as ActionType["etat"] });
  const [workflowAction, setWorkflowAction] = useState<ActionType | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [newStepLabel, setNewStepLabel] = useState("");

  const filtered = actions.filter((a) => {
    if (filterCat !== "all-categories" && a.categorie !== filterCat) return false;
    if (filterEtat !== "all-statuses" && a.etat !== filterEtat) return false;
    if (search) {
      return [a.libelle, a.description].some(f => searchMatch(f, search));
    }
    return true;
  });

  const stats = {
    total: actions.length,
    actifs: actions.filter(a => a.etat === "actif").length,
    inactifs: actions.filter(a => a.etat === "inactif").length,
    brouillons: actions.filter(a => a.etat === "brouillon").length,
    utilisations: actions.reduce((s, a) => s + a.utilisations, 0),
  };

  const handleCreate = () => {
    const newAction: ActionType = {
      id: String(Date.now()),
      libelle: form.libelle || "Nouveau type",
      description: form.description,
      categorie: form.categorie,
      prix: Number(form.prix) || 0,
      duree: form.duree || "1 jour",
      etat: form.etat,
      utilisations: 0,
      workflow: [],
    };
    setActions(prev => [...prev, newAction]);
    setShowCreate(false);
    setForm({ libelle: "", description: "", categorie: "Vente", prix: "", duree: "", etat: "actif" });
    toast.success(t("typesActions.toastCreated"));
  };

  const handleUpdate = () => {
    if (!editing) return;
    setActions(prev => prev.map(a => a.id === editing.id ? editing : a));
    setEditing(null);
    toast.success(t("typesActions.toastUpdated"));
  };

  const handleArchive = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, etat: a.etat === "inactif" ? "actif" : "inactif" as ActionType["etat"] } : a));
    toast.success(t("typesActions.toastArchived"));
  };

  const openWorkflow = (action: ActionType) => {
    setWorkflowAction(action);
    setWorkflowSteps(action.workflow.map(s => ({ ...s })));
    setNewStepLabel("");
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    setWorkflowSteps(prev => {
      const steps = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= steps.length) return steps;
      [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
      return steps;
    });
  };

  const removeStep = (id: string) => {
    setWorkflowSteps(prev => prev.filter(s => s.id !== id));
  };

  const addStep = () => {
    if (!newStepLabel.trim()) return;
    setWorkflowSteps(prev => [...prev, { id: String(Date.now()), libelle: newStepLabel.trim() }]);
    setNewStepLabel("");
  };

  const saveWorkflow = () => {
    if (!workflowAction) return;
    setActions(prev => prev.map(a => a.id === workflowAction.id ? { ...a, workflow: workflowSteps } : a));
    setWorkflowAction(null);
    toast.success(t("typesActions.workflowSaved") || (fr ? `Workflow enregistré pour « ${workflowAction.libelle} »` : `Workflow saved for "${workflowAction.libelle}"`));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("typesActions.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("typesActions.subtitle")}</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => { setForm({ libelle: "", description: "", categorie: "Vente", prix: "", duree: "", etat: "actif" }); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> {t("typesActions.newType")}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: t("typesActions.totalTypes"), value: stats.total, icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: t("typesActions.active"), value: stats.actifs, icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { label: t("typesActions.inactive"), value: stats.inactifs, icon: XCircle, bg: "bg-rose-50 dark:bg-rose-900/20", iconBg: "bg-rose-500" },
          { label: t("typesActions.drafts"), value: stats.brouillons, icon: Clock, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
          { label: t("typesActions.usages"), value: stats.utilisations, icon: TrendingUp, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={cn("rounded-xl border border-border p-5 flex items-center gap-4", kpi.bg)}>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", kpi.iconBg)}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("typesActions.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="all-categories">{t("typesActions.allCategories")}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterEtat} onChange={e => setFilterEtat(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="all-statuses">{t("typesActions.allStatuses")}</option>
          <option value="actif">{t("typesActions.statusActive")}</option>
          <option value="inactif">{t("typesActions.statusInactive")}</option>
          <option value="brouillon">{t("typesActions.statusDraft")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[t("typesActions.colLabel"), t("typesActions.colCategory"), t("typesActions.colPrice"), t("typesActions.colDuration"), t("typesActions.colStatus"), t("typesActions.colUsages"), t("typesActions.colActions")].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-foreground">{a.libelle}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", catColors[a.categorie])}>{a.categorie}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono font-medium text-foreground">{formatGNF(a.prix)}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{a.duree}</td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", etatColors[a.etat])}>{a.etat}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">
                    <span className="flex items-center gap-1.5">{a.utilisations} {a.utilisations > 0 && <span className="h-2 w-2 rounded-full bg-blue-500" />}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditing({ ...a })}>{t("typesActions.edit")}</Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title={fr ? "Configurer le workflow" : "Configure workflow"}
                        onClick={() => openWorkflow(a)}
                      >
                        <GitBranch className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => handleArchive(a.id)}>{t("typesActions.archive")}</Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">{t("typesActions.noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("typesActions.createTitle")}</DialogTitle>
            <DialogDescription>{t("typesActions.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("typesActions.labelField")}</label>
              <Input value={form.libelle} onChange={e => setForm(p => ({ ...p, libelle: e.target.value }))} placeholder={t("typesActions.placeholderLabel")} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("typesActions.descriptionField")}</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t("typesActions.placeholderDesc")} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("typesActions.categoryField")}</label>
                <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("typesActions.priceField")}</label>
                <Input value={form.prix} onChange={e => setForm(p => ({ ...p, prix: e.target.value }))} placeholder="150000" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("typesActions.durationField")}</label>
                <Input value={form.duree} onChange={e => setForm(p => ({ ...p, duree: e.target.value }))} placeholder={t("typesActions.placeholderDuration")} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("typesActions.statusField")}</label>
                <select value={form.etat} onChange={e => setForm(p => ({ ...p, etat: e.target.value as ActionType["etat"] }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  <option value="actif">{t("typesActions.statusActive")}</option>
                  <option value="brouillon">{t("typesActions.statusDraft")}</option>
                  <option value="inactif">{t("typesActions.statusInactive")}</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("typesActions.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate}>{t("typesActions.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("typesActions.editTitle")}</DialogTitle>
            <DialogDescription>{t("typesActions.editDesc")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("typesActions.labelField")}</label>
                <Input value={editing.libelle} onChange={e => setEditing({ ...editing, libelle: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("typesActions.descriptionField")}</label>
                <Input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("typesActions.categoryField")}</label>
                  <select value={editing.categorie} onChange={e => setEditing({ ...editing, categorie: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("typesActions.priceField")}</label>
                  <Input value={String(editing.prix)} onChange={e => setEditing({ ...editing, prix: Number(e.target.value) || 0 })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("typesActions.durationField")}</label>
                  <Input value={editing.duree} onChange={e => setEditing({ ...editing, duree: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("typesActions.statusField")}</label>
                  <select value={editing.etat} onChange={e => setEditing({ ...editing, etat: e.target.value as ActionType["etat"] })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    <option value="actif">{t("typesActions.statusActive")}</option>
                    <option value="brouillon">{t("typesActions.statusDraft")}</option>
                    <option value="inactif">{t("typesActions.statusInactive")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t("typesActions.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdate}>{t("typesActions.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modale configurateur de workflow ═══ */}
      <Dialog open={!!workflowAction} onOpenChange={open => !open && setWorkflowAction(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              {fr ? "Workflow procédural" : "Procedural Workflow"}
            </DialogTitle>
            <DialogDescription>
              {workflowAction?.libelle} — {fr ? "Configurez les étapes du workflow" : "Configure workflow steps"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {workflowSteps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {fr ? "Aucune étape définie" : "No steps defined"}
              </p>
            )}
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border group">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-foreground">{step.libelle}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => moveStep(index, "up")}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    disabled={index === workflowSteps.length - 1}
                    onClick={() => moveStep(index, "down")}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeStep(step.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Ajouter une étape */}
          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={newStepLabel}
                onChange={e => setNewStepLabel(e.target.value)}
                placeholder={fr ? "Nom de la nouvelle étape..." : "New step name..."}
                onKeyDown={e => e.key === "Enter" && addStep()}
                className="flex-1"
              />
              <Button size="sm" onClick={addStep} disabled={!newStepLabel.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setWorkflowAction(null)}>
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button className="bg-primary text-primary-foreground" onClick={saveWorkflow}>
              {fr ? "Enregistrer le workflow" : "Save workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
