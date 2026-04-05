// ═══════════════════════════════════════════════════════════════
// Page Utilisateurs — Gestion des utilisateurs du cabinet
// Inclut : champs facultatifs (date/lieu naissance, adresse),
// filtrage, création, modification, archivage
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit, Archive, Trash2, ArchiveRestore, Lock, Unlock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteUsers } from "@/hooks/useInfiniteUsers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, updateUser, deleteUser, activateUser, deactivateUser, lockAccount, unlockAccount, getUserStatistics, getUserRoleDistribution, resetUserPassword } from "@/api/users";
import type { User, UserRole } from "@/types/user";

const ROLE_LABELS: Record<UserRole, string> = {
  GERANT: 'Gérant',
  STANDARD: 'Standard',
  STANDARD: 'Standard',
  ADMIN: 'Admin',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'GERANT', label: 'Notaire' },
  { value: 'STANDARD', label: 'Clerc' },
  { value: 'STANDARD', label: 'Stagiaire' },
  { value: 'ADMIN', label: 'Admin' },
];

// Liste des modules disponibles pour les droits d'accès
const allModules = ["Clients", "Dossiers", "Actes", "Factures", "Paiements", "Archives", "Messagerie", "Agenda", "Kanban"];

export default function Utilisateurs() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filterRole, setFilterRole] = useState<string>("Tous");
  const [filterStatut, setFilterStatut] = useState<string>("Tous");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [archiving, setArchiving] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [unarchiving, setUnarchiving] = useState<User | null>(null);

  // Formulaire avec champs facultatifs
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", role: "STANDARD" as UserRole,
    dateNaissance: "", lieuNaissance: "", adresse: "",
    password: "", confirmPassword: "",
  });
  const [page, _setPage] = useState(1);
  const perPage = 20;

  // Chargement des utilisateurs depuis l'API
  const { data, isLoading } = useInfiniteUsers({
    search: debouncedSearch || undefined,
    size: 100,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const allUsers: User[] = useMemo(
    () => (data?.pages.flatMap(p => p.content) ?? []).filter(Boolean),
    [data],
  );

  // Filtrage client-side (rôle + statut)
  const filtered = useMemo(() => allUsers.filter(u => {
    const matchRole = filterRole === "Tous" || ROLE_LABELS[u.role] === filterRole;
    const matchStatut = filterStatut === "Tous" ||
      (filterStatut === "Actif" && u.actif) ||
      (filterStatut === "Archivé" && !u.actif);
    return matchRole && matchStatut;
  }), [allUsers, filterRole, filterStatut]);

  // Pagination locale
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Mutations CRUD
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowNew(false);
      setForm({ nom: "", prenom: "", email: "", telephone: "", role: "STANDARD", dateNaissance: "", lieuNaissance: "", adresse: "", password: "", confirmPassword: "" });
      toast.success(t("users.toastAdded"));
    },
    onError: () => toast.error("Erreur lors de la création de l'utilisateur"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      toast.success(t("users.toastUpdated"));
    },
    onError: () => toast.error("Erreur lors de la modification"),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setArchiving(null);
      toast.success(t("users.toastArchived"));
    },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUnarchiving(null);
      toast.success(t("users.toastUnarchived") || "Utilisateur réactivé");
    },
    onError: () => toast.error("Erreur lors de la réactivation"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleting(null);
      toast.success(t("users.toastDeleted") || "Utilisateur supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const lockMutation = useMutation({
    mutationFn: lockAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Compte verrouillé");
    },
    onError: () => toast.error("Erreur lors du verrouillage"),
  });

  const unlockMutation = useMutation({
    mutationFn: unlockAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Compte déverrouillé");
    },
    onError: () => toast.error("Erreur lors du déverrouillage"),
  });

  // Statistiques utilisateurs depuis l'API
  const { data: userStats } = useQuery({
    queryKey: ['users', 'statistics'],
    queryFn: getUserStatistics,
    staleTime: 60_000,
  });

  // Distribution des rôles
  const { data: roleDistribution } = useQuery({
    queryKey: ['users', 'statistics', 'roles'],
    queryFn: getUserRoleDistribution,
    staleTime: 60_000,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => toast.success("Email de réinitialisation envoyé"),
    onError: () => toast.error("Erreur lors de la réinitialisation"),
  });

  // Création d'un nouvel utilisateur
  const handleCreate = () => {
    if (!form.nom || !form.prenom || !form.email || !form.password) return;
    if (form.password !== form.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    createMutation.mutate({
      nom: form.nom, prenom: form.prenom, email: form.email,
      telephone: form.telephone || undefined, role: form.role,
      password: form.password, confirmPassword: form.confirmPassword,
      dateNaissance: form.dateNaissance || undefined,
      lieuNaissance: form.lieuNaissance || undefined,
      adresse: form.adresse || undefined,
      actif: true,
    });
  };

  // Mise à jour d'un utilisateur
  const handleUpdate = () => {
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      data: {
        nom: editing.nom, prenom: editing.prenom, email: editing.email,
        telephone: editing.telephone || undefined,
        dateNaissance: editing.dateNaissance || undefined,
        lieuNaissance: editing.lieuNaissance || undefined,
        adresse: editing.adresse || undefined,
        role: editing.role,
      },
    });
  };

  // Archivage (désactivation) d'un utilisateur
  const handleArchive = () => {
    if (!archiving) return;
    deactivateMutation.mutate(archiving.id);
  };

  // Désarchivage (activation) d'un utilisateur
  const handleUnarchive = () => {
    if (!unarchiving) return;
    activateMutation.mutate(unarchiving.id);
  };

  // Suppression définitive d'un utilisateur
  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("users.pageTitle")}</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />{t("users.newUser")}
          </Button>
        </div>
      </div>

      {/* Statistiques utilisateurs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("users.allStatuses") === "Tous" ? "Total" : "Total", value: userStats?.total ?? allUsers.length },
          { label: "Actifs", value: userStats?.actifs ?? allUsers.filter(u => u.actif).length },
          { label: "Archivés", value: userStats?.inactifs ?? allUsers.filter(u => !u.actif).length },
          { label: "Verrouillés", value: userStats?.verrouilles ?? allUsers.filter(u => u.compteVerrouille).length },
        ].map((kpi, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="font-heading text-lg font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Distribution par rôle */}
      {roleDistribution && Object.keys(roleDistribution).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(roleDistribution).map(([role, count]) => (
            <div key={role} className="rounded-lg border border-border bg-card px-4 py-2 text-center">
              <p className="text-sm font-bold text-foreground">{count as number}</p>
              <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role as UserRole] || role}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres de recherche */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("users.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{t("users.allRoles")}</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.label}>{r.label}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{t("users.allStatuses")}</option>
          {["Actif", "Archivé"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[t("users.colUser"), t("users.colPhone"), t("users.colRole"), t("users.colStatus"), t("users.colActions")].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Chargement...</td></tr>
            )}
            {paginated.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-heading text-xs font-bold text-primary">{(u.prenom?.[0] ?? "?")}{(u.nom?.[0] ?? "?")}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.prenom} {u.nom}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.telephone ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    u.role === "ADMIN" ? "bg-primary/15 text-primary border-primary/30" :
                    u.role === "GERANT" ? "bg-secondary/15 text-secondary border-secondary/30" :
                    "bg-muted text-muted-foreground border-border"
                  )}>{ROLE_LABELS[u.role]}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.actif ? "Actif" : "Archivé"} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={t("users.edit") || "Modifier"} onClick={() => setEditing({ ...u })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {u.actif ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning" title={t("users.archive") || "Archiver"} onClick={() => setArchiving(u)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" title={t("users.unarchive") || "Désarchiver"} onClick={() => setUnarchiving(u)}>
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    )}
                    {u.compteVerrouille ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-600" title="Déverrouiller" onClick={() => unlockMutation.mutate(u.id)}>
                        <Unlock className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-500" title="Verrouiller" onClick={() => lockMutation.mutate(u.id)}>
                        <Lock className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title={t("users.delete") || "Supprimer"} onClick={() => setDeleting(u)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" title="Réinitialiser MDP" onClick={() => resetPasswordMutation.mutate(u.email)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ Modal de création d'utilisateur avec champs facultatifs ═══ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("users.modalNewTitle")}</DialogTitle>
            <DialogDescription>{t("users.modalNewDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Champs obligatoires */}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">{t("users.firstName")} *</label><Input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{t("users.lastName")} *</label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Email *</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{t("users.phone")}</label><Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="mt-1" /></div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("users.role")}</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Mot de passe *</label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Confirmer MDP *</label><Input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} className="mt-1" /></div>
            </div>

            {/* Champs facultatifs */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("users.optionalSection")}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("users.dateOfBirth")}</label>
                  <Input type="date" value={form.dateNaissance} onChange={e => setForm(p => ({ ...p, dateNaissance: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("users.placeOfBirth")}</label>
                  <Input value={form.lieuNaissance} onChange={e => setForm(p => ({ ...p, lieuNaissance: e.target.value }))} placeholder={t("users.placeOfBirthPlaceholder")} className="mt-1" />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium text-muted-foreground">{t("users.address")}</label>
                <Input value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} placeholder={t("users.addressPlaceholder")} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>{t("users.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate}
              disabled={!form.nom || !form.prenom || !form.email || !form.password || createMutation.isPending}>
              {createMutation.isPending ? "En cours..." : t("users.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal de modification d'utilisateur ═══ */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("users.modalEditTitle")}</DialogTitle>
            <DialogDescription>{editing?.prenom} {editing?.nom}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">{t("users.firstName")}</label><Input value={editing.prenom} onChange={e => setEditing({ ...editing, prenom: e.target.value })} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">{t("users.lastName")}</label><Input value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })} className="mt-1" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{t("users.phone")}</label><Input value={editing.telephone ?? ""} onChange={e => setEditing({ ...editing, telephone: e.target.value })} className="mt-1" /></div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("users.role")} (non modifiable)</label>
                <p className="mt-1 h-10 flex items-center px-3 rounded-lg border border-border bg-muted text-sm text-muted-foreground">{ROLE_LABELS[editing.role]}</p>
              </div>

              {/* Champs facultatifs en édition */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("users.optionalSection")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("users.dateOfBirth")}</label>
                    <Input type="date" value={editing.dateNaissance || ""} onChange={e => setEditing({ ...editing, dateNaissance: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t("users.placeOfBirth")}</label>
                    <Input value={editing.lieuNaissance || ""} onChange={e => setEditing({ ...editing, lieuNaissance: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-muted-foreground">{t("users.address")}</label>
                  <Input value={editing.adresse || ""} onChange={e => setEditing({ ...editing, adresse: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("users.accessRights")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {allModules.map(m => (
                    <label key={m} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-muted/30">
                      <input type="checkbox" defaultChecked className="rounded border-border" />
                      <span className="text-xs text-foreground">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t("users.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdate}>{t("users.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialogue de confirmation d'archivage ═══ */}
      <AlertDialog open={!!archiving} onOpenChange={o => !o && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.archiveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.archiveConfirm").replace("{name}", `${archiving?.prenom} ${archiving?.nom}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("users.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="bg-warning text-warning-foreground hover:bg-warning/90">{t("users.archive")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Dialogue de confirmation de désarchivage ═══ */}
      <AlertDialog open={!!unarchiving} onOpenChange={o => !o && setUnarchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désarchiver cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {unarchiving?.prenom} {unarchiving?.nom} sera réactivé et pourra à nouveau accéder à l'application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("users.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnarchive} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Désarchiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Dialogue de confirmation de suppression ═══ */}
      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting?.prenom} {deleting?.nom}</strong> sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("users.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
