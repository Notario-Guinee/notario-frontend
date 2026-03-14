// ═══════════════════════════════════════════════════════════════
// Page Espace Formation — Gestion des ressources de formation
// Inclut : progression, certificats téléchargeables, notifications
// gérant, ajout/modification/suppression de formations
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Play, FileText, HelpCircle, BookOpen, Award, Plus, Edit, Trash2, MoreHorizontal, Search, Download, Trophy, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { searchMatch } from "@/lib/utils";
import { currentUser } from "@/data/mockData";
import { useLanguage } from "@/context/LanguageContext";

// Type représentant une ressource de formation
type Ressource = {
  id: string;
  titre: string;
  type: string;
  duree: string;
  description: string;
  icone: string;
  progress: number;
  completedDate?: string; // Date de fin de formation
  completedBy?: string;   // Nom de l'employé ayant terminé
};

// Données initiales de formation
const initialRessources: Ressource[] = [
  { id: "1", titre: "Introduction à NotaRio", type: "Vidéo", duree: "12 min", description: "Découvrez les fonctionnalités principales de la plateforme.", icone: "🎬", progress: 100, completedDate: "2026-03-01", completedBy: "Mamadou Diallo" },
  { id: "2", titre: "Guide de rédaction des actes", type: "Document", duree: "PDF · 24 pages", description: "Manuel complet sur la rédaction des actes notariaux guinéens.", icone: "📖", progress: 0 },
  { id: "3", titre: "Gestion financière du cabinet", type: "Vidéo", duree: "28 min", description: "Facturation, paiements, caisse et synthèse financière.", icone: "🎬", progress: 45 },
  { id: "4", titre: "Quiz : Droit notarial guinéen", type: "Quiz", duree: "15 questions", description: "Testez vos connaissances sur le droit notarial en Guinée.", icone: "❓", progress: 0 },
  { id: "5", titre: "Gestion des archives OCR", type: "Vidéo", duree: "18 min", description: "Numérisation, indexation et recherche dans les archives.", icone: "🎬", progress: 0 },
  { id: "6", titre: "Module Clients avancé", type: "Document", duree: "PDF · 12 pages", description: "Fiches clients, historiques et gestion des accès portail.", icone: "📖", progress: 0 },
];

// Correspondance type → icône et couleur
const typeIcon: Record<string, typeof FileText> = { "Vidéo": Play, "Document": FileText, "Quiz": HelpCircle };
const typeColor: Record<string, string> = { "Vidéo": "bg-secondary/15 text-secondary", "Document": "bg-primary/15 text-primary", "Quiz": "bg-teal/15 text-teal" };
const typeEmoji: Record<string, string> = { "Vidéo": "🎬", "Document": "📖", "Quiz": "❓" };
const typesFormation = ["Vidéo", "Document", "Quiz"];

// Filtre par catégorie
const categories = ["Tous", "Vidéo", "Document", "Quiz"];

/**
 * Génère un certificat de formation en PDF (simulé via téléchargement HTML)
 * @param ressource - La ressource de formation terminée
 */
function generateCertificate(ressource: Ressource) {
  const certHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Certificat de Formation</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  body { font-family: 'Georgia', serif; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8f9fa; }
  .cert { width: 900px; padding: 60px; background: white; border: 3px solid #1a365d; position: relative; text-align: center; }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid #c5a55a; }
  .header { color: #c5a55a; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 10px; }
  h1 { color: #1a365d; font-size: 36px; margin: 20px 0 10px; }
  .name { font-size: 28px; color: #2d3748; margin: 20px 0; font-style: italic; }
  .formation { font-size: 22px; color: #1a365d; margin: 15px 0; font-weight: bold; background: #f7f3e9; padding: 10px 30px; display: inline-block; border-radius: 4px; }
  .details { color: #718096; font-size: 14px; margin: 15px 0; }
  .footer { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; }
  .signature { text-align: center; }
  .signature .line { width: 200px; border-top: 1px solid #2d3748; margin: 40px auto 5px; }
  .signature .label { font-size: 12px; color: #718096; }
  .seal { width: 80px; height: 80px; border: 2px solid #c5a55a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #c5a55a; font-size: 10px; margin: 0 auto; }
</style></head>
<body>
<div class="cert">
  <p class="header">Étude Notariale Diallo & Associés</p>
  <h1>🏆 Certificat de Formation</h1>
  <p class="details">Ce certificat atteste que</p>
  <p class="name">${ressource.completedBy || currentUser.name}</p>
  <p class="details">a complété avec succès la formation</p>
  <p class="formation">« ${ressource.titre} »</p>
  <p class="details">Type : ${ressource.type} · Durée : ${ressource.duree}</p>
  <p class="details">Date d'obtention : ${ressource.completedDate || new Date().toLocaleDateString("fr-FR")}</p>
  <div class="footer">
    <div class="signature"><div class="line"></div><p class="label">Le Gérant</p><p style="font-size:13px;color:#2d3748;">Maître Mamadou Diallo</p></div>
    <div class="seal">CERTIFIÉ</div>
    <div class="signature"><div class="line"></div><p class="label">Cachet du cabinet</p><p style="font-size:13px;color:#2d3748;">Conakry, Guinée</p></div>
  </div>
</div>
</body></html>`;

  // Créer un blob HTML et déclencher le téléchargement
  const blob = new Blob([certHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Certificat_${ressource.titre.replace(/\s+/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Formation() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [ressources, setRessources] = useState(initialRessources);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [showModal, setShowModal] = useState(false);
  const [editingRes, setEditingRes] = useState<Ressource | null>(null);
  const [form, setForm] = useState({ titre: "", type: "Vidéo", duree: "", description: "" });
  const [showCertModal, setShowCertModal] = useState(false);
  const [certRes, setCertRes] = useState<Ressource | null>(null);

  // Calcul des statistiques globales
  const completedCount = ressources.filter(r => r.progress === 100).length;
  const inProgressCount = ressources.filter(r => r.progress > 0 && r.progress < 100).length;
  const globalProgress = ressources.length > 0 ? Math.round(ressources.reduce((s, r) => s + r.progress, 0) / ressources.length) : 0;

  // Réinitialiser le formulaire
  const resetForm = () => { setForm({ titre: "", type: "Vidéo", duree: "", description: "" }); setEditingRes(null); };

  // Ouvrir le formulaire d'édition
  const openEdit = (r: Ressource) => {
    setEditingRes(r);
    setForm({ titre: r.titre, type: r.type, duree: r.duree, description: r.description });
    setShowModal(true);
  };

  // Enregistrer une formation (ajout ou modification)
  const handleSave = () => {
    if (editingRes) {
      setRessources(prev => prev.map(r => r.id === editingRes.id ? { ...r, titre: form.titre, type: form.type, duree: form.duree, description: form.description, icone: typeEmoji[form.type] || "📖" } : r));
      toast.success(fr ? "Formation modifiée" : "Training updated");
    } else {
      const newRes: Ressource = {
        id: String(Date.now()), titre: form.titre, type: form.type,
        duree: form.duree, description: form.description,
        icone: typeEmoji[form.type] || "📖", progress: 0,
      };
      setRessources(prev => [...prev, newRes]);
      toast.success(fr ? "Formation ajoutée" : "Training added");
    }
    setShowModal(false);
    resetForm();
  };

  // Supprimer une formation
  const handleDelete = (id: string) => {
    setRessources(prev => prev.filter(r => r.id !== id));
    toast.success(fr ? "Formation supprimée" : "Training deleted");
  };

  // Progresser dans une formation (simule une avancée de 25%)
  const startFormation = (id: string) => {
    setRessources(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newProgress = Math.min(r.progress + 25, 100);
      // Si la formation vient d'être terminée, notifier le gérant
      if (newProgress === 100 && r.progress < 100) {
        const completedR = {
          ...r,
          progress: 100,
          completedDate: new Date().toLocaleDateString("fr-FR"),
          completedBy: currentUser.name,
        };
        // Notification au gérant
        toast.success(
          fr
            ? `🎓 ${currentUser.name} a terminé la formation « ${r.titre} » ! Un certificat est disponible.`
            : `🎓 ${currentUser.name} completed training "${r.titre}"! A certificate is available.`,
          { duration: 6000 }
        );
        return completedR;
      }
      return { ...r, progress: newProgress };
    }));
    toast.success(fr ? "Progression mise à jour" : "Progress updated");
  };

  // Ouvrir le modal de certificat
  const openCertificate = (r: Ressource) => {
    setCertRes(r);
    setShowCertModal(true);
  };

  // Filtrer les ressources par recherche et catégorie
  const filtered = ressources.filter(r => {
    if (filterType !== "Tous" && r.type !== filterType) return false;
    if (!search) return true;
    return [r.titre, r.type, r.description, r.duree].some(f => searchMatch(f, search));
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{fr ? "Espace Formation" : "Training Center"}</h1>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={fr ? "Rechercher..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 w-56" />
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="mr-1 h-4 w-4" /> {fr ? "Ajouter" : "Add"}
          </Button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Trophy, value: completedCount, label: fr ? "Complétés" : "Completed", bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { icon: Clock, value: inProgressCount, label: fr ? "En cours" : "In progress", bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { icon: BookOpen, value: ressources.length, label: fr ? "Total formations" : "Total trainings", bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
          { icon: Star, value: `${globalProgress}%`, label: fr ? "Progression globale" : "Overall progress", bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-xl border border-border p-4 flex items-center gap-3 ${kpi.bg}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${kpi.iconBg}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Barre de progression globale */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">{fr ? "Progression globale" : "Overall progress"}</p>
          <span className="text-sm font-bold text-primary">{globalProgress}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${globalProgress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completedCount} {fr ? "sur" : "of"} {ressources.length} {fr ? "modules complétés" : "modules completed"}</p>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c} onClick={() => setFilterType(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${filterType === c ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {c === "Tous" ? (fr ? "Tous" : "All") : c}
          </button>
        ))}
      </div>

      {/* Grille des formations */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r, i) => {
          const Icon = typeIcon[r.type] || BookOpen;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-glow-gold/20 transition-all group relative">
              {/* Menu d'actions (modifier/supprimer) */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(r)}><Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* En-tête de la carte */}
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeColor[r.type] || "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xl">{r.icone}</span>
              </div>

              {/* Informations de la formation */}
              <h3 className="font-heading text-sm font-semibold text-foreground mb-1">{r.titre}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{r.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className={`rounded-full px-2 py-0.5 font-medium ${typeColor[r.type] || "bg-muted"}`}>{r.type}</span>
                <span>{r.duree}</span>
              </div>

              {/* Barre de progression */}
              {r.progress > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{fr ? "Progression" : "Progress"}</span><span>{r.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${r.progress === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${r.progress}%` }} />
                  </div>
                </div>
              )}

              {/* Boutons d'action selon l'état */}
              {r.progress === 0 && (
                <button onClick={() => startFormation(r.id)} className="mt-2 w-full rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                  {fr ? "Commencer" : "Start"}
                </button>
              )}
              {r.progress > 0 && r.progress < 100 && (
                <button onClick={() => startFormation(r.id)} className="mt-2 w-full rounded-lg border border-primary/30 bg-primary/5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                  {fr ? "Continuer" : "Continue"}
                </button>
              )}
              {r.progress === 100 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-success">
                    <Award className="h-3 w-3" /> {fr ? "Complété" : "Completed"}
                    {r.completedDate && <span className="text-muted-foreground ml-1">— {r.completedDate}</span>}
                  </div>
                  {/* Bouton de téléchargement du certificat */}
                  <button
                    onClick={() => openCertificate(r)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <Download className="h-3 w-3" /> {fr ? "Télécharger le certificat" : "Download certificate"}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal de prévisualisation et téléchargement du certificat */}
      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              🏆 {fr ? "Certificat de formation" : "Training Certificate"}
            </DialogTitle>
            <DialogDescription>{fr ? "Téléchargez votre certificat de réussite" : "Download your completion certificate"}</DialogDescription>
          </DialogHeader>
          {certRes && (
            <div className="space-y-4 py-2">
              {/* Aperçu du certificat */}
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-card p-6 text-center space-y-3">
                <p className="text-[10px] uppercase tracking-[3px] text-amber-600">{fr ? "Étude Notariale Diallo & Associés" : "Diallo & Associates Notarial Office"}</p>
                <p className="text-2xl">🏆</p>
                <h3 className="font-heading text-lg font-bold text-foreground">{fr ? "Certificat de Formation" : "Training Certificate"}</h3>
                <p className="text-sm text-muted-foreground">{fr ? "Décerné à" : "Awarded to"}</p>
                <p className="text-lg font-semibold text-foreground italic">{certRes.completedBy || currentUser.name}</p>
                <p className="text-sm text-muted-foreground">{fr ? "Pour avoir complété" : "For completing"}</p>
                <p className="text-base font-bold text-primary bg-primary/5 rounded-lg py-2 px-4 inline-block">« {certRes.titre} »</p>
                <p className="text-xs text-muted-foreground">{certRes.type} · {certRes.duree}</p>
                <p className="text-xs text-muted-foreground">{fr ? "Date d'obtention" : "Date"}: {certRes.completedDate || new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertModal(false)}>{fr ? "Fermer" : "Close"}</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={() => { if (certRes) generateCertificate(certRes); toast.success(fr ? "Certificat téléchargé !" : "Certificate downloaded!"); }}>
              <Download className="h-4 w-4" /> {fr ? "Télécharger" : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout/modification de formation */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingRes ? (fr ? "Modifier la formation" : "Edit training") : (fr ? "Ajouter une formation" : "Add training")}</DialogTitle>
            <DialogDescription>{editingRes ? (fr ? "Modifiez les informations de la formation" : "Edit training details") : (fr ? "Ajoutez une nouvelle ressource de formation" : "Add a new training resource")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{fr ? "Titre" : "Title"} *</Label>
              <Input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder={fr ? "Ex: Introduction à la rédaction d'actes" : "e.g. Introduction to deed writing"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{typesFormation.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Durée / Format" : "Duration / Format"}</Label>
                <Input value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} placeholder={fr ? "Ex: 15 min, PDF · 10 pages" : "e.g. 15 min, PDF · 10 pages"} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={fr ? "Description de la formation..." : "Training description..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={!form.titre}>
              {editingRes ? (fr ? "Enregistrer" : "Save") : (fr ? "Ajouter la formation" : "Add training")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
