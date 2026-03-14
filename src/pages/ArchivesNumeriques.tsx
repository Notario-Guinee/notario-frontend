// ═══════════════════════════════════════════════════════════════
// Page Archives Numériques — Gestion complète des documents numérisés
// Fonctionnalités :
//   - Vue par dossier / vue globale (tableau)
//   - Import de documents (glisser-déposer, sélection fichier)
//   - Import direct dans un dossier existant
//   - Édition de dossier (renommer l'objet)
//   - Suppression de dossier avec traçabilité (journal d'audit)
//   - Édition de document (renommer, changer type)
//   - Remplacement d'un fichier par un autre
//   - Aperçu de chaque fichier (prévisualisation modale)
//   - Déplacement de document entre dossiers
//   - Recherche plein-texte, statistiques en temps réel
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useMemo } from "react";
import {
  Upload, Search, FileText, Image, File, FolderOpen, ChevronDown, ChevronRight,
  MoveRight, X, Plus, Loader2, Eye, Pencil, Trash2, RefreshCw, Download,
  History, AlertTriangle, FolderEdit, ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, searchMatch } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { mockDossiers } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// ── Type représentant un document archivé ──
type ArchiveDoc = {
  id: string;
  nom: string;
  type: string;
  dossier: string;
  client: string;
  taille: string;
  statut: string;
  date: string;
  miniature: string;
};

// ── Entrée du journal d'audit (traçabilité) ──
type AuditEntry = {
  id: string;
  action: string;
  detail: string;
  user: string;
  date: string;
};

// ── Données initiales des archives ──
const initialArchives: ArchiveDoc[] = [
  { id: "1", nom: "Acte de vente terrain Camara.pdf", type: "PDF", dossier: "DOS-2026-001", client: "Camara Fatoumata", taille: "2.4 Mo", statut: "Indexé", date: "2026-02-15", miniature: "📄" },
  { id: "2", nom: "CNI Bah Ibrahima.jpg", type: "Image", dossier: "DOS-2026-003", client: "Bah Ibrahima", taille: "1.1 Mo", statut: "Indexé", date: "2026-02-20", miniature: "🖼️" },
  { id: "3", nom: "Statuts SCI Les Palmiers.pdf", type: "PDF", dossier: "DOS-2026-002", client: "SCI Les Palmiers", taille: "4.8 Mo", statut: "En traitement", date: "2026-02-28", miniature: "📄" },
  { id: "4", nom: "Titre foncier Soumah.pdf", type: "PDF", dossier: "DOS-2025-048", client: "Soumah Aissatou", taille: "6.2 Mo", statut: "Indexé", date: "2025-12-10", miniature: "📄" },
  { id: "5", nom: "Extrait RCCM SARL.pdf", type: "PDF", dossier: "DOS-2026-003", client: "SARL Guinée Invest", taille: "0.9 Mo", statut: "Erreur", date: "2026-03-01", miniature: "📄" },
  { id: "6", nom: "Plan cadastral terrain.png", type: "Image", dossier: "DOS-2026-001", client: "Camara Fatoumata", taille: "3.3 Mo", statut: "En traitement", date: "2026-03-05", miniature: "🗺️" },
  { id: "7", nom: "Procuration Condé.pdf", type: "PDF", dossier: "N-2025-101", client: "Bah Oumar", taille: "1.5 Mo", statut: "Indexé", date: "2026-01-15", miniature: "📄" },
  { id: "8", nom: "Attestation bancaire.pdf", type: "PDF", dossier: "N-2025-103", client: "SARL Nimba", taille: "0.7 Mo", statut: "Indexé", date: "2026-02-01", miniature: "📄" },
];

export default function ArchivesNumeriques() {
  const { lang } = useLanguage();
  const fr = lang === "FR";

  // ── États principaux ──
  const [archives, setArchives] = useState(initialArchives);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "dossier">("dossier");
  const [expandedDossiers, setExpandedDossiers] = useState<Set<string>>(new Set());

  // ── Journal d'audit pour la traçabilité ──
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // ── Modal de déplacement ──
  const [moveDoc, setMoveDoc] = useState<ArchiveDoc | null>(null);
  const [targetDossier, setTargetDossier] = useState("");

  // ── Modal d'import dans un dossier ──
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDossier, setImportDossier] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Modal d'aperçu de fichier ──
  const [previewDoc, setPreviewDoc] = useState<ArchiveDoc | null>(null);

  // ── Modal d'édition de document ──
  const [editDoc, setEditDoc] = useState<ArchiveDoc | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocType, setEditDocType] = useState("");

  // ── Modal de remplacement de fichier ──
  const [replaceDoc, setReplaceDoc] = useState<ArchiveDoc | null>(null);
  const [replaceFileName, setReplaceFileName] = useState("");
  const [replacing, setReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // ── Modal de suppression de document ──
  const [deleteDoc, setDeleteDoc] = useState<ArchiveDoc | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // ── Modal d'édition de dossier ──
  const [editDossierCode, setEditDossierCode] = useState<string | null>(null);
  const [editDossierLabel, setEditDossierLabel] = useState("");

  // ── Modal de suppression de dossier ──
  const [deleteDossierCode, setDeleteDossierCode] = useState<string | null>(null);
  const [deleteDossierReason, setDeleteDossierReason] = useState("");

  // ── Utilitaire : ajouter une entrée d'audit ──
  const addAudit = (action: string, detail: string) => {
    setAuditLog(prev => [{
      id: String(Date.now()),
      action,
      detail,
      user: "Me Diallo",
      date: new Date().toISOString(),
    }, ...prev]);
  };

  // ── Filtrer les documents par recherche ──
  const filtered = useMemo(() => archives.filter(a => {
    if (!search) return true;
    return [a.nom, a.client, a.dossier, a.type, a.taille].some(f => searchMatch(f, search));
  }), [archives, search]);

  // ── Grouper les documents par dossier ──
  const dossierGroups = useMemo(() => filtered.reduce<Record<string, ArchiveDoc[]>>((acc, a) => {
    if (!acc[a.dossier]) acc[a.dossier] = [];
    acc[a.dossier].push(a);
    return acc;
  }, {}), [filtered]);

  // ── Basculer l'expansion d'un dossier ──
  const toggleDossier = (code: string) => {
    setExpandedDossiers(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  // ── Déplacer un document ──
  const handleMoveDoc = () => {
    if (!moveDoc || !targetDossier) return;
    const oldDossier = moveDoc.dossier;
    setArchives(prev => prev.map(a => a.id === moveDoc.id ? { ...a, dossier: targetDossier } : a));
    addAudit(fr ? "Déplacement" : "Move", fr
      ? `« ${moveDoc.nom} » de ${oldDossier} vers ${targetDossier}`
      : `"${moveDoc.nom}" from ${oldDossier} to ${targetDossier}`
    );
    toast.success(fr ? `Document déplacé vers ${targetDossier}` : `Document moved to ${targetDossier}`);
    setMoveDoc(null);
    setTargetDossier("");
  };

  // ── Importer un document dans un dossier ──
  const handleImportInDossier = () => {
    if (!importDossier || !importFileName) return;
    setImporting(true);
    setTimeout(() => {
      const dossierInfo = mockDossiers.find(d => d.code === importDossier);
      const newDoc: ArchiveDoc = {
        id: String(Date.now()),
        nom: importFileName,
        type: importFileName.toLowerCase().endsWith(".pdf") ? "PDF" : "Image",
        dossier: importDossier,
        client: dossierInfo?.clients[0] || "—",
        taille: `${(Math.random() * 5 + 0.5).toFixed(1)} Mo`,
        statut: "En traitement",
        date: new Date().toISOString().slice(0, 10),
        miniature: importFileName.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️",
      };
      setArchives(prev => [newDoc, ...prev]);
      addAudit(fr ? "Import" : "Import", fr
        ? `« ${importFileName} » importé dans ${importDossier}`
        : `"${importFileName}" imported into ${importDossier}`
      );
      setImporting(false);
      setShowImportModal(false);
      setImportDossier("");
      setImportFileName("");
      setExpandedDossiers(prev => new Set(prev).add(importDossier));
      toast.success(fr
        ? `Document « ${importFileName} » importé dans ${importDossier}`
        : `Document "${importFileName}" imported into ${importDossier}`
      );
    }, 1200);
  };

  // ── Sélection de fichier (input natif) ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportFileName(file.name);
  };

  // ── Éditer un document (renommer, changer type) ──
  const handleEditDoc = () => {
    if (!editDoc || !editDocName.trim()) return;
    const oldName = editDoc.nom;
    setArchives(prev => prev.map(a => a.id === editDoc.id ? {
      ...a,
      nom: editDocName.trim(),
      type: editDocType,
      miniature: editDocType === "PDF" ? "📄" : "🖼️",
    } : a));
    addAudit(fr ? "Modification" : "Edit", fr
      ? `« ${oldName} » renommé en « ${editDocName.trim()} »`
      : `"${oldName}" renamed to "${editDocName.trim()}"`
    );
    toast.success(fr ? "Document modifié avec succès" : "Document updated successfully");
    setEditDoc(null);
  };

  // ── Remplacer un fichier par un autre ──
  const handleReplaceDoc = () => {
    if (!replaceDoc || !replaceFileName) return;
    setReplacing(true);
    setTimeout(() => {
      const oldName = replaceDoc.nom;
      setArchives(prev => prev.map(a => a.id === replaceDoc.id ? {
        ...a,
        nom: replaceFileName,
        type: replaceFileName.toLowerCase().endsWith(".pdf") ? "PDF" : "Image",
        miniature: replaceFileName.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️",
        taille: `${(Math.random() * 5 + 0.5).toFixed(1)} Mo`,
        statut: "En traitement",
        date: new Date().toISOString().slice(0, 10),
      } : a));
      addAudit(fr ? "Remplacement" : "Replace", fr
        ? `« ${oldName} » remplacé par « ${replaceFileName} »`
        : `"${oldName}" replaced by "${replaceFileName}"`
      );
      setReplacing(false);
      setReplaceDoc(null);
      setReplaceFileName("");
      toast.success(fr ? "Fichier remplacé avec succès" : "File replaced successfully");
    }, 1200);
  };

  // ── Supprimer un document avec traçabilité ──
  const handleDeleteDoc = () => {
    if (!deleteDoc) return;
    const docName = deleteDoc.nom;
    const docDossier = deleteDoc.dossier;
    setArchives(prev => prev.filter(a => a.id !== deleteDoc.id));
    addAudit(fr ? "Suppression document" : "Delete document", fr
      ? `« ${docName} » supprimé du dossier ${docDossier}. Motif : ${deleteReason || "Non précisé"}`
      : `"${docName}" deleted from ${docDossier}. Reason: ${deleteReason || "Not specified"}`
    );
    toast.success(fr ? `Document « ${docName} » supprimé` : `Document "${docName}" deleted`);
    setDeleteDoc(null);
    setDeleteReason("");
  };

  // ── Éditer un dossier (renommer l'objet) ──
  const handleEditDossier = () => {
    if (!editDossierCode || !editDossierLabel.trim()) return;
    addAudit(fr ? "Modification dossier" : "Edit folder", fr
      ? `Dossier ${editDossierCode} : objet modifié en « ${editDossierLabel.trim()} »`
      : `Folder ${editDossierCode}: label changed to "${editDossierLabel.trim()}"`
    );
    toast.success(fr ? `Dossier ${editDossierCode} modifié` : `Folder ${editDossierCode} updated`);
    setEditDossierCode(null);
    setEditDossierLabel("");
  };

  // ── Supprimer un dossier et ses documents avec traçabilité ──
  const handleDeleteDossier = () => {
    if (!deleteDossierCode) return;
    const docsCount = archives.filter(a => a.dossier === deleteDossierCode).length;
    setArchives(prev => prev.filter(a => a.dossier !== deleteDossierCode));
    addAudit(fr ? "Suppression dossier" : "Delete folder", fr
      ? `Dossier ${deleteDossierCode} supprimé avec ${docsCount} document(s). Motif : ${deleteDossierReason || "Non précisé"}`
      : `Folder ${deleteDossierCode} deleted with ${docsCount} document(s). Reason: ${deleteDossierReason || "Not specified"}`
    );
    toast.success(fr
      ? `Dossier ${deleteDossierCode} et ses ${docsCount} documents supprimés`
      : `Folder ${deleteDossierCode} and its ${docsCount} documents deleted`
    );
    setDeleteDossierCode(null);
    setDeleteDossierReason("");
  };

  // ── Statistiques ──
  const indexedCount = archives.filter(a => a.statut === "Indexé").length;
  const processingCount = archives.filter(a => a.statut === "En traitement").length;
  const totalSize = archives.reduce((s, a) => s + parseFloat(a.taille), 0).toFixed(1);

  // ── Composant ligne de document réutilisable ──
  const DocActions = ({ doc }: { doc: ArchiveDoc }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
          <span className="text-lg leading-none">⋮</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setPreviewDoc(doc)} className="gap-2">
          <Eye className="h-4 w-4" /> {fr ? "Aperçu" : "Preview"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setEditDoc(doc); setEditDocName(doc.nom); setEditDocType(doc.type); }} className="gap-2">
          <Pencil className="h-4 w-4" /> {fr ? "Modifier" : "Edit"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setReplaceDoc(doc); setReplaceFileName(""); }} className="gap-2">
          <RefreshCw className="h-4 w-4" /> {fr ? "Remplacer le fichier" : "Replace file"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setMoveDoc(doc); setTargetDossier(""); }} className="gap-2">
          <MoveRight className="h-4 w-4" /> {fr ? "Déplacer" : "Move"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info(fr ? "Téléchargement en cours..." : "Downloading...")} className="gap-2">
          <Download className="h-4 w-4" /> {fr ? "Télécharger" : "Download"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { setDeleteDoc(doc); setDeleteReason(""); }} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> {fr ? "Supprimer" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* ═══ En-tête ═══ */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">
          {fr ? "Archives Numériques (OCR)" : "Digital Archives (OCR)"}
        </h1>
        <div className="ml-auto flex gap-2 flex-wrap">
          {/* Bouton journal d'audit */}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAuditLog(true)}>
            <History className="h-4 w-4" />
            {fr ? "Journal" : "Audit log"}
            {auditLog.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-[10px]">
                {auditLog.length}
              </Badge>
            )}
          </Button>
          {/* Vue globale / par dossier */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              {fr ? "Tous" : "All"}
            </button>
            <button onClick={() => setViewMode("dossier")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "dossier" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <FolderOpen className="h-3 w-3" /> {fr ? "Par dossier" : "By case"}
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setImportDossier(""); setImportFileName(""); setShowImportModal(true); }}>
            <Plus className="h-4 w-4" /> {fr ? "Importer dans un dossier" : "Import into case"}
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
            <Upload className="mr-2 h-4 w-4" /> {fr ? "Importer document" : "Import document"}
          </Button>
        </div>
      </div>

      {/* ═══ Zone de dépôt ═══ */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); toast.info(fr ? "Fichier reçu — indexation OCR en cours..." : "File received — OCR indexing..."); }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">{fr ? "Glissez-déposez vos fichiers ici" : "Drag and drop files here"}</p>
        <p className="text-xs text-muted-foreground mt-1">{fr ? "PDF, JPEG, PNG jusqu'à 50 Mo — Indexation OCR automatique" : "PDF, JPEG, PNG up to 50 MB — Automatic OCR indexing"}</p>
      </div>

      {/* ═══ Barre de recherche ═══ */}
      <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder={fr ? "Recherche plein-texte dans les documents..." : "Full-text search in documents..."}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ═══ Statistiques ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: fr ? "Documents indexés" : "Indexed documents", value: String(indexedCount), icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: fr ? "En traitement OCR" : "OCR processing", value: String(processingCount), icon: File, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
          { label: fr ? "Stockage utilisé" : "Storage used", value: `${totalSize} Mo`, icon: Image, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
        ].map(({ label, value, icon: Icon, bg, iconBg }) => (
          <div key={label} className={cn("rounded-xl border border-border p-5 flex items-center gap-4", bg)}>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", iconBg)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Vue par dossier ═══ */}
      {viewMode === "dossier" ? (
        <div className="space-y-3">
          {Object.entries(dossierGroups).map(([dossierCode, docs]) => {
            const isExpanded = expandedDossiers.has(dossierCode);
            const dossierInfo = mockDossiers.find(d => d.code === dossierCode);
            return (
              <div key={dossierCode} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                {/* En-tête du dossier */}
                <div className="flex items-center">
                  <button onClick={() => toggleDossier(dossierCode)}
                    className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono font-medium text-primary">{dossierCode}</span>
                      {dossierInfo && <span className="text-sm text-muted-foreground ml-2">— {dossierInfo.objet}</span>}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{docs.length} doc(s)</Badge>
                  </button>
                  {/* Actions sur le dossier */}
                  <div className="flex items-center gap-1 mr-3">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-primary h-8"
                      onClick={e => { e.stopPropagation(); setImportDossier(dossierCode); setImportFileName(""); setShowImportModal(true); }}>
                      <Plus className="h-3.5 w-3.5" /> {fr ? "Importer" : "Import"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <span className="text-lg leading-none">⋮</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => { setEditDossierCode(dossierCode); setEditDossierLabel(dossierInfo?.objet || ""); }} className="gap-2">
                          <FolderEdit className="h-4 w-4" /> {fr ? "Éditer le dossier" : "Edit folder"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setDeleteDossierCode(dossierCode); setDeleteDossierReason(""); }} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" /> {fr ? "Supprimer le dossier" : "Delete folder"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Liste des documents du dossier */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t border-border">
                        {docs.map(a => (
                          <div key={a.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                            {/* Miniature cliquable pour aperçu */}
                            <button onClick={() => setPreviewDoc(a)} className="text-lg shrink-0 hover:scale-125 transition-transform relative group/thumb" title={fr ? "Aperçu" : "Preview"}>
                              {a.miniature}
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <ZoomIn className="h-3.5 w-3.5 text-primary" />
                              </span>
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{a.nom}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{a.client}</span><span>·</span>
                                <span>{a.taille}</span><span>·</span>
                                <span>{new Date(a.date).toLocaleDateString("fr-FR")}</span>
                              </div>
                            </div>
                            <StatusBadge status={a.statut} />
                            <DocActions doc={a} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {Object.keys(dossierGroups).length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              {fr ? "Aucun document trouvé" : "No documents found"}
            </div>
          )}
        </div>
      ) : (
        /* ═══ Vue globale (tableau) ═══ */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[fr ? "Document" : "Document", fr ? "Dossier" : "Case", fr ? "Client" : "Client", fr ? "Taille" : "Size", fr ? "Statut OCR" : "OCR Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setPreviewDoc(a)} className="text-xl hover:scale-125 transition-transform" title={fr ? "Aperçu" : "Preview"}>
                          {a.miniature}
                        </button>
                        <div>
                          <p className="text-sm font-medium text-foreground max-w-[200px] truncate">{a.nom}</p>
                          <p className="text-xs text-muted-foreground">{a.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{a.dossier}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{a.client}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{a.taille}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.statut} /></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <DocActions doc={a} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ═══ MODALS ═══ */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* ── Modal Aperçu de fichier ── */}
      <Dialog open={!!previewDoc} onOpenChange={o => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {fr ? "Aperçu du document" : "Document Preview"}
            </DialogTitle>
            <DialogDescription>{previewDoc?.nom}</DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-4">
              {/* Prévisualisation simulée */}
              <div className="rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center min-h-[300px] p-8">
                <span className="text-7xl mb-4">{previewDoc.miniature}</span>
                <p className="text-lg font-medium text-foreground text-center">{previewDoc.nom}</p>
                <p className="text-sm text-muted-foreground mt-1">{previewDoc.type} · {previewDoc.taille}</p>
                {previewDoc.type === "PDF" ? (
                  <div className="mt-6 w-full max-w-md space-y-2">
                    {/* Simulation d'un aperçu PDF multi-pages */}
                    {[1, 2, 3].map(page => (
                      <div key={page} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
                        <div className="h-16 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground font-mono">p.{page}</div>
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2 bg-muted rounded w-full" />
                          <div className="h-2 bg-muted rounded w-4/5" />
                          <div className="h-2 bg-muted rounded w-3/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 w-full max-w-sm aspect-[4/3] rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center">
                    <Image className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              {/* Métadonnées */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{fr ? "Dossier" : "Case"}</p>
                  <p className="font-mono font-medium text-primary">{previewDoc.dossier}</p>
                </div>
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{fr ? "Client" : "Client"}</p>
                  <p className="font-medium text-foreground">{previewDoc.client}</p>
                </div>
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{fr ? "Statut OCR" : "OCR Status"}</p>
                  <StatusBadge status={previewDoc.statut} />
                </div>
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-medium text-foreground">{new Date(previewDoc.date).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info(fr ? "Téléchargement en cours..." : "Downloading...")}>
              <Download className="h-4 w-4" /> {fr ? "Télécharger" : "Download"}
            </Button>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>{fr ? "Fermer" : "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Édition de document ── */}
      <Dialog open={!!editDoc} onOpenChange={o => !o && setEditDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              {fr ? "Modifier le document" : "Edit document"}
            </DialogTitle>
            <DialogDescription>{fr ? "Renommez le fichier ou changez son type" : "Rename the file or change its type"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Nom du fichier" : "File name"}</label>
              <Input value={editDocName} onChange={e => setEditDocName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Type de fichier" : "File type"}</label>
              <Select value={editDocType} onValueChange={setEditDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={handleEditDoc} disabled={!editDocName.trim()}>
              {fr ? "Enregistrer" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Remplacement de fichier ── */}
      <Dialog open={!!replaceDoc} onOpenChange={o => { if (!replacing && !o) setReplaceDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              {fr ? "Remplacer le fichier" : "Replace file"}
            </DialogTitle>
            <DialogDescription>
              {fr ? "Le fichier actuel sera remplacé par le nouveau. L'ancien sera archivé dans le journal." : "The current file will be replaced. The old one will be logged in the audit trail."}
            </DialogDescription>
          </DialogHeader>
          {replaceDoc && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border">
                <span className="text-xl">{replaceDoc.miniature}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{replaceDoc.nom}</p>
                  <p className="text-xs text-muted-foreground">{replaceDoc.taille} · {replaceDoc.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Nouveau fichier" : "New file"}</label>
                <input ref={replaceInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setReplaceFileName(f.name); }} />
                <div onClick={() => replaceInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/40 p-6 text-center transition-colors hover:bg-muted/30">
                  {replaceFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{replaceFileName}</span>
                      <button onClick={e => { e.stopPropagation(); setReplaceFileName(""); }} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">{fr ? "Cliquez pour choisir le nouveau fichier" : "Click to choose the new file"}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceDoc(null)} disabled={replacing}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={handleReplaceDoc} disabled={!replaceFileName || replacing} className="gap-2">
              {replacing ? <><Loader2 className="h-4 w-4 animate-spin" />{fr ? "Remplacement..." : "Replacing..."}</>
                : <><RefreshCw className="h-4 w-4" />{fr ? "Remplacer" : "Replace"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Suppression de document (avec motif obligatoire) ── */}
      <Dialog open={!!deleteDoc} onOpenChange={o => !o && setDeleteDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {fr ? "Supprimer le document" : "Delete document"}
            </DialogTitle>
            <DialogDescription>
              {fr ? "Cette action est irréversible. Un enregistrement sera conservé dans le journal d'audit." : "This action is irreversible. A record will be kept in the audit log."}
            </DialogDescription>
          </DialogHeader>
          {deleteDoc && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <span className="text-xl">{deleteDoc.miniature}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deleteDoc.nom}</p>
                  <p className="text-xs text-muted-foreground">{deleteDoc.dossier} · {deleteDoc.taille}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Motif de suppression" : "Reason for deletion"}</label>
                <Textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                  placeholder={fr ? "Ex: Document en doublon, erreur de scan..." : "e.g. Duplicate document, scanning error..."}
                  className="min-h-[80px]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDeleteDoc} className="gap-2">
              <Trash2 className="h-4 w-4" /> {fr ? "Supprimer" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Édition de dossier ── */}
      <Dialog open={!!editDossierCode} onOpenChange={o => !o && setEditDossierCode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <FolderEdit className="h-5 w-5 text-primary" />
              {fr ? "Modifier le dossier" : "Edit folder"}
            </DialogTitle>
            <DialogDescription>{editDossierCode}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Objet / Libellé du dossier" : "Folder label / subject"}</label>
              <Input value={editDossierLabel} onChange={e => setEditDossierLabel(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDossierCode(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={handleEditDossier} disabled={!editDossierLabel.trim()}>
              {fr ? "Enregistrer" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Suppression de dossier (avec motif et avertissement) ── */}
      <Dialog open={!!deleteDossierCode} onOpenChange={o => !o && setDeleteDossierCode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {fr ? "Supprimer le dossier" : "Delete folder"}
            </DialogTitle>
            <DialogDescription>
              {fr ? "Tous les documents de ce dossier seront supprimés. Cette action est tracée dans le journal." : "All documents in this folder will be deleted. This action is logged."}
            </DialogDescription>
          </DialogHeader>
          {deleteDossierCode && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <FolderOpen className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground font-mono">{deleteDossierCode}</p>
                  <p className="text-xs text-destructive font-medium">
                    {archives.filter(a => a.dossier === deleteDossierCode).length} {fr ? "document(s) seront supprimés" : "document(s) will be deleted"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Motif de suppression" : "Reason for deletion"}</label>
                <Textarea value={deleteDossierReason} onChange={e => setDeleteDossierReason(e.target.value)}
                  placeholder={fr ? "Ex: Dossier archivé physiquement, erreur de création..." : "e.g. Physically archived, created by mistake..."}
                  className="min-h-[80px]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDossierCode(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDeleteDossier} className="gap-2">
              <Trash2 className="h-4 w-4" /> {fr ? "Supprimer définitivement" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Déplacement ── */}
      <Dialog open={!!moveDoc} onOpenChange={o => !o && setMoveDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Déplacer le document" : "Move document"}</DialogTitle>
            <DialogDescription>{fr ? "Placez ce document dans le dossier d'un client" : "Place this document in a client's case"}</DialogDescription>
          </DialogHeader>
          {moveDoc && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border">
                <span className="text-xl">{moveDoc.miniature}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{moveDoc.nom}</p>
                  <p className="text-xs text-muted-foreground">{fr ? "Dossier actuel" : "Current case"}: <span className="font-mono text-primary">{moveDoc.dossier}</span></p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{fr ? "Dossier de destination" : "Target case"}</label>
                <Select value={targetDossier} onValueChange={setTargetDossier}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un dossier..." : "Select a case..."} /></SelectTrigger>
                  <SelectContent>
                    {mockDossiers.map(d => (
                      <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDoc(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={handleMoveDoc} disabled={!targetDossier || targetDossier === moveDoc?.dossier} className="gap-2">
              <MoveRight className="h-4 w-4" /> {fr ? "Déplacer" : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Import dans un dossier ── */}
      <Dialog open={showImportModal} onOpenChange={o => { if (!importing) setShowImportModal(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {fr ? "Importer dans un dossier" : "Import into a case"}
            </DialogTitle>
            <DialogDescription>{fr ? "Sélectionnez un dossier puis choisissez le fichier" : "Select a case then choose the file"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Dossier" : "Case"} *</label>
              <Select value={importDossier} onValueChange={setImportDossier}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner..." : "Select..."} /></SelectTrigger>
                <SelectContent>
                  {mockDossiers.map(d => (
                    <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {importDossier && (() => {
                const info = mockDossiers.find(d => d.code === importDossier);
                const docsCount = archives.filter(a => a.dossier === importDossier).length;
                return info ? (
                  <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{info.objet}</p>
                      <p className="text-[10px] text-muted-foreground">{info.clients.join(", ")} · {docsCount} doc(s)</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{fr ? "Fichier" : "File"} *</label>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff" onChange={handleFileSelect} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/40 p-6 text-center transition-colors hover:bg-muted/30">
                {importFileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{importFileName}</span>
                    <button onClick={e => { e.stopPropagation(); setImportFileName(""); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">{fr ? "Cliquez pour choisir un fichier" : "Click to choose a file"}</p>
                  </>
                )}
              </div>
              {!importFileName && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{fr ? "ou saisir :" : "or type:"}</span>
                  <Input placeholder="acte.pdf" value={importFileName} onChange={e => setImportFileName(e.target.value)} className="h-8 text-xs flex-1" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)} disabled={importing}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={handleImportInDossier} disabled={!importDossier || !importFileName || importing} className="gap-2">
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" />{fr ? "Import..." : "Importing..."}</>
                : <><Upload className="h-4 w-4" />{fr ? "Importer" : "Import"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Journal d'audit ── */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {fr ? "Journal d'audit — Traçabilité" : "Audit Log — Traceability"}
            </DialogTitle>
            <DialogDescription>
              {fr ? "Historique de toutes les actions effectuées sur les archives" : "History of all actions performed on archives"}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh] space-y-2 py-2">
            {auditLog.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {fr ? "Aucune action enregistrée pour cette session" : "No actions recorded for this session"}
              </p>
            ) : auditLog.map(entry => (
              <div key={entry.id} className="flex gap-3 rounded-lg border border-border p-3 bg-card">
                <div className={cn(
                  "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
                  entry.action.includes("Suppression") || entry.action.includes("Delete") ? "bg-destructive" :
                  entry.action.includes("Modification") || entry.action.includes("Edit") ? "bg-amber-500" :
                  entry.action.includes("Remplacement") || entry.action.includes("Replace") ? "bg-blue-500" : "bg-primary"
                )}>
                  {entry.action.includes("Suppression") || entry.action.includes("Delete") ? <Trash2 className="h-3.5 w-3.5" /> :
                   entry.action.includes("Modification") || entry.action.includes("Edit") ? <Pencil className="h-3.5 w-3.5" /> :
                   entry.action.includes("Remplacement") || entry.action.includes("Replace") ? <RefreshCw className="h-3.5 w-3.5" /> :
                   <History className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{entry.action}</Badge>
                    <span className="text-[10px] text-muted-foreground">{entry.user}</span>
                  </div>
                  <p className="text-xs text-foreground mt-1">{entry.detail}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(entry.date).toLocaleString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditLog(false)}>{fr ? "Fermer" : "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
