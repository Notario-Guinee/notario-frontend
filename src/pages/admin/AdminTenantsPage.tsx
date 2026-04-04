import { useState, useEffect, useRef } from "react";
import { cn, searchMatch } from "@/lib/utils";
import {
  Building2, Users, Activity, Search, Plus, Eye, Edit, Package,
  Loader2, PowerOff, Power, Info, Upload, Globe, Phone, Mail,
  MapPin, FileText, Settings2, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import {
  cabinetService,
  type CabinetResume,
  type CabinetConfig,
} from "@/services/cabinetService";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  tenantId: string;
  nom: string;
  sousDomaine: string;
  gerant: string;
  users: number;
  maxUsers: number;
  plan: string;
  statut: string;
  date: string;
  modules: string[];
  storageUsed: number;
  storageTotal: number;
  logoUrl?: string | null;
  email?: string | null;
  ville?: string | null;
  devise?: string | null;
  pourcentageCompletion?: number;
  configurationComplete?: boolean;
}

interface EditForm {
  nomCabinet: string;
  logoUrl: string;
  devise: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
  telephone: string;
  email: string;
  siteWeb: string;
  numeroInscription: string;
  chambreRattachement: string;
  configurationFactureJson: string;
  themeCouleur: string;
  langueDefaut: string;
  fuseauHoraire: string;
  maxUtilisateurs: number;
  maxStockageMo: number;
  notificationsSmsActives: boolean;
  notificationsEmailActives: boolean;
  version: number;
}

const defaultEditForm: EditForm = {
  nomCabinet: "", logoUrl: "", devise: "GNF",
  adresse: "", ville: "", codePostal: "", pays: "Guinée",
  telephone: "", email: "", siteWeb: "",
  numeroInscription: "", chambreRattachement: "",
  configurationFactureJson: "", themeCouleur: "blue",
  langueDefaut: "fr", fuseauHoraire: "Africa/Conakry",
  maxUtilisateurs: 10, maxStockageMo: 5000,
  notificationsSmsActives: false, notificationsEmailActives: true,
  version: 0,
};

const defaultCreateForm = {
  tenantId: "", sousDomaine: "", nom: "", logoUrl: "", devise: "GNF",
  adresse: "", ville: "", codePostal: "", pays: "Guinée",
  telephone: "", email: "", siteWeb: "",
  numeroInscription: "", dateInscription: "", chambreRattachement: "",
  configurationFactureJson: "", themeCouleur: "blue",
  langueDefaut: "fr", fuseauHoraire: "Africa/Conakry",
  maxUtilisateurs: 10, maxStockageMo: 5000,
  notificationsSmsActives: false, notificationsEmailActives: true,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const allModules = ["Clients", "Dossiers", "Factures", "Paiements", "Archives OCR", "Messagerie", "Portail Client", "Kanban", "Formation", "Agenda"];

const statutColors: Record<string, string> = {
  Actif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Suspendu: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Incomplet: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Inactif: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const DEVISES = ["GNF", "EUR", "USD", "XOF"];
const THEMES = ["blue", "green", "purple", "orange"];
const FUSEAUX = ["Africa/Conakry", "Africa/Dakar", "Africa/Abidjan", "Europe/Paris", "UTC"];
const LANGUES = [{ v: "fr", l: "Français" }, { v: "en", l: "English" }];

// ── Logo picker helper ─────────────────────────────────────────────────────────
function LogoPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const displaySrc = value || preview;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
          {displaySrc ? (
            <img src={displaySrc} alt="Logo" loading="lazy" className="h-full w-full object-cover rounded-xl" />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Choisir un fichier
          </Button>
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://cdn.example.com/logo.png"
            className="h-8 text-xs font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Le fichier sélectionné est une prévisualisation locale — saisissez une URL HTTPS pour l'enregistrer.
          </p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Section header helper ──────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary/70" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ── Row helper for detail modal ────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground font-medium truncate">{value || "—"}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminTenantsPage() {
  const { lang } = useLanguage();
  const fr = lang === "FR";

  // List state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [showNew, setShowNew] = useState(false);
  const [deleting2, setDeleting2] = useState(false);

  // Create form
  const [form, setForm] = useState(defaultCreateForm);
  const [creating, setCreating] = useState(false);

  // View modal
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [viewConfig, setViewConfig] = useState<CabinetConfig | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Edit modal
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(defaultEditForm);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load list
  const loadList = () => {
    setLoading(true);
    setLoadError(null);
    cabinetService.getAllConfigs()
      .then((configs: CabinetResume[]) => {
        setTenants(configs.map(c => ({
          id: String(c.id),
          tenantId: c.tenantId,
          nom: c.nomCabinet,
          gerant: "—",
          sousDomaine: "—",
          users: 0,
          maxUsers: 0,
          plan: "—",
          statut: c.actif ? (c.configurationComplete ? "Actif" : "Incomplet") : "Inactif",
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
        })));
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Erreur inconnue"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadList(); }, []);

  const filtered = tenants.filter(t => {
    const matchSearch = !search || [t.nom, t.gerant].some(f => searchMatch(f, search));
    const matchFilter = filter === "Tous" || t.statut === filter;
    return matchSearch && matchFilter;
  });

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.tenantId) return toast.error("L'identifiant tenant est requis");
    if (!form.sousDomaine) return toast.error("Le sous-domaine est requis");
    if (!form.nom) return toast.error("Le nom du cabinet est requis");
    setCreating(true);
    try {
      const created = await cabinetService.createConfig({
        tenantId: form.tenantId,
        sousDomaine: form.sousDomaine,
        nomCabinet: form.nom,
        logoUrl: form.logoUrl || undefined,
        devise: form.devise,
        adresse: form.adresse || undefined,
        ville: form.ville || undefined,
        codePostal: form.codePostal || undefined,
        pays: form.pays || undefined,
        telephone: form.telephone || undefined,
        email: form.email || undefined,
        siteWeb: form.siteWeb || undefined,
        numeroInscription: form.numeroInscription || undefined,
        dateInscription: form.dateInscription || undefined,
        chambreRattachement: form.chambreRattachement || undefined,
        configurationFactureJson: form.configurationFactureJson || undefined,
        themeCouleur: form.themeCouleur || undefined,
        langueDefaut: form.langueDefaut || undefined,
        fuseauHoraire: form.fuseauHoraire || undefined,
        maxUtilisateurs: form.maxUtilisateurs,
        maxStockageMo: form.maxStockageMo,
        notificationsSmsActives: form.notificationsSmsActives,
        notificationsEmailActives: form.notificationsEmailActives,
      });
      setTenants(prev => [...prev, {
        id: String(created.id),
        tenantId: form.tenantId,
        nom: created.nomCabinet,
        gerant: "—",
        sousDomaine: form.sousDomaine,
        users: 0,
        maxUsers: created.maxUtilisateurs ?? 0,
        plan: "—",
        statut: created.actif ? (created.configurationComplete ? "Actif" : "Incomplet") : "Inactif",
        date: created.dateCreation.slice(0, 10),
        modules: [],
        storageUsed: 0,
        storageTotal: 0,
        logoUrl: created.logoUrl,
        email: created.email,
        ville: created.ville,
        devise: created.devise,
        pourcentageCompletion: created.pourcentageCompletion,
        configurationComplete: created.configurationComplete,
      }]);
      setShowNew(false);
      setForm(defaultCreateForm);
      toast.success(fr ? "Cabinet créé avec succès" : "Office created successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  // ── Open view ──────────────────────────────────────────────────────────────

  const handleOpenView = async (t: Tenant) => {
    setViewingTenant(t);
    setViewConfig(null);
    setLoadingView(true);
    try {
      const config = await cabinetService.getConfig(t.tenantId);
      setViewConfig(config);
    } catch {
      // afficher quand même avec les données de la liste
    } finally {
      setLoadingView(false);
    }
  };

  // ── Open edit ──────────────────────────────────────────────────────────────

  const handleOpenEdit = async (t: Tenant) => {
    setEditingTenant(t);
    setEditForm(defaultEditForm);
    setLoadingEdit(true);
    try {
      const config = await cabinetService.getConfig(t.tenantId);
      setEditForm({
        nomCabinet: config.nomCabinet,
        logoUrl: config.logoUrl ?? "",
        devise: config.devise,
        adresse: config.adresse ?? "",
        ville: config.ville ?? "",
        codePostal: config.codePostal ?? "",
        pays: config.pays ?? "",
        telephone: config.telephone ?? "",
        email: config.email ?? "",
        siteWeb: config.siteWeb ?? "",
        numeroInscription: config.numeroInscription ?? "",
        chambreRattachement: config.chambreRattachement ?? "",
        configurationFactureJson: config.configurationFactureJson ?? "",
        themeCouleur: config.themeCouleur ?? "blue",
        langueDefaut: config.langueDefaut ?? "fr",
        fuseauHoraire: config.fuseauHoraire ?? "Africa/Conakry",
        maxUtilisateurs: config.maxUtilisateurs ?? 10,
        maxStockageMo: (config.maxStockageGo ?? 5) * 1024,
        notificationsSmsActives: config.notificationsSmsActives,
        notificationsEmailActives: config.notificationsEmailActives,
        version: config.version,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Impossible de charger la configuration");
      setEditingTenant(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  // ── Save edit ──────────────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!editingTenant) return;
    setSaving(true);
    try {
      // 1. Logo si URL non vide
      if (editForm.logoUrl) {
        await cabinetService.updateLogo(editForm.logoUrl, editingTenant.tenantId);
      }
      // 2. Mise à jour complète
      const updated = await cabinetService.updateConfig({
        version: editForm.version,
        nomCabinet: editForm.nomCabinet,
        logoUrl: editForm.logoUrl || undefined,
        devise: editForm.devise,
        adresse: editForm.adresse || undefined,
        ville: editForm.ville || undefined,
        codePostal: editForm.codePostal || undefined,
        pays: editForm.pays || undefined,
        telephone: editForm.telephone || undefined,
        email: editForm.email || undefined,
        siteWeb: editForm.siteWeb || undefined,
        numeroInscription: editForm.numeroInscription || undefined,
        chambreRattachement: editForm.chambreRattachement || undefined,
        configurationFactureJson: editForm.configurationFactureJson || undefined,
        themeCouleur: editForm.themeCouleur || undefined,
        langueDefaut: editForm.langueDefaut || undefined,
        fuseauHoraire: editForm.fuseauHoraire || undefined,
        maxUtilisateurs: editForm.maxUtilisateurs,
        maxStockageMo: editForm.maxStockageMo,
        notificationsSmsActives: editForm.notificationsSmsActives,
        notificationsEmailActives: editForm.notificationsEmailActives,
      }, editingTenant.tenantId);

      // Mettre à jour la liste locale
      setTenants(prev => prev.map(t =>
        t.id === editingTenant.id
          ? {
              ...t,
              nom: updated.nomCabinet,
              logoUrl: updated.logoUrl,
              email: updated.email,
              ville: updated.ville,
              devise: updated.devise,
              pourcentageCompletion: updated.pourcentageCompletion,
              configurationComplete: updated.configurationComplete,
              statut: updated.actif ? (updated.configurationComplete ? "Actif" : "Incomplet") : "Inactif",
            }
          : t
      ));
      setEditingTenant(null);
      toast.success(fr ? "Cabinet mis à jour" : "Office updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle statut ──────────────────────────────────────────────────────────

  const handleToggleStatut = async (tenant: Tenant) => {
    const estInactif = tenant.statut === "Inactif";
    setDeleting2(true);
    try {
      if (estInactif) {
        await cabinetService.reactiverConfig(tenant.tenantId);
        setTenants(prev => prev.map(t => t.id === tenant.id
          ? { ...t, statut: t.configurationComplete ? "Actif" : "Incomplet" }
          : t
        ));
        toast.success(fr ? "Cabinet réactivé" : "Office reactivated");
      } else {
        await cabinetService.toggleActif(tenant.tenantId);
        setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, statut: "Inactif" } : t));
        toast.success(fr ? "Cabinet désactivé" : "Office deactivated");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du changement de statut");
    } finally {
      setDeleting2(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (loadError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5 text-center max-w-md">
        <p className="text-sm font-semibold text-destructive mb-1">{fr ? "Erreur de chargement" : "Loading error"}</p>
        <p className="text-xs text-muted-foreground font-mono">{loadError}</p>
      </div>
      <Button variant="outline" size="sm" onClick={loadList}>{fr ? "Réessayer" : "Retry"}</Button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {fr ? "Gestion des Cabinets" : "Office Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fr ? "Ajouter, modifier, activer/désactiver des cabinets et leurs modules" : "Add, edit, enable/disable offices and their modules"}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}
          className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2">
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
          <div key={kpi.label} className={cn("rounded-xl border border-border p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default", kpi.bg)}>
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
      <div className="bg-card/50 rounded-xl p-4 border border-border flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher un cabinet..." : "Search office..."} value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          {[fr ? "Tous" : "All", "Actif", "Incomplet", "Suspendu", "Inactif"].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
      </div>

      {/* Bannière info suppression logique */}
      {tenants.some(t => t.statut === "Inactif") && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {fr
              ? "Les cabinets désactivés passent au statut Inactif — il n'y a pas de suppression physique. Vous pouvez les réactiver à tout moment via le bouton ↺ dans les actions."
              : "Deactivated offices switch to Inactive status — there is no physical deletion. You can reactivate them at any time using the ↺ button in the actions."}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[fr ? "Cabinet" : "Office", fr ? "Gérant" : "Manager", fr ? "Sous-domaine" : "Subdomain",
                fr ? "Utilisateurs" : "Users", "Plan", fr ? "Stockage" : "Storage",
                fr ? "Statut" : "Status", "Modules", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{fr ? "Aucun cabinet trouvé" : "No office found"}</p>
              </td></tr>
            )}
            {filtered.map((t, i) => (
              <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {t.logoUrl
                      ? <img src={t.logoUrl} alt="" loading="lazy" className="h-8 w-8 rounded-lg object-cover border border-border" />
                      : <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary/60" /></div>
                    }
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.nom}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{t.tenantId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{t.gerant}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.sousDomaine}.notario.gn</td>
                <td className="px-4 py-3 text-sm text-foreground text-center">{t.users}<span className="text-muted-foreground">/{t.maxUsers || "—"}</span></td>
                <td className="px-4 py-3"><span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-[11px] font-semibold">{t.plan}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", (t.storageTotal - t.storageUsed) <= 1 ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${Math.min(100, t.storageTotal > 0 ? (t.storageUsed / t.storageTotal) * 100 : 0)}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{t.storageUsed}/{t.storageTotal} Go</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statutColors[t.statut] || "bg-muted text-muted-foreground")}>
                    {t.statut}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.modules.length}/{allModules.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={fr ? "Voir" : "View"}
                      onClick={() => handleOpenView(t)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={fr ? "Modifier" : "Edit"}
                      onClick={() => handleOpenEdit(t)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" disabled={deleting2}
                      className={`h-8 w-8 text-muted-foreground ${t.statut === "Inactif" ? "hover:text-emerald-600" : "hover:text-destructive"}`}
                      title={t.statut === "Inactif" ? (fr ? "Réactiver" : "Reactivate") : (fr ? "Désactiver" : "Deactivate")}
                      onClick={() => handleToggleStatut(t)}>
                      {deleting2 ? <Loader2 className="h-4 w-4 animate-spin" /> : t.statut === "Inactif" ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal : Nouveau cabinet ──────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouveau cabinet" : "New office"}</DialogTitle>
            <DialogDescription>{fr ? "Remplissez les informations du cabinet à créer" : "Fill in the information for the new office"}</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1 space-y-6">

            {/* Logo */}
            <div>
              <SectionTitle icon={Upload} label={fr ? "Logo" : "Logo"} />
              <LogoPicker value={form.logoUrl} onChange={v => setForm(p => ({ ...p, logoUrl: v }))} />
            </div>

            {/* Identifiants */}
            <div>
              <SectionTitle icon={Hash} label={fr ? "Identifiants *" : "Identifiers *"} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tenant ID</label>
                  <Input value={form.tenantId}
                    onChange={e => setForm(p => ({ ...p, tenantId: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                    placeholder="cabinet-dupont" className="mt-1 font-mono text-sm" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Unique, sans espaces</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Sous-domaine" : "Subdomain"}</label>
                  <Input value={form.sousDomaine}
                    onChange={e => setForm(p => ({ ...p, sousDomaine: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                    placeholder="dupont" className="mt-1 font-mono text-sm" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">dupont.notariale.com</p>
                </div>
              </div>
            </div>

            {/* Informations générales */}
            <div>
              <SectionTitle icon={Building2} label={fr ? "Informations générales" : "General info"} />
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Nom du cabinet *" : "Office name *"}</label>
                  <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Ex: Étude Notariale Dupont" className="mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Devise</label>
                    <select value={form.devise} onChange={e => setForm(p => ({ ...p, devise: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                      {DEVISES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Langue</label>
                    <select value={form.langueDefaut} onChange={e => setForm(p => ({ ...p, langueDefaut: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                      {LANGUES.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Thème</label>
                    <select value={form.themeCouleur} onChange={e => setForm(p => ({ ...p, themeCouleur: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                      {THEMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fuseau horaire</label>
                  <select value={form.fuseauHoraire} onChange={e => setForm(p => ({ ...p, fuseauHoraire: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {FUSEAUX.map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <SectionTitle icon={MapPin} label="Coordonnées" />
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Adresse</label>
                  <Input value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))}
                    placeholder="Ex: Quartier Kaloum, Avenue de la République" className="mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Ville</label>
                    <Input value={form.ville} onChange={e => setForm(p => ({ ...p, ville: e.target.value }))} placeholder="Conakry" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Code postal</label>
                    <Input value={form.codePostal} onChange={e => setForm(p => ({ ...p, codePostal: e.target.value }))} placeholder="BP 1234" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Pays</label>
                    <Input value={form.pays} onChange={e => setForm(p => ({ ...p, pays: e.target.value }))} placeholder="Guinée" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                    <Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="+224 628 000 000" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@etude.gn" className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Site web</label>
                  <Input value={form.siteWeb} onChange={e => setForm(p => ({ ...p, siteWeb: e.target.value }))} placeholder="https://etude-dupont.gn" className="mt-1" />
                </div>
              </div>
            </div>

            {/* Informations légales */}
            <div>
              <SectionTitle icon={FileText} label={fr ? "Informations légales" : "Legal info"} />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "N° inscription" : "Registration no."}</label>
                    <Input value={form.numeroInscription} onChange={e => setForm(p => ({ ...p, numeroInscription: e.target.value }))}
                      placeholder="NOT-GN-2024-0001" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "Date d'inscription" : "Registration date"}</label>
                    <Input type="date" value={form.dateInscription} onChange={e => setForm(p => ({ ...p, dateInscription: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Chambre de rattachement" : "Chamber"}</label>
                  <Input value={form.chambreRattachement} onChange={e => setForm(p => ({ ...p, chambreRattachement: e.target.value }))}
                    placeholder="Chambre des Notaires de Guinée" className="mt-1" />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <SectionTitle icon={Settings2} label="Configuration" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "Max utilisateurs" : "Max users"}</label>
                    <Input type="number" min={1} value={form.maxUtilisateurs}
                      onChange={e => setForm(p => ({ ...p, maxUtilisateurs: Number(e.target.value) }))} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "Stockage max (Mo)" : "Max storage (MB)"}</label>
                    <Input type="number" min={100} value={form.maxStockageMo}
                      onChange={e => setForm(p => ({ ...p, maxStockageMo: Number(e.target.value) }))} className="mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.notificationsEmailActives}
                      onChange={e => setForm(p => ({ ...p, notificationsEmailActives: e.target.checked }))} className="rounded" />
                    <span className="text-xs text-foreground">{fr ? "Notifications email" : "Email notifications"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.notificationsSmsActives}
                      onChange={e => setForm(p => ({ ...p, notificationsSmsActives: e.target.checked }))} className="rounded" />
                    <span className="text-xs text-foreground">{fr ? "Notifications SMS" : "SMS notifications"}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowNew(false)} disabled={creating}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {fr ? "Créer le cabinet" : "Create office"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal : Voir cabinet ─────────────────────────────────────────────── */}
      <Dialog open={!!viewingTenant} onOpenChange={o => !o && setViewingTenant(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewingTenant?.nom}</DialogTitle>
            <DialogDescription>{fr ? "Détails du cabinet" : "Office details"}</DialogDescription>
          </DialogHeader>
          {viewingTenant && (
            <div>
              {/* Bannière */}
              <div className="relative bg-gradient-to-br from-[#1a2e42] to-[#2a4a6b] px-6 pt-8 pb-6">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative flex items-center gap-5">
                  {viewingTenant.logoUrl || viewConfig?.logoUrl ? (
                    <img src={viewingTenant.logoUrl ?? viewConfig?.logoUrl ?? ""} alt="Logo"
                      loading="lazy" className="h-20 w-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-sm">
                      <Building2 className="h-9 w-9 text-white/70" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-xl font-bold text-white truncate">{viewingTenant.nom}</p>
                    <p className="text-sm text-white/60 mt-0.5 font-mono">{viewingTenant.tenantId}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statutColors[viewingTenant.statut] || "bg-white/20 text-white")}>
                        {viewingTenant.statut}
                      </span>
                      {(viewingTenant.devise || viewConfig?.devise) && (
                        <span className="rounded-full bg-white/10 text-white/80 px-2.5 py-0.5 text-[11px] font-medium">
                          {viewingTenant.devise ?? viewConfig?.devise}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative mt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-white/60">{fr ? "Complétion du profil" : "Profile completion"}</span>
                    <span className="text-[11px] font-bold text-white">{viewingTenant.pourcentageCompletion ?? 0}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${viewingTenant.pourcentageCompletion ?? 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Corps */}
              <div className="p-6 space-y-5 bg-card overflow-y-auto max-h-[55vh]">
                {loadingView && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}

                {/* Coordonnées */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-3.5 w-3.5 text-primary/60" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coordonnées</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailRow label="Adresse" value={viewConfig?.adresse ?? "—"} />
                    <DetailRow label="Ville" value={viewConfig?.ville ?? viewingTenant.ville ?? "—"} />
                    <DetailRow label="Code postal" value={viewConfig?.codePostal ?? "—"} />
                    <DetailRow label="Pays" value={viewConfig?.pays ?? "—"} />
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-3" />
                      <DetailRow label="Téléphone" value={viewConfig?.telephone ?? "—"} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-3" />
                      <DetailRow label="Email" value={viewConfig?.email ?? viewingTenant.email ?? "—"} />
                    </div>
                  </div>
                  {(viewConfig?.siteWeb) && (
                    <div className="mt-2 flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <a href={viewConfig.siteWeb} target="_blank" rel="noreferrer"
                        className="text-sm text-primary hover:underline truncate">{viewConfig.siteWeb}</a>
                    </div>
                  )}
                </div>

                {/* Légal */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-3.5 w-3.5 text-primary/60" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Informations légales" : "Legal"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailRow label={fr ? "N° inscription" : "Registration no."} value={viewConfig?.numeroInscription} />
                    <DetailRow label={fr ? "Chambre de rattachement" : "Chamber"} value={viewConfig?.chambreRattachement} />
                  </div>
                </div>

                {/* Configuration */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings2 className="h-3.5 w-3.5 text-primary/60" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configuration</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <DetailRow label="Thème" value={viewConfig?.themeCouleur} />
                    <DetailRow label="Langue" value={viewConfig?.langueDefaut} />
                    <DetailRow label="Fuseau" value={viewConfig?.fuseauHoraire} />
                    <DetailRow label={fr ? "Max utilisateurs" : "Max users"} value={viewConfig?.maxUtilisateurs?.toString()} />
                    <DetailRow label={fr ? "Stockage max" : "Max storage"} value={viewConfig?.maxStockageGo != null ? `${viewConfig.maxStockageGo} Go` : undefined} />
                    <DetailRow label="Version" value={viewConfig?.version?.toString()} />
                  </div>
                  <div className="mt-3 flex gap-3 text-xs">
                    <span className={cn("flex items-center gap-1", viewConfig?.notificationsEmailActives ? "text-emerald-600" : "text-muted-foreground")}>
                      <Mail className="h-3 w-3" /> Email {viewConfig?.notificationsEmailActives ? "✓" : "✗"}
                    </span>
                    <span className={cn("flex items-center gap-1", viewConfig?.notificationsSmsActives ? "text-emerald-600" : "text-muted-foreground")}>
                      <Phone className="h-3 w-3" /> SMS {viewConfig?.notificationsSmsActives ? "✓" : "✗"}
                    </span>
                  </div>
                </div>

                {/* Statut configuration */}
                <div className={cn("rounded-xl border px-4 py-3 flex items-center gap-3",
                  viewingTenant.configurationComplete
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40"
                )}>
                  <span className="text-lg">{viewingTenant.configurationComplete ? "✅" : "⚠️"}</span>
                  <div>
                    <p className={cn("text-xs font-semibold", viewingTenant.configurationComplete ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
                      {viewingTenant.configurationComplete ? (fr ? "Profil complet" : "Complete profile") : (fr ? "Profil incomplet" : "Incomplete profile")}
                    </p>
                    <p className={cn("text-[11px]", viewingTenant.configurationComplete ? "text-emerald-600" : "text-amber-600")}>
                      {viewingTenant.pourcentageCompletion ?? 0}% {fr ? "complété" : "completed"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" className="rounded-xl" onClick={() => setViewingTenant(null)}>
                    {fr ? "Fermer" : "Close"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal : Modifier cabinet ─────────────────────────────────────────── */}
      <Dialog open={!!editingTenant} onOpenChange={o => !o && setEditingTenant(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier le cabinet" : "Edit office"}</DialogTitle>
            <DialogDescription>
              {editingTenant?.nom} — <span className="font-mono text-[11px]">{editingTenant?.tenantId}</span>
            </DialogDescription>
          </DialogHeader>

          {loadingEdit ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 pr-1 space-y-6">

              {/* Logo */}
              <div>
                <SectionTitle icon={Upload} label={fr ? "Logo" : "Logo"} />
                <LogoPicker value={editForm.logoUrl} onChange={v => setEditForm(p => ({ ...p, logoUrl: v }))} />
              </div>

              {/* Informations générales */}
              <div>
                <SectionTitle icon={Building2} label={fr ? "Informations générales" : "General info"} />
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "Nom du cabinet" : "Office name"}</label>
                    <Input value={editForm.nomCabinet} onChange={e => setEditForm(p => ({ ...p, nomCabinet: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Devise</label>
                      <select value={editForm.devise} onChange={e => setEditForm(p => ({ ...p, devise: e.target.value }))}
                        className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                        {DEVISES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Langue</label>
                      <select value={editForm.langueDefaut} onChange={e => setEditForm(p => ({ ...p, langueDefaut: e.target.value }))}
                        className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                        {LANGUES.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Thème</label>
                      <select value={editForm.themeCouleur} onChange={e => setEditForm(p => ({ ...p, themeCouleur: e.target.value }))}
                        className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                        {THEMES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fuseau horaire</label>
                    <select value={editForm.fuseauHoraire} onChange={e => setEditForm(p => ({ ...p, fuseauHoraire: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                      {FUSEAUX.map(tz => <option key={tz}>{tz}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <SectionTitle icon={MapPin} label="Coordonnées" />
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Adresse</label>
                    <Input value={editForm.adresse} onChange={e => setEditForm(p => ({ ...p, adresse: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Ville</label>
                      <Input value={editForm.ville} onChange={e => setEditForm(p => ({ ...p, ville: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Code postal</label>
                      <Input value={editForm.codePostal} onChange={e => setEditForm(p => ({ ...p, codePostal: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Pays</label>
                      <Input value={editForm.pays} onChange={e => setEditForm(p => ({ ...p, pays: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                      <Input value={editForm.telephone} onChange={e => setEditForm(p => ({ ...p, telephone: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Site web</label>
                    <Input value={editForm.siteWeb} onChange={e => setEditForm(p => ({ ...p, siteWeb: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Informations légales */}
              <div>
                <SectionTitle icon={FileText} label={fr ? "Informations légales" : "Legal info"} />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{fr ? "N° inscription" : "Registration no."}</label>
                      <Input value={editForm.numeroInscription} onChange={e => setEditForm(p => ({ ...p, numeroInscription: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{fr ? "Chambre de rattachement" : "Chamber"}</label>
                      <Input value={editForm.chambreRattachement} onChange={e => setEditForm(p => ({ ...p, chambreRattachement: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <SectionTitle icon={Settings2} label="Configuration" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{fr ? "Max utilisateurs" : "Max users"}</label>
                      <Input type="number" min={1} value={editForm.maxUtilisateurs}
                        onChange={e => setEditForm(p => ({ ...p, maxUtilisateurs: Number(e.target.value) }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{fr ? "Stockage max (Mo)" : "Max storage (MB)"}</label>
                      <Input type="number" min={100} value={editForm.maxStockageMo}
                        onChange={e => setEditForm(p => ({ ...p, maxStockageMo: Number(e.target.value) }))} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.notificationsEmailActives}
                        onChange={e => setEditForm(p => ({ ...p, notificationsEmailActives: e.target.checked }))} className="rounded" />
                      <span className="text-xs text-foreground">{fr ? "Notifications email" : "Email notifications"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.notificationsSmsActives}
                        onChange={e => setEditForm(p => ({ ...p, notificationsSmsActives: e.target.checked }))} className="rounded" />
                      <span className="text-xs text-foreground">{fr ? "Notifications SMS" : "SMS notifications"}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setEditingTenant(null)} disabled={saving}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              onClick={handleSaveEdit} disabled={saving || loadingEdit}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {fr ? "Enregistrer" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}