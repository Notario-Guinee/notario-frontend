import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Edit, MoreHorizontal, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatGNF } from "@/data/mockData";
import { searchMatch } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Operation = { id: string; type: string; libelle: string; dossier: string; montant: number; mode: string; date: string };

const soldeModes = [
  { mode: "Espèces", solde: 8450000, icon: "💵", color: "bg-success/15 text-success" },
  { mode: "Virement", solde: 32100000, icon: "🏦", color: "bg-secondary/15 text-secondary" },
  { mode: "Chèque", solde: 12800000, icon: "📄", color: "bg-primary/15 text-primary" },
  { mode: "Orange Money", solde: 5600000, icon: "🟠", color: "bg-warning/15 text-warning" },
  { mode: "PayCard", solde: 3200000, icon: "💳", color: "bg-teal/15 text-teal" },
];

const initialOperations: Operation[] = [
  { id: "1", type: "Entrée", libelle: "Paiement FAC-2026-001", dossier: "DOS-2026-001", montant: 3500000, mode: "Orange Money", date: "2026-02-22" },
  { id: "2", type: "Sortie", libelle: "Frais d'expertise terrain", dossier: "DOS-2026-001", montant: 450000, mode: "Espèces", date: "2026-02-23" },
  { id: "3", type: "Débours", libelle: "Droits d'enregistrement DGI", dossier: "DOS-2026-001", montant: 1250000, mode: "Virement", date: "2026-02-24" },
  { id: "4", type: "Entrée", libelle: "Paiement SCI Les Palmiers", dossier: "DOS-2026-002", montant: 1800000, mode: "Virement", date: "2026-02-26" },
  { id: "5", type: "Débours", libelle: "Publication JORGG", dossier: "DOS-2026-002", montant: 350000, mode: "Espèces", date: "2026-02-28" },
  { id: "6", type: "Sortie", libelle: "Salaires personnel", dossier: "—", montant: 8500000, mode: "Virement", date: "2026-03-01" },
];

const typeColor: Record<string, string> = { "Entrée": "text-success", "Sortie": "text-destructive", "Débours": "text-primary" };
const modesOp = ["Espèces", "Virement", "Chèque", "Orange Money", "PayCard"];
const typesOp = ["Entrée", "Sortie", "Débours"];

export default function Caisse() {
  const [operations, setOperations] = useState(initialOperations);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [showModal, setShowModal] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [form, setForm] = useState({ type: "Entrée", libelle: "", dossier: "", montant: "", mode: "Espèces" });

  const totalEntrees = operations.filter(o => o.type === "Entrée").reduce((s, o) => s + o.montant, 0);
  const totalSorties = operations.filter(o => o.type !== "Entrée").reduce((s, o) => s + o.montant, 0);

  const resetForm = () => { setForm({ type: "Entrée", libelle: "", dossier: "", montant: "", mode: "Espèces" }); setEditingOp(null); };

  const openEdit = (op: Operation) => {
    setEditingOp(op);
    setForm({ type: op.type, libelle: op.libelle, dossier: op.dossier, montant: String(op.montant), mode: op.mode });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingOp) {
      setOperations(prev => prev.map(o => o.id === editingOp.id ? { ...o, type: form.type, libelle: form.libelle, dossier: form.dossier || "—", montant: Number(form.montant) || o.montant, mode: form.mode } : o));
      toast.success("Opération modifiée");
    } else {
      const newOp: Operation = {
        id: String(Date.now()), type: form.type, libelle: form.libelle,
        dossier: form.dossier || "—", montant: Number(form.montant) || 0,
        mode: form.mode, date: new Date().toISOString().slice(0, 10),
      };
      setOperations(prev => [newOp, ...prev]);
      toast.success("Opération enregistrée");
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setOperations(prev => prev.filter(o => o.id !== id));
    toast.success("Opération supprimée");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">Caisse & Débours</h1>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-56" />
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle opération
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {soldeModes.map((s) => (
          <motion.div key={s.mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-xs text-muted-foreground">{s.mode}</p>
            <p className="mt-1 font-heading text-base font-bold text-foreground">{(s.solde / 1000000).toFixed(2)}M GNF</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-success"><TrendingUp className="h-4 w-4" /><span className="text-xs font-medium">Total Entrées</span></div>
          <p className="mt-2 font-heading text-xl font-bold text-foreground">{formatGNF(totalEntrees)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-destructive"><TrendingDown className="h-4 w-4" /><span className="text-xs font-medium">Total Sorties</span></div>
          <p className="mt-2 font-heading text-xl font-bold text-foreground">{formatGNF(totalSorties)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-medium">Solde net</span></div>
          <p className="mt-2 font-heading text-xl font-bold text-foreground">{formatGNF(totalEntrees - totalSorties)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["Tous", "Entrée", "Sortie", "Débours"].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterType === t ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Date", "Libellé", "Dossier", "Mode", "Type", "Montant", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operations.filter(o => {
              if (filterType !== "Tous" && o.type !== filterType) return false;
              if (!search) return true;
              return [o.libelle, o.dossier, o.mode, o.type, String(o.montant), o.date].some(f => searchMatch(f, search));
            }).map(op => (
              <tr key={op.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-sm text-foreground">{op.libelle}</td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{op.dossier}</td>
                <td className="px-4 py-3 text-sm text-foreground">{op.mode}</td>
                <td className={`px-4 py-3 text-xs font-semibold ${typeColor[op.type]}`}>{op.type}</td>
                <td className={`px-4 py-3 text-sm font-bold ${op.type === "Entrée" ? "text-success" : "text-destructive"}`}>
                  {op.type === "Entrée" ? "+" : "-"}{formatGNF(op.montant)}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(op)}><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(op.id)}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Operation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingOp ? "Modifier l'opération" : "Nouvelle opération"}</DialogTitle>
            <DialogDescription>{editingOp ? "Modifiez les détails de l'opération" : "Enregistrez une nouvelle opération de caisse"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type d'opération *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{typesOp.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{modesOp.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Droits d'enregistrement DGI" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dossier associé</Label>
                <Input value={form.dossier} onChange={e => setForm(f => ({ ...f, dossier: e.target.value }))} placeholder="DOS-XXXX-XXX" />
              </div>
              <div className="space-y-2">
                <Label>Montant (GNF) *</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={!form.libelle || !form.montant}>
              {editingOp ? "Enregistrer" : "Ajouter l'opération"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
