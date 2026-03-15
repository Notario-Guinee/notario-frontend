// ═══════════════════════════════════════════════════════════════
// Page Moteur de Tarifs — Configuration des barèmes notariaux
// Gestion des grilles tarifaires par type d'acte, avec calcul
// automatique des honoraires selon le montant de la transaction
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Calculator, ChevronRight, Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Composant {
  id: string;
  nom: string;
  mode: "Fixe" | "Pourcentage" | "Pourcentage dégressif";
  taux: number;
}

const typesActes = [
  "Vente de terrain",
  "Vente immobilière",
  "Création société SARL",
  "Bail commercial",
  "Donation",
  "Succession",
  "Hypothèque",
];

const defaultComposants: Record<string, Composant[]> = {
  "Vente de terrain": [
    { id: "1", nom: "Droits d'enregistrement", mode: "Pourcentage", taux: 2.5 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 50000 },
    { id: "3", nom: "Barème notarial", mode: "Pourcentage dégressif", taux: 1.2 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
    { id: "5", nom: "Frais cadastre", mode: "Fixe", taux: 150000 },
    { id: "6", nom: "Frais de publication", mode: "Fixe", taux: 350000 },
  ],
  "Vente immobilière": [
    { id: "1", nom: "Droits d'enregistrement", mode: "Pourcentage", taux: 3 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 75000 },
    { id: "3", nom: "Barème notarial", mode: "Pourcentage dégressif", taux: 1.5 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
    { id: "5", nom: "Frais cadastre", mode: "Fixe", taux: 200000 },
    { id: "6", nom: "Frais de publication", mode: "Fixe", taux: 400000 },
    { id: "7", nom: "Frais d'expertise", mode: "Fixe", taux: 500000 },
  ],
  "Création société SARL": [
    { id: "1", nom: "Droits d'enregistrement", mode: "Pourcentage", taux: 1 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 50000 },
    { id: "3", nom: "Honoraires de rédaction", mode: "Fixe", taux: 2000000 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
    { id: "5", nom: "Frais RCCM", mode: "Fixe", taux: 300000 },
    { id: "6", nom: "Publication JORT", mode: "Fixe", taux: 250000 },
  ],
  "Bail commercial": [
    { id: "1", nom: "Droits d'enregistrement", mode: "Pourcentage", taux: 2 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 50000 },
    { id: "3", nom: "Honoraires notariaux", mode: "Pourcentage", taux: 1 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
  ],
  "Donation": [
    { id: "1", nom: "Droits de donation", mode: "Pourcentage", taux: 5 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 50000 },
    { id: "3", nom: "Barème notarial", mode: "Pourcentage dégressif", taux: 1.2 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
    { id: "5", nom: "Frais de publication", mode: "Fixe", taux: 350000 },
  ],
  "Succession": [
    { id: "1", nom: "Droits de succession", mode: "Pourcentage", taux: 3 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 100000 },
    { id: "3", nom: "Honoraires notariaux", mode: "Pourcentage dégressif", taux: 1.5 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
    { id: "5", nom: "Frais d'inventaire", mode: "Fixe", taux: 750000 },
    { id: "6", nom: "Frais de publication", mode: "Fixe", taux: 350000 },
  ],
  "Hypothèque": [
    { id: "1", nom: "Droits d'inscription", mode: "Pourcentage", taux: 1.5 },
    { id: "2", nom: "Timbre fiscal", mode: "Fixe", taux: 50000 },
    { id: "3", nom: "Honoraires notariaux", mode: "Pourcentage", taux: 0.8 },
    { id: "4", nom: "TVA honoraires", mode: "Pourcentage", taux: 18 },
    { id: "5", nom: "Frais conservation foncière", mode: "Fixe", taux: 200000 },
  ],
};

const modes: Composant["mode"][] = ["Fixe", "Pourcentage", "Pourcentage dégressif"];

export default function Tarifs() {
  const [typeSelectionne, setTypeSelectionne] = useState("Vente de terrain");
  const [valeur, setValeur] = useState("");
  const [resultats, setResultats] = useState<{ nom: string; montant: number }[] | null>(null);
  const [composantsMap, setComposantsMap] = useState<Record<string, Composant[]>>(defaultComposants);

  // Modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editingComp, setEditingComp] = useState<Composant | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", mode: "Fixe" as Composant["mode"], taux: "" });

  const composants = composantsMap[typeSelectionne] || [];

  const calculer = () => {
    const v = parseFloat(valeur.replace(/\s/g, "")) || 0;
    const r = composants.map(c => ({
      nom: c.nom,
      montant: c.mode === "Fixe" ? c.taux : Math.round(v * c.taux / 100),
    }));
    setResultats(r);
  };

  const total = resultats?.reduce((s, r) => s + r.montant, 0) || 0;

  const updateComposants = (updated: Composant[]) => {
    setComposantsMap(prev => ({ ...prev, [typeSelectionne]: updated }));
    setResultats(null);
  };

  const handleAdd = () => {
    const taux = parseFloat(form.taux) || 0;
    if (!form.nom.trim()) return;
    const newComp: Composant = { id: Date.now().toString(), nom: form.nom.trim(), mode: form.mode, taux };
    updateComposants([...composants, newComp]);
    setShowAdd(false);
    setForm({ nom: "", mode: "Fixe", taux: "" });
    toast.success("Composant ajouté");
  };

  const handleUpdate = () => {
    if (!editingComp) return;
    updateComposants(composants.map(c => c.id === editingComp.id ? editingComp : c));
    setShowEdit(false);
    setEditingComp(null);
    toast.success("Composant modifié");
  };

  const handleDelete = (id: string) => {
    updateComposants(composants.filter(c => c.id !== id));
    toast.success("Composant supprimé");
  };

  const openEdit = (c: Composant) => {
    setEditingComp({ ...c });
    setShowEdit(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">Moteur de Tarifs Notariaux</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Simulateur */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-heading text-base font-semibold text-foreground">Simulateur de tarifs</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type d'acte</label>
              <select
                value={typeSelectionne}
                onChange={e => { setTypeSelectionne(e.target.value); setResultats(null); }}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
              >
                {typesActes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valeur du dossier (GNF)</label>
              <input
                type="text"
                value={valeur}
                onChange={e => setValeur(e.target.value)}
                placeholder="Ex: 50 000 000"
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
            <Button onClick={calculer} className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              <Calculator className="mr-2 h-4 w-4" /> Calculer les frais
            </Button>
          </div>

          {resultats && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl bg-muted/50 p-4 space-y-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">Résultat pour : {typeSelectionne}</h3>
              {resultats.map(r => (
                <div key={r.nom} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.nom}</span>
                  <span className="font-medium text-foreground">{formatGNF(r.montant)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between font-heading font-bold">
                <span className="text-foreground">Total estimé</span>
                <span className="text-primary">{formatGNF(total)}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Composants tarifaires dynamiques */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                <Settings2 className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">Composants tarifaires</h2>
                <p className="text-xs text-muted-foreground">{typeSelectionne} — {composants.length} composant{composants.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => { setForm({ nom: "", mode: "Fixe", taux: "" }); setShowAdd(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="wait">
              <motion.div key={typeSelectionne} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-2">
                {composants.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun composant configuré pour ce type d'acte.</p>
                )}
                {composants.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 group">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.nom}</p>
                      <p className="text-xs text-muted-foreground">{c.mode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {c.mode === "Fixe" ? formatGNF(c.taux) : `${c.taux}%`}
                      </span>
                      <button onClick={() => openEdit(c)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Types d'actes configurés */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Types d'actes configurés</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {typesActes.map(t => (
            <button key={t} onClick={() => { setTypeSelectionne(t); setResultats(null); }}
              className={`flex items-center justify-between rounded-lg border p-3 text-sm text-left transition-colors ${typeSelectionne === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-foreground hover:bg-muted"}`}>
              <span className="truncate">{t}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Modal Ajouter */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un composant — {typeSelectionne}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom du composant</label>
              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Droits d'enregistrement" className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mode de calcul</label>
              <Select value={form.mode} onValueChange={(v: Composant["mode"]) => setForm(f => ({ ...f, mode: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{form.mode === "Fixe" ? "Montant (GNF)" : "Taux (%)"}</label>
              <input type="number" value={form.taux} onChange={e => setForm(f => ({ ...f, taux: e.target.value }))} placeholder={form.mode === "Fixe" ? "Ex: 50000" : "Ex: 2.5"} className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le composant</DialogTitle>
          </DialogHeader>
          {editingComp && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom du composant</label>
                <input value={editingComp.nom} onChange={e => setEditingComp(c => c ? { ...c, nom: e.target.value } : c)} className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Mode de calcul</label>
                <Select value={editingComp.mode} onValueChange={(v: Composant["mode"]) => setEditingComp(c => c ? { ...c, mode: v } : c)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{editingComp.mode === "Fixe" ? "Montant (GNF)" : "Taux (%)"}</label>
                <input type="number" value={editingComp.taux} onChange={e => setEditingComp(c => c ? { ...c, taux: parseFloat(e.target.value) || 0 } : c)} className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Annuler</Button>
            <Button onClick={handleUpdate} className="bg-primary text-primary-foreground hover:bg-primary/90">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
