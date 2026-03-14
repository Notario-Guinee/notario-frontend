import { useState } from "react";
import { cn, searchMatch } from "@/lib/utils";
import { Shield, Search, Download, LogIn, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const auditLog = [
  { id: "1", action: "Connexion", user: "Me Diallo", cabinet: "Étude Diallo", detail: "Connexion depuis Conakry", date: "2026-03-09 08:15", icon: LogIn, color: "text-success bg-success/15" },
  { id: "2", action: "Modification dossier", user: "Me Keita", cabinet: "Étude Diallo", detail: "DOS-2026-001 — Statut → En cours", date: "2026-03-09 09:30", icon: Edit, color: "text-secondary bg-secondary/15" },
  { id: "3", action: "Suppression document", user: "Me Diallo", cabinet: "Étude Diallo", detail: "Brouillon facture supprimé", date: "2026-03-08 16:45", icon: Trash2, color: "text-destructive bg-destructive/15" },
  { id: "4", action: "Export données", user: "Comptable", cabinet: "Étude Diallo", detail: "Export CSV factures mars 2026", date: "2026-03-08 14:20", icon: Download, color: "text-primary bg-primary/15" },
  { id: "5", action: "Connexion", user: "Me Bah", cabinet: "Cabinet Bah", detail: "Connexion depuis Kankan", date: "2026-03-08 11:00", icon: LogIn, color: "text-success bg-success/15" },
  { id: "6", action: "Connexion", user: "Me Camara", cabinet: "Étude Camara", detail: "Connexion depuis Conakry", date: "2026-03-08 08:05", icon: LogIn, color: "text-success bg-success/15" },
  { id: "7", action: "Modification client", user: "Me Diallo", cabinet: "Étude Diallo", detail: "Mise à jour fiche Camara Fatoumata", date: "2026-03-07 17:30", icon: Edit, color: "text-secondary bg-secondary/15" },
  { id: "8", action: "Consultation dossier", user: "Me Camara", cabinet: "Étude Camara", detail: "DOS-2026-003 consulté", date: "2026-03-07 10:15", icon: Eye, color: "text-muted-foreground bg-muted" },
];

export default function AdminAudit() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [search, setSearch] = useState("");
  const [filterCabinet, setFilterCabinet] = useState("Tous");

  const cabinets = [...new Set(auditLog.map(a => a.cabinet))];

  const filtered = auditLog.filter(a => {
    const matchSearch = !search || [a.action, a.user, a.detail].some(f => searchMatch(f, search));
    const matchCabinet = filterCabinet === "Tous" || a.cabinet === filterCabinet;
    return matchSearch && matchCabinet;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Journal d'audit global" : "Global Audit Log"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fr ? "Traçabilité de tous les cabinets" : "Traceability across all offices"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: fr ? "Événements aujourd'hui" : "Today's events", v: "24", color: "bg-blue-50 dark:bg-blue-900/20" },
          { l: fr ? "Cabinets actifs" : "Active offices", v: "3", color: "bg-emerald-50 dark:bg-emerald-900/20" },
          { l: fr ? "Alertes" : "Alerts", v: "1", color: "bg-rose-50 dark:bg-rose-900/20" },
        ].map(s => (
          <div key={s.l} className={cn("rounded-xl border border-border p-5 text-center", s.color)}>
            <p className="font-heading text-3xl font-bold text-foreground">{s.v}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterCabinet} onChange={e => setFilterCabinet(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les cabinets" : "All offices"}</option>
          {cabinets.map(c => <option key={c}>{c}</option>)}
        </select>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> {fr ? "Exporter" : "Export"}</Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-3">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-start gap-4 rounded-lg bg-muted/30 p-3.5 hover:bg-muted/50 transition-colors">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", a.color)}>
                <a.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-foreground">{a.user}</p>
                <p className="text-[10px] text-primary">{a.cabinet}</p>
                <p className="text-[10px] text-muted-foreground">{a.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
