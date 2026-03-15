// ═══════════════════════════════════════════════════════════════
// Page Admin Modules — Gestion des modules et offres SaaS
// Permet d'activer/désactiver les modules disponibles et de
// configurer les offres tarifaires pour les tenants
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatGNF } from "@/data/mockData";

const initialModules = [
  { id:"1",nom:"Gestion Clients",prix:100000,actif:true },
  { id:"2",nom:"Dossiers & Actes",prix:150000,actif:true },
  { id:"3",nom:"Facturation",prix:120000,actif:true },
  { id:"4",nom:"Paiements & Caisse",prix:100000,actif:true },
  { id:"5",nom:"Archives OCR",prix:200000,actif:false },
  { id:"6",nom:"Messagerie Interne",prix:80000,actif:false },
  { id:"7",nom:"Portail Client",prix:150000,actif:false },
  { id:"8",nom:"Espace Formation",prix:50000,actif:true },
];

export default function AdminModules() {
  const [modules, setModules] = useState(initialModules);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, actif: !m.actif } : m));
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">📦 Modules & Facturation</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full"><thead><tr className="border-b border-border">{["Module","Prix mensuel","Statut","Actions"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr></thead>
        <tbody>{modules.map(m=>(
          <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
            <td className="px-4 py-3 text-sm font-medium text-foreground">{m.nom}</td>
            <td className="px-4 py-3 text-sm text-foreground">{formatGNF(m.prix)}</td>
            <td className="px-4 py-3">
              <Switch checked={m.actif} onCheckedChange={() => toggleModule(m.id)} />
            </td>
            <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Configurer</Button></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
