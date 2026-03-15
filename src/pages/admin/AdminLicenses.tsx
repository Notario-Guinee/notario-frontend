// ═══════════════════════════════════════════════════════════════
// Page Admin Licences — Gestion des clés de licence SaaS
// Génération, attribution et révocation des licences d'accès
// aux tenants (cabinets notariaux) de la plateforme
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Key, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface License {
  id: string; cabinet: string; cle: string; duree: string; dateDebut: string; dateFin: string; statut: string;
}

const initialLicenses: License[] = [
  { id: "1", cabinet: "Étude Diallo & Associés", cle: "NTR-2025-DIALLO-12M-A1B2C3", duree: "12 mois", dateDebut: "2025-06-15", dateFin: "2026-06-15", statut: "Active" },
  { id: "2", cabinet: "Cabinet Notarial Bah", cle: "NTR-2025-BAH-6M-D4E5F6", duree: "6 mois", dateDebut: "2025-09-20", dateFin: "2026-03-20", statut: "Expire bientôt" },
  { id: "3", cabinet: "Étude Camara", cle: "NTR-2025-CAMARA-12M-G7H8I9", duree: "12 mois", dateDebut: "2025-11-01", dateFin: "2026-11-01", statut: "Active" },
  { id: "4", cabinet: "SN Condé", cle: "NTR-2026-CONDE-3M-J0K1L2", duree: "3 mois", dateDebut: "2026-01-10", dateFin: "2026-04-10", statut: "Suspendue" },
];

const dureeOptions = ["1 mois", "3 mois", "6 mois", "12 mois", "24 mois"];

export default function AdminLicenses() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [licenses, setLicenses] = useState(initialLicenses);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ cabinet: "", duree: "12 mois" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateKey = (cabinet: string, duree: string) => {
    const prefix = cabinet.split(" ").pop()?.toUpperCase().slice(0, 6) || "XXXXX";
    const dur = duree.replace(" mois", "M");
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NTR-${new Date().getFullYear()}-${prefix}-${dur}-${rand}`;
  };

  const handleGenerate = () => {
    const cle = generateKey(newForm.cabinet, newForm.duree);
    const mois = parseInt(newForm.duree);
    const debut = new Date();
    const fin = new Date();
    fin.setMonth(fin.getMonth() + mois);
    setLicenses(prev => [...prev, {
      id: String(Date.now()), cabinet: newForm.cabinet || "Nouveau cabinet", cle, duree: newForm.duree,
      dateDebut: debut.toISOString().slice(0, 10), dateFin: fin.toISOString().slice(0, 10), statut: "Active",
    }]);
    setShowNew(false);
    setNewForm({ cabinet: "", duree: "12 mois" });
    toast.success(fr ? "Licence générée" : "License generated");
  };

  const copyKey = (id: string, cle: string) => {
    navigator.clipboard.writeText(cle);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(fr ? "Clé copiée" : "Key copied");
  };

  const statutColors: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "Expire bientôt": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    Suspendue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    Expirée: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Key className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Licences" : "Licenses"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{fr ? "Générer et gérer les clés de licence" : "Generate and manage license keys"}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> {fr ? "Générer une licence" : "Generate license"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: fr ? "Total licences" : "Total", v: licenses.length },
          { l: fr ? "Actives" : "Active", v: licenses.filter(l => l.statut === "Active").length },
          { l: fr ? "Expirent bientôt" : "Expiring soon", v: licenses.filter(l => l.statut === "Expire bientôt").length },
          { l: fr ? "Suspendues" : "Suspended", v: licenses.filter(l => l.statut === "Suspendue").length },
        ].map(s => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
            <p className="font-heading text-2xl font-bold text-foreground">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Cabinet", fr ? "Clé de licence" : "License key", fr ? "Durée" : "Duration", fr ? "Début" : "Start", fr ? "Fin" : "End", fr ? "Statut" : "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {licenses.map((l, i) => (
              <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{l.cabinet}</td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">{l.cle}</code>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{l.duree}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(l.dateDebut).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(l.dateFin).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statutColors[l.statut])}>{l.statut}</span></td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyKey(l.id, l.cle)}>
                    {copiedId === l.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fr ? "Générer une licence" : "Generate a license"}</DialogTitle>
            <DialogDescription>{fr ? "Créer une clé de licence temporaire" : "Create a temporary license key"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cabinet</label>
              <select value={newForm.cabinet} onChange={e => setNewForm(p => ({ ...p, cabinet: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                <option value="">{fr ? "Sélectionner un cabinet" : "Select office"}</option>
                {["Étude Diallo & Associés", "Cabinet Notarial Bah", "Étude Camara", "SN Condé"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Durée" : "Duration"}</label>
              <select value={newForm.duree} onChange={e => setNewForm(p => ({ ...p, duree: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                {dureeOptions.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleGenerate}>{fr ? "Générer" : "Generate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
