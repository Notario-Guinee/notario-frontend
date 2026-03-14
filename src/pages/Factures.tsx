// ═══════════════════════════════════════════════════════════════
// Page Factures — Gestion des factures du cabinet
// Inclut : recherche avancée (client, dossier, téléphone),
// création de facture, vue modèle de facture
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, Download, MoreHorizontal, Eye, Edit, Trash2, Search, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockFactures, mockClients, mockDossiers, formatGNF, currentUser } from "@/data/mockData";
import { searchMatch } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type Facture = typeof mockFactures[0];

export default function Factures() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [factures, setFactures] = useState(mockFactures);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Recherche avancée dans le modal de création
  const [clientSearch, setClientSearch] = useState("");
  const [form, setForm] = useState({
    client: "", dossier: "", montant: "", description: "", echeance: "", statut: "Brouillon" as string,
  });

  // Modal de visualisation d'une facture
  const [viewFacture, setViewFacture] = useState<Facture | null>(null);

  // Réinitialisation du formulaire
  const resetForm = () => {
    setForm({ client: "", dossier: "", montant: "", description: "", echeance: "", statut: "Brouillon" });
    setClientSearch("");
  };

  // Création d'une nouvelle facture
  const handleCreate = () => {
    const num = `FAC-2026-${String(factures.length + 1).padStart(3, "0")}`;
    const newFacture: Facture = {
      id: String(Date.now()), numero: num, client: form.client,
      montant: Number(form.montant) || 0, statut: form.statut as any,
      dateEmission: new Date().toISOString().slice(0, 10), dossier: form.dossier,
    };
    setFactures(prev => [newFacture, ...prev]);
    setShowCreateModal(false);
    resetForm();
    toast.success(fr ? `Facture ${num} créée avec succès` : `Invoice ${num} created successfully`);
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
        <h1 className="font-heading text-xl font-bold text-foreground">{fr ? "Factures" : "Invoices"}</h1>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={fr ? "Rechercher..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-56" />
          </div>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {fr ? "Nouvelle facture" : "New invoice"}
          </Button>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Numéro" : "Number"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Client" : "Client"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{fr ? "Dossier" : "Case"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Montant" : "Amount"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Statut" : "Status"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
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
                <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewFacture(f)}><Eye className="mr-2 h-4 w-4" /> {fr ? "Voir" : "View"}</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ Modal de visualisation de facture (modèle) ═══ */}
      <Dialog open={!!viewFacture} onOpenChange={o => !o && setViewFacture(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Facture" : "Invoice"} {viewFacture?.numero}</DialogTitle>
            <DialogDescription>{fr ? "Modèle de facture" : "Invoice template"}</DialogDescription>
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
                    <h3 className="font-heading text-2xl font-bold text-foreground">{fr ? "FACTURE" : "INVOICE"}</h3>
                    <p className="text-sm font-mono font-bold text-primary mt-1">{viewFacture.numero}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fr ? "Date d'émission" : "Issue date"}: {new Date(viewFacture.dateEmission).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Infos client */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{fr ? "Facturé à" : "Bill to"}</p>
                    <p className="text-sm font-bold text-foreground">{viewFacture.client}</p>
                    <p className="text-xs text-muted-foreground">{fr ? "Dossier" : "Case"}: {viewFacture.dossier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{fr ? "Statut" : "Status"}</p>
                    <StatusBadge status={viewFacture.statut} />
                  </div>
                </div>

                {/* Détail de la prestation */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">{fr ? "Description" : "Description"}</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">{fr ? "Montant" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {fr ? "Honoraires notariaux — Dossier" : "Notarial fees — Case"} {viewFacture.dossier}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-medium text-foreground">{formatGNF(viewFacture.montant)}</td>
                      </tr>
                      <tr className="border-t border-border bg-muted/30">
                        <td className="px-4 py-2 text-sm font-semibold text-foreground">{fr ? "TVA (18%)" : "VAT (18%)"}</td>
                        <td className="px-4 py-2 text-sm text-right font-mono text-foreground">{formatGNF(Math.round(viewFacture.montant * 0.18))}</td>
                      </tr>
                      <tr className="border-t-2 border-primary/30">
                        <td className="px-4 py-3 text-base font-bold text-foreground">{fr ? "Total TTC" : "Total (incl. tax)"}</td>
                        <td className="px-4 py-3 text-base text-right font-mono font-bold text-primary">{formatGNF(Math.round(viewFacture.montant * 1.18))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mentions légales */}
                <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border pt-4">
                  <p>{fr ? "Conditions de paiement : Payable à réception" : "Payment terms: Payable upon receipt"}</p>
                  <p>{fr ? "Mode de paiement : Virement bancaire, Espèces, Orange Money" : "Payment methods: Bank transfer, Cash, Orange Money"}</p>
                  <p className="italic">{fr ? "En cas de retard de paiement, des pénalités de 2% par mois seront appliquées." : "Late payment will incur a 2% monthly penalty."}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFacture(null)}>{fr ? "Fermer" : "Close"}</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={() => { toast.success(fr ? "Impression en cours..." : "Printing..."); window.print(); }}>
              <Printer className="h-4 w-4" /> {fr ? "Imprimer" : "Print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal de création de facture avec recherche avancée ═══ */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouvelle facture" : "New invoice"}</DialogTitle>
            <DialogDescription>{fr ? "Créez et générez une nouvelle facture" : "Create and generate a new invoice"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Champ de recherche avancée client */}
            <div className="space-y-2">
              <Label>{fr ? "Client" : "Client"} *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); if (!e.target.value) setForm(f => ({ ...f, client: "" })); }}
                  placeholder={fr ? "Rechercher par nom, code client, téléphone ou n° dossier..." : "Search by name, client code, phone or case number..."}
                  className="pl-9"
                />
                {clientSearch && (
                  <button onClick={() => { setClientSearch(""); setForm(f => ({ ...f, client: "" })); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                    <p className="text-xs text-muted-foreground p-3 text-center">{fr ? "Aucun client trouvé" : "No client found"}</p>
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
              <Label>{fr ? "Dossier associé" : "Associated case"}</Label>
              <Select value={form.dossier} onValueChange={v => setForm(f => ({ ...f, dossier: v }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un dossier..." : "Select a case..."} /></SelectTrigger>
                <SelectContent>
                  {clientDossiers.map(d => <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Montant et date d'échéance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF)" : "Amount (GNF)"} *</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Date d'échéance" : "Due date"}</Label>
                <Input type="date" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))} />
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label>{fr ? "Statut" : "Status"}</Label>
              <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">{fr ? "Brouillon" : "Draft"}</SelectItem>
                  <SelectItem value="Émise">{fr ? "Émise" : "Issued"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{fr ? "Description / Détails" : "Description / Details"}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={fr ? "Détails de la prestation facturée..." : "Billing details..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={!form.client || !form.montant}>
              {fr ? "Générer la facture" : "Generate invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
