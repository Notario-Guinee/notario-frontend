// ═══════════════════════════════════════════════════════════════
// Page Actes & Signatures — Gestion des actes notariaux
// Inclut : liste avec filtres, workflow procédural interactif,
// tiroir de détail, transitions d'état (brouillon → signature → signé)
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, Search, FileText, PenLine, CheckCircle2, DollarSign, Download, Eye, X, MoreHorizontal, Edit, Trash2, Receipt } from "lucide-react";
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
import { workflowTemplates, type WorkflowStep, type WorkflowConfig } from "@/components/workflow/workflow-types";

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

const types = ["Vente immobilière", "Vente de terrain", "Succession", "Constitution société", "Donation", "Bail commercial", "Hypothèque", "Procuration"];

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
    id: "2", ref: "A-8843", dossier: "N-2025-103", dateDossier: "12/08/2024", type: "Constitution société", etat: "En signature",
    signataires: [{ nom: "SARL Nimba", signe: true }, { nom: "Diallo M.", signe: false }], montant: 200000,
    workflow: {
      ...workflowTemplates["Constitution société"],
      steps: workflowTemplates["Constitution société"].steps.map((s, i) =>
        i < 3
          ? { ...s, status: "completed" as const, startedAt: new Date(Date.now() - (15 - i * 4) * 86400000).toISOString(), completedAt: new Date(Date.now() - (11 - i * 4) * 86400000).toISOString() }
          : i === 3
            ? { ...s, status: "active" as const, startedAt: new Date(Date.now() - 1 * 86400000).toISOString() }
            : s
      ),
    },
  },
  {
    id: "3", ref: "A-8844", dossier: "N-2025-105", dateDossier: "10/08/2024", type: "Donation", etat: "Signé",
    signataires: [{ nom: "Camara Aïssatou", signe: true }, { nom: "Bah Oumar", signe: true }], montant: 800000,
    workflow: {
      ...workflowTemplates["Donation"],
      steps: workflowTemplates["Donation"].steps.map((s, i) => ({
        ...s, status: "completed" as const,
        startedAt: new Date(Date.now() - (30 - i * 5) * 86400000).toISOString(),
        completedAt: new Date(Date.now() - (25 - i * 5) * 86400000).toISOString(),
      })),
    },
  },
];

const typeColors: Record<string, string> = {
  "Vente immobilière": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Vente de terrain": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  Succession: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Constitution société": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Donation: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Bail commercial": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  Hypothèque: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Procuration: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

const etatColors: Record<string, string> = {
  Brouillon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "En signature": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Signé: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Annulé: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function ActesSignatures() {
  const [actes, setActes] = useState<Acte[]>(initialActes);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEtat, setFilterEtat] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedActeId, setSelectedActeId] = useState<string | null>(null);
  const [form, setForm] = useState({ dossier: "", type: "Vente immobilière", signataires: "", montant: "" });

  // Always derive selectedActe from latest actes state
  const selectedActe = selectedActeId ? actes.find(a => a.id === selectedActeId) || null : null;
  const setSelectedActe = (a: Acte | null) => setSelectedActeId(a?.id || null);

  const filtered = actes.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterEtat !== "all" && a.etat !== filterEtat) return false;
    if (search) {
      return [a.ref, a.dossier, a.type].some(f => searchMatch(f, search));
    }
    return true;
  });

  const stats = {
    total: actes.length,
    brouillons: actes.filter(a => a.etat === "Brouillon").length,
    enSignature: actes.filter(a => a.etat === "En signature").length,
    signes: actes.filter(a => a.etat === "Signé").length,
    totalMontant: actes.reduce((s, a) => s + a.montant, 0),
  };

  const handleCreate = () => {
    const template = workflowTemplates[form.type];
    const newActe: Acte = {
      id: String(Date.now()),
      ref: `A-${8844 + actes.length}`,
      dossier: form.dossier || "N-2025-XXX",
      dateDossier: new Date().toLocaleDateString("fr-FR"),
      type: form.type,
      etat: "Brouillon",
      signataires: form.signataires.split(",").map(s => ({ nom: s.trim(), signe: false })).filter(s => s.nom),
      montant: Number(form.montant) || 0,
      workflow: template ? { ...template } : undefined,
    };
    setActes(prev => [newActe, ...prev]);
    setShowCreate(false);
    setForm({ dossier: "", type: "Vente immobilière", signataires: "", montant: "" });
    toast.success("Acte créé avec workflow associé");
  };

  const handleWorkflowStart = (acte: Acte, actionId: string, stepKey: string) => {
    const now = new Date().toISOString();
    setActes(prev => prev.map(a => {
      if (a.id !== acte.id || !a.workflow) return a;
      const stepIndex = a.workflow.steps.findIndex(s => s.key === stepKey);
      // Sequential: block if previous step isn't completed
      if (stepIndex > 0 && a.workflow.steps[stepIndex - 1].status !== "completed") return a;
      // Block if there's already an active step
      if (a.workflow.steps.some(s => s.status === "active")) return a;
      const updated = a.workflow.steps.map((s, i) => {
        if (i === stepIndex) return { ...s, status: "active" as const, startedAt: now };
        return s;
      });
      return { ...a, workflow: { ...a.workflow, steps: updated } };
    }));
    toast.success(`Étape "${stepKey}" démarrée pour ${acte.ref}`);
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
    toast.info(`Retour à l'étape "${stepKey}" pour ${acte.ref}`);
  };

  const handleWorkflowComplete = (acte: Acte, stepKey: string) => {
    const now = new Date().toISOString();
    setActes(prev => prev.map(a => {
      if (a.id !== acte.id || !a.workflow) return a;
      const stepIndex = a.workflow.steps.findIndex(s => s.key === stepKey);
      const isLast = stepIndex === a.workflow.steps.length - 1;
      const updated = a.workflow.steps.map(s =>
        s.key === stepKey && s.status === "active"
          ? { ...s, status: "completed" as const, completedAt: now }
          : s
      );
      return { ...a, workflow: { ...a.workflow, steps: updated } };
    }));
    const step = acte.workflow?.steps.find(s => s.key === stepKey);
    const isLast = acte.workflow?.steps[acte.workflow.steps.length - 1]?.key === stepKey;
    toast.success(isLast ? `Workflow terminé pour ${acte.ref} ! 🎉` : `Étape "${stepKey}" terminée pour ${acte.ref}`);
  };

  const handleAction = (acte: Acte) => {
    if (acte.etat === "Brouillon") {
      setActes(prev => prev.map(a => a.id === acte.id ? { ...a, etat: "En signature" as const } : a));
      toast.success(`${acte.ref} envoyé en signature`);
    } else if (acte.etat === "En signature") {
      setActes(prev => prev.map(a => a.id === acte.id ? { ...a, etat: "Signé" as const, signataires: a.signataires.map(s => ({ ...s, signe: true })) } : a));
      toast.success(`${acte.ref} signé`);
    } else if (acte.etat === "Signé") {
      toast.success(`Téléchargement de ${acte.ref}...`);
    }
  };

  const actionLabel = (etat: Acte["etat"]) => {
    if (etat === "Brouillon") return "Envoyer en signature";
    if (etat === "En signature") return "Signer";
    if (etat === "Signé") return "Télécharger";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Actes & signatures</h1>
          <p className="text-sm text-muted-foreground mt-1">Rédaction, workflow procédural et signature électronique</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nouvel acte
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: "Total actes", value: String(stats.total), icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: "Brouillons", value: String(stats.brouillons), icon: PenLine, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
          { label: "En signature", value: String(stats.enSignature), icon: PenLine, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: "Signés", value: String(stats.signes), icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { label: "Total montant", value: formatGNF(stats.totalMontant), icon: DollarSign, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
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
          <Input placeholder="Rechercher par référence, dossier ou type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEtat} onValueChange={setFilterEtat}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Tous les états" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les états</SelectItem>
            <SelectItem value="Brouillon">Brouillon</SelectItem>
            <SelectItem value="En signature">En signature</SelectItem>
            <SelectItem value="Signé">Signé</SelectItem>
            <SelectItem value="Annulé">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Réf.", "Dossier", "Type", "État", "Signataires", "Montant", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono font-medium text-primary cursor-pointer hover:underline" onClick={() => setSelectedActe(a)}>{a.ref}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-foreground">{a.dossier}</p>
                    <p className="text-xs text-muted-foreground">{a.dateDossier}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", typeColors[a.type] || "bg-muted text-muted-foreground")}>{a.type}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", etatColors[a.etat])}>{a.etat}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {a.signataires.map((s, si) => (
                        <div key={si} className="flex items-center gap-1.5">
                          <span className="text-sm text-foreground">{s.nom}</span>
                          <span className={cn("h-2 w-2 rounded-full", s.signe ? "bg-emerald-500" : "bg-amber-400")} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono font-medium text-foreground">{formatGNF(a.montant)}</td>
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedActe(a)}><Eye className="mr-2 h-4 w-4" /> Voir workflow</DropdownMenuItem>
                        {a.etat !== "Annulé" && (
                          <DropdownMenuItem onClick={() => handleAction(a)}>
                            <PenLine className="mr-2 h-4 w-4" /> {actionLabel(a.etat)}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.info("Facture générée pour " + a.ref)}>
                          <Receipt className="mr-2 h-4 w-4" /> Générer facture
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toast.info(`Détails de ${a.ref}`)}>
                          <FileText className="mr-2 h-4 w-4" /> Détails
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucun acte trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acte Detail Drawer with Workflow */}
      <AnimatePresence>
        {selectedActe && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedActe(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-5xl border-l border-border bg-card shadow-2xl overflow-y-auto scrollbar-thin">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono font-medium text-primary">{selectedActe.ref}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", etatColors[selectedActe.etat])}>{selectedActe.etat}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", typeColors[selectedActe.type] || "bg-muted text-muted-foreground")}>{selectedActe.type}</span>
                    </div>
                    <h2 className="font-heading text-xl font-bold text-foreground">{selectedActe.type}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Dossier {selectedActe.dossier} · {selectedActe.dateDossier}</p>
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

                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">Montant</p>
                    <p className="text-lg font-bold text-foreground font-mono">{formatGNF(selectedActe.montant)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">Signataires</p>
                    <p className="text-lg font-bold text-foreground">{selectedActe.signataires.length}</p>
                    <p className="text-xs text-muted-foreground">{selectedActe.signataires.filter(s => s.signe).length} signé(s)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">Avancement</p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedActe.workflow
                        ? `${Math.round((selectedActe.workflow.steps.filter(s => s.status === "completed").length / selectedActe.workflow.steps.length) * 100)}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Signataires */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Signataires</h3>
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

                {/* Workflow */}
                {selectedActe.workflow && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4">Workflow procédural</h3>
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
                    <p className="text-sm">Aucun workflow configuré pour ce type d'acte</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Nouvel acte</DialogTitle>
            <DialogDescription>Créer un acte avec un workflow procédural automatique</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Dossier associé</Label>
              <Select value={form.dossier} onValueChange={v => setForm(p => ({ ...p, dossier: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un dossier..." /></SelectTrigger>
                <SelectContent>
                  {mockDossiers.map(d => <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type d'acte *</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {workflowTemplates[form.type] && (
                <p className="text-xs text-muted-foreground">
                  ✅ Workflow disponible : {workflowTemplates[form.type].steps.length} étapes
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Signataires <span className="text-xs text-muted-foreground">(séparés par des virgules)</span></Label>
              <Input value={form.signataires} onChange={e => setForm(p => ({ ...p, signataires: e.target.value }))} placeholder="Bah Oumar, Diallo Famille" />
            </div>
            <div className="space-y-2">
              <Label>Montant (GNF)</Label>
              <Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} placeholder="200000" />
            </div>

            {/* Workflow preview */}
            {workflowTemplates[form.type] && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu du workflow :</p>
                <div className="flex flex-wrap gap-1.5">
                  {workflowTemplates[form.type].steps.map((s, i) => (
                    <span key={s.key} className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: workflowTemplates[form.type].palette[i % workflowTemplates[form.type].palette.length] }}>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate} disabled={!form.type}>
              Créer l'acte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
