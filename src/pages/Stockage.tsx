import { HardDrive, FileText, Image, Archive, File, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

const pieData = [
  { name:"Documents",value:8.2,color:"hsl(211 55% 48%)" },
  { name:"Archives",value:4.1,color:"hsl(200 67% 50%)" },
  { name:"Photos",value:2.3,color:"hsl(87 52% 49%)" },
  { name:"Autres",value:0.9,color:"hsl(220 24% 64%)" },
];
const fichiers = [
  { nom:"Titre foncier Soumah.pdf",taille:"6.2 Mo",date:"2025-12-10" },
  { nom:"Statuts SCI Palmiers.pdf",taille:"4.8 Mo",date:"2026-02-28" },
  { nom:"Plan cadastral.png",taille:"3.3 Mo",date:"2026-03-05" },
  { nom:"Acte vente Camara.pdf",taille:"2.4 Mo",date:"2026-02-15" },
  { nom:"Factures export.zip",taille:"1.8 Mo",date:"2026-03-01" },
];

export default function Stockage() {
  const used=15.5, total=20, pct=Math.round(used/total*100);
  const remaining = total - used;
  const lowStorage = remaining <= 1;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">Stockage</h1>

      {lowStorage && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Espace de stockage critique</p>
            <p className="text-xs text-destructive/80">Il ne reste que {remaining.toFixed(1)} Go. Contactez l'administrateur pour étendre votre espace de stockage.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-card flex flex-col sm:flex-row items-center gap-8">
        <div className="relative h-32 w-32 shrink-0">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5"/>
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={pct>90?"hsl(0 72% 51%)":pct>70?"hsl(211 55% 48%)":"hsl(87 52% 49%)"} strokeWidth="2.5" strokeDasharray={`${pct}, 100`} strokeLinecap="round"/>
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-heading text-2xl font-bold text-foreground">{pct}%</span><span className="text-[10px] text-muted-foreground">utilisé</span></span>
        </div>
        <div>
          <p className="font-heading text-3xl font-bold text-foreground">{used} Go <span className="text-base font-normal text-muted-foreground">/ {total} Go</span></p>
          <p className={cn("text-sm mt-1", lowStorage ? "text-destructive font-semibold" : "text-muted-foreground")}>{remaining.toFixed(1)} Go disponibles</p>
          <div className="mt-3 h-3 w-64 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", lowStorage ? "bg-destructive" : "bg-primary")} style={{width:`${pct}%`}}/></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Répartition par type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>{pieData.map(e=><Cell key={e.name} fill={e.color}/>)}</Pie><Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:"12px",color:"hsl(var(--foreground))"}}/></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">{pieData.map(d=><div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{background:d.color}}/>{d.name} ({d.value} Go)</div>)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Fichiers les plus volumineux</h2>
          <div className="space-y-3">{fichiers.map(f=><div key={f.nom} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3"><FileText className="h-4 w-4 text-muted-foreground shrink-0"/><div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{f.nom}</p><p className="text-xs text-muted-foreground">{f.date}</p></div><span className="text-xs font-medium text-muted-foreground">{f.taille}</span></div>)}</div>
        </div>
      </div>
    </div>
  );
}
