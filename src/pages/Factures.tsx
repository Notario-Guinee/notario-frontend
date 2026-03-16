// ═══════════════════════════════════════════════════════════════
// Page Factures — Gestion des factures du cabinet
// Inclut : recherche avancée (client, dossier, téléphone),
// création de facture, vue modèle de facture
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, Download, MoreHorizontal, Eye, Edit, Trash2, Search, X, Printer, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockFactures, mockClients, mockDossiers, formatGNF, currentUser } from "@/data/mockData";
import { searchMatch } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";

type Facture = typeof mockFactures[0];

export default function Factures() {
  const { t, lang } = useLanguage();
  const { announce } = useAnnouncer();
  const fr = lang === "FR";
  const [factures, setFactures] = useState(mockFactures);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Recherche avancée dans le modal de création
  const [clientSearch, setClientSearch] = useState("");
  const [form, setForm] = useState({
    client: "", dossier: "", montant: "", description: "", echeance: "", statut: "Brouillon" as string,
  });

  // Modal de visualisation d'une facture
  const [viewFacture, setViewFacture] = useState<Facture | null>(null);

  // Confirmation de suppression
  const [deleteFactureId, setDeleteFactureId] = useState<string | null>(null);

  // Suppression d'une facture
  const handleDelete = (id: string) => {
    setFactures(prev => prev.filter(f => f.id !== id));
    toast.success(t("factures.toastDeleted") || "Facture supprimée définitivement.");
    announce(fr ? "Facture supprimée" : "Invoice deleted");
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setForm({ client: "", dossier: "", montant: "", description: "", echeance: "", statut: "Brouillon" });
    setClientSearch("");
  };

  // Création d'une nouvelle facture
  const handleCreate = () => {
    if (!form.client?.trim()) { toast.error("Le client est obligatoire."); return; }
    const montant = Number(form.montant);
    if (!montant || montant <= 0) { toast.error("Le montant doit être supérieur à 0."); return; }

    setIsSubmitting(true);
    try {
      const num = `FAC-2026-${String(factures.length + 1).padStart(3, "0")}`;
      const newFacture: Facture = {
        id: String(Date.now()), numero: num, client: form.client,
        montant: montant, statut: form.statut as any,
        dateEmission: new Date().toISOString().slice(0, 10), dossier: form.dossier,
      };
      setFactures(prev => [newFacture, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast.success(`${num} ${t("factures.toastCreated")}`);
      announce(fr ? "Facture créée" : "Invoice created");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les clients par recherche (code, nom, téléphone, dossier)
  const filteredClients = clientSearch.length >= 1
    ? mockClients.filter(c => {
        const searchStr = clientSearch.toLowerCase();
        // Recherche par code client, nom, prénom, téléphone
        if (searchMatch(c.code, clientSearch)) return true;
        if (searchMatch(c.nom, clientSearch)) return true;
        if (searchMatch(c.prenom, clientSearch)) return true;
        if (searchMatch(c.telephone, clientSearch)) return true;
        // Recherche par numéro de dossier associé
        const clientDossiers = mockDossiers.filter(d =>
          d.clients.some(cl => cl.toLowerCase().includes(c.nom.toLowerCase()))
        );
        if (clientDossiers.some(d => searchMatch(d.code, clientSearch))) return true;
        return false;
      })
    : mockClients;

  // Dossiers associés au client sélectionné
  const clientDossiers = form.client
    ? mockDossiers.filter(d => d.clients.some(c => c.toLowerCase().includes(form.client.split(" ")[0]?.toLowerCase() || "")))
    : mockDossiers;

  // Filtrage global dans la liste
  const filtered = factures.filter(f => {
    if (!search) return true;
    return [f.numero, f.client, f.dossier, String(f.montant), f.statut, f.dateEmission].some(field => searchMatch(field, search));
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("factures.title")}</h1>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Rechercher une facture" placeholder={t("factures.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-56" />
          </div>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> {t("factures.export")}</Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("factures.newFacture")}
          </Button>
        </div>
      </div>

      {/* Compteur de résultats pour lecteurs d'écran */}
      <p aria-live="polite" className="sr-only">
        {search ? (fr ? `${filtered.length} facture${filtered.length > 1 ? "s" : ""} trouvée${filtered.length > 1 ? "s" : ""}` : `${filtered.length} invoice${filtered.length > 1 ? "s" : ""} found`) : ""}
      </p>

      {/* Tableau des factures */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("factures.colNumber")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("factures.colClient")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("factures.colCase")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("factures.colAmount")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("factures.colStatus")}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("factures.colDate")}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("factures.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">{f.numero}</td>
                <td className="px-4 py-3 text-sm text-foreground">{f.client}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono hidden md:table-cell">{f.dossier}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{formatGNF(f.montant)}</td>
                <td className="px-4 py-3"><StatusBadge status={f.statut} /></td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{new Date(f.dateEmission).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-GB")}</td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewFacture(f)}><Eye className="mr-2 h-4 w-4" /> {t("factures.actionView")}</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> {t("factures.actionEdit")}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteFactureId(f.id)}><Trash2 className="mr-2 h-4 w-4" /> {t("factures.actionDelete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <EmptyState
            icon={Receipt}
            title={t("factures.emptyTitle") || "Aucune facture trouvée"}
            description={search ? "Aucune facture ne correspond à votre recherche." : "Commencez par créer votre première facture."}
          />
        )}
      </div>

      {/* ═══ Confirmation de suppression de facture ═══ */}
      <AlertDialog open={!!deleteFactureId} onOpenChange={(open) => !open && setDeleteFactureId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement la facture et ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { handleDelete(deleteFactureId!); setDeleteFactureId(null); }}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Modal de visualisation de facture (modèle) ═══ */}
      <Dialog open={!!viewFacture} onOpenChange={o => !o && setViewFacture(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("factures.viewTitle")} {viewFacture?.numero}</DialogTitle>
            <DialogDescription>{t("factures.viewDesc")}</DialogDescription>
          </DialogHeader>
          {viewFacture && (
            <div className="space-y-6 py-2">
              {/* En-tête de la facture */}
              <div className="border-2 border-border rounded-xl p-6 space-y-6">
                {/* Logo et infos cabinet */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-primary">{currentUser.cabinet}</h2>
                    <p className="text-xs text-muted-foreground">Quartier Almamya, Kaloum, Conakry</p>
                    <p className="text-xs text-muted-foreground">Tél: +224 622 00 11 22</p>
                    <p className="text-xs text-muted-foreground">Email: contact@diallo-notaires.gn</p>
                    <p className="text-xs text-muted-foreground">NIF: NIF-2020-001234</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-heading text-2xl font-bold text-foreground">{t("factures.invoiceLabel")}</h3>
                    <p className="text-sm font-mono font-bold text-primary mt-1">{viewFacture.numero}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("factures.issueDate")}: {new Date(viewFacture.dateEmission).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-GB")}</p>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Infos client */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("factures.billTo")}</p>
                    <p className="text-sm font-bold text-foreground">{viewFacture.client}</p>
                    <p className="text-xs text-muted-foreground">{t("factures.caseLabel")}: {viewFacture.dossier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("factures.statusLabel")}</p>
                    <StatusBadge status={viewFacture.statut} />
                  </div>
                </div>

                {/* Détail de la prestation */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">{t("factures.colDesc")}</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">{t("factures.colAmountHeader")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {t("factures.notarialFees")} {viewFacture.dossier}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-medium text-foreground">{formatGNF(viewFacture.montant)}</td>
                      </tr>
                      <tr className="border-t border-border bg-muted/30">
                        <td className="px-4 py-2 text-sm font-semibold text-foreground">{t("factures.vat")}</td>
                        <td className="px-4 py-2 text-sm text-right font-mono text-foreground">{formatGNF(Math.round(viewFacture.montant * 0.18))}</td>
                      </tr>
                      <tr className="border-t-2 border-primary/30">
                        <td className="px-4 py-3 text-base font-bold text-foreground">{t("factures.totalInclTax")}</td>
                        <td className="px-4 py-3 text-base text-right font-mono font-bold text-primary">{formatGNF(Math.round(viewFacture.montant * 1.18))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mentions légales */}
                <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border pt-4">
                  <p>{t("factures.paymentTerms")}</p>
                  <p>{t("factures.paymentMethods")}</p>
                  <p className="italic">{t("factures.latePayment")}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFacture(null)}>{t("factures.btnClose")}</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={() => { toast.success(t("factures.printing")); window.print(); }}>
              <Printer className="h-4 w-4" /> {t("factures.btnPrint")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal de création de facture avec recherche avancée ═══ */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("factures.modalNewTitle")}</DialogTitle>
            <DialogDescription>{t("factures.modalNewDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Champ de recherche avancée client */}
            <div className="space-y-2">
              <Label>{t("factures.clientLabel")} *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Rechercher un client"
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); if (!e.target.value) setForm(f => ({ ...f, client: "" })); }}
                  placeholder={t("factures.searchClientPlaceholder")}
                  className="pl-9"
                />
                {clientSearch && (
                  <button aria-label="Effacer la recherche client" onClick={() => { setClientSearch(""); setForm(f => ({ ...f, client: "" })); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Liste de résultats de recherche */}
              {clientSearch && !form.client && (
                <div className="border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 ? filteredClients.map(c => {
                    // Trouver les dossiers associés à ce client
                    const clientDos = mockDossiers.filter(d =>
                      d.clients.some(cl => cl.toLowerCase().includes(c.nom.toLowerCase()))
                    );
                    return (
                      <button key={c.id} onClick={() => { setForm(f => ({ ...f, client: `${c.nom} ${c.prenom}`.trim() })); setClientSearch(`${c.nom} ${c.prenom}`.trim()); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-foreground">{c.nom} {c.prenom}</span>
                            <span className="text-xs font-mono text-primary ml-2">{c.code}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{c.telephone}</span>
                        </div>
                        {clientDos.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {clientDos.map(d => (
                              <span key={d.id} className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{d.code}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  }) : (
                    <p className="text-xs text-muted-foreground p-3 text-center">{t("factures.noClientFound")}</p>
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

            {/* Sélection du dossier */}
            <div className="space-y-2">
              <Label>{t("factures.dossierLabel")}</Label>
              <Select value={form.dossier} onValueChange={v => setForm(f => ({ ...f, dossier: v }))}>
                <SelectTrigger><SelectValue placeholder={t("factures.selectDossier")} /></SelectTrigger>
                <SelectContent>
                  {clientDossiers.map(d => <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Montant et date d'échéance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("factures.montantLabel")} *</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{t("factures.echeanceLabel")}</Label>
                <Input type="date" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))} />
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label>{t("factures.statutLabel")}</Label>
              <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">{t("factures.statutDraft")}</SelectItem>
                  <SelectItem value="Émise">{t("factures.statutIssued")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t("factures.descLabel")}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("factures.descPlaceholder")} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t("factures.btnCancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.client?.trim() || !form.montant || Number(form.montant) <= 0}>
              {isSubmitting ? "Création..." : t("factures.btnGenerate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
