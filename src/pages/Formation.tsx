// ═══════════════════════════════════════════════════════════════
// Page Espace Formation — LMS intégré à Notario
// Système de gestion de l'apprentissage pour cabinets notariaux
// Inclut : parcours, modules, instructeurs, KPIs, certificats
// Contexte : Étude notariale guinéenne — Conakry, Guinée
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  Play, FileText, HelpCircle, BookOpen, Award, Plus, Edit, Trash2,
  MoreHorizontal, Search, Download, Trophy, Star, Clock,
  ChevronRight, ChevronDown, Users, Target, TrendingUp, CheckCircle,
  Lock, BarChart3, CalendarDays, Video, Filter, X,
  PlayCircle, PauseCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { searchMatch, cn } from "@/lib/utils";
import { currentUser } from "@/data/mockData";
import { useLanguage } from "@/context/LanguageContext";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Ressource = {
  id: string;
  titre: string;
  type: string;
  duree: string;
  description: string;
  icone: string;
  progress: number;
  completedDate?: string;
  completedBy?: string;
  locked?: boolean;
  tags?: string[];
  lastAccessed?: string;
};

type LearningPath = {
  id: string;
  titre: string;
  description: string;
  modules: number;
  duration: string;
  progress: number;
  color: string;
  tags: string[];
  level: string;
};

type Instructor = {
  id: string;
  initials: string;
  name: string;
  speciality: string;
  modules: number;
  color: string;
  rating: number;
};

type TabId = "catalogue" | "mes-formations" | "parcours" | "instructeurs";

// ─────────────────────────────────────────────────────────────
// Données initiales
// ─────────────────────────────────────────────────────────────

const initialRessources: Ressource[] = [
  {
    id: "1",
    titre: "Introduction à NotaRio",
    type: "Vidéo",
    duree: "12 min",
    description: "Découvrez les fonctionnalités principales de la plateforme NotaRio et son interface adaptée au contexte guinéen.",
    icone: "🎬",
    progress: 100,
    completedDate: "01 Mar. 2026",
    completedBy: "Mamadou Diallo",
    tags: ["Débutant", "Plateforme"],
    lastAccessed: "2026-03-01",
  },
  {
    id: "2",
    titre: "Guide de rédaction des actes",
    type: "Document",
    duree: "24 min",
    description: "Manuel complet sur la rédaction des actes notariaux guinéens conformément au code civil en vigueur.",
    icone: "📖",
    progress: 0,
    tags: ["Actes", "Rédaction"],
  },
  {
    id: "3",
    titre: "Gestion financière du cabinet",
    type: "Vidéo",
    duree: "28 min",
    description: "Facturation, paiements, caisse et synthèse financière — maîtrisez les outils comptables de NotaRio.",
    icone: "🎬",
    progress: 45,
    tags: ["Finance", "Gestion"],
    lastAccessed: "2026-03-20",
  },
  {
    id: "4",
    titre: "Quiz : Droit notarial guinéen",
    type: "Quiz",
    duree: "15 min",
    description: "Testez vos connaissances sur le droit notarial en Guinée avec 15 questions à choix multiples.",
    icone: "❓",
    progress: 0,
    tags: ["Quiz", "Droit"],
  },
  {
    id: "5",
    titre: "Gestion des archives OCR",
    type: "Vidéo",
    duree: "18 min",
    description: "Numérisation, indexation et recherche plein-texte dans les archives — workflows OCR avancés.",
    icone: "🎬",
    progress: 0,
    tags: ["Archives", "Numérique"],
  },
  {
    id: "6",
    titre: "Module Clients avancé",
    type: "Document",
    duree: "20 min",
    description: "Fiches clients, historiques, relances automatiques et gestion des accès au portail client.",
    icone: "📖",
    progress: 0,
    tags: ["Clients", "CRM"],
  },
  {
    id: "7",
    titre: "Rédaction des actes de succession",
    type: "Vidéo",
    duree: "45 min",
    description: "Maîtrisez la rédaction des actes successoraux complexes selon le droit guinéen et les règles de dévolution.",
    icone: "🎬",
    progress: 45,
    tags: ["Succession", "Actes"],
    lastAccessed: "2026-03-25",
  },
  {
    id: "8",
    titre: "Fiscalité des actes notariaux",
    type: "Document",
    duree: "30 min",
    description: "Comprendre les droits d'enregistrement, taxes applicables et obligations fiscales des actes notariaux en Guinée.",
    icone: "📖",
    progress: 0,
    tags: ["Fiscalité", "Taxes"],
    locked: true,
  },
  {
    id: "9",
    titre: "Gestion des conflits clients",
    type: "Vidéo",
    duree: "25 min",
    description: "Techniques de médiation professionnelle et résolution amiable des différends entre parties en droit notarial.",
    icone: "🎬",
    progress: 100,
    completedDate: "22 Jan. 2026",
    completedBy: "Mamadou Diallo",
    tags: ["Médiation", "Clients"],
  },
  {
    id: "10",
    titre: "Quiz — Droit foncier",
    type: "Quiz",
    duree: "20 min",
    description: "Évaluez vos connaissances en droit foncier guinéen avec 30 questions sur le titre foncier et les transactions immobilières.",
    icone: "❓",
    progress: 0,
    tags: ["Quiz", "Foncier"],
  },
  {
    id: "11",
    titre: "Numérisation et archivage légal",
    type: "Document",
    duree: "35 min",
    description: "Standards de numérisation et conservation légale des actes notariaux — normes ISO et obligations légales guinéennes.",
    icone: "📖",
    progress: 75,
    tags: ["Archivage", "Numérique"],
    lastAccessed: "2026-03-28",
  },
  {
    id: "12",
    titre: "Éthique et déontologie notariale",
    type: "Vidéo",
    duree: "50 min",
    description: "Les obligations déontologiques du notaire selon l'Ordre des Notaires de Guinée — secret professionnel, impartialité, responsabilité.",
    icone: "🎬",
    progress: 100,
    completedDate: "10 Fév. 2026",
    completedBy: "Mamadou Diallo",
    tags: ["Déontologie", "Éthique"],
  },
];

const learningPaths: LearningPath[] = [
  {
    id: "lp1",
    titre: "Parcours Notaire Débutant",
    description: "Maîtrisez les fondamentaux du droit notarial guinéen et de la plateforme NotaRio. Ce parcours structuré vous guide pas à pas, de la prise en main jusqu'à la rédaction des premiers actes.",
    modules: 5,
    duration: "3h 30min",
    progress: 40,
    color: "from-blue-500 to-indigo-600",
    tags: ["Débutant", "Fondamentaux", "Pratique"],
    level: "Débutant",
  },
  {
    id: "lp2",
    titre: "Maîtriser les Actes Complexes",
    description: "Approfondissez vos compétences sur les actes notariaux complexes — successions, donations, ventes immobilières, sociétés civiles. Pour notaires expérimentés souhaitant exceller.",
    modules: 7,
    duration: "5h 45min",
    progress: 10,
    color: "from-purple-500 to-violet-600",
    tags: ["Avancé", "Successions", "Foncier"],
    level: "Avancé",
  },
];

const instructors: Instructor[] = [
  {
    id: "i1",
    initials: "AK",
    name: "Maître A. Kouyaté",
    speciality: "Droit foncier & successions",
    modules: 4,
    color: "bg-blue-500",
    rating: 4.9,
  },
  {
    id: "i2",
    initials: "MB",
    name: "Dr. Mariama Baldé",
    speciality: "Fiscalité notariale",
    modules: 3,
    color: "bg-emerald-500",
    rating: 4.8,
  },
  {
    id: "i3",
    initials: "ST",
    name: "Me Sékou Traoré",
    speciality: "Déontologie & procédures",
    modules: 2,
    color: "bg-amber-500",
    rating: 4.7,
  },
];

// ─────────────────────────────────────────────────────────────
// Constantes UI
// ─────────────────────────────────────────────────────────────

const typeIcon: Record<string, typeof FileText> = {
  "Vidéo": Play,
  "Document": FileText,
  "Quiz": HelpCircle,
};

const typeColor: Record<string, string> = {
  "Vidéo": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "Document": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Quiz": "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

const typeHeaderColor: Record<string, string> = {
  "Vidéo": "from-blue-500 to-blue-600",
  "Document": "from-amber-500 to-amber-600",
  "Quiz": "from-purple-500 to-purple-600",
};

const typeEmoji: Record<string, string> = {
  "Vidéo": "🎬",
  "Document": "📖",
  "Quiz": "❓",
};

const typesFormation = ["Vidéo", "Document", "Quiz"];
const categories = ["Tous", "Vidéo", "Document", "Quiz"];

const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "catalogue", label: "Catalogue", icon: BookOpen },
  { id: "mes-formations", label: "Mes formations", icon: PlayCircle },
  { id: "parcours", label: "Parcours", icon: Target },
  { id: "instructeurs", label: "Instructeurs", icon: Users },
];

// ─────────────────────────────────────────────────────────────
// generateCertificate
// ─────────────────────────────────────────────────────────────

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
  <p class="header">Étude Notariale Diallo &amp; Associés</p>
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

  const blob = new Blob([certHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Certificat_${ressource.titre.replace(/\s+/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "bg-primary", height = "h-1.5" }: { value: number; color?: string; height?: string }) {
  return (
    <div className={cn("w-full rounded-full bg-muted overflow-hidden", height)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3 w-3",
            s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          )}
        />
      ))}
      <span className="ml-1 text-[11px] text-muted-foreground font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

export default function Formation() {
  const { t } = useLanguage();

  // ── State ─────────────────────────────────────────────────
  const [ressources, setRessources] = useState<Ressource[]>(initialRessources);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [activeTab, setActiveTab] = useState<TabId>("catalogue");
  const [showModal, setShowModal] = useState(false);
  const [editingRes, setEditingRes] = useState<Ressource | null>(null);
  const [form, setForm] = useState({ titre: "", type: "Vidéo", duree: "", description: "" });
  const [showCertModal, setShowCertModal] = useState(false);
  const [certRes, setCertRes] = useState<Ressource | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedPath, setExpandedPath] = useState<string | null>("lp1");
  const [showFilters, setShowFilters] = useState(false);

  // ── Stats (KPIs) ──────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = ressources.filter((r) => r.progress === 100);
    const inProgress = ressources.filter((r) => r.progress > 0 && r.progress < 100);
    const totalMinutes = completed.reduce((acc, r) => {
      const match = r.duree.match(/(\d+)/);
      return acc + (match ? parseInt(match[1], 10) : 0);
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const certCount = completed.filter((r) => !!r.completedDate).length;
    return {
      completed: completed.length,
      inProgress: inProgress.length,
      total: ressources.length,
      hoursLabel: hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}m`,
      certCount,
    };
  }, [ressources]);

  // ── Recently viewed (3 most recent lastAccessed) ──────────
  const recentlyViewed = useMemo(() => {
    return [...ressources]
      .filter((r) => !!r.lastAccessed)
      .sort((a, b) => (b.lastAccessed! > a.lastAccessed! ? 1 : -1))
      .slice(0, 3);
  }, [ressources]);

  // ── Filtered list ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return ressources.filter((r) => {
      if (filterType !== "Tous" && r.type !== filterType) return false;
      if (!search) return true;
      return [r.titre, r.type, r.description, r.duree, ...(r.tags ?? [])].some((f) =>
        searchMatch(f, search)
      );
    });
  }, [ressources, filterType, search]);

  const myFormations = useMemo(
    () => ressources.filter((r) => r.progress > 0),
    [ressources]
  );

  // ── Helpers ───────────────────────────────────────────────
  const resetForm = () => {
    setForm({ titre: "", type: "Vidéo", duree: "", description: "" });
    setEditingRes(null);
  };

  const openEdit = (r: Ressource) => {
    setEditingRes(r);
    setForm({ titre: r.titre, type: r.type, duree: r.duree, description: r.description });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingRes) {
      setRessources((prev) =>
        prev.map((r) =>
          r.id === editingRes.id
            ? { ...r, titre: form.titre, type: form.type, duree: form.duree, description: form.description, icone: typeEmoji[form.type] || "📖" }
            : r
        )
      );
      toast.success(t("formation.updated"));
    } else {
      const newRes: Ressource = {
        id: String(Date.now()),
        titre: form.titre,
        type: form.type,
        duree: form.duree,
        description: form.description,
        icone: typeEmoji[form.type] || "📖",
        progress: 0,
      };
      setRessources((prev) => [...prev, newRes]);
      toast.success(t("formation.added"));
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setRessources((prev) => prev.filter((r) => r.id !== id));
    toast.success(t("formation.deleted"));
  };

  const startFormation = (id: string) => {
    setRessources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newProgress = Math.min(r.progress + 25, 100);
        if (newProgress === 100 && r.progress < 100) {
          toast.success(
            `🎓 ${currentUser.name} ${t("formation.completed")} « ${r.titre} » ! ${t("formation.downloadCert")}.`,
            { duration: 6000 }
          );
          return {
            ...r,
            progress: 100,
            completedDate: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
            completedBy: currentUser.name,
          };
        }
        return { ...r, progress: newProgress, lastAccessed: new Date().toISOString().split("T")[0] };
      })
    );
    toast.success(t("formation.progressUpdated"));
  };

  const openCertificate = (r: Ressource) => {
    setCertRes(r);
    setShowCertModal(true);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Action label helper ───────────────────────────────────
  const actionLabel = (r: Ressource) => {
    if (r.progress === 0) return t("formation.start");
    if (r.progress === 100) return "Revoir";
    return t("formation.continue");
  };

  const actionVariant = (r: Ressource): string => {
    if (r.progress === 100) return "bg-success/10 text-success border-success/30 hover:bg-success/20";
    if (r.progress > 0) return "bg-primary/8 text-primary border-primary/30 hover:bg-primary/15";
    return "bg-muted text-muted-foreground border-border hover:border-primary/30 hover:text-primary";
  };

  // ─────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────

  const renderTrainingCard = (r: Ressource, i: number) => {
    const Icon = typeIcon[r.type] || BookOpen;
    const isFav = favorites.has(r.id);

    return (
      <motion.div
        key={r.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="group relative rounded-xl border border-border bg-card shadow-card hover:shadow-md transition-all overflow-hidden flex flex-col"
      >
        {/* Colored header band */}
        <div className={cn("h-1.5 w-full bg-gradient-to-r", typeHeaderColor[r.type] ?? "from-muted to-muted")} />

        {/* Card body */}
        <div className="flex flex-col flex-1 p-5">
          {/* Top row: type badge + duration + actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", typeColor[r.type] ?? "bg-muted text-muted-foreground")}>
                <Icon className="h-3 w-3" />
                {r.type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {r.duree}
              </span>
              {r.locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Prérequis
                </span>
              )}
            </div>
            {/* Favorite + 3-dot menu — revealed on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => toggleFavorite(r.id)}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                  isFav ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
                )}
              >
                <Star className={cn("h-3.5 w-3.5", isFav && "fill-amber-400")} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(r)}>
                    <Edit className="mr-2 h-4 w-4" /> {t("formation.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> {t("formation.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title & description */}
          <h3 className="font-heading text-sm font-semibold text-foreground mb-1 leading-snug">{r.titre}</h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">{r.description}</p>

          {/* Tags */}
          {r.tags && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {r.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Progress */}
          <div className="mb-3 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t("formation.progress")}</span>
              <span className={cn("font-semibold", r.progress === 100 ? "text-success" : "text-primary")}>
                {r.progress}%
              </span>
            </div>
            <ProgressBar
              value={r.progress}
              color={r.progress === 100 ? "bg-success" : "bg-primary"}
            />
          </div>

          {/* Completion info */}
          {r.progress === 100 && r.completedDate && (
            <div className="flex items-center gap-1.5 text-[10px] text-success mb-3">
              <CheckCircle className="h-3 w-3 shrink-0" />
              <span>Terminé le {r.completedDate}</span>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-2 mt-auto">
            {r.locked ? (
              <button
                disabled
                className="flex-1 rounded-lg border border-border bg-muted py-1.5 text-[11px] font-medium text-muted-foreground cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Lock className="h-3 w-3" /> Verrouillé
              </button>
            ) : (
              <button
                onClick={() => startFormation(r.id)}
                className={cn(
                  "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
                  actionVariant(r)
                )}
              >
                {r.progress === 0 && <PlayCircle className="h-3 w-3" />}
                {r.progress > 0 && r.progress < 100 && <PauseCircle className="h-3 w-3" />}
                {r.progress === 100 && <Video className="h-3 w-3" />}
                {actionLabel(r)}
              </button>
            )}
            {r.progress === 100 && (
              <button
                onClick={() => openCertificate(r)}
                className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-1"
              >
                <Award className="h-3 w-3" />
                Cert.
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // ─────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">{t("formation.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Plateforme LMS — Étude Notariale Diallo &amp; Associés</p>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("formation.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {filterType !== "Tous" && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 font-bold leading-none">1</span>
            )}
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 h-9"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <Plus className="mr-1 h-4 w-4" /> {t("formation.add")}
          </Button>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            icon: Trophy,
            value: stats.completed,
            label: "Formations complétées",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            iconBg: "bg-emerald-500",
            border: "border-emerald-200 dark:border-emerald-800",
          },
          {
            icon: PauseCircle,
            value: stats.inProgress,
            label: "En cours",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            iconBg: "bg-blue-500",
            border: "border-blue-200 dark:border-blue-800",
          },
          {
            icon: BookOpen,
            value: stats.total,
            label: "Total disponible",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            iconBg: "bg-purple-500",
            border: "border-purple-200 dark:border-purple-800",
          },
          {
            icon: Clock,
            value: stats.hoursLabel,
            label: "Heures de formation",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            iconBg: "bg-amber-500",
            border: "border-amber-200 dark:border-amber-800",
          },
          {
            icon: Award,
            value: stats.certCount,
            label: "Certificats obtenus",
            bg: "bg-rose-50 dark:bg-rose-900/20",
            iconBg: "bg-rose-500",
            border: "border-rose-200 dark:border-rose-800",
          },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn("rounded-xl border p-4 flex items-center gap-3", kpi.bg, kpi.border)}
          >
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0", kpi.iconBg)}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xl font-bold text-foreground leading-none">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Recently viewed ──────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Récemment consultés</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {recentlyViewed.map((r, i) => {
              const Icon = typeIcon[r.type] || BookOpen;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="shrink-0 w-64 rounded-xl border border-border bg-card p-4 flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => startFormation(r.id)}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", typeColor[r.type] ?? "bg-muted text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">{r.titre}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.duree}</p>
                    <div className="mt-2">
                      <ProgressBar value={r.progress} color={r.progress === 100 ? "bg-success" : "bg-primary"} />
                    </div>
                    <p className="text-[10px] text-primary font-medium mt-1">{r.progress}% complété</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs navigation ──────────────────────────────────── */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
                {tab.id === "mes-formations" && myFormations.length > 0 && (
                  <span className="rounded-full bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 font-bold leading-none">
                    {myFormations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab: Catalogue / Mes formations ─────────────────── */}
      <AnimatePresence mode="wait">
        {(activeTab === "catalogue" || activeTab === "mes-formations") && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Filters bar */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 py-1"
              >
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterType(c)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border",
                      filterType === c
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c === "Tous" ? t("formation.all") : c}
                  </button>
                ))}
                {filterType !== "Tous" && (
                  <button
                    onClick={() => setFilterType("Tous")}
                    className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 border border-border"
                  >
                    <X className="h-3 w-3" /> Effacer
                  </button>
                )}
              </motion.div>
            )}

            {/* Grid */}
            {(() => {
              const list = activeTab === "catalogue" ? filtered : myFormations;
              return list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {activeTab === "catalogue" ? "Aucune formation ne correspond à votre recherche." : "Vous n'avez pas encore commencé de formation."}
                  </p>
                  {activeTab === "catalogue" && search && (
                    <button onClick={() => setSearch("")} className="mt-2 text-xs text-primary underline underline-offset-2">
                      Effacer la recherche
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((r, i) => renderTrainingCard(r, i))}
                </div>
              );
            })()}

            {/* Overall progress bar (catalogue only) */}
            {activeTab === "catalogue" && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">{t("formation.overallProgress")}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {ressources.length > 0
                      ? Math.round(ressources.reduce((s, r) => s + r.progress, 0) / ressources.length)
                      : 0}%
                  </span>
                </div>
                <ProgressBar
                  value={
                    ressources.length > 0
                      ? Math.round(ressources.reduce((s, r) => s + r.progress, 0) / ressources.length)
                      : 0
                  }
                  height="h-2.5"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.completed} {t("formation.of")} {ressources.length} {t("formation.modulesCompletedOf")}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Parcours ─────────────────────────────────── */}
        {activeTab === "parcours" && (
          <motion.div
            key="parcours"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Parcours d'apprentissage structurés</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                {learningPaths.length} parcours
              </span>
            </div>

            {learningPaths.map((path, i) => {
              const isExpanded = expandedPath === path.id;
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
                >
                  {/* Path header band */}
                  <div className={cn("h-1.5 w-full bg-gradient-to-r", path.color)} />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Level badge */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r",
                            path.color
                          )}>
                            {path.level}
                          </span>
                          {path.tags.map((tag) => (
                            <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h3 className="font-heading text-base font-bold text-foreground mb-1">{path.titre}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{path.description}</p>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {path.modules} modules
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {path.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {path.progress}% complété
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Progression du parcours</span>
                            <span className="font-semibold text-primary">{path.progress}%</span>
                          </div>
                          <ProgressBar value={path.progress} color={`bg-gradient-to-r ${path.color}`} height="h-2" />
                        </div>
                      </div>

                      {/* Right: action button + expand */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <Button
                          size="sm"
                          className={cn("bg-gradient-to-r text-white text-xs font-semibold shadow-sm hover:opacity-90", path.color)}
                        >
                          {path.progress > 0 ? "Continuer" : "Commencer"}
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                        <button
                          onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {isExpanded ? "Masquer" : "Détails"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded: module list preview */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-5 overflow-hidden"
                        >
                          <div className="border-t border-border pt-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                              Modules inclus
                            </p>
                            <div className="space-y-2">
                              {Array.from({ length: path.modules }).map((_, mi) => {
                                const stepDone = mi < Math.floor((path.progress / 100) * path.modules);
                                return (
                                  <div key={mi} className="flex items-center gap-3">
                                    <div className={cn(
                                      "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                      stepDone
                                        ? "bg-success text-white"
                                        : mi === Math.floor((path.progress / 100) * path.modules)
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted text-muted-foreground"
                                    )}>
                                      {stepDone ? <CheckCircle className="h-3.5 w-3.5" /> : mi + 1}
                                    </div>
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                                      <div
                                        className={cn("h-full rounded-full", stepDone ? "bg-success" : mi === Math.floor((path.progress / 100) * path.modules) ? "bg-primary" : "bg-transparent")}
                                        style={{ width: stepDone ? "100%" : mi === Math.floor((path.progress / 100) * path.modules) ? `${(path.progress % (100 / path.modules)) / (100 / path.modules) * 100}%` : "0%" }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      Module {mi + 1}
                                    </span>
                                    {stepDone && <CheckCircle className="h-3 w-3 text-success shrink-0" />}
                                    {!stepDone && mi > Math.floor((path.progress / 100) * path.modules) && (
                                      <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Tab: Instructeurs ────────────────────────────── */}
        {activeTab === "instructeurs" && (
          <motion.div
            key="instructeurs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Corps enseignant</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                {instructors.length} instructeurs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {instructors.map((inst, i) => (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-md transition-all flex flex-col items-center text-center gap-4"
                >
                  {/* Avatar */}
                  <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-xl shadow-md", inst.color)}>
                    {inst.initials}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground leading-snug">{inst.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{inst.speciality}</p>
                  </div>

                  {/* Rating */}
                  <StarRating rating={inst.rating} />

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-4 w-full border-t border-border pt-4">
                    <div className="text-center">
                      <p className="font-heading text-lg font-bold text-foreground">{inst.modules}</p>
                      <p className="text-[10px] text-muted-foreground">Modules</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="font-heading text-lg font-bold text-foreground">{inst.rating}</p>
                      <p className="text-[10px] text-muted-foreground">Note moy.</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    Voir les modules
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Info banner */}
            <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Vous souhaitez contribuer ?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Les notaires certifiés de l'Ordre de Guinée peuvent proposer des modules de formation. Contactez l'administrateur de la plateforme pour soumettre votre candidature d'instructeur.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal : Certificat ────────────────────────────────── */}
      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              🏆 {t("formation.certTitle")}
            </DialogTitle>
            <DialogDescription>{t("formation.certDesc")}</DialogDescription>
          </DialogHeader>
          {certRes && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-card p-6 text-center space-y-3">
                <p className="text-[10px] uppercase tracking-[3px] text-amber-600">{t("formation.notarialOffice")}</p>
                <p className="text-2xl">🏆</p>
                <h3 className="font-heading text-lg font-bold text-foreground">{t("formation.trainingCertTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("formation.awardedTo")}</p>
                <p className="text-lg font-semibold text-foreground italic">
                  {certRes.completedBy || currentUser.name}
                </p>
                <p className="text-sm text-muted-foreground">{t("formation.forCompleting")}</p>
                <p className="text-base font-bold text-primary bg-primary/5 rounded-lg py-2 px-4 inline-block">
                  « {certRes.titre} »
                </p>
                <p className="text-xs text-muted-foreground">{certRes.type} · {certRes.duree}</p>
                <p className="text-xs text-muted-foreground">
                  {t("formation.dateObtained")} : {certRes.completedDate || new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertModal(false)}>
              {t("formation.close")}
            </Button>
            <Button
              className="bg-primary text-primary-foreground gap-2"
              onClick={() => {
                if (certRes) generateCertificate(certRes);
                toast.success(t("formation.certDownloaded"));
              }}
            >
              <Download className="h-4 w-4" /> {t("formation.download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal : Ajout / Modification ─────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingRes ? t("formation.editModule") : t("formation.addModule")}
            </DialogTitle>
            <DialogDescription>
              {editingRes ? t("formation.editModuleInfo") : t("formation.addModuleInfo")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("formation.titleLabel")} *</Label>
              <Input
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                placeholder={t("formation.titlePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("formation.moduleType")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typesFormation.map((tp) => (
                      <SelectItem key={tp} value={tp}>{tp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("formation.moduleDuration")}</Label>
                <Input
                  value={form.duree}
                  onChange={(e) => setForm((f) => ({ ...f, duree: e.target.value }))}
                  placeholder={t("formation.durationPlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("formation.descriptionLabel")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("formation.descriptionPlaceholder")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              {t("formation.cancel")}
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={handleSave}
              disabled={!form.titre}
            >
              {editingRes ? t("formation.save") : t("formation.addTraining")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
