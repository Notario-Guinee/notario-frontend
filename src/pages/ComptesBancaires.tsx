// ═══════════════════════════════════════════════════════════════
// Page Comptes Bancaires — Gestion des comptes du cabinet
// Inclut : cartes par compte, solde total consolidé, opérations
// récentes, ajout/modification/suppression de comptes bancaires
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatGNF } from "@/data/mockData";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type Compte = { id: string; nom: string; banque: string; numero: string; solde: number; statut: string; type: string };

const initialComptes: Compte[] = [
  { id: "1", nom: "BCRG — Compte Principal", banque: "Banque Centrale de la République de Guinée", numero: "GN01 0010 1234 5678 9012 345", solde: 124500000, statut: "Actif", type: "Courant" },
  { id: "2", nom: "BICIGUI — Opérations Courantes", banque: "Banque Internationale pour le Commerce et l'Industrie", numero: "GN01 0020 9876 5432 1098 765", solde: 45800000, statut: "Actif", type: "Courant" },
  { id: "3", nom: "Ecobank — Épargne", banque: "Ecobank Guinée", numero: "GN01 0030 1111 2222 3333 444", solde: 89200000, statut: "Actif", type: "Épargne" },
  { id: "4", nom: "UBA — Dépôts notariaux", banque: "United Bank for Africa", numero: "GN01 0040 5555 6666 7777 888", solde: 312000000, statut: "Actif", type: "Spécial" },
];

const operations = [
  { id: "1", compte: "BCRG", type: "Crédit", libelle: "Paiement FAC-2026-001", montant: 3500000, date: "2026-02-22" },
  { id: "2", compte: "BICIGUI", type: "Débit", libelle: "Frais d'enregistrement DOS-2026-001", montant: 850000, date: "2026-02-20" },
  { id: "3", compte: "BCRG", type: "Crédit", libelle: "Virement SCI Les Palmiers", montant: 1800000, date: "2026-02-26" },
  { id: "4", compte: "UBA", type: "Crédit", libelle: "Séquestre vente terrain", montant: 45000000, date: "2026-03-01" },
  { id: "5", compte: "Ecobank", type: "Débit", libelle: "Charges locatives bureau", montant: 2500000, date: "2026-03-05" },
];

const banques = ["BCRG", "BICIGUI", "Ecobank Guinée", "UBA", "Société Générale Guinée", "BIG", "FIBank", "Autre"];
const typesCompte = ["Courant", "Épargne", "Spécial", "Séquestre"];

export default function ComptesBancaires() {
  const { t } = useLanguage();
  const [comptes, setComptes] = useState(initialComptes);
  const [showModal, setShowModal] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);
  const [form, setForm] = useState({ nom: "", banque: "", numero: "", solde: "", type: "Courant" });

  const totalSolde = comptes.reduce((s, c) => s + c.solde, 0);

  const resetForm = () => { setForm({ nom: "", banque: "", numero: "", solde: "", type: "Courant" }); setEditingCompte(null); };

  const openEdit = (c: Compte) => {
    setEditingCompte(c);
    setForm({ nom: c.nom, banque: c.banque, numero: c.numero, solde: String(c.solde), type: c.type });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingCompte) {
      setComptes(prev => prev.map(c => c.id === editingCompte.id ? { ...c, nom: form.nom, banque: form.banque, numero: form.numero, solde: Number(form.solde) || c.solde, type: form.type } : c));
      toast.success(t("comptes.toastEdited"));
    } else {
      const newCompte: Compte = {
        id: String(Date.now()), nom: form.nom, banque: form.banque, numero: form.numero,
        solde: Number(form.solde) || 0, statut: "Actif", type: form.type,
      };
      setComptes(prev => [...prev, newCompte]);
      toast.success(t("comptes.toastAdded"));
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setComptes(prev => prev.filter(c => c.id !== id));
    toast.success(t("comptes.toastDeleted"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("comptes.title")}</h1>
        <div className="ml-auto">
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("comptes.addAccount")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("comptes.totalBalance")}</p>
        <p className="mt-2 font-heading text-3xl font-extrabold text-foreground">{formatGNF(totalSolde)}</p>
        <p className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {t("comptes.monthlyGrowth")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {comptes.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-glow-gold/30 transition-all relative group">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="mr-2 h-4 w-4" /> {t("comptes.edit")}</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-4 w-4" /> {t("comptes.delete")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15 text-lg">🏦</div>
              <StatusBadge status={c.statut} />
            </div>
            <p className="font-heading text-sm font-semibold text-foreground truncate">{c.nom}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{c.banque}</p>
            <p className="mt-3 font-heading text-lg font-bold text-foreground">{formatGNF(c.solde)}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{c.numero}</p>
            <span className="mt-2 inline-block text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{c.type}</span>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t("comptes.recentOps")}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[t("comptes.colDate"), t("comptes.colAccount"), t("comptes.colLabel"), t("comptes.colType"), t("comptes.colAmount")].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operations.map(op => (
              <tr key={op.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-sm text-foreground">{op.compte}</td>
                <td className="px-4 py-3 text-sm text-foreground">{op.libelle}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs font-medium ${op.type === "Crédit" ? "text-success" : "text-destructive"}`}>
                    {op.type === "Crédit" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {op.type}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-semibold ${op.type === "Crédit" ? "text-success" : "text-destructive"}`}>
                  {op.type === "Crédit" ? "+" : "-"}{formatGNF(op.montant)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Account Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingCompte ? t("comptes.modalEditTitle") : t("comptes.modalNewTitle")}</DialogTitle>
            <DialogDescription>{editingCompte ? t("comptes.modalEditDesc") : t("comptes.modalNewDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("comptes.labelName")}</Label>
              <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder={t("comptes.placeholderName")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("comptes.labelBank")}</Label>
                <Select value={form.banque} onValueChange={v => setForm(f => ({ ...f, banque: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("comptes.selectBank")} /></SelectTrigger>
                  <SelectContent>
                    {banques.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("comptes.labelAccountType")}</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typesCompte.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("comptes.labelIban")}</Label>
              <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder={t("comptes.placeholderIban")} />
            </div>
            <div className="space-y-2">
              <Label>{t("comptes.labelInitialBalance")}</Label>
              <Input type="number" value={form.solde} onChange={e => setForm(f => ({ ...f, solde: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>{t("comptes.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={!form.nom || !form.banque}>
              {editingCompte ? t("comptes.save") : t("comptes.addBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
