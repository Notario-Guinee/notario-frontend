// ═══════════════════════════════════════════════════════════════
// Page Documents — Liste et gestion des documents notariaux
// Inclut : KPI, filtres, vue grille/liste, création de document
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Edit3,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Download,
  Grid3X3,
  List,
  History,
  Share2,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Pencil,
  Palette,
  Star,
  Copy,
  Trash2,
  CheckSquare,
  Check,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { mockDocuments, userMamadou } from "@/data/documentsData";
import type { NotarioDocument, DocumentStatus, DocumentType } from "@/types/documents";

// ─── Animations ───────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

// ─── Utilitaires ──────────────────────────────────────────────

function formatRelativeTime(date: Date, t: (k: string) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffH < 1) return t("docs.justNow");
  if (diffH < 24) return `${t("docs.minutesAgo")} ${diffH}${t("docs.hoursSuffix")}`.trim();
  if (diffD === 1) return t("docs.dayAgo");
  return `${t("docs.daysAgo")} ${diffD}${t("docs.daysSuffix")}`.trim();
}

function statusLabel(status: DocumentStatus, t: (k: string) => string): string {
  const map: Record<DocumentStatus, string> = {
    brouillon: t("collab.statusBrouillon"),
    en_revision: t("collab.statusEnRevision"),
    valide: t("collab.statusValide"),
    archive: t("collab.statusArchive"),
  };
  return map[status];
}

function statusClasses(status: DocumentStatus): string {
  const map: Record<DocumentStatus, string> = {
    brouillon: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    en_revision: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    valide: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    archive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[status];
}

function typeLabel(type: DocumentType, t: (k: string) => string): string {
  const map: Record<DocumentType, string> = {
    contrat: t("docs.typeContrat"),
    acte: t("docs.typeActe"),
    courrier: t("docs.typeCourrier"),
    attestation: t("docs.typeAttestation"),
    note: t("docs.typeNote"),
    autre: t("docs.typeAutre"),
  };
  return map[type];
}

function typeClasses(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    contrat: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    acte: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    courrier: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    attestation: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    note: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    autre: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[type];
}

// ─── Helper couleur dossier ────────────────────────────────────

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Palette de couleurs dossier ──────────────────────────────

const FOLDER_COLORS = [
  { name: 'Jaune', value: '#FBBF24' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Vert', value: '#10B981' },
  { name: 'Gris', value: '#6B7280' },
  { name: 'Ardoise', value: '#475569' },
];

// ─── Composant carte document (vue grille) ────────────────────

function DocumentCard({
  doc,
  isSelecting,
  isSelected,
  onToggleSelect,
}: {
  doc: NotarioDocument;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const onlineCollabs = doc.collaborators.filter((c) => c.isOnline);

  return (
    <motion.div
      {...fadeUp}
      className="relative rounded-xl border border-border bg-card p-4 shadow-card flex flex-col gap-3 hover:border-primary/30 transition-colors"
    >
      {/* Checkbox sélection */}
      {isSelecting && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={e => { e.stopPropagation(); onToggleSelect?.(); }}
        >
          <div className={cn(
            "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
          )}>
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn("flex items-start justify-between gap-2", isSelecting && "pl-7")}>
        <button
          className="font-mono text-xs bg-primary/10 text-primary rounded px-2 py-0.5 hover:bg-primary/20 transition-colors"
          onClick={() => navigate(`/dossiers`)}
        >
          {doc.dossierRef}
        </button>
        <span className={cn("text-xs rounded px-2 py-0.5 font-medium", typeClasses(doc.type))}>
          {typeLabel(doc.type, t)}
        </span>
      </div>

      {/* Titre + statut */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {doc.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs rounded px-2 py-0.5 font-medium", statusClasses(doc.status))}>
            {statusLabel(doc.status, t)}
          </span>
          <span className="text-xs text-muted-foreground">v{doc.currentVersion.versionLabel}</span>
        </div>
      </div>

      {/* Modifié par */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ backgroundColor: "#3b82f6" }}
        >
          {doc.updatedBy.initiales}
        </div>
        <span className="truncate">
          {t("docs.modifiedBy")} {doc.updatedBy.prenom} {doc.updatedBy.nom} · {formatRelativeTime(doc.updatedAt, t)}
        </span>
      </div>

      {/* Collaborateurs */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {doc.collaborators.slice(0, 4).map((collab) => (
            <div
              key={collab.id}
              className="relative h-6 w-6 rounded-full border-2 border-card flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: collab.cursorColor }}
              title={`${collab.user.prenom} ${collab.user.nom}`}
            >
              {collab.user.initiales}
              {collab.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-card animate-pulse" />
              )}
            </div>
          ))}
          {doc.collaborators.length > 4 && (
            <div className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
              +{doc.collaborators.length - 4}
            </div>
          )}
        </div>
        {onlineCollabs.length > 0 && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {onlineCollabs.length} en ligne
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => navigate(`/documents/${doc.id}`)}
        >
          Ouvrir
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <History className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => window.open(`/documents/${doc.id}`, '_blank')}>
              <Share2 className="mr-2 h-3.5 w-3.5" /> Ouvrir dans un nouvel onglet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

// ─── Composant vue liste (table) ──────────────────────────────

function DocumentListView({
  docs,
  isSelecting,
  selectedDocs,
  onToggleSelect,
}: {
  docs: NotarioDocument[];
  isSelecting?: boolean;
  selectedDocs?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {isSelecting && <th className="px-4 py-3 w-10" />}
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Titre</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Dossier</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Type</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Statut</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Version</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Collaborateurs</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Modifié le</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                {isSelecting && (
                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                        selectedDocs?.has(doc.id) ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
                      )}
                      onClick={() => onToggleSelect?.(doc.id)}
                    >
                      {selectedDocs?.has(doc.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground line-clamp-1">{doc.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-primary/10 text-primary rounded px-2 py-0.5">
                    {doc.dossierRef}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs rounded px-2 py-0.5 font-medium", typeClasses(doc.type))}>
                    {typeLabel(doc.type, t)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs rounded px-2 py-0.5 font-medium", statusClasses(doc.status))}>
                    {statusLabel(doc.status, t)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  v{doc.currentVersion.versionLabel}
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-1.5">
                    {doc.collaborators.slice(0, 3).map((collab) => (
                      <div
                        key={collab.id}
                        className="relative h-5 w-5 rounded-full border-2 border-card flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ backgroundColor: collab.cursorColor }}
                        title={`${collab.user.prenom} ${collab.user.nom}`}
                      >
                        {collab.user.initiales}
                        {collab.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 border border-card" />
                        )}
                      </div>
                    ))}
                    {doc.collaborators.length > 3 && (
                      <div className="h-5 w-5 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                        +{doc.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {formatRelativeTime(doc.updatedAt, t)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      Ouvrir
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <History className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Aucun document trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────

export default function DocumentsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Filtres
  const [search, setSearch] = useState("");
  const [filterDossier, setFilterDossier] = useState("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "folders">("folders");

  // Modal nouveau document
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocForm, setNewDocForm] = useState({
    title: "",
    dossier: "",
    type: "acte" as DocumentType,
    status: "brouillon" as DocumentStatus,
  });

  // ─── Métadonnées des dossiers (persiste pendant la session) ──

  type FolderMeta = {
    dossierId: string;
    customName?: string;
    color?: string;
    isStarred?: boolean;
  };
  const [folderMetas, setFolderMetas] = useState<Record<string, FolderMeta>>({});

  // Modaux dossier
  const [renamingFolder, setRenamingFolder] = useState<{ dossierId: string; currentName: string } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<{ dossierId: string; ref: string } | null>(null);
  const [coloringFolder, setColoringFolder] = useState<{ dossierId: string; currentColor: string } | null>(null);
  const [sharingFolder, setSharingFolder] = useState<{ dossierId: string; ref: string } | null>(null);

  // État rename
  const [renameValue, setRenameValue] = useState("");

  // Tri
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'docs_desc' | 'docs_asc'>('date_desc');
  const [docSortBy, setDocSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'status' | 'version'>('date_desc');

  // Scroll infini
  const [displayCount, setDisplayCount] = useState(12);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver pour charger plus au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => prev + 12);
        }
      },
      { threshold: 0.1 }
    );
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, []);

  // Reset displayCount quand les filtres changent
  useEffect(() => {
    setDisplayCount(12);
  }, [search, filterDossier, filterType, filterStatus, viewMode, sortBy, docSortBy]);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string>('');
  const [importTitle, setImportTitle] = useState('');
  const [importTargetFolder, setImportTargetFolder] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Sélection multi-documents
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  // Dossier sélectionné (simple clic)
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());

  // Local docs state — allows new documents to appear immediately
  const [allDocs, setAllDocs] = useState<NotarioDocument[]>([...mockDocuments]);

  // Custom empty folders (no documents yet)
  const [customFolders, setCustomFolders] = useState<Array<{id: string; name: string; color: string; createdAt: Date}>>([]);

  // Modal nouveau dossier
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#FBBF24');

  // Recherche de dossier dans le modal "Nouveau document"
  const [folderSearch, setFolderSearch] = useState('');

  // Helpers
  const getFolderMeta = (dossierId: string): FolderMeta =>
    folderMetas[dossierId] ?? { dossierId };

  const updateFolderMeta = (dossierId: string, updates: Partial<FolderMeta>) =>
    setFolderMetas(prev => ({ ...prev, [dossierId]: { ...prev[dossierId], dossierId, ...updates } }));

  // KPI
  const totalDocs = allDocs.length;
  const enRedaction = allDocs.filter((d) => d.status === "brouillon").length;
  const enRevision = allDocs.filter((d) => d.status === "en_revision").length;
  const valides = allDocs.filter((d) => d.status === "valide").length;

  // Dossiers uniques pour le filtre
  const dossiers = useMemo(() => {
    const refs = Array.from(new Set(allDocs.map((d) => d.dossierRef)));
    return refs.sort();
  }, [allDocs]);

  // Filtrage + tri documents
  const filteredDocs = useMemo(() => {
    const filtered = allDocs.filter((doc) => {
      const matchSearch =
        search === "" ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.dossierRef.toLowerCase().includes(search.toLowerCase());
      const matchDossier = filterDossier === "all" || doc.dossierRef === filterDossier;
      const matchType = filterType === "all" || doc.type === filterType;
      const matchStatus = filterStatus === "all" || doc.status === filterStatus;
      return matchSearch && matchDossier && matchType && matchStatus;
    });

    const sortFn = (a: NotarioDocument, b: NotarioDocument) => {
      switch (docSortBy) {
        case 'date_desc': return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'date_asc': return a.updatedAt.getTime() - b.updatedAt.getTime();
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'title_desc': return b.title.localeCompare(a.title);
        case 'status': return a.status.localeCompare(b.status);
        case 'version': return b.currentVersion.versionNumber - a.currentVersion.versionNumber;
        default: return 0;
      }
    };
    return filtered.sort(sortFn);
  }, [allDocs, search, filterDossier, filterType, filterStatus, docSortBy]);

  // Groupes par dossier (vue Dossiers) + tri
  const dossierGroups = useMemo(() => {
    const map = new Map<string, { dossierId: string; dossierRef: string; docs: NotarioDocument[] }>();
    filteredDocs.forEach(doc => {
      if (!map.has(doc.dossierId)) map.set(doc.dossierId, { dossierId: doc.dossierId, dossierRef: doc.dossierRef, docs: [] });
      map.get(doc.dossierId)!.docs.push(doc);
    });

    // Add custom empty folders
    customFolders.forEach(folder => {
      if (!map.has(folder.id)) {
        const nameToMatch = folderMetas[folder.id]?.customName ?? folder.name;
        const matchSearch = search === '' || nameToMatch.toLowerCase().includes(search.toLowerCase()) || folder.id.toLowerCase().includes(search.toLowerCase());
        if (matchSearch) {
          map.set(folder.id, { dossierId: folder.id, dossierRef: folder.name, docs: [] });
        }
      }
    });

    const sortedGroups = Array.from(map.values()).sort((a, b) => {
      const metaA = folderMetas[a.dossierId];
      const metaB = folderMetas[b.dossierId];
      const nameA = metaA?.customName ?? a.dossierRef;
      const nameB = metaB?.customName ?? b.dossierRef;
      const dateA = a.docs.length > 0 ? Math.max(...a.docs.map(d => d.updatedAt.getTime())) : 0;
      const dateB = b.docs.length > 0 ? Math.max(...b.docs.map(d => d.updatedAt.getTime())) : 0;
      switch (sortBy) {
        case 'date_desc': return dateB - dateA;
        case 'date_asc': return dateA - dateB;
        case 'name_asc': return nameA.localeCompare(nameB);
        case 'name_desc': return nameB.localeCompare(nameA);
        case 'docs_desc': return b.docs.length - a.docs.length;
        case 'docs_asc': return a.docs.length - b.docs.length;
        default: return 0;
      }
    });

    // Étoilés en premier
    return sortedGroups.sort((a, b) => {
      const starA = folderMetas[a.dossierId]?.isStarred ? -1 : 1;
      const starB = folderMetas[b.dossierId]?.isStarred ? -1 : 1;
      return starA - starB;
    });
  }, [filteredDocs, sortBy, folderMetas, customFolders, search]);

  const handleImportFile = (file: File) => {
    setImportFile(file);
    setImportTitle(file.name.replace(/\.[^/.]+$/, ''));
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const html = text.split('\n\n')
          .filter(p => p.trim())
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
        setImportPreview(html);
      };
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'html' || ext === 'htm') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const html = e.target?.result as string;
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setImportPreview(bodyMatch ? bodyMatch[1] : html);
      };
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'docx' || ext === 'doc') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const extracted = text
          .replace(/<[^>]+>/g, ' ')
          .replace(/[^\x20-\x7E\u00C0-\u024F\n\r\t]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (extracted.length > 20) {
          const html = `<p>${extracted.substring(0, 5000)}</p><p class="text-xs text-gray-400 italic">Note : import DOCX basique — le formatage complet nécessite une intégration backend.</p>`;
          setImportPreview(html);
        } else {
          setImportPreview(`<p>Document Word importé : <strong>${file.name}</strong></p><p>Le formatage complet sera disponible après traitement.</p>`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'pdf') {
      const url = URL.createObjectURL(file);
      setImportPreview(`<iframe src="${url}" style="width:100%;height:500px;border:none;" title="Aperçu PDF"></iframe>`);
    } else {
      setImportPreview(`<p>Fichier importé : <strong>${file.name}</strong></p>`);
    }
  };

  const handleImportCreate = () => {
    if (!importTitle.trim()) return;
    toast.success(`Document "${importTitle}" importé avec succès`);
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview('');
    setImportTitle('');
  };

  const handleCreateDocument = () => {
    if (!newDocForm.title.trim() || !newDocForm.dossier) return;

    // Find the existing dossier group to get the real dossierId
    const existingGroup = dossierGroups.find(g => g.dossierRef === newDocForm.dossier || g.dossierId === newDocForm.dossier);
    const customFolder = customFolders.find(f => f.name === newDocForm.dossier || f.id === newDocForm.dossier);
    const dossierId = existingGroup?.dossierId ?? customFolder?.id ?? newDocForm.dossier.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dossierRef = existingGroup?.dossierRef ?? customFolder?.name ?? newDocForm.dossier;

    const id = `doc-${Date.now()}`;
    const now = new Date();
    const newDoc: NotarioDocument = {
      id,
      dossierId,
      dossierRef,
      title: newDocForm.title.trim(),
      type: newDocForm.type,
      status: newDocForm.status,
      currentVersion: {
        id: `v-${id}`,
        documentId: id,
        versionNumber: 1,
        versionLabel: '1.0',
        content: `<h2>${newDocForm.title.trim()}</h2><p>${t("docs.startWriting")}</p>`,
        contentSnapshot: '',
        createdAt: now,
        createdBy: userMamadou,
        changesSummary: 'Création du document',
        isDraft: true,
        isMajorVersion: false,
        wordCount: 0,
        sizeBytes: 0,
      },
      versions: [],
      collaborators: [],
      changes: [],
      comments: [],
      createdAt: now,
      createdBy: userMamadou,
      updatedAt: now,
      updatedBy: userMamadou,
      tags: [],
      isLocked: false,
      metadata: { wordCount: 0, pageCount: 1, readingTimeMinutes: 0 },
    };

    mockDocuments.push(newDoc);
    setAllDocs([...mockDocuments]);
    setShowNewDocModal(false);
    setNewDocForm({ title: '', dossier: '', type: 'acte', status: 'brouillon' });
    setFolderSearch('');
    navigate(`/documents/${id}`);
  };

  const handleToggleDoc = (id: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div {...fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rédaction, collaboration et gestion des actes notariés
            <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {allDocs.length} document{allDocs.length > 1 ? 's' : ''}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(viewMode === 'grid' || viewMode === 'list') && (
            <Button
              variant={isSelecting ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => { setIsSelecting(!isSelecting); setSelectedDocs(new Set()); }}
            >
              <CheckSquare className="h-4 w-4" />
              {isSelecting ? 'Terminer' : 'Sélectionner'}
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setNewFolderName(''); setNewFolderColor('#FBBF24'); setShowNewFolderModal(true); }}>
            <Folder className="h-4 w-4" />
            Nouveau dossier
          </Button>
          <Button size="sm" className="gap-2 bg-primary" onClick={() => setShowNewDocModal(true)}>
            <Plus className="h-4 w-4" />
            Nouveau document
          </Button>
        </div>
      </motion.div>

      {/* ─── KPI Cards ──────────────────────────────────────── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-foreground">{totalDocs}</p>
            <p className="text-xs text-muted-foreground">Total documents</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
            <Edit3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-foreground">{enRedaction}</p>
            <p className="text-xs text-muted-foreground">En rédaction</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-foreground">{enRevision}</p>
            <p className="text-xs text-muted-foreground">En révision</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-foreground">{valides}</p>
            <p className="text-xs text-muted-foreground">Validés</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Filtres ─────────────────────────────────────────── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filtre dossier */}
        <Select value={filterDossier} onValueChange={setFilterDossier}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder={t("docs.allFolders")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("docs.allFolders")}</SelectItem>
            {dossiers.map((ref) => (
              <SelectItem key={ref} value={ref}>{ref}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre type */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder={t("docs.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("docs.allTypes")}</SelectItem>
            <SelectItem value="contrat">{t("docs.typeContrat")}</SelectItem>
            <SelectItem value="acte">{t("docs.typeActe")}</SelectItem>
            <SelectItem value="courrier">{t("docs.typeCourrier")}</SelectItem>
            <SelectItem value="attestation">{t("docs.typeAttestation")}</SelectItem>
            <SelectItem value="note">{t("docs.typeNote")}</SelectItem>
            <SelectItem value="autre">{t("docs.typeAutre")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre statut */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder={t("docs.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("docs.allStatuses")}</SelectItem>
            <SelectItem value="brouillon">{t("collab.statusBrouillon")}</SelectItem>
            <SelectItem value="en_revision">{t("collab.statusEnRevision")}</SelectItem>
            <SelectItem value="valide">{t("collab.statusValide")}</SelectItem>
            <SelectItem value="archive">{t("collab.statusArchive")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sélecteur de tri */}
        {viewMode === 'folders' ? (
          <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={t("docs.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">{t("docs.sortRecentFirst")}</SelectItem>
              <SelectItem value="date_asc">{t("docs.sortOldestFirst")}</SelectItem>
              <SelectItem value="name_asc">{t("docs.sortNameAZ")}</SelectItem>
              <SelectItem value="name_desc">{t("docs.sortNameZA")}</SelectItem>
              <SelectItem value="docs_desc">{t("docs.sortMoreDocs")}</SelectItem>
              <SelectItem value="docs_asc">{t("docs.sortLessDocs")}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={docSortBy} onValueChange={(v: typeof docSortBy) => setDocSortBy(v)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={t("docs.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">{t("docs.sortRecentFirst")}</SelectItem>
              <SelectItem value="date_asc">{t("docs.sortOldestFirst")}</SelectItem>
              <SelectItem value="title_asc">{t("docs.sortTitleAZ")}</SelectItem>
              <SelectItem value="title_desc">{t("docs.sortTitleZA")}</SelectItem>
              <SelectItem value="status">{t("docs.sortByStatus")}</SelectItem>
              <SelectItem value="version">{t("docs.sortLatestVersion")}</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Toggle vue */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <button
            className={cn(
              "h-7 w-7 rounded flex items-center justify-center transition-colors",
              viewMode === "folders"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("folders")}
            title={t("docs.viewFolders")}
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </button>
          <button
            className={cn(
              "h-7 w-7 rounded flex items-center justify-center transition-colors",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("grid")}
            title={t("docs.viewGrid")}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button
            className={cn(
              "h-7 w-7 rounded flex items-center justify-center transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("list")}
            title={t("docs.viewList")}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* ─── Résultats ───────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        {viewMode === "folders" && (
          <>
            {dossierGroups.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {dossierGroups.slice(0, displayCount).map(group => {
                  const meta = getFolderMeta(group.dossierId);
                  const folderColor = meta.color ?? '#FBBF24';
                  const darkerColor = meta.color ? adjustColor(meta.color, -20) : '#F59E0B';
                  const isSelected = selectedFolderIds.has(group.dossierId);

                  return (
                    <div
                      key={group.dossierId}
                      className={cn(
                        "group relative flex flex-col items-center gap-2 p-4 rounded-xl border bg-card cursor-pointer transition-all select-none",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/5"
                      )}
                      onClick={() => {
                        setSelectedFolderIds(prev => {
                          const next = new Set(prev);
                          if (next.has(group.dossierId)) next.delete(group.dossierId);
                          else next.add(group.dossierId);
                          return next;
                        });
                      }}
                      onDoubleClick={() => navigate(`/documents/dossier/${group.dossierId}`)}
                      title={t("docs.folderClickHint")}
                    >
                      {/* Étoile favori */}
                      {meta.isStarred && (
                        <div className="absolute top-2 left-2">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </div>
                      )}

                      {/* Menu 3 points (visible au hover) */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-6 w-6 rounded flex items-center justify-center bg-background/80 hover:bg-background border border-border/50 shadow-sm"
                              onClick={e => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => navigate(`/documents/dossier/${group.dossierId}`)}>
                              <FolderOpen className="mr-2 h-4 w-4" /> Ouvrir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => {
                              setRenamingFolder({ dossierId: group.dossierId, currentName: meta.customName ?? group.dossierRef });
                              setRenameValue(meta.customName ?? group.dossierRef);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" /> Renommer
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setColoringFolder({ dossierId: group.dossierId, currentColor: folderColor })}>
                              <Palette className="mr-2 h-4 w-4" /> Changer la couleur
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => updateFolderMeta(group.dossierId, { isStarred: !meta.isStarred })}>
                              <Star className="mr-2 h-4 w-4" /> {meta.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => {
                              toast.success(`Dossier ${group.dossierRef} copié`);
                            }}>
                              <Copy className="mr-2 h-4 w-4" /> Copier
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSharingFolder({ dossierId: group.dossierId, ref: meta.customName ?? group.dossierRef })}>
                              <Share2 className="mr-2 h-4 w-4" /> Partager
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => setDeletingFolder({ dossierId: group.dossierId, ref: meta.customName ?? group.dossierRef })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Icône dossier SVG avec couleur custom */}
                      <div className="relative">
                        <svg viewBox="0 0 48 40" className="w-16 h-14 drop-shadow-sm" fill="none">
                          <rect x="0" y="8" width="48" height="32" rx="4" fill={folderColor} opacity="0.6"/>
                          <path d="M0 12 Q0 8 4 8 L20 8 L24 4 L44 4 Q48 4 48 8 L48 12 Z" fill={folderColor}/>
                          <rect x="0" y="12" width="48" height="28" rx="3" fill={folderColor} opacity="0.4"/>
                          <rect x="0" y="12" width="48" height="28" rx="3" fill={darkerColor} opacity="0.15"/>
                        </svg>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {group.docs.length}
                        </div>
                      </div>

                      {/* Nom + date */}
                      <div className="text-center w-full">
                        <p className="text-xs font-semibold text-foreground font-mono truncate max-w-full px-1">
                          {meta.customName ?? group.dossierRef}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {group.docs.length} doc{group.docs.length > 1 ? 's' : ''}{group.docs.length > 0 ? ` · ${formatRelativeTime(new Date(Math.max(...group.docs.map(d => d.updatedAt.getTime()))), t)}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-border bg-card">
                <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Aucun dossier ne correspond aux filtres</p>
              </div>
            )}
            {dossierGroups.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Clic pour sélectionner · Double-cliquez pour ouvrir le dossier
              </p>
            )}
            {/* Sentinel scroll infini */}
            <div ref={sentinelRef} className="h-4" />
            {displayCount < dossierGroups.length && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Chargement...
                </div>
              </div>
            )}
          </>
        )}
        {viewMode === "grid" && (
          filteredDocs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.slice(0, displayCount).map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isSelecting={isSelecting}
                    isSelected={selectedDocs.has(doc.id)}
                    onToggleSelect={() => handleToggleDoc(doc.id)}
                  />
                ))}
              </div>
              {/* Sentinel scroll infini */}
              <div ref={sentinelRef} className="h-4" />
              {displayCount < filteredDocs.length && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Chargement...
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-border bg-card">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Aucun document ne correspond aux filtres</p>
            </div>
          )
        )}
        {viewMode === "list" && (
          <>
            <DocumentListView
              docs={filteredDocs.slice(0, displayCount)}
              isSelecting={isSelecting}
              selectedDocs={selectedDocs}
              onToggleSelect={handleToggleDoc}
            />
            {/* Sentinel scroll infini */}
            <div ref={sentinelRef} className="h-4" />
            {displayCount < filteredDocs.length && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Chargement...
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ─── Barre d'action flottante (sélection multi-docs) ─── */}
      {isSelecting && selectedDocs.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-lg rounded-xl px-4 py-3"
        >
          <span className="text-sm font-medium text-foreground">
            {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} sélectionné{selectedDocs.size > 1 ? 's' : ''}
          </span>
          <div className="w-px h-5 bg-border" />
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { toast.info('Export en cours...'); setSelectedDocs(new Set()); }}>
            <Download className="h-3.5 w-3.5" /> Exporter
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { toast.success('Partage en cours...'); }}>
            <Share2 className="h-3.5 w-3.5" /> Partager
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => { toast.success(`${selectedDocs.size} document(s) supprimé(s)`); setSelectedDocs(new Set()); }}>
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedDocs(new Set()); setIsSelecting(false); }}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* ─── Modal nouveau document ──────────────────────────── */}
      <Dialog open={showNewDocModal} onOpenChange={setShowNewDocModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("docs.newDocTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("docs.docTitleLabel")}</Label>
              <Input
                placeholder={t("docs.docTitlePlaceholder")}
                value={newDocForm.title}
                onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("docs.folderLabel")}</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-8"
                    placeholder={t("docs.folderSearchPlaceholder")}
                    value={newDocForm.dossier ? newDocForm.dossier : folderSearch}
                    onChange={(e) => {
                      if (newDocForm.dossier) {
                        setNewDocForm({ ...newDocForm, dossier: '' });
                      }
                      setFolderSearch(e.target.value);
                    }}
                  />
                  {newDocForm.dossier && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => { setNewDocForm({ ...newDocForm, dossier: '' }); setFolderSearch(''); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {!newDocForm.dossier && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden max-h-40 overflow-y-auto">
                    {[...dossiers, ...customFolders.map(f => f.name)]
                      .filter(ref => !folderSearch || ref.toLowerCase().includes(folderSearch.toLowerCase()))
                      .map((ref) => (
                        <button
                          key={ref}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNewDocForm({ ...newDocForm, dossier: ref });
                            setFolderSearch('');
                          }}
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="font-mono text-xs">{ref}</span>
                        </button>
                      ))}
                    {[...dossiers, ...customFolders.map(f => f.name)].filter(ref => !folderSearch || ref.toLowerCase().includes(folderSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">{t("docs.noFolderFound")}</div>
                    )}
                  </div>
                )}
              </div>
              {newDocForm.dossier && (
                <div className="flex items-center gap-1.5 mt-1">
                  <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-foreground font-mono">{newDocForm.dossier}</span>
                  <span className="text-xs text-emerald-600">{t("docs.selected")}</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("archNum.docType")}</Label>
              <Select
                value={newDocForm.type}
                onValueChange={(v) => setNewDocForm({ ...newDocForm, type: v as DocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acte">{t("docs.typeActe")}</SelectItem>
                  <SelectItem value="contrat">{t("docs.typeContrat")}</SelectItem>
                  <SelectItem value="courrier">{t("docs.typeCourrier")}</SelectItem>
                  <SelectItem value="attestation">{t("docs.typeAttestation")}</SelectItem>
                  <SelectItem value="note">{t("docs.typeNote")}</SelectItem>
                  <SelectItem value="autre">{t("docs.typeAutre")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("docs.initialStatus")}</Label>
              <Select
                value={newDocForm.status}
                onValueChange={(v) => setNewDocForm({ ...newDocForm, status: v as DocumentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">{t("collab.statusBrouillon")}</SelectItem>
                  <SelectItem value="en_revision">{t("collab.statusEnRevision")}</SelectItem>
                  <SelectItem value="valide">{t("collab.statusValide")}</SelectItem>
                  <SelectItem value="archive">{t("collab.statusArchive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocModal(false)}>
              {t("action.cancel")}
            </Button>
            <Button onClick={handleCreateDocument} disabled={!newDocForm.title.trim()}>
              {t("docs.createDoc")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Renommer dossier ───────────────────────────── */}
      <Dialog open={!!renamingFolder} onOpenChange={o => !o && setRenamingFolder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("docs.renameFolder")}</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-xs text-muted-foreground">{t("docs.folderNameLabel")}</Label>
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className="mt-1.5"
              onKeyDown={e => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  updateFolderMeta(renamingFolder!.dossierId, { customName: renameValue.trim() });
                  setRenamingFolder(null);
                  toast.success(t("docs.folderRenamed"));
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>{t("action.cancel")}</Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={() => {
                updateFolderMeta(renamingFolder!.dossierId, { customName: renameValue.trim() });
                setRenamingFolder(null);
                toast.success(t("docs.folderRenamed"));
              }}
            >{t("archNum.rename")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Couleur dossier ────────────────────────────── */}
      <Dialog open={!!coloringFolder} onOpenChange={o => !o && setColoringFolder(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>{t("docs.folderColor")}</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-5 gap-3">
              {FOLDER_COLORS.map(c => (
                <button
                  key={c.value}
                  className={cn(
                    "h-10 w-10 rounded-lg transition-all border-2",
                    coloringFolder?.currentColor === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                  onClick={() => setColoringFolder(prev => prev ? { ...prev, currentColor: c.value } : null)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColoringFolder(null)}>{t("action.cancel")}</Button>
            <Button onClick={() => {
              updateFolderMeta(coloringFolder!.dossierId, { color: coloringFolder!.currentColor });
              setColoringFolder(null);
              toast.success(t("docs.colorUpdated"));
            }}>{t("archNum.apply")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AlertDialog Supprimer dossier ───────────────────── */}
      <AlertDialog open={!!deletingFolder} onOpenChange={o => !o && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">{t("docs.deleteFolderTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("docs.folderLabel")} <strong>{deletingFolder?.ref}</strong> {t("docs.deleteFolderDesc")} {dossierGroups.find(g => g.dossierId === deletingFolder?.dossierId)?.docs.length ?? 0} {t("docs.deleteFolderDesc2")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast.success(`${t("docs.folderLabel")} ${deletingFolder?.ref} ${t("docs.folderDeleted")}`);
                setDeletingFolder(null);
              }}
            >
              {t("docs.deleteForever")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Modal Partager dossier ───────────────────────────── */}
      <Dialog open={!!sharingFolder} onOpenChange={o => !o && setSharingFolder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("docs.shareFolder")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{t("docs.folderLink")}</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/documents/dossier/${sharingFolder?.dossierId ?? ''}`}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/documents/dossier/${sharingFolder?.dossierId ?? ''}`);
                  toast.success(t("docs.linkCopied"));
                }}>{t("docs.copy")}</Button>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("docs.sendByEmail")}</p>
              <div className="flex gap-2">
                <Input placeholder="email@exemple.com" className="text-sm" />
                <Button size="sm" onClick={() => toast.success(t("docs.invitationSent"))}>{t("docs.send")}</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSharingFolder(null)}>{t("action.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Nouveau dossier ────────────────────────────── */}
      <Dialog open={showNewFolderModal} onOpenChange={o => !o && setShowNewFolderModal(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("archNum.newFolder")}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t("docs.folderNumberLabel")}</Label>
              <Input
                placeholder="Ex: N-2025-110"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    const id = newFolderName.trim();
                    const folder = { id, name: id, color: newFolderColor, createdAt: new Date() };
                    setCustomFolders(prev => [...prev, folder]);
                    setFolderMetas(prev => ({ ...prev, [id]: { dossierId: id, color: newFolderColor } }));
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                    toast.success(`"${id}" ${t("docs.folderCreated")}`);
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("docs.color")}</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c.value}
                    className={cn(
                      "h-8 w-8 rounded-lg border-2 transition-transform hover:scale-105",
                      newFolderColor === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                    onClick={() => setNewFolderColor(c.value)}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
              <svg viewBox="0 0 48 40" className="w-10 h-8 drop-shadow-sm shrink-0" fill="none">
                <rect x="0" y="8" width="48" height="32" rx="4" fill={newFolderColor} opacity="0.6"/>
                <path d="M0 12 Q0 8 4 8 L20 8 L24 4 L44 4 Q48 4 48 8 L48 12 Z" fill={newFolderColor}/>
                <rect x="0" y="12" width="48" height="28" rx="3" fill={newFolderColor} opacity="0.4"/>
              </svg>
              <span className="text-sm font-mono font-semibold text-foreground truncate">
                {newFolderName || t("docs.folderPreviewPlaceholder")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderModal(false)}>{t("action.cancel")}</Button>
            <Button
              disabled={!newFolderName.trim()}
              onClick={() => {
                const id = newFolderName.trim();
                const folder = { id, name: id, color: newFolderColor, createdAt: new Date() };
                setCustomFolders(prev => [...prev, folder]);
                setFolderMetas(prev => ({ ...prev, [id]: { dossierId: id, color: newFolderColor } }));
                setShowNewFolderModal(false);
                setNewFolderName('');
                toast.success(`"${id}" ${t("docs.folderCreated")}`);
              }}
            >
              <Folder className="h-4 w-4 mr-2" />
              {t("docs.createFolder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Import ─── */}
      <Dialog open={showImportModal} onOpenChange={o => { if (!o) { setShowImportModal(false); setImportFile(null); setImportPreview(''); setImportTitle(''); setImportTargetFolder(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("docs.importDoc")}</DialogTitle>
            {importTargetFolder && (
              <p className="text-xs text-muted-foreground">
                {t("docs.importInFolder")} <span className="font-medium text-foreground">{importTargetFolder}</span>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!importFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleImportFile(file);
                }}
                onClick={() => importFileRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("docs.dragDrop")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("docs.orClick")}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['.docx', '.doc', '.pdf', '.txt', '.html'].map(ext => (
                      <span key={ext} className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono">{ext}</span>
                    ))}
                  </div>
                </div>
                <input
                  ref={importFileRef}
                  type="file"
                  className="hidden"
                  accept=".docx,.doc,.pdf,.txt,.html,.htm"
                  onChange={e => { const file = e.target.files?.[0]; if (file) handleImportFile(file); }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} Ko</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => { setImportFile(null); setImportPreview(''); setImportTitle(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">{t("docs.docTitleLabel")}</Label>
                  <Input value={importTitle} onChange={e => setImportTitle(e.target.value)} className="mt-1.5" placeholder={t("docs.docNamePlaceholder")} />
                </div>

                {importPreview && !importPreview.includes('<iframe') && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("docs.contentPreview")}</Label>
                    <div
                      className="border border-border rounded-lg p-3 bg-white dark:bg-gray-900 max-h-48 overflow-y-auto text-sm"
                      dangerouslySetInnerHTML={{ __html: importPreview }}
                    />
                  </div>
                )}
                {importPreview.includes('<iframe') && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("docs.pdfPreview")}</Label>
                    <div className="border border-border rounded-lg overflow-hidden" style={{ height: '300px' }}
                      dangerouslySetInnerHTML={{ __html: importPreview }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview(''); setImportTitle(''); setImportTargetFolder(null); }}>
              {t("action.cancel")}
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              disabled={!importFile || !importTitle.trim()}
              onClick={handleImportCreate}
            >
              <Plus className="mr-2 h-4 w-4" /> {t("docs.createDoc")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
