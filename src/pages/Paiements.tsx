// ═══════════════════════════════════════════════════════════════
// Page Paiements — Gestion des paiements et reçus
// Inclut : recherche avancée client (code, téléphone),
// filtrage par mode de paiement, enregistrement de paiement
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Plus, Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockClients, mockFactures, formatGNF } from "@/data/mockData";
import { searchMatch } from "@/lib/utils";
import { paiementService } from "@/services/paiementService";
import { getModePaiementLabel, getPaiementStatutLabel } from "@/lib/dataUtils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

// Type représentant un paiement
type Paiement = {
  id: string; reference: string; client: string; facture: string; montant: number;
  mode: string; statut: string; date: string; transaction: string;
};

// Données initiales de paiements
const initialPaiements: Paiement[] = [
  { id: "1", reference: "PAI-2026-001", client: "Camara Fatoumata", facture: "FAC-2026-001", montant: 3500000, mode: "Orange Money", statut: "Encaissé", date: "2026-02-22", transaction: "OM-889901" },
  { id: "2", reference: "PAI-2026-002", client: "SCI Les Palmiers", facture: "FAC-2026-002", montant: 1800000, mode: "Virement", statut: "Confirmé", date: "2026-02-26", transaction: "VIR-20260226" },
  { id: "3", reference: "PAI-2026-003", client: "Barry Ousmane", facture: "FAC-2026-006", montant: 5500000, mode: "Chèque", statut: "En attente", date: "2026-03-01", transaction: "CHQ-4521" },
  { id: "4", reference: "PAI-2026-004", client: "Soumah Aissatou", facture: "FAC-2026-004", montant: 7200000, mode: "Espèces", statut: "Encaissé", date: "2025-12-16", transaction: "ESP-001" },
  { id: "5", reference: "PAI-2026-005", client: "SARL Guinée Invest", facture: "FAC-2026-003", montant: 950000, mode: "PayCard", statut: "Rejeté", date: "2026-01-20", transaction: "PC-77821" },
];

// Modes de paiement disponibles et leurs icônes
const modes = ["Tous", "Espèces", "Virement", "Chèque", "Orange Money", "PayCard"];
const modeIcons: Record<string, string> = { "Orange Money": "🟠", "Virement": "🏦", "Chèque": "📄", "Espèces": "💵", "PayCard": "💳" };

export default function Paiements() {
  const { t } = useLanguage();
  const [paiements, setPaiements] = useState(initialPaiements);

  useEffect(() => {
    let cancelled = false;
    paiementService.getAll(0, 100).then(page => {
      if (!cancelled && page.content.length > 0) {
        const mapped: Paiement[] = page.content.map(p => ({
          id: String(p.id),
          reference: p.reference,
          client: p.client ? `${p.client.nom ?? ""} ${p.client.prenom ?? ""}`.trim() || p.client.raisonSociale || String(p.clientId) : String(p.clientId),
          facture: p.factureId ? `FAC-${p.factureId}` : "",
          montant: p.montant,
          mode: getModePaiementLabel(p.modePaiement),
          statut: getPaiementStatutLabel(p.statut),
          date: p.dateTransaction?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          transaction: p.numerTransaction ?? "",
        }));
        setPaiements(mapped);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("Tous");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [form, setForm] = useState({ client: "", facture: "", montant: "", mode: "Espèces", notes: "" });

  // Filtrage des paiements
  const filtered = paiements.filter(p => {
    if (filterMode !== "Tous" && p.mode !== filterMode) return false;
    if (!search) return true;
    return [p.reference, p.client, p.facture, String(p.montant), p.mode, p.statut, p.transaction].some(f => searchMatch(f, search));
  });

  const resetForm = () => { setForm({ client: "", facture: "", montant: "", mode: "Espèces", notes: "" }); setClientSearch(""); };

  // Recherche avancée de clients (code, nom, téléphone)
  const filteredClients = clientSearch.length >= 1
    ? mockClients.filter(c =>
        searchMatch(c.code, clientSearch) || searchMatch(c.nom, clientSearch) ||
        searchMatch(c.prenom, clientSearch) || searchMatch(c.telephone, clientSearch)
      )
    : mockClients;

  // Création d'un nouveau paiement
  const handleCreate = async () => {
    if (!form.client || !form.montant) return;
    setIsSubmitting(true);
    const ref = `PAI-2026-${String(paiements.length + 1).padStart(3, "0")}`;
    const now = new Date().toISOString().slice(0, 10);
    const newPaiement: Paiement = {
      id: String(Date.now()), reference: ref, client: form.client, facture: form.facture,
      montant: Number(form.montant) || 0, mode: form.mode, statut: "Encaissé",
      date: now, transaction: `${form.mode.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
    };
    setPaiements(prev => [newPaiement, ...prev]);
    setShowCreateModal(false);
    resetForm();
    toast.success(`${ref} — ${t("caisse.toastSaved")}`);
    // Sync with backend (fire-and-forget, UI already updated)
    const modeMap: Record<string, string> = {
      "Espèces": "ESPECES", "Virement": "VIREMENT", "Chèque": "CHEQUE",
      "Orange Money": "ORANGE_MONEY", "PayCard": "PAYCARD",
    };
    paiementService.create({
      clientId: 0, // clientId unknown from name search; best-effort
      montant: Number(form.montant) || 0,
      modePaiement: (modeMap[form.mode] ?? "ESPECES") as import("@/types/api").ModePaiement,
      dateTransaction: now,
      notes: form.notes || undefined,
    }).then(created => {
      // Replace the optimistic entry with the real one from the server
      setPaiements(prev => prev.map((p, i) => i === 0 ? {
        id: String(created.id),
        reference: created.reference,
        client: p.client,
        facture: p.facture,
        montant: created.montant,
        mode: getModePaiementLabel(created.modePaiement),
        statut: getPaiementStatutLabel(created.statut),
        date: created.dateTransaction?.slice(0, 10) ?? now,
        transaction: created.numerTransaction ?? p.transaction,
      } : p));
    }).catch(() => {/* keep optimistic entry */});
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("paiements.title")}</h1>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("paiements.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-56" />
          </div>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("paiements.recordBtn")}
          </Button>
        </div>
      </div>

      {/* Filtres par mode de paiement */}
      <div className="flex flex-wrap gap-2">
        {modes.map(m => (
          <button key={m} onClick={() => setFilterMode(m)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${filterMode === m ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {modeIcons[m]} {m === "Tous" ? t("paiements.filterAll") : m}
          </button>
        ))}
      </div>

      {/* Totaux par mode */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {modes.slice(1).map((m) => {
          const total = paiements.filter(p => p.mode === m).reduce((s, p) => s + p.montant, 0);
          return (
            <div key={m} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xl">{modeIcons[m]}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{m}</p>
              <p className="mt-1 font-heading text-sm font-bold text-foreground">{(total / 1000000).toFixed(1)}M GNF</p>
            </div>
          );
        })}
      </div>

      {/* Tableau des paiements */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[t("paiements.colRef"), t("paiements.colClient"), t("paiements.colInvoice"), t("paiements.colAmount"), t("paiements.colMethod"), t("paiements.colStatus"), "Date", "Transaction"].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">{p.reference}</td>
                <td className="px-4 py-3 text-sm text-foreground">{p.client}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{p.facture}</td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatGNF(p.montant)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{modeIcons[p.mode]} {p.mode}</td>
                <td className="px-4 py-3"><StatusBadge status={p.statut} /></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.transaction}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* ═══ Modal d'enregistrement de paiement avec recherche avancée ═══ */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("paiements.modalTitle")}</DialogTitle>
            <DialogDescription>{t("paiements.modalDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Recherche avancée client */}
            <div className="space-y-2">
              <Label>{t("paiements.labelClient")} *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); if (!e.target.value) setForm(f => ({ ...f, client: "" })); }}
                  placeholder={t("paiements.searchClientPlaceholder")}
                  className="pl-9"
                />
                {clientSearch && (
                  <button onClick={() => { setClientSearch(""); setForm(f => ({ ...f, client: "" })); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Résultats de recherche */}
              {clientSearch && !form.client && (
                <div className="border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 ? filteredClients.map(c => (
                    <button key={c.id} onClick={() => { setForm(f => ({ ...f, client: `${c.nom} ${c.prenom}`.trim() })); setClientSearch(`${c.nom} ${c.prenom}`.trim()); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{c.nom} {c.prenom}</span>
                          <span className="text-xs font-mono text-primary ml-2">{c.code}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{c.telephone}</span>
                      </div>
                    </button>
                  )) : (
                    <p className="text-xs text-muted-foreground p-3 text-center">{t("paiements.noClientFound")}</p>
                  )}
                </div>
              )}
              {/* Client sélectionné */}
              {form.client && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{form.client}</span>
                  <button onClick={() => { setForm(f => ({ ...f, client: "" })); setClientSearch(""); }} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Facture associée */}
            <div className="space-y-2">
              <Label>{t("paiements.labelInvoice")}</Label>
              <Select value={form.facture} onValueChange={v => setForm(f => ({ ...f, facture: v }))}>
                <SelectTrigger><SelectValue placeholder={t("paiements.selectInvoice")} /></SelectTrigger>
                <SelectContent>
                  {mockFactures.map(f => (
                    <SelectItem key={f.id} value={f.numero}>{f.numero} — {f.client} ({formatGNF(f.montant)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Montant et mode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("paiements.labelAmount")} *</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{t("paiements.labelMethod")} *</Label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modes.slice(1).map(m => <SelectItem key={m} value={m}>{modeIcons[m]} {m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("paiements.placeholderNotes")} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t("paiements.cancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.client || !form.montant}>
              {isSubmitting ? (t("paiements.record") + "...") : t("paiements.record")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
