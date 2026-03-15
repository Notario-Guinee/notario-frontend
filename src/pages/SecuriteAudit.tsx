// ═══════════════════════════════════════════════════════════════
// Page Sécurité & Audit — Journal d'activité et contrôle d'accès
// Affiche l'historique des connexions, modifications et alertes
// de sécurité de tous les utilisateurs du cabinet
// ═══════════════════════════════════════════════════════════════

import { Shield, LogIn, Edit, Trash2, Download, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const auditLog = [
  { id:"1",actionKey:"audit.actionLogin",user:"Me Diallo",detail:"Connexion depuis Conakry",date:"2026-03-09 08:15",icon:LogIn,color:"text-success bg-success/15" },
  { id:"2",actionKey:"audit.actionEditCase",user:"Me Keita",detail:"DOS-2026-001 — Statut → En cours",date:"2026-03-09 09:30",icon:Edit,color:"text-secondary bg-secondary/15" },
  { id:"3",actionKey:"audit.actionDeleteDoc",user:"Me Diallo",detail:"Brouillon facture supprimé",date:"2026-03-08 16:45",icon:Trash2,color:"text-destructive bg-destructive/15" },
  { id:"4",actionKey:"audit.actionExport",user:"Comptable",detail:"Export CSV factures mars 2026",date:"2026-03-08 14:20",icon:Download,color:"text-primary bg-primary/15" },
  { id:"5",actionKey:"audit.actionViewCase",user:"Me Keita",detail:"DOS-2026-003 consulté",date:"2026-03-08 11:00",icon:Eye,color:"text-muted-foreground bg-muted" },
  { id:"6",actionKey:"audit.actionLogin",user:"Comptable",detail:"Connexion depuis Conakry",date:"2026-03-08 08:05",icon:LogIn,color:"text-success bg-success/15" },
  { id:"7",actionKey:"audit.actionEditClient",user:"Me Diallo",detail:"Mise à jour fiche Camara Fatoumata",date:"2026-03-07 17:30",icon:Edit,color:"text-secondary bg-secondary/15" },
];

export default function SecuriteAudit() {
  const { t } = useLanguage();

  const stats = [
    { labelKey: "audit.eventsToday", v: "12" },
    { labelKey: "audit.activeUsers", v: "4" },
    { labelKey: "audit.alerts", v: "0" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Shield className="h-6 w-6 text-primary"/><h1 className="font-heading text-xl font-bold text-foreground">{t("audit.pageTitle")}</h1></div>
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s=>(
          <div key={s.labelKey} className="rounded-xl border border-border bg-card p-4 text-center shadow-card"><p className="font-heading text-2xl font-bold text-foreground">{s.v}</p><p className="text-xs text-muted-foreground">{t(s.labelKey)}</p></div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("audit.logTitle")}</h2>
        <div className="space-y-3">
          {auditLog.map((a,i)=>(
            <motion.div key={a.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}} className="flex items-start gap-4 rounded-lg bg-muted/30 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.color}`}><a.icon className="h-4 w-4"/></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{t(a.actionKey)}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div>
              <div className="text-right shrink-0"><p className="text-xs text-muted-foreground">{a.user}</p><p className="text-[10px] text-muted-foreground">{a.date}</p></div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
