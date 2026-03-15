// ═══════════════════════════════════════════════════════════════
// Page Archives Physiques — Gestion des archives papier du cabinet
// Inclut : registres d'archivage, localisation physique, CRUD
// boîtes/rayons, recherche par référence ou type d'acte
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, Package, Search, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchMatch } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type Boite = { id: string; numero: string; designation: string; localisation: string; dateArchivage: string; dossiers: string[] };

const initialBoites: Boite[] = [
  { id: "1", numero: "BOI-2025-001", designation: "Actes de vente 2025 — T1", localisation: "Salle B, Étagère 3, Rang A", dateArchivage: "2025-04-15", dossiers: ["DOS-2025-001", "DOS-2025-002", "DOS-2025-005"] },
  { id: "2", numero: "BOI-2025-002", designation: "Successions 2025", localisation: "Salle B, Étagère 3, Rang B", dateArchivage: "2025-07-10", dossiers: ["DOS-2025-045"] },
  { id: "3", numero: "BOI-2025-003", designation: "Constitutions sociétés 2025 — S1", localisation: "Salle A, Étagère 1, Rang C", dateArchivage: "2025-06-30", dossiers: ["DOS-2025-012", "DOS-2025-018"] },
  { id: "4", numero: "BOI-2024-010", designation: "Archives 2024 — Divers", localisation: "Salle C, Armoire 2", dateArchivage: "2024-12-31", dossiers: ["DOS-2024-080", "DOS-2024-081", "DOS-2024-082", "DOS-2024-090"] },
  { id: "5", numero: "BOI-2026-001", designation: "Actes 2026 — Janvier/Février", localisation: "Salle B, Étagère 4, Rang A", dateArchivage: "2026-02-28", dossiers: ["DOS-2025-048"] },
];

export default function ArchivesPhysiques() {
  const { t, lang } = useLanguage();
  const [boites, setBoites] = useState(initialBoites);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBoite, setEditingBoite] = useState<Boite | null>(null);
  const [form, setForm] = useState({ designation: "", localisation: "", dossiers: "" });

  const filtered = boites.filter(b =>
    [b.numero, b.designation, b.localisation].some(f => searchMatch(f, search))
  );

  const resetForm = () => { setForm({ designation: "", localisation: "", dossiers: "" }); setEditingBoite(null); };

  const openEdit = (b: Boite) => {
    setEditingBoite(b);
    setForm({ designation: b.designation, localisation: b.localisation, dossiers: b.dossiers.join(", ") });
    setShowModal(true);
  };

  const handleSave = () => {
    const dossiersArr = form.dossiers.split(",").map(d => d.trim()).filter(Boolean);
    if (editingBoite) {
      setBoites(prev => prev.map(b => b.id === editingBoite.id ? { ...b, designation: form.designation, localisation: form.localisation, dossiers: dossiersArr } : b));
      toast.success(t("archives.toastEdited"));
    } else {
      const num = `BOI-2026-${String(boites.length + 1).padStart(3, "0")}`;
      const newBoite: Boite = {
        id: String(Date.now()), numero: num, designation: form.designation,
        localisation: form.localisation, dateArchivage: new Date().toISOString().slice(0, 10), dossiers: dossiersArr,
      };
      setBoites(prev => [...prev, newBoite]);
      toast.success(`${t("archives.newBoxBtn")} ${num}`);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setBoites(prev => prev.filter(b => b.id !== id));
    toast.success(t("archives.toastDeleted"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("archives.title")}</h1>
        <div className="ml-auto">
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("archives.newBoxBtn")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder={t("archives.searchFull")} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-heading text-2xl font-bold text-foreground">{boites.length}</p>
          <p className="text-xs text-muted-foreground">{t("archives.statBoxes")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-heading text-2xl font-bold text-foreground">{boites.reduce((s, b) => s + b.dossiers.length, 0)}</p>
          <p className="text-xs text-muted-foreground">{t("archives.statDossiers")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-heading text-2xl font-bold text-foreground">3</p>
          <p className="text-xs text-muted-foreground">{t("archives.statRooms")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-glow-gold/20 transition-all relative group">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(b)}><Edit className="mr-2 h-4 w-4" /> {t("archives.actionEdit")}</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="mr-2 h-4 w-4" /> {t("archives.actionDelete")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-foreground font-mono">{b.numero}</p>
                <p className="text-xs text-muted-foreground truncate">{b.designation}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>📍 {b.localisation}</p>
              <p>📅 {t("archives.archivedOn")} {new Date(b.dateArchivage).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-GB")}</p>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">{t("archives.dossiersLabel")} ({b.dossiers.length})</p>
              <div className="flex flex-wrap gap-1">
                {b.dossiers.map(d => (
                  <span key={d} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{d}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Boite Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingBoite ? t("archives.modalTitleEdit") : t("archives.modalTitleNew")}</DialogTitle>
            <DialogDescription>{editingBoite ? t("archives.modalDescEdit") : t("archives.modalDescNew")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("archives.labelDesignation")}</Label>
              <Input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder={t("archives.placeholderDesignation")} />
            </div>
            <div className="space-y-2">
              <Label>{t("archives.labelLocation")}</Label>
              <Input value={form.localisation} onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))} placeholder={t("archives.placeholderLocation")} />
            </div>
            <div className="space-y-2">
              <Label>{t("archives.labelDossiers")}</Label>
              <Input value={form.dossiers} onChange={e => setForm(f => ({ ...f, dossiers: e.target.value }))} placeholder={t("archives.placeholderDossiers")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>{t("archives.btnCancel")}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={!form.designation || !form.localisation}>
              {editingBoite ? t("archives.btnSave") : t("archives.btnCreate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
