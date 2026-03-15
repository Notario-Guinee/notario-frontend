// ═══════════════════════════════════════════════════════════════
// Page Types d'Actions — Référentiel des types d'actes notariaux
// Gestion des catégories d'actes (vente, succession, donation…)
// avec activation/désactivation, statistiques et personnalisation
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, Search, FileText, CheckCircle2, XCircle, Clock, TrendingUp, Edit, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, searchMatch } from "@/lib/utils";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatGNF } from "@/data/mockData";

interface ActionType {
  id: string;
  libelle: string;
  description: string;
  categorie: string;
  prix: number;
  duree: string;
  etat: "actif" | "inactif" | "brouillon";
  utilisations: number;
}

const categories = ["Vente", "Donation", "Entreprise", "Succession", "Bail", "Sûreté"];

const initialActions: ActionType[] = [
  { id: "1", libelle: "Acte de vente", description: "Vente immobilière, véhicules, biens meubles", categorie: "Vente", prix: 150000, duree: "2-3 jours", etat: "actif", utilisations: 45 },
  { id: "2", libelle: "Donation", description: "Donation entre vifs, donation-partage", categorie: "Donation", prix: 120000, duree: "1-2 jours", etat: "actif", utilisations: 23 },
  { id: "3", libelle: "Statuts SARL", description: "Constitution de société à responsabilité limitée", categorie: "Entreprise", prix: 200000, duree: "3-5 jours", etat: "actif", utilisations: 12 },
  { id: "4", libelle: "Testament", description: "Testament authentique, testament mystique", categorie: "Succession", prix: 80000, duree: "1 jour", etat: "actif", utilisations: 8 },
  { id: "5", libelle: "Bail commercial", description: "Bail commercial, bail professionnel", categorie: "Bail", prix: 100000, duree: "1-2 jours", etat: "brouillon", utilisations: 0 },
  { id: "6", libelle: "Hypothèque", description: "Hypothèque conventionnelle, hypothèque légale", categorie: "Sûreté", prix: 180000, duree: "2-4 jours", etat: "inactif", utilisations: 3 },
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
  const [actions, setActions] = useState<ActionType[]>(initialActions);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes les catégories");
  const [filterEtat, setFilterEtat] = useState("Tous les états");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ActionType | null>(null);
  const [form, setForm] = useState({ libelle: "", description: "", categorie: "Vente", prix: "", duree: "", etat: "actif" as ActionType["etat"] });

  const filtered = actions.filter((a) => {
    if (filterCat !== "Toutes les catégories" && a.categorie !== filterCat) return false;
    if (filterEtat !== "Tous les états" && a.etat !== filterEtat) return false;
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
    };
    setActions(prev => [...prev, newAction]);
    setShowCreate(false);
    setForm({ libelle: "", description: "", categorie: "Vente", prix: "", duree: "", etat: "actif" });
    toast.success("Type d'action créé");
  };

  const handleUpdate = () => {
    if (!editing) return;
    setActions(prev => prev.map(a => a.id === editing.id ? editing : a));
    setEditing(null);
    toast.success("Type d'action modifié");
  };

  const handleArchive = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, etat: a.etat === "inactif" ? "actif" : "inactif" as ActionType["etat"] } : a));
    toast.success("État mis à jour");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Types d'actions</h1>
          <p className="text-sm text-muted-foreground mt-1">Catalogue des prestations</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => { setForm({ libelle: "", description: "", categorie: "Vente", prix: "", duree: "", etat: "actif" }); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> Nouveau type
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: "Total types", value: stats.total, icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: "Actifs", value: stats.actifs, icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { label: "Inactifs", value: stats.inactifs, icon: XCircle, bg: "bg-rose-50 dark:bg-rose-900/20", iconBg: "bg-rose-500" },
          { label: "Brouillons", value: stats.brouillons, icon: Clock, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
          { label: "Utilisations", value: stats.utilisations, icon: TrendingUp, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
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
          <Input placeholder="Rechercher par libellé ou description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option>Toutes les catégories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterEtat} onChange={e => setFilterEtat(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option>Tous les états</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="brouillon">Brouillon</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Libellé", "Catégorie", "Prix", "Durée", "État", "Utilisations", "Actions"].map(h => (
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
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditing({ ...a })}>Modifier</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => handleArchive(a.id)}>Archiver</Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucun type d'action trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau type d'action</DialogTitle>
            <DialogDescription>Ajouter une prestation au catalogue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Libellé</label>
              <Input value={form.libelle} onChange={e => setForm(p => ({ ...p, libelle: e.target.value }))} placeholder="Ex: Acte de vente" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description courte" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Prix (GNF)</label>
                <Input value={form.prix} onChange={e => setForm(p => ({ ...p, prix: e.target.value }))} placeholder="150000" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Durée estimée</label>
                <Input value={form.duree} onChange={e => setForm(p => ({ ...p, duree: e.target.value }))} placeholder="2-3 jours" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">État</label>
                <select value={form.etat} onChange={e => setForm(p => ({ ...p, etat: e.target.value as ActionType["etat"] }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  <option value="actif">Actif</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le type d'action</DialogTitle>
            <DialogDescription>Mettre à jour les informations</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Libellé</label>
                <Input value={editing.libelle} onChange={e => setEditing({ ...editing, libelle: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                  <select value={editing.categorie} onChange={e => setEditing({ ...editing, categorie: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Prix (GNF)</label>
                  <Input value={String(editing.prix)} onChange={e => setEditing({ ...editing, prix: Number(e.target.value) || 0 })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Durée</label>
                  <Input value={editing.duree} onChange={e => setEditing({ ...editing, duree: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">État</label>
                  <select value={editing.etat} onChange={e => setEditing({ ...editing, etat: e.target.value as ActionType["etat"] })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    <option value="actif">Actif</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
