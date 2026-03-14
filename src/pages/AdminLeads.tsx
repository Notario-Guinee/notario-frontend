import { StatusBadge } from "@/components/ui/status-badge";
import { motion } from "framer-motion";

const leads = [
  { id:"1",nom:"Me Alpha Diallo",cabinet:"Étude Diallo",email:"alpha@email.gn",tel:"+224 622 11 11 11",message:"Intéressé par la solution complète.",date:"2026-03-08",statut:"Nouveau" },
  { id:"2",nom:"Me Kadiatou Bah",cabinet:"Cabinet Bah",email:"k.bah@email.gn",tel:"+224 628 22 22 22",message:"Souhaite une démo du module facturation.",date:"2026-03-05",statut:"En cours" },
  { id:"3",nom:"Me Ousmane Sylla",cabinet:"Étude Sylla",email:"o.sylla@email.gn",tel:"+224 664 33 33 33",message:"Migration depuis Excel souhaitée.",date:"2026-02-28",statut:"Contacté" },
  { id:"4",nom:"Me Aminata Condé",cabinet:"SN Condé",email:"a.conde@email.gn",tel:"+224 621 44 44 44",message:"Budget limité, plan basique.",date:"2026-02-20",statut:"Fermé" },
];

export default function AdminLeads() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">📈 Leads & Démos</h1>
      <div className="grid grid-cols-4 gap-3">{[{l:"Nouveau",v:1},{l:"En cours",v:1},{l:"Contacté",v:1},{l:"Fermé",v:1}].map(s=>(
        <div key={s.l} className="rounded-xl border border-border bg-card p-4 text-center"><p className="font-heading text-2xl font-bold text-foreground">{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
      ))}</div>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full"><thead><tr className="border-b border-border">{["Nom","Cabinet","Email","Téléphone","Message","Date","Statut"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
        <tbody>{leads.map(l=>(
          <motion.tr key={l.id} initial={{opacity:0}} animate={{opacity:1}} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-foreground">{l.nom}</td>
            <td className="px-4 py-3 text-sm text-foreground">{l.cabinet}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{l.email}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{l.tel}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{l.message}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(l.date).toLocaleDateString('fr-FR')}</td>
            <td className="px-4 py-3"><StatusBadge status={l.statut}/></td>
          </motion.tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
