// ═══════════════════════════════════════════════════════════════
// Page Monitoring — Surveillance des ressources de la plateforme
// Affiche les métriques système : CPU, RAM, base de données,
// stockage, utilisateurs connectés et état du réseau
// ═══════════════════════════════════════════════════════════════

import { Activity, Cpu, Database, HardDrive, Users, Wifi } from "lucide-react";

const metrics = [
  { label:"CPU",value:"23%",icon:Cpu,color:"text-success" },
  { label:"RAM",value:"4.2 / 8 Go",icon:Activity,color:"text-secondary" },
  { label:"Requêtes/sec",value:"142",icon:Wifi,color:"text-primary" },
  { label:"Connexions DB",value:"18",icon:Database,color:"text-teal" },
  { label:"Sessions actives",value:"12",icon:Users,color:"text-success" },
  { label:"Stockage total",value:"62 / 200 Go",icon:HardDrive,color:"text-primary" },
];

const tenantMetrics = [
  { cabinet:"Diallo & Associés",sessions:4,docs:156,storage:"15.5 Go" },
  { cabinet:"Cabinet Bah",sessions:2,docs:43,storage:"4.8 Go" },
  { cabinet:"Étude Camara",sessions:5,docs:210,storage:"28.3 Go" },
  { cabinet:"SN Condé",sessions:0,docs:12,storage:"1.2 Go" },
];

export default function AdminMonitoring() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">🖥️ Monitoring Plateforme</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map(m=>(
          <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
            <m.icon className={`mx-auto h-5 w-5 mb-2 ${m.color}`}/>
            <p className="font-heading text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-4"><h2 className="font-heading text-sm font-semibold text-foreground">Métriques par tenant</h2></div>
        <table className="w-full"><thead><tr className="border-b border-border">{["Cabinet","Sessions","Documents","Stockage"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
        <tbody>{tenantMetrics.map(t=>(
          <tr key={t.cabinet} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-foreground">{t.cabinet}</td>
            <td className="px-4 py-3 text-sm text-foreground">{t.sessions}</td>
            <td className="px-4 py-3 text-sm text-foreground">{t.docs}</td>
            <td className="px-4 py-3 text-sm text-foreground">{t.storage}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
