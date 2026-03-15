// ═══════════════════════════════════════════════════════════════
// Page Admin Leads & Démos — Gestion des prospects commerciaux
// Suivi des leads entrants, demandes de démonstration et pipeline
// de conversion vers les abonnements de la plateforme Notario
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { cn, searchMatch } from "@/lib/utils";
import { Search, Plus, Edit, Eye, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface Lead {
  id: string; nom: string; prenom: string; cabinet: string; email: string; tel: string;
  message: string; type: string; date: string; statut: string; notes: string;
}

const initialLeads: Lead[] = [
  { id: "1", nom: "Diallo", prenom: "Alpha", cabinet: "Étude Diallo", email: "alpha@email.gn", tel: "+224 622 11 11 11", message: "Intéressé par la solution complète.", type: "Démo", date: "2026-03-08", statut: "Nouveau", notes: "" },
  { id: "2", nom: "Bah", prenom: "Kadiatou", cabinet: "Cabinet Bah", email: "k.bah@email.gn", tel: "+224 628 22 22 22", message: "Souhaite une démo du module facturation.", type: "Démo", date: "2026-03-05", statut: "En cours", notes: "Appelé le 06/03" },
  { id: "3", nom: "Sylla", prenom: "Ousmane", cabinet: "Étude Sylla", email: "o.sylla@email.gn", tel: "+224 664 33 33 33", message: "Migration depuis Excel souhaitée.", type: "Contact", date: "2026-02-28", statut: "Contacté", notes: "Envoyé proposition" },
  { id: "4", nom: "Condé", prenom: "Aminata", cabinet: "SN Condé", email: "a.conde@email.gn", tel: "+224 621 44 44 44", message: "Budget limité, plan basique.", type: "Contact", date: "2026-02-20", statut: "Fermé", notes: "Pas de suite" },
];

const statuts = ["Nouveau", "En cours", "Contacté", "Fermé"];

export default function AdminLeadsPage() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);

  const filtered = leads.filter(l => {
    const matchSearch = !search || [l.nom, l.prenom, l.cabinet, l.email, l.tel, l.message].some(f => searchMatch(f, search));
    const matchFilter = filterStatut === "Tous" || l.statut === filterStatut;
    return matchSearch && matchFilter;
  });

  const countByStatut = (s: string) => leads.filter(l => l.statut === s).length;

  const handleUpdateLead = () => {
    if (!editing) return;
    setLeads(prev => prev.map(l => l.id === editing.id ? editing : l));
    setEditing(null);
    toast.success(fr ? "Lead mis à jour" : "Lead updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Leads & Démos" : "Leads & Demos"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fr ? "Gestion des demandes issues de la landing page" : "Manage requests from the landing page"}</p>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statuts.map(s => (
          <div key={s} className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
            <p className="font-heading text-2xl font-bold text-foreground">{countByStatut(s)}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher un lead..." : "Search lead..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les statuts" : "All statuses"}</option>
          {statuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[fr ? "Nom" : "Name", "Cabinet", "Email", fr ? "Téléphone" : "Phone", "Type", "Message", "Date", fr ? "Statut" : "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{l.prenom} {l.nom}</td>
                <td className="px-4 py-3 text-sm text-foreground">{l.cabinet}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{l.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{l.tel}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{l.type}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{l.message}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(l.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3"><StatusBadge status={l.statut} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(l)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...l })}><Edit className="h-4 w-4" /></Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Lead */}
      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.prenom} {viewing?.nom}</DialogTitle>
            <DialogDescription>{viewing?.cabinet}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { l: "Email", v: viewing.email }, { l: fr ? "Téléphone" : "Phone", v: viewing.tel },
                  { l: "Type", v: viewing.type }, { l: fr ? "Statut" : "Status", v: viewing.statut },
                  { l: "Date", v: new Date(viewing.date).toLocaleDateString("fr-FR") },
                ].map(f => (
                  <div key={f.l}><label className="text-xs font-medium text-muted-foreground">{f.l}</label><p className="text-sm font-medium text-foreground mt-0.5">{f.v}</p></div>
                ))}
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Message</label><p className="text-sm text-foreground mt-1 bg-muted/30 rounded-lg p-3">{viewing.message}</p></div>
              {viewing.notes && <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Notes internes" : "Internal notes"}</label><p className="text-sm text-foreground mt-1 bg-muted/30 rounded-lg p-3">{viewing.notes}</p></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>{fr ? "Fermer" : "Close"}</Button>
            <Button onClick={() => { setEditing(viewing ? { ...viewing } : null); setViewing(null); }}>{fr ? "Modifier" : "Edit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier le lead" : "Edit lead"}</DialogTitle>
            <DialogDescription>{editing?.prenom} {editing?.nom}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Statut" : "Status"}</label>
                <select value={editing.statut} onChange={e => setEditing({ ...editing, statut: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                  {statuts.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Notes internes" : "Internal notes"}</label>
                <Textarea value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} placeholder={fr ? "Ajouter une note..." : "Add a note..."} className="mt-1" rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdateLead}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
