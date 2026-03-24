import { useState, useEffect } from "react";
import { cn, searchMatch } from "@/lib/utils";
import { Building2, Users, Receipt, Activity, Search, Plus, Eye, Edit, Trash2, Package, HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { cabinetService, type CabinetResume } from "@/services/cabinetService";

interface Tenant {
  id: string; nom: string; gerant: string; sousDomaine: string; users: number; maxUsers: number;
  plan: string; statut: string; date: string; modules: string[];
  storageUsed: number; storageTotal: number;
  // Champs issus de l'API
  logoUrl?: string | null;
  email?: string | null;
  ville?: string | null;
  devise?: string | null;
  pourcentageCompletion?: number;
  configurationComplete?: boolean;
}

const allModules = ["Clients", "Dossiers", "Factures", "Paiements", "Archives OCR", "Messagerie", "Portail Client", "Kanban", "Formation", "Agenda"];

const initialTenants: Tenant[] = [
  { id: "1", nom: "Étude Diallo & Associés", gerant: "Me Mamadou Diallo", sousDomaine: "diallo", users: 14, maxUsers: 20, plan: "Premium", statut: "Actif", date: "2025-06-15", modules: ["Clients", "Dossiers", "Factures", "Archives OCR", "Messagerie", "Portail Client", "Kanban", "Formation", "Agenda", "Paiements"], storageUsed: 15.5, storageTotal: 20 },
  { id: "2", nom: "Cabinet Notarial Bah", gerant: "Me Ibrahima Bah", sousDomaine: "bah-notaire", users: 6, maxUsers: 10, plan: "Professionnel", statut: "Actif", date: "2025-09-20", modules: ["Clients", "Dossiers", "Factures", "Paiements", "Messagerie"], storageUsed: 8.2, storageTotal: 10 },
  { id: "3", nom: "Étude Camara", gerant: "Me Fatoumata Camara", sousDomaine: "camara", users: 8, maxUsers: 15, plan: "Professionnel", statut: "Actif", date: "2025-11-01", modules: ["Clients", "Dossiers", "Factures", "Archives OCR", "Messagerie", "Portail Client"], storageUsed: 9.3, storageTotal: 10 },
  { id: "4", nom: "SN Condé", gerant: "Me Mariama Condé", sousDomaine: "conde", users: 1, maxUsers: 3, plan: "Essentiel", statut: "Suspendu", date: "2026-01-10", modules: ["Clients", "Dossiers"], storageUsed: 1.2, storageTotal: 5 },
];

const statutColors: Record<string, string> = {
  Actif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Suspendu: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Inactif: "bg-muted text-muted-foreground",
};

export default function AdminTenantsPage() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [tenants, setTenants] = useState(initialTenants);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cabinetService.getAllConfigs()
      .then((configs: CabinetResume[]) => {
        const mapped: Tenant[] = configs.map(c => ({
          id: String(c.id),
          nom: c.nomCabinet,
          gerant: "—",
          sousDomaine: "—",
          users: 0,
          maxUsers: 0,
          plan: "—",
          statut: c.configurationComplete ? "Actif" : "Incomplet",
          date: c.derniereMiseAJour ?? new Date().toISOString().slice(0, 10),
          modules: [],
          storageUsed: 0,
          storageTotal: 0,
          logoUrl: c.logoUrl,
          email: c.email,
          ville: c.ville,
          devise: c.devise,
          pourcentageCompletion: c.pourcentageCompletion,
          configurationComplete: c.configurationComplete,
        }));
        setTenants(mapped);
      })
      .catch(() => toast.error("Impossible de charger la liste des cabinets"))
      .finally(() => setLoading(false));
  }, []);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [showNew, setShowNew] = useState(false);
  const [viewing, setViewing] = useState<Tenant | null>(null);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ nom: "", gerant: "", sousDomaine: "", plan: "Essentiel", modules: [] as string[], maxUsers: 5 });

  const filtered = tenants.filter(t => {
    const matchSearch = !search || [t.nom, t.gerant].some(f => searchMatch(f, search));
    const matchFilter = filter === "Tous" || t.statut === filter;
    return matchSearch && matchFilter;
  });

  const handleCreate = () => {
    setTenants(prev => [...prev, {
      id: String(Date.now()), nom: form.nom || "Nouveau cabinet", gerant: form.gerant || "",
      sousDomaine: form.sousDomaine || "nouveau", users: 0, maxUsers: form.maxUsers,
      plan: form.plan,
      statut: "Actif", date: new Date().toISOString().slice(0, 10), modules: form.modules,
      storageUsed: 0, storageTotal: form.plan === "Premium" ? 20 : form.plan === "Professionnel" ? 10 : 5,
    }]);
    setShowNew(false);
    setForm({ nom: "", gerant: "", sousDomaine: "", plan: "Essentiel", modules: [], maxUsers: 5 });
    toast.success(fr ? "Cabinet créé avec succès" : "Office created successfully");
  };

  const handleUpdate = () => {
    if (!editing) return;
    setTenants(prev => prev.map(t => t.id === editing.id ? editing : t));
    setEditing(null);
    toast.success(fr ? "Cabinet mis à jour" : "Office updated");
  };

  const handleDelete = () => {
    if (!deleting) return;
    setTenants(prev => prev.filter(t => t.id !== deleting.id));
    setDeleting(null);
    toast.success(fr ? "Cabinet supprimé" : "Office deleted");
  };

  const toggleModule = (tenantId: string, mod: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      const modules = t.modules.includes(mod) ? t.modules.filter(m => m !== mod) : [...t.modules, mod];
      return { ...t, modules };
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {fr ? "🏢 Gestion des Cabinets (Tenants)" : "🏢 Office Management (Tenants)"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fr ? "Ajouter, modifier, activer/désactiver des cabinets et leurs modules" : "Add, edit, enable/disable offices and their modules"}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> {fr ? "Nouveau cabinet" : "New office"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: fr ? "Total cabinets" : "Total offices", value: String(tenants.length), icon: Building2, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: fr ? "Cabinets actifs" : "Active", value: String(tenants.filter(t => t.statut === "Actif").length), icon: Activity, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { label: fr ? "Utilisateurs totaux" : "Total users", value: String(tenants.reduce((a, t) => a + t.users, 0)), icon: Users, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
          { label: fr ? "Modules activés" : "Active modules", value: String(tenants.reduce((a, t) => a + t.modules.length, 0)), icon: Package, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
        ].map(kpi => (
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher un cabinet..." : "Search office..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          {[fr ? "Tous" : "All", "Actif", "Suspendu", "Inactif"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tenants Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[fr ? "Cabinet" : "Office", fr ? "Gérant" : "Manager", fr ? "Sous-domaine" : "Subdomain", fr ? "Utilisateurs" : "Users", "Plan", fr ? "Stockage" : "Storage", fr ? "Statut" : "Status", "Modules", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{t.nom}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString("fr-FR")}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{t.gerant}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.sousDomaine}.notario.gn</td>
                <td className="px-4 py-3 text-sm text-foreground text-center">{t.users}<span className="text-muted-foreground">/{t.maxUsers}</span></td>
                <td className="px-4 py-3"><span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-[11px] font-semibold">{t.plan}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", (t.storageTotal - t.storageUsed) <= 1 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(100, (t.storageUsed / t.storageTotal) * 100)}%` }} />
                    </div>
                    <span className={cn("text-[11px] font-medium", (t.storageTotal - t.storageUsed) <= 1 ? "text-destructive" : "text-muted-foreground")}>{t.storageUsed}/{t.storageTotal} Go</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statutColors[t.statut] || "bg-muted text-muted-foreground")}>{t.statut}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.modules.length}/{allModules.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(t)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...t })}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Tenant */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouveau cabinet" : "New office"}</DialogTitle>
            <DialogDescription>{fr ? "Ajouter un nouveau cabinet à la plateforme" : "Add a new office to the platform"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { l: fr ? "Nom du cabinet" : "Office name", k: "nom" as const, p: "Ex: Étude Maître..." },
              { l: fr ? "Gérant" : "Manager", k: "gerant" as const, p: "Ex: Me Diallo" },
              { l: fr ? "Sous-domaine" : "Subdomain", k: "sousDomaine" as const, p: "ex: diallo" },
            ].map(f => (
              <div key={f.k}>
                <label className="text-xs font-medium text-muted-foreground">{f.l}</label>
                <Input value={form[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))} placeholder={f.p} className="mt-1" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Offre" : "Plan"}</label>
              <select value={form.plan} onChange={e => setForm(prev => ({ ...prev, plan: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                {["Essentiel", "Professionnel", "Premium"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Nombre max. d'utilisateurs" : "Max users"}</label>
              <Input type="number" min={1} max={100} value={form.maxUsers} onChange={e => setForm(prev => ({ ...prev, maxUsers: Number(e.target.value) }))} className="mt-1" placeholder="Ex: 10" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{fr ? "Modules à activer" : "Modules to enable"}</label>
              <div className="grid grid-cols-2 gap-2">
                {allModules.map(m => (
                  <label key={m} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-muted/30">
                    <input type="checkbox" checked={form.modules.includes(m)} onChange={() => setForm(prev => ({
                      ...prev, modules: prev.modules.includes(m) ? prev.modules.filter(x => x !== m) : [...prev.modules, m]
                    }))} className="rounded border-border" />
                    <span className="text-xs text-foreground">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate}>{fr ? "Créer le cabinet" : "Create office"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tenant */}
      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewing?.nom}</DialogTitle>
            <DialogDescription>{fr ? "Détails du cabinet" : "Office details"}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div>
              {/* Bannière header avec dégradé */}
              <div className="relative bg-gradient-to-br from-[#1a2e42] to-[#2a4a6b] px-6 pt-8 pb-6">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative flex items-center gap-5">
                  {viewing.logoUrl ? (
                    <img src={viewing.logoUrl} alt="Logo" className="h-20 w-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-sm">
                      <Building2 className="h-9 w-9 text-white/70" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-xl font-bold text-white truncate">{viewing.nom}</p>
                    <p className="text-sm text-white/60 mt-0.5">{viewing.email ?? "—"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statutColors[viewing.statut] || "bg-white/20 text-white")}>
                        {viewing.statut}
                      </span>
                      {viewing.devise && (
                        <span className="rounded-full bg-white/10 text-white/80 px-2.5 py-0.5 text-[11px] font-medium">
                          {viewing.devise}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barre de complétion */}
                <div className="relative mt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-white/60">{fr ? "Complétion du profil" : "Profile completion"}</span>
                    <span className="text-[11px] font-bold text-white">{viewing.pourcentageCompletion ?? 0}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${viewing.pourcentageCompletion ?? 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Corps du modal */}
              <div className="p-6 space-y-5 bg-card">
                {/* Champs en grille */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: fr ? "Ville" : "City", v: viewing.ville ?? "—", icon: "📍" },
                    { l: fr ? "Devise" : "Currency", v: viewing.devise ?? "—", icon: "💱" },
                    { l: fr ? "Gérant" : "Manager", v: viewing.gerant, icon: "👤" },
                    { l: "Plan", v: viewing.plan, icon: "📦" },
                    { l: fr ? "Utilisateurs" : "Users", v: `${viewing.users} / ${viewing.maxUsers || "—"}`, icon: "👥" },
                    { l: fr ? "Dernière MAJ" : "Last update", v: viewing.date ? new Date(viewing.date).toLocaleDateString("fr-FR") : "—", icon: "🕐" },
                  ].map(f => (
                    <div key={f.l} className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <span>{f.icon}</span> {f.l}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-1 truncate">{f.v}</p>
                    </div>
                  ))}
                </div>

                {/* Statut configuration */}
                <div className={cn("rounded-xl border px-4 py-3 flex items-center gap-3",
                  viewing.configurationComplete
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40"
                )}>
                  <span className="text-lg">{viewing.configurationComplete ? "✅" : "⚠️"}</span>
                  <div>
                    <p className={cn("text-xs font-semibold", viewing.configurationComplete ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
                      {fr ? "Configuration" : "Configuration"}
                    </p>
                    <p className={cn("text-[11px]", viewing.configurationComplete ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                      {viewing.configurationComplete ? (fr ? "Profil complet" : "Complete profile") : (fr ? "Profil incomplet" : "Incomplete profile")}
                    </p>
                  </div>
                </div>

                {/* Modules activés */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{fr ? "Modules activés" : "Enabled modules"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewing.modules.length > 0 ? viewing.modules.map(m => (
                      <span key={m} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-medium">{m}</span>
                    )) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-1">
                  <Button variant="outline" className="rounded-xl" onClick={() => setViewing(null)}>
                    {fr ? "Fermer" : "Close"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tenant */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier le cabinet" : "Edit office"}</DialogTitle>
            <DialogDescription>{fr ? "Mettre à jour les informations" : "Update information"}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Name"}</label><Input value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Gérant" : "Manager"}</label><Input value={editing.gerant} onChange={e => setEditing({ ...editing, gerant: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Plan</label>
                  <select value={editing.plan} onChange={e => setEditing({ ...editing, plan: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {["Essentiel", "Professionnel", "Premium"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Statut" : "Status"}</label>
                  <select value={editing.statut} onChange={e => setEditing({ ...editing, statut: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {["Actif", "Suspendu", "Inactif"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Stockage (Go)" : "Storage (GB)"}</label>
                <select value={editing.storageTotal} onChange={e => setEditing({ ...editing, storageTotal: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  {[5, 10, 20, 50, 100, 200].map(v => <option key={v} value={v}>{v} Go</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdate}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Supprimer le cabinet" : "Delete office"}</AlertDialogTitle>
            <AlertDialogDescription>{fr ? `Êtes-vous sûr de vouloir supprimer ${deleting?.nom} ?` : `Are you sure you want to delete ${deleting?.nom}?`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{fr ? "Supprimer" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
