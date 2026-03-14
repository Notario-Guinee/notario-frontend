// ═══════════════════════════════════════════════════════════════
// Page Utilisateurs — Gestion des utilisateurs du cabinet
// Inclut : champs facultatifs (date/lieu naissance, adresse),
// filtrage, création, modification, archivage
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { cn, searchMatch } from "@/lib/utils";
import { Plus, Search, Edit, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

// Interface utilisateur avec champs facultatifs
interface User {
  id: string; code: string; nom: string; prenom: string; telephone: string;
  email: string; role: string; statut: string; photo?: string;
  permissions: string[];
  // Champs facultatifs
  dateNaissance?: string;
  lieuNaissance?: string;
  adresse?: string;
}

// Données initiales des utilisateurs
const initialUsers: User[] = [
  { id: "1", code: "USR-001", nom: "Diallo", prenom: "Mamadou", telephone: "+224 622 11 22 33", email: "m.diallo@notario.gn", role: "Gérant", statut: "Actif", permissions: ["all"], dateNaissance: "1975-05-15", lieuNaissance: "Conakry", adresse: "Quartier Almamya, Kaloum" },
  { id: "2", code: "USR-002", nom: "Keita", prenom: "Aissata", telephone: "+224 628 44 55 66", email: "a.keita@notario.gn", role: "Notaire", statut: "Actif", permissions: ["dossiers", "actes", "clients"] },
  { id: "3", code: "USR-003", nom: "Diallo", prenom: "Boubacar", telephone: "+224 664 77 88 99", email: "b.diallo@notario.gn", role: "Comptable", statut: "Actif", permissions: ["factures", "paiements"] },
  { id: "4", code: "USR-004", nom: "Bah", prenom: "Fatoumata", telephone: "+224 621 33 44 55", email: "f.bah@notario.gn", role: "Standard", statut: "Actif", permissions: ["dossiers:view"] },
  { id: "5", code: "USR-005", nom: "Camara", prenom: "Sékou", telephone: "+224 625 66 77 88", email: "s.camara@notario.gn", role: "Standard", statut: "Archivé", permissions: [] },
];

// Liste des modules disponibles pour les droits d'accès
const allModules = ["Clients", "Dossiers", "Actes", "Factures", "Paiements", "Archives", "Messagerie", "Agenda", "Kanban"];

export default function Utilisateurs() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [archiving, setArchiving] = useState<User | null>(null);
  // Formulaire avec champs facultatifs
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", role: "Standard",
    dateNaissance: "", lieuNaissance: "", adresse: "",
  });
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Filtrage des utilisateurs
  const filtered = users.filter(u => {
    const matchSearch = !search || [u.nom, u.prenom, u.email, u.telephone, u.code, u.role].some(f => searchMatch(f, search));
    const matchRole = filterRole === "Tous" || u.role === filterRole;
    const matchStatut = filterStatut === "Tous" || u.statut === filterStatut;
    return matchSearch && matchRole && matchStatut;
  });

  // Création d'un nouvel utilisateur
  const handleCreate = () => {
    const code = `USR-${String(users.length + 1).padStart(3, "0")}`;
    setUsers(prev => [...prev, {
      id: String(Date.now()), code, nom: form.nom, prenom: form.prenom,
      telephone: form.telephone, email: form.email, role: form.role,
      statut: "Actif", permissions: [],
      dateNaissance: form.dateNaissance || undefined,
      lieuNaissance: form.lieuNaissance || undefined,
      adresse: form.adresse || undefined,
    }]);
    setShowNew(false);
    setForm({ nom: "", prenom: "", email: "", telephone: "", role: "Standard", dateNaissance: "", lieuNaissance: "", adresse: "" });
    toast.success(fr ? "Utilisateur ajouté" : "User added");
  };

  // Mise à jour d'un utilisateur
  const handleUpdate = () => {
    if (!editing) return;
    setUsers(prev => prev.map(u => u.id === editing.id ? editing : u));
    setEditing(null);
    toast.success(fr ? "Utilisateur mis à jour" : "User updated");
  };

  // Archivage d'un utilisateur
  const handleArchive = () => {
    if (!archiving) return;
    setUsers(prev => prev.map(u => u.id === archiving.id ? { ...u, statut: "Archivé" } : u));
    setArchiving(null);
    toast.success(fr ? "Utilisateur archivé" : "User archived");
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{fr ? "Utilisateurs du cabinet" : "Office Users"}</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />{fr ? "Nouvel utilisateur" : "New user"}
          </Button>
        </div>
      </div>

      {/* Filtres de recherche */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher par nom, email, code..." : "Search by name, email, code..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les rôles" : "All roles"}</option>
          {["Gérant", "Notaire", "Comptable", "Standard"].map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les statuts" : "All statuses"}</option>
          {["Actif", "Archivé"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[fr ? "Utilisateur" : "User", "Code", fr ? "Téléphone" : "Phone", fr ? "Rôle" : "Role", fr ? "Statut" : "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-heading text-xs font-bold text-primary">{u.prenom[0]}{u.nom[0]}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.prenom} {u.nom}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{u.code}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.telephone}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    u.role === "Gérant" ? "bg-primary/15 text-primary border-primary/30" :
                    u.role === "Notaire" ? "bg-secondary/15 text-secondary border-secondary/30" :
                    "bg-muted text-muted-foreground border-border"
                  )}>{u.role}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.statut} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...u })}><Edit className="h-4 w-4" /></Button>
                    {u.statut !== "Archivé" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning" onClick={() => setArchiving(u)}><Archive className="h-4 w-4" /></Button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ Modal de création d'utilisateur avec champs facultatifs ═══ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouvel utilisateur" : "New user"}</DialogTitle>
            <DialogDescription>{fr ? "Ajouter un membre à votre cabinet" : "Add a member to your office"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Champs obligatoires */}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Prénom" : "First name"} *</label><Input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Last name"} *</label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Email *</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Téléphone" : "Phone"} *</label><Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="mt-1" /></div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Rôle" : "Role"}</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                {["Standard", "Notaire", "Comptable"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Champs facultatifs */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Informations facultatives" : "Optional information"}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Date de naissance" : "Date of birth"}</label>
                  <Input type="date" value={form.dateNaissance} onChange={e => setForm(p => ({ ...p, dateNaissance: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Lieu de naissance" : "Place of birth"}</label>
                  <Input value={form.lieuNaissance} onChange={e => setForm(p => ({ ...p, lieuNaissance: e.target.value }))} placeholder={fr ? "Ex: Conakry" : "e.g. Conakry"} className="mt-1" />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Adresse" : "Address"}</label>
                <Input value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} placeholder={fr ? "Ex: Quartier Almamya, Kaloum, Conakry" : "e.g. Almamya, Kaloum, Conakry"} className="mt-1" />
              </div>
            </div>

            {/* Droits d'accès aux modules */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{fr ? "Droits d'accès aux modules" : "Module access rights"}</label>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate} disabled={!form.nom || !form.prenom || !form.email}>
              {fr ? "Ajouter" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal de modification d'utilisateur ═══ */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier l'utilisateur" : "Edit user"}</DialogTitle>
            <DialogDescription>{editing?.prenom} {editing?.nom}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Prénom" : "First name"}</label><Input value={editing.prenom} onChange={e => setEditing({ ...editing, prenom: e.target.value })} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Last name"}</label><Input value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })} className="mt-1" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Téléphone" : "Phone"}</label><Input value={editing.telephone} onChange={e => setEditing({ ...editing, telephone: e.target.value })} className="mt-1" /></div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Rôle" : "Role"}</label>
                <select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  {["Standard", "Notaire", "Comptable", "Gérant"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              {/* Champs facultatifs en édition */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{fr ? "Informations facultatives" : "Optional information"}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "Date de naissance" : "Date of birth"}</label>
                    <Input type="date" value={editing.dateNaissance || ""} onChange={e => setEditing({ ...editing, dateNaissance: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{fr ? "Lieu de naissance" : "Place of birth"}</label>
                    <Input value={editing.lieuNaissance || ""} onChange={e => setEditing({ ...editing, lieuNaissance: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-muted-foreground">{fr ? "Adresse" : "Address"}</label>
                  <Input value={editing.adresse || ""} onChange={e => setEditing({ ...editing, adresse: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{fr ? "Droits d'accès" : "Access rights"}</label>
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
            <Button variant="outline" onClick={() => setEditing(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdate}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialogue de confirmation d'archivage ═══ */}
      <AlertDialog open={!!archiving} onOpenChange={o => !o && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Archiver l'utilisateur" : "Archive user"}</AlertDialogTitle>
            <AlertDialogDescription>
              {fr ? `Archiver ${archiving?.prenom} ${archiving?.nom} ? L'utilisateur n'aura plus accès au système.` : `Archive ${archiving?.prenom} ${archiving?.nom}? The user will no longer have access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="bg-warning text-warning-foreground hover:bg-warning/90">{fr ? "Archiver" : "Archive"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
