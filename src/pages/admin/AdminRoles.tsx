import { useState } from "react";
import { cn } from "@/lib/utils";
import { Shield, Users, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface Role {
  id: string; nom: string; badge: string; desc: string; users: number;
  permissions: string[]; actif: boolean;
}

const allPermissions = [
  "platform:admin", "tenant:manage", "security:manage", "cabinet:admin", "users:manage",
  "finance:manage", "dossiers:manage", "actes:manage", "signatures:manage",
  "dossiers:view", "clients:view", "reports:view", "factures:manage", "paiements:manage",
];

const initialRoles: Role[] = [
  { id: "1", nom: "Admin Global", badge: "Administrateur", desc: "Accès complet à la plateforme et gestion des tenants", users: 2, permissions: ["platform:admin", "tenant:manage", "security:manage"], actif: true },
  { id: "2", nom: "Gérant", badge: "Gérant", desc: "Administration complète du cabinet", users: 4, permissions: ["cabinet:admin", "users:manage", "finance:manage"], actif: true },
  { id: "3", nom: "Notaire", badge: "Utilisateur", desc: "Gestion des dossiers, actes et signatures", users: 8, permissions: ["dossiers:manage", "actes:manage", "signatures:manage"], actif: true },
  { id: "4", nom: "Assistant", badge: "Lecture seule", desc: "Accès en lecture seule", users: 6, permissions: ["dossiers:view", "clients:view", "reports:view"], actif: true },
  { id: "5", nom: "Comptabilité", badge: "Utilisateur", desc: "Gestion financière et facturation", users: 4, permissions: ["finance:manage", "factures:manage", "paiements:manage"], actif: true },
];

export default function AdminRoles() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [roles, setRoles] = useState(initialRoles);
  const [editing, setEditing] = useState<Role | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ nom: "", desc: "", badge: "Utilisateur", permissions: [] as string[] });

  const handleCreate = () => {
    setRoles(prev => [...prev, { id: String(Date.now()), nom: form.nom || "Nouveau rôle", badge: form.badge, desc: form.desc, users: 0, permissions: form.permissions, actif: true }]);
    setShowNew(false);
    setForm({ nom: "", desc: "", badge: "Utilisateur", permissions: [] });
    toast.success(fr ? "Rôle créé" : "Role created");
  };

  const handleUpdate = () => {
    if (!editing) return;
    setRoles(prev => prev.map(r => r.id === editing.id ? editing : r));
    setEditing(null);
    toast.success(fr ? "Rôle mis à jour" : "Role updated");
  };

  const badgeColors: Record<string, string> = {
    Administrateur: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    Gérant: "bg-primary/15 text-primary",
    Utilisateur: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "Lecture seule": "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Rôles & Permissions" : "Roles & Permissions"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{fr ? "Gérer les rôles et leurs permissions" : "Manage roles and their permissions"}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> {fr ? "Nouveau rôle" : "New role"}
        </Button>
      </div>

      <div className="space-y-4">
        {roles.map((role, i) => (
          <motion.div key={role.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">{role.nom}</h3>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", badgeColors[role.badge] || "bg-muted text-muted-foreground")}>{role.badge}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", role.actif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{role.actif ? (fr ? "Actif" : "Active") : (fr ? "Inactif" : "Inactive")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={role.actif} onCheckedChange={() => setRoles(prev => prev.map(r => r.id === role.id ? { ...r, actif: !r.actif } : r))} />
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditing({ ...role })}><Edit className="h-3 w-3 mr-1" /> {fr ? "Modifier" : "Edit"}</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{role.desc}</p>
            <div className="flex items-center gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {role.users} {fr ? "utilisateurs" : "users"}</span>
              <span className="text-xs text-muted-foreground">🔑 {role.permissions.length} permissions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map(p => (
                <span key={p} className="rounded-md bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground">{p}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Role */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouveau rôle" : "New role"}</DialogTitle>
            <DialogDescription>{fr ? "Définir un nouveau rôle et ses permissions" : "Define a new role and its permissions"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom du rôle" : "Role name"}</label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Description</label><Input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} className="mt-1" /></div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(p => (
                  <label key={p} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-muted/30">
                    <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => setForm(prev => ({
                      ...prev, permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p]
                    }))} className="rounded border-border" />
                    <span className="text-[10px] font-mono text-foreground">{p}</span>
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

      {/* Edit Role */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier le rôle" : "Edit role"}</DialogTitle>
            <DialogDescription>{editing?.nom}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Name"}</label><Input value={editing.nom} onChange={e => setEditing({ ...editing, nom: e.target.value })} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Description</label><Input value={editing.desc} onChange={e => setEditing({ ...editing, desc: e.target.value })} className="mt-1" /></div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {allPermissions.map(p => (
                    <label key={p} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-muted/30">
                      <input type="checkbox" checked={editing.permissions.includes(p)} onChange={() => setEditing({
                        ...editing, permissions: editing.permissions.includes(p) ? editing.permissions.filter(x => x !== p) : [...editing.permissions, p]
                      })} className="rounded border-border" />
                      <span className="text-[10px] font-mono text-foreground">{p}</span>
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
