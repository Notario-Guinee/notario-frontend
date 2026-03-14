import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatGNF } from "@/data/mockData";
import { Building2, Users, Receipt, Activity } from "lucide-react";
import { motion } from "framer-motion";

const tenants = [
  { id:"1",nom:"Étude Diallo & Associés",gerant:"Me Mamadou Diallo",sousDomaine:"diallo",users:4,modules:["Clients","Dossiers","Factures","Archives"],statut:"Actif",date:"2025-06-15" },
  { id:"2",nom:"Cabinet Notarial Bah",gerant:"Me Ibrahima Bah",sousDomaine:"bah-notaire",users:2,modules:["Clients","Dossiers","Factures"],statut:"Actif",date:"2025-09-20" },
  { id:"3",nom:"Étude Camara",gerant:"Me Fatoumata Camara",sousDomaine:"camara",users:6,modules:["Clients","Dossiers","Factures","Archives","Messagerie","Portail"],statut:"Actif",date:"2025-11-01" },
  { id:"4",nom:"SN Condé",gerant:"Me Mariama Condé",sousDomaine:"conde",users:1,modules:["Clients","Dossiers"],statut:"Suspendu",date:"2026-01-10" },
];

export default function AdminTenants() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">🛡️ Gestion des Tenants</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total cabinets" value="4" icon={Building2} accentColor="blue"/>
        <KpiCard title="Cabinets actifs" value="3" icon={Activity} accentColor="green"/>
        <KpiCard title="Revenus mensuels" value={formatGNF(3900000)} icon={Receipt} accentColor="blue"/>
        <KpiCard title="Utilisateurs totaux" value="13" icon={Users} accentColor="teal"/>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full"><thead><tr className="border-b border-border">{["Cabinet","Gérant","Sous-domaine","Utilisateurs","Modules","Statut","Date création"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
        <tbody>{tenants.map(t=>(
          <motion.tr key={t.id} initial={{opacity:0}} animate={{opacity:1}} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-foreground">{t.nom}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{t.gerant}</td>
            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.sousDomaine}.notario.gn</td>
            <td className="px-4 py-3 text-sm text-foreground">{t.users}</td>
            <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{t.modules.map(m=><span key={m} className="rounded-md bg-secondary/10 px-1.5 py-0.5 text-[10px] text-secondary">{m}</span>)}</div></td>
            <td className="px-4 py-3"><StatusBadge status={t.statut}/></td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
          </motion.tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
