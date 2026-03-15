// ═══════════════════════════════════════════════════════════════
// Page Modèles de Documents — Bibliothèque de modèles notariaux
// Inclut : création, modification, duplication et suppression de
// modèles d'actes, filtrables par type et catégorie
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, FileText, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Modele = { id: string; nom: string; categorie: string; type: string; description: string; placeholders: string[] };

const initialModeles: Modele[] = [
  { id: "1", nom: "Acte de vente de terrain", categorie: "Vente", type: "Global", description: "Modèle standard pour la vente de terrains non bâtis en Guinée", placeholders: ["Client.Nom", "Client.CNI", "Acte.DateSignature", "Acte.Valeur"] },
  { id: "2", nom: "Contrat de bail commercial", categorie: "Bail", type: "Global", description: "Bail commercial pour locaux professionnels", placeholders: ["Client.Nom", "Cabinet.Nom", "Acte.Duree"] },
  { id: "3", nom: "Statuts SARL", categorie: "Société", type: "Global", description: "Statuts types pour constitution de SARL en Guinée", placeholders: ["Client.Nom", "Acte.Capital", "Acte.Objet"] },
  { id: "4", nom: "Acte de donation", categorie: "Donation", type: "Cabinet", description: "Donation entre particuliers — Étude Diallo & Associés", placeholders: ["Client.Nom", "Client.DateNaissance", "Acte.Biens"] },
  { id: "5", nom: "Convocation RDV", categorie: "Communication", type: "Cabinet", description: "Lettre de convocation pour rendez-vous notarial", placeholders: ["Client.Nom", "RDV.Date", "RDV.Heure", "Cabinet.Adresse"] },
  { id: "6", nom: "Procès-verbal d'assemblée", categorie: "Société", type: "Global", description: "PV d'assemblée générale ordinaire ou extraordinaire", placeholders: ["Client.Nom", "Acte.DateAssemblee"] },
];

const placeholderExamples = ["<<Client.Nom>>", "<<Client.CNI>>", "<<Client.DateNaissance>>", "<<Cabinet.Nom>>", "<<Cabinet.Adresse>>", "<<Acte.DateSignature>>", "<<Acte.Valeur>>", "<<Acte.Objet>>", "<<RDV.Date>>", "<<RDV.Heure>>"];
const categories = ["Vente", "Bail", "Société", "Donation", "Communication", "Succession", "Procuration"];

export default function ModelesDocuments() {
  const [modeles, setModeles] = useState(initialModeles);
  const [selected, setSelected] = useState<Modele | null>(null);
  const [filterCat, setFilterCat] = useState("Tous");
  const [editorContent, setEditorContent] = useState("Sélectionnez un modèle pour commencer l'édition...");
  const [showModal, setShowModal] = useState(false);
  const [editingModele, setEditingModele] = useState<Modele | null>(null);
  const [form, setForm] = useState({ nom: "", categorie: "Vente", type: "Cabinet", description: "", placeholders: "" });

  const cats = ["Tous", ...Array.from(new Set(modeles.map(m => m.categorie)))];
  const filtered = filterCat === "Tous" ? modeles : modeles.filter(m => m.categorie === filterCat);

  const resetForm = () => { setForm({ nom: "", categorie: "Vente", type: "Cabinet", description: "", placeholders: "" }); setEditingModele(null); };

  const openEdit = (m: Modele) => {
    setEditingModele(m);
    setForm({ nom: m.nom, categorie: m.categorie, type: m.type, description: m.description, placeholders: m.placeholders.join(", ") });
    setShowModal(true);
  };

  const handleSave = () => {
    const phArr = form.placeholders.split(",").map(p => p.trim()).filter(Boolean);
    if (editingModele) {
      setModeles(prev => prev.map(m => m.id === editingModele.id ? { ...m, nom: form.nom, categorie: form.categorie, type: form.type, description: form.description, placeholders: phArr } : m));
      toast.success("Modèle modifié");
    } else {
      const newModele: Modele = {
        id: String(Date.now()), nom: form.nom, categorie: form.categorie,
        type: form.type, description: form.description, placeholders: phArr,
      };
      setModeles(prev => [...prev, newModele]);
      toast.success("Modèle créé");
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setModeles(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) { setSelected(null); setEditorContent("Sélectionnez un modèle pour commencer l'édition..."); }
    toast.success("Modèle supprimé");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">Modèles de Documents</h1>
        <div className="ml-auto">
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau modèle
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterCat === c ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {filtered.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 cursor-pointer transition-all relative group ${selected?.id === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}
              onClick={() => { setSelected(m); setEditorContent(`MODÈLE : ${m.nom}\n\nEn l'étude de <<Cabinet.Nom>>, notaire à Conakry,\n\nEntre :\n  <<Client.Nom>>, ci-après désigné "le Client",\n\nD'une part,\n\nEt :\n  <<Cabinet.Nom>>, Notaire,\n\nD'autre part.\n\nIl a été convenu et arrêté ce qui suit...`); }}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(m)}><Edit className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.type === "Global" ? "bg-secondary/15" : "bg-primary/15"}`}>
                  <FileText className={`h-4 w-4 ${m.type === "Global" ? "text-secondary" : "text-primary"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.nom}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{m.categorie}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.type === "Global" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>{m.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Edit className="h-4 w-4 text-primary" /> Éditeur — {selected.nom}
                </h2>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Générer PDF</Button>
              </div>
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Placeholders disponibles :</p>
                <div className="flex flex-wrap gap-1.5">
                  {placeholderExamples.map(p => (
                    <button key={p} onClick={() => setEditorContent(prev => prev + " " + p)}
                      className="rounded-md bg-secondary/10 px-2 py-1 text-[10px] font-mono text-secondary hover:bg-secondary/20 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={editorContent} onChange={e => setEditorContent(e.target.value)} rows={14}
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground font-mono outline-none focus:border-primary/50 resize-none" />
            </div>
          )}
          {!selected && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Sélectionnez un modèle à gauche pour l'éditer</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Model Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingModele ? "Modifier le modèle" : "Nouveau modèle de document"}</DialogTitle>
            <DialogDescription>{editingModele ? "Modifiez les informations du modèle" : "Créez un nouveau modèle de document"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom du modèle *</Label>
              <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Acte de vente de terrain" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={v => setForm(f => ({ ...f, categorie: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Portée</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cabinet">Cabinet</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description du modèle..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Placeholders (séparés par des virgules)</Label>
              <Input value={form.placeholders} onChange={e => setForm(f => ({ ...f, placeholders: e.target.value }))} placeholder="Client.Nom, Acte.DateSignature, ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={!form.nom}>
              {editingModele ? "Enregistrer" : "Créer le modèle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
