import { Shield, LogIn, Edit, Trash2, Download, Eye } from "lucide-react";
import { motion } from "framer-motion";

const auditLog = [
  { id:"1",action:"Connexion",user:"Me Diallo",detail:"Connexion depuis Conakry",date:"2026-03-09 08:15",icon:LogIn,color:"text-success bg-success/15" },
  { id:"2",action:"Modification dossier",user:"Me Keita",detail:"DOS-2026-001 — Statut → En cours",date:"2026-03-09 09:30",icon:Edit,color:"text-secondary bg-secondary/15" },
  { id:"3",action:"Suppression document",user:"Me Diallo",detail:"Brouillon facture supprimé",date:"2026-03-08 16:45",icon:Trash2,color:"text-destructive bg-destructive/15" },
  { id:"4",action:"Export données",user:"Comptable",detail:"Export CSV factures mars 2026",date:"2026-03-08 14:20",icon:Download,color:"text-primary bg-primary/15" },
  { id:"5",action:"Consultation dossier",user:"Me Keita",detail:"DOS-2026-003 consulté",date:"2026-03-08 11:00",icon:Eye,color:"text-muted-foreground bg-muted" },
  { id:"6",action:"Connexion",user:"Comptable",detail:"Connexion depuis Conakry",date:"2026-03-08 08:05",icon:LogIn,color:"text-success bg-success/15" },
  { id:"7",action:"Modification client",user:"Me Diallo",detail:"Mise à jour fiche Camara Fatoumata",date:"2026-03-07 17:30",icon:Edit,color:"text-secondary bg-secondary/15" },
];

export default function SecuriteAudit() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Shield className="h-6 w-6 text-primary"/><h1 className="font-heading text-xl font-bold text-foreground">Sécurité & Audit</h1></div>
      <div className="grid grid-cols-3 gap-4">
        {[{l:"Événements aujourd'hui",v:"12"},{l:"Utilisateurs actifs",v:"4"},{l:"Alertes",v:"0"}].map(s=>(
          <div key={s.l} className="rounded-xl border border-border bg-card p-4 text-center shadow-card"><p className="font-heading text-2xl font-bold text-foreground">{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Journal d'audit</h2>
        <div className="space-y-3">
          {auditLog.map((a,i)=>(
            <motion.div key={a.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}} className="flex items-start gap-4 rounded-lg bg-muted/30 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.color}`}><a.icon className="h-4 w-4"/></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{a.action}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div>
              <div className="text-right shrink-0"><p className="text-xs text-muted-foreground">{a.user}</p><p className="text-[10px] text-muted-foreground">{a.date}</p></div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
