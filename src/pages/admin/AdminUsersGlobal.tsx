import { useState } from "react";
import { cn, searchMatch } from "@/lib/utils";
import { Users, Plus, Edit, Search, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface User {
  id: string; nom: string; prenom: string; email: string; telephone: string;
  role: string; cabinet: string; statut: string; temporaire: boolean;
  dateExpiration?: string; permissions: string[];
}

const initialUsers: User[] = [
  { id: "1", nom: "Diallo", prenom: "Mamadou", email: "m.diallo@notario.gn", telephone: "+224 622 11 22 33", role: "Gérant", cabinet: "Étude Diallo & Associés", statut: "Actif", temporaire: false, permissions: ["all"] },
  { id: "2", nom: "Keita", prenom: "Aissata", email: "a.keita@notario.gn", telephone: "+224 628 44 55 66", role: "Notaire", cabinet: "Étude Diallo & Associés", statut: "Actif", temporaire: false, permissions: ["dossiers", "actes", "clients"] },
  { id: "3", nom: "Bah", prenom: "Ibrahima", email: "i.bah@notario.gn", telephone: "+224 628 77 88 99", role: "Gérant", cabinet: "Cabinet Notarial Bah", statut: "Actif", temporaire: false, permissions: ["all"] },
  { id: "4", nom: "Camara", prenom: "Fatoumata", email: "f.camara@notario.gn", telephone: "+224 664 11 22 33", role: "Gérant", cabinet: "Étude Camara", statut: "Actif", temporaire: false, permissions: ["all"] },
  { id: "5", nom: "Sylla", prenom: "Mohamed", email: "m.sylla@notario.gn", telephone: "+224 622 44 55 66", role: "Comptable", cabinet: "Étude Diallo & Associés", statut: "Actif", temporaire: true, dateExpiration: "2026-06-30", permissions: ["factures", "paiements"] },
  { id: "6", nom: "Barry", prenom: "Ousmane", email: "o.barry@notario.gn", telephone: "+224 625 77 88 99", role: "Standard", cabinet: "Étude Camara", statut: "Archivé", temporaire: false, permissions: ["dossiers:view"] },
];

const allModules = ["Clients", "Dossiers", "Actes", "Factures", "Paiements", "Archives", "Messagerie", "Agenda", "Kanban", "Portail"];

export default function AdminUsersGlobal() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterCabinet, setFilterCabinet] = useState("Tous");
  const [filterRole, setFilterRole] = useState("Tous");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "", role: "Standard", cabinet: "", temporaire: false, dureeAcces: "" });

  const cabinets = [...new Set(users.map(u => u.cabinet))];

  const filtered = users.filter(u => {
    const matchSearch = !search || [u.nom, u.prenom, u.email, u.telephone, u.cabinet, u.role].some(f => searchMatch(f, search));
    const matchCabinet = filterCabinet === "Tous" || u.cabinet === filterCabinet;
    const matchRole = filterRole === "Tous" || u.role === filterRole;
    return matchSearch && matchCabinet && matchRole;
  });

  const handleCreate = () => {
    setUsers(prev => [...prev, {
      id: String(Date.now()), nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.telephone,
      role: form.role, cabinet: form.cabinet, statut: "Actif", temporaire: form.temporaire,
      dateExpiration: form.temporaire && form.dureeAcces ? (() => { const d = new Date(); d.setMonth(d.getMonth() + parseInt(form.dureeAcces)); return d.toISOString().slice(0, 10); })() : undefined,
      permissions: [],
    }]);
    setShowNew(false);
    setForm({ nom: "", prenom: "", email: "", telephone: "", role: "Standard", cabinet: "", temporaire: false, dureeAcces: "" });
    toast.success(fr ? "Utilisateur créé" : "User created");
  };

  const handleUpdate = () => {
    if (!editing) return;
    setUsers(prev => prev.map(u => u.id === editing.id ? editing : u));
    setEditing(null);
    toast.success(fr ? "Utilisateur mis à jour" : "User updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Utilisateurs Globaux" : "Global Users"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{fr ? "Vue globale des utilisateurs de tous les cabinets" : "Global view of users across all offices"}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> {fr ? "Nouvel utilisateur" : "New user"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterCabinet} onChange={e => setFilterCabinet(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les cabinets" : "All offices"}</option>
          {cabinets.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les rôles" : "All roles"}</option>
          {["Gérant", "Notaire", "Comptable", "Standard"].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[fr ? "Utilisateur" : "User", "Cabinet", fr ? "Rôle" : "Role", fr ? "Statut" : "Status", fr ? "Type" : "Type", "Actions"].map(h => (
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
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.cabinet}</td>
                <td className="px-4 py-3"><span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", u.role === "Gérant" ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border")}>{u.role}</span></td>
                <td className="px-4 py-3"><StatusBadge status={u.statut} /></td>
                <td className="px-4 py-3">
                  {u.temporaire ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-warning" />
                      <span className="text-[10px] text-warning font-semibold">{fr ? "Temporaire" : "Temporary"}</span>
                      {u.dateExpiration && <span className="text-[10px] text-muted-foreground ml-1">→ {new Date(u.dateExpiration).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  ) : <span className="text-[10px] text-muted-foreground">{fr ? "Permanent" : "Permanent"}</span>}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...u })}><Edit className="h-4 w-4" /></Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New User */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouvel utilisateur" : "New user"}</DialogTitle>
            <DialogDescription>{fr ? "Créer un utilisateur pour un cabinet" : "Create a user for an office"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Prénom" : "First name"}</label><Input value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Last name"}</label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Téléphone" : "Phone"}</label><Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cabinet</label>
                <select value={form.cabinet} onChange={e => setForm(p => ({ ...p, cabinet: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">{fr ? "Sélectionner" : "Select"}</option>
                  {cabinets.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Rôle" : "Role"}</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  {["Standard", "Notaire", "Comptable", "Gérant"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch checked={form.temporaire} onCheckedChange={v => setForm(p => ({ ...p, temporaire: v }))} />
              <div>
                <p className="text-sm font-medium text-foreground">{fr ? "Utilisateur temporaire" : "Temporary user"}</p>
                <p className="text-xs text-muted-foreground">{fr ? "Accès limité dans le temps" : "Time-limited access"}</p>
              </div>
            </div>
            {form.temporaire && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Durée d'accès" : "Access duration"}</label>
                <select value={form.dureeAcces} onChange={e => setForm(p => ({ ...p, dureeAcces: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">{fr ? "Sélectionner" : "Select"}</option>
                  {["1", "3", "6", "12"].map(d => <option key={d} value={d}>{d} {fr ? "mois" : "months"}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{fr ? "Accès aux modules" : "Module access"}</label>
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
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreate}>{fr ? "Créer" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier l'utilisateur" : "Edit user"}</DialogTitle>
            <DialogDescription>{editing?.prenom} {editing?.nom}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Rôle" : "Role"}</label>
                  <select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {["Standard", "Notaire", "Comptable", "Gérant"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Statut" : "Status"}</label>
                  <select value={editing.statut} onChange={e => setEditing({ ...editing, statut: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                    {["Actif", "Archivé"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{fr ? "Accès aux modules" : "Module access"}</label>
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
    </div>
  );
}
