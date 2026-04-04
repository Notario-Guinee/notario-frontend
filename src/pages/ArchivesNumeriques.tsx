// ═══════════════════════════════════════════════════════════════
// ArchivesNumeriques — Gestionnaire de fichiers style Google Drive
// Navigation, drag-drop, couleurs, aperçu, audit, corbeille,
// tags, quota stockage, accès rapide, versions, filtres avancés
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Folder, FileText, Image, File, Plus, Upload, FolderInput,
  Search, List, MoreVertical, Download, Pencil, Share2, MoveRight,
  Info, Trash2, Star, Link2, ChevronRight, ChevronDown, X, Loader2,
  LayoutGrid, FolderPlus, Check, Eye, RefreshCw, History,
  AlertTriangle, HardDrive, Edit3, SlidersHorizontal, Tag,
  RotateCcw, Flame, Lock, Clock, Bookmark, BarChart2,
  Video, Music, FileSpreadsheet, FileCode,
  Keyboard, AlignJustify, FolderOpen, Rows3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

// ─── Types ──────────────────────────────────────────────────────

type DocStatus = 'Indexé' | 'En traitement' | 'Erreur';
type DocType   = 'PDF' | 'Image' | 'Vidéo' | 'Audio' | 'Texte' | 'Tableur' | 'Code' | 'Autre';
type DriveTag  = 'Urgent' | 'À signer' | 'Confidentiel' | 'Archivé' | 'Important';

interface DriveItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string | null;
  // dossier
  color?: string;
  starred?: boolean;
  // fichier
  docType?: DocType;
  sizeLabel?: string;
  statut?: DocStatus;
  client?: string;
  version?: number;
  // commun
  modifiedAt: string;
  owner: string;
  tags?: DriveTag[];
  // corbeille
  isDeleted?: boolean;
  deletedAt?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  detail: string;
  user: string;
  date: string;
}

// ─── Constantes ─────────────────────────────────────────────────

const FOLDER_COLORS = [
  { name: 'Cinnabar',  value: '#EA4335' },
  { name: 'Flamingo',  value: '#FA7B17' },
  { name: 'Tangerine', value: '#FBBC04' },
  { name: 'Banane',    value: '#F6E05E' },
  { name: 'Sauge',     value: '#CCFF90' },
  { name: 'Basilic',   value: '#007B4B' },
  { name: 'Paon',      value: '#00BEB8' },
  { name: 'Myrtille',  value: '#4285F4' },
  { name: 'Lavande',   value: '#A9C3FC' },
  { name: 'Raisin',    value: '#C9ABFF' },
  { name: 'Graphite',  value: '#94A3B8' },
];

const STATUS_STYLES: Record<DocStatus, string> = {
  'Indexé':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'En traitement': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Erreur':        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TAG_META: Record<DriveTag, { bg: string; text: string; icon: React.ElementType }> = {
  'Urgent':       { bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',      icon: Flame     },
  'À signer':     { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400',  icon: Pencil    },
  'Confidentiel': { bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-400',icon: Lock      },
  'Archivé':      { bg: 'bg-gray-100 dark:bg-gray-900/30',    text: 'text-gray-600 dark:text-gray-400',    icon: Bookmark  },
  'Important':    { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400',    icon: Star      },
};

const ALL_TAGS: DriveTag[] = ['Urgent', 'À signer', 'Confidentiel', 'Archivé', 'Important'];

const INITIAL_ITEMS: DriveItem[] = [
  { id: 'f1', name: 'DOS-2026-001 — Camara Fatoumata', type: 'folder', parentId: null, modifiedAt: '15 févr. 2026', owner: 'Me Diallo', tags: ['Urgent'] },
  { id: 'f2', name: 'DOS-2026-002 — SCI Les Palmiers',  type: 'folder', parentId: null, color: '#4285F4', modifiedAt: '28 févr. 2026', owner: 'Me Diallo' },
  { id: 'f3', name: 'DOS-2026-003 — Bah Ibrahima',      type: 'folder', parentId: null, modifiedAt: '1 mars 2026',  owner: 'Me Diallo' },
  { id: 'f4', name: 'DOS-2025-048 — Soumah Aissatou',   type: 'folder', parentId: null, color: '#EA4335', modifiedAt: '10 déc. 2025', owner: 'Me Diallo', tags: ['Archivé'] },
  { id: 'f5', name: 'N-2025-101 — Bah Oumar',           type: 'folder', parentId: null, starred: true, modifiedAt: '15 janv. 2026', owner: 'Me Diallo', tags: ['Important'] },
  { id: 'f6', name: 'N-2025-103 — SARL Nimba',          type: 'folder', parentId: null, color: '#007B4B', modifiedAt: '1 févr. 2026', owner: 'Me Diallo' },
  { id: 'd1', name: 'Acte de vente terrain Camara.pdf', type: 'file', parentId: 'f1', docType: 'PDF',   sizeLabel: '2.4 Mo', statut: 'Indexé',        client: 'Camara Fatoumata', modifiedAt: '15 févr. 2026', owner: 'Me Diallo', version: 2, tags: ['À signer'] },
  { id: 'd2', name: 'Plan cadastral terrain.png',       type: 'file', parentId: 'f1', docType: 'Image', sizeLabel: '3.3 Mo', statut: 'En traitement', client: 'Camara Fatoumata', modifiedAt: '5 mars 2026',  owner: 'Me Diallo', version: 1 },
  { id: 'd3', name: 'Statuts SCI Les Palmiers.pdf',     type: 'file', parentId: 'f2', docType: 'PDF',   sizeLabel: '4.8 Mo', statut: 'Indexé',        client: 'SCI Les Palmiers', modifiedAt: '28 févr. 2026', owner: 'Me Diallo', version: 3 },
  { id: 'd4', name: 'CNI Bah Ibrahima.jpg',             type: 'file', parentId: 'f3', docType: 'Image', sizeLabel: '1.1 Mo', statut: 'Indexé',        client: 'Bah Ibrahima',     modifiedAt: '20 févr. 2026', owner: 'Me Diallo', version: 1 },
  { id: 'd5', name: 'Extrait RCCM SARL.pdf',            type: 'file', parentId: 'f3', docType: 'PDF',   sizeLabel: '0.9 Mo', statut: 'Erreur',        client: 'SARL Guinée Invest', modifiedAt: '1 mars 2026', owner: 'Me Diallo', version: 1, tags: ['Urgent'] },
  { id: 'd6', name: 'Titre foncier Soumah.pdf',         type: 'file', parentId: 'f4', docType: 'PDF',   sizeLabel: '6.2 Mo', statut: 'Indexé',        client: 'Soumah Aissatou',  modifiedAt: '10 déc. 2025', owner: 'Me Diallo', version: 1, tags: ['Archivé'] },
  { id: 'd7', name: 'Procuration Condé.pdf',            type: 'file', parentId: 'f5', docType: 'PDF',   sizeLabel: '1.5 Mo', statut: 'Indexé',        client: 'Bah Oumar',        modifiedAt: '15 janv. 2026', owner: 'Me Diallo', version: 4, tags: ['Confidentiel'] },
  { id: 'd8', name: 'Attestation bancaire.pdf',         type: 'file', parentId: 'f6', docType: 'PDF',   sizeLabel: '0.7 Mo', statut: 'En traitement', client: 'SARL Nimba',       modifiedAt: '1 févr. 2026',  owner: 'Me Diallo', version: 1 },
];

// ─── Helpers ────────────────────────────────────────────────────

function fileIconComp(item: DriveItem) {
  const t = item.docType?.toLowerCase() ?? '';
  if (t === 'pdf') return FileText;
  if (t === 'image' || /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(item.name)) return Image;
  if (t === 'vidéo' || /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i.test(item.name)) return Video;
  if (t === 'audio' || /\.(mp3|wav|aac|flac|ogg|m4a|wma)$/i.test(item.name)) return Music;
  if (t === 'tableur' || /\.(xlsx?|csv|ods)$/i.test(item.name)) return FileSpreadsheet;
  if (t === 'code' || /\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json|xml)$/i.test(item.name)) return FileCode;
  return File;
}

function nowLabel() {
  return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FR_MONTHS: Record<string, number> = {
  janv: 1, févr: 2, mars: 3, avr: 4, mai: 5, juin: 6,
  juil: 7, août: 8, sept: 9, oct: 10, nov: 11, déc: 12,
};
function parseFrDate(s: string): number {
  const parts = s.toLowerCase().replace('.', '').split(/\s+/);
  const year  = parseInt(parts.find(p => p.length === 4) ?? '0');
  const mKey  = parts.find(p => FR_MONTHS[p]);
  const month = mKey ? FR_MONTHS[mKey] : 0;
  const day   = parseInt(parts.find(p => /^\d{1,2}$/.test(p)) ?? '1');
  return new Date(year, month - 1, day).getTime();
}

function formatSize(label: string | undefined): string {
  if (!label) return '—';
  const n = parseFloat(label);
  if (isNaN(n)) return label;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} Go`;
  if (n < 0.1)   return `${Math.round(n * 1000)} Ko`;
  return `${n.toFixed(1)} Mo`;
}

function relativeTime(dateStr: string): string {
  const ts = parseFrDate(dateStr);
  if (!ts) return dateStr;
  const diffMs  = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH   < 24) return `Il y a ${diffH} h`;
  if (diffD   < 7)  return `Il y a ${diffD} j`;
  return dateStr;
}

// ─── FilterChip ─────────────────────────────────────────────────

interface FilterChipProps { label: string; active: boolean; children: React.ReactNode; }

function FilterChip({ label, active, children }: FilterChipProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={active ? 'secondary' : 'ghost'} size="sm"
          className={cn('h-7 gap-1 text-xs shrink-0 px-2.5 rounded-full border',
            active ? 'border-primary/40' : 'border-transparent')}>
          {active && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          {label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── TagBadge ───────────────────────────────────────────────────

function TagBadge({ tag, onRemove }: { tag: DriveTag; onRemove?: () => void }) {
  const m = TAG_META[tag];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full', m.bg, m.text)}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 ml-0.5">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════

export default function ArchivesNumeriques() {
  const { t } = useLanguage();

  const fileInputRef        = useRef<HTMLInputElement>(null);
  const folderInputRef      = useRef<HTMLInputElement>(null);
  const replaceInputRef     = useRef<HTMLInputElement>(null);
  const ctxImportInputRef   = useRef<HTMLInputElement>(null);
  const [ctxImportTarget, setCtxImportTarget] = useState<DriveItem | null>(null);

  useEffect(() => { folderInputRef.current?.setAttribute('webkitdirectory', ''); }, []);

  // ─── État principal ────────────────────────────────────────
  const [items, setItems]                     = useState<DriveItem[]>(INITIAL_ITEMS);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb]           = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]               = useState<'grid' | 'list' | 'compact'>('grid');
  const [search, setSearch]                   = useState('');
  const [dragging, setDragging]               = useState(false);
  const [importing, setImporting]             = useState(false);
  const [auditLog, setAuditLog]               = useState<AuditEntry[]>([]);
  const [showTrash, setShowTrash]             = useState(false);
  const [showStats, setShowStats]             = useState(false);

  // ─── Filtres & tri ─────────────────────────────────────────
  const [filterType,   setFilterType]   = useState<'all'|'folders'|'pdf'|'image'|'other'>('all');
  const [filterStatus, setFilterStatus] = useState<'all'|'Indexé'|'En traitement'|'Erreur'|'starred'>('all');
  const [filterDate,   setFilterDate]   = useState<'all'|'month'|'year-2026'|'year-2025'>('all');
  const [filterTag,    setFilterTag]    = useState<'all' | DriveTag>('all');
  const [sortBy,       setSortBy]       = useState<'name-asc'|'name-desc'|'date-desc'|'date-asc'|'size-desc'|'size-asc'>('name-asc');

  // ─── Modals ────────────────────────────────────────────────
  const [showNewFolder, setShowNewFolder]   = useState(false);
  const [newFolderName, setNewFolderName]   = useState('');
  const [showAudit, setShowAudit]           = useState(false);
  const [renameItem, setRenameItem]         = useState<DriveItem | null>(null);
  const [renameValue, setRenameValue]       = useState('');
  const [infoItem, setInfoItem]             = useState<DriveItem | null>(null);
  const [moveItem, setMoveItem]             = useState<DriveItem | null>(null);
  const [previewItem, setPreviewItem]       = useState<DriveItem | null>(null);
  const [editItem, setEditItem]             = useState<DriveItem | null>(null);
  const [editName, setEditName]             = useState('');
  const [editDocType, setEditDocType]       = useState<DocType>('PDF');
  const [replaceTarget, setReplaceTarget]   = useState<DriveItem | null>(null);
  const [deleteItem, setDeleteItem]         = useState<DriveItem | null>(null);
  const [deleteReason, setDeleteReason]     = useState('');
  const [shareItem, setShareItem]           = useState<DriveItem | null>(null);
  const [bulkStatusItem, setBulkStatusItem] = useState<DriveItem[] | null>(null);
  const [bulkNewStatus, setBulkNewStatus]   = useState<DocStatus>('Indexé');

  // ─── Nouveaux états (améliorations DMS) ───────────────────
  const [panelItem, setPanelItem]           = useState<DriveItem | null>(null);
  const [isDragOver, setIsDragOver]         = useState(false);
  const [showShortcuts, setShowShortcuts]   = useState(false);

  // ─── Import avec choix de destination ────────────────────
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [showImportDest, setShowImportDest]       = useState(false);
  const [importNewFolder, setImportNewFolder]     = useState('');

  // ─── Audit ────────────────────────────────────────────────

  const audit = (action: string, detail: string) =>
    setAuditLog(prev => [{
      id: String(Date.now()), action, detail, user: 'Me Diallo',
      date: new Date().toLocaleString('fr-FR'),
    }, ...prev]);

  // ─── Items courants (drive ou corbeille) — déclaré ici pour les raccourcis ─
  const currentItems = useMemo(() => {
    let base = showTrash
      ? items.filter(i => i.isDeleted)
      : items.filter(i => i.parentId === currentFolderId && !i.isDeleted);

    if (search) base = base.filter(i =>
      [i.name, i.client ?? '', i.docType ?? '', ...(i.tags ?? [])].some(f =>
        f.toLowerCase().includes(search.toLowerCase())
      )
    );

    if (!showTrash) {
      if (filterType === 'folders') base = base.filter(i => i.type === 'folder');
      else if (filterType === 'pdf')   base = base.filter(i => i.type === 'folder' || i.docType === 'PDF');
      else if (filterType === 'image') base = base.filter(i => i.type === 'folder' || i.docType === 'Image');
      else if (filterType === 'other') base = base.filter(i => i.type === 'folder' || (i.type === 'file' && i.docType !== 'PDF' && i.docType !== 'Image'));

      if (filterStatus === 'starred') base = base.filter(i => i.starred);
      else if (filterStatus !== 'all') base = base.filter(i => i.type === 'folder' || i.statut === filterStatus);

      if (filterDate === 'month')          base = base.filter(i => { const d = new Date(parseFrDate(i.modifiedAt)); return d.getFullYear() === 2026 && d.getMonth() === 2; });
      else if (filterDate === 'year-2026') base = base.filter(i => parseFrDate(i.modifiedAt) >= new Date(2026, 0, 1).getTime());
      else if (filterDate === 'year-2025') base = base.filter(i => { const ts = parseFrDate(i.modifiedAt); return ts >= new Date(2025, 0, 1).getTime() && ts < new Date(2026, 0, 1).getTime(); });

      if (filterTag !== 'all') base = base.filter(i => i.tags?.includes(filterTag));
    }

    const sorted = [...base];
    if      (sortBy === 'name-asc')  sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    else if (sortBy === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name, 'fr'));
    else if (sortBy === 'date-desc') sorted.sort((a, b) => parseFrDate(b.modifiedAt) - parseFrDate(a.modifiedAt));
    else if (sortBy === 'date-asc')  sorted.sort((a, b) => parseFrDate(a.modifiedAt) - parseFrDate(b.modifiedAt));
    else if (sortBy === 'size-desc') sorted.sort((a, b) => parseFloat(b.sizeLabel ?? '0') - parseFloat(a.sizeLabel ?? '0'));
    else if (sortBy === 'size-asc')  sorted.sort((a, b) => parseFloat(a.sizeLabel ?? '0') - parseFloat(b.sizeLabel ?? '0'));

    return sorted;
  }, [items, currentFolderId, search, filterType, filterStatus, filterDate, filterTag, sortBy, showTrash]);

  // ─── Raccourcis clavier ────────────────────────────────────
  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') {
      setPanelItem(null);
      setSelected(new Set());
    } else if (e.key === 'n' || e.key === 'N') {
      if (!showTrash) { setNewFolderName(''); setShowNewFolder(true); }
    } else if (e.key === 'u' || e.key === 'U') {
      if (!showTrash) fileInputRef.current?.click();
    } else if (e.key === 'Delete') {
      if (selected.size > 0 && !showTrash) {
        [...selected].forEach(id => { const it = items.find(i => i.id === id); if (it) softDelete(it); });
        setSelected(new Set());
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      setSelected(new Set(currentItems.map(i => i.id)));
    }
  }, [showTrash, selected, items, currentItems]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  // ─── Quota (simulé) ────────────────────────────────────────
  const usedGb   = useMemo(() => {
    const totalMo = items.filter(i => i.type === 'file' && !i.isDeleted)
      .reduce((acc, f) => acc + parseFloat(f.sizeLabel ?? '0'), 0);
    return (totalMo / 1000).toFixed(2);
  }, [items]);
  const totalGb  = 15;
  const usedPct  = Math.min(100, Math.round((parseFloat(usedGb) / totalGb) * 100));

  const folders      = currentItems.filter(i => i.type === 'folder');
  const files        = currentItems.filter(i => i.type === 'file');
  const trashedCount = items.filter(i => i.isDeleted).length;

  const totalSizeMo = files.reduce((acc, f) => {
    const n = parseFloat(f.sizeLabel ?? '0');
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  // Quick access: favoris (racine, non supprimés)
  const quickAccessItems = useMemo(() =>
    items.filter(i => i.starred && !i.isDeleted && i.parentId === null).slice(0, 4),
    [items]
  );

  // ─── Navigation ────────────────────────────────────────────

  const openFolder = (folder: DriveItem) => {
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setSelected(new Set());
  };

  const goToBreadcrumb = (idx: number) => {
    if (idx < 0) { setBreadcrumb([]); setCurrentFolderId(null); }
    else { setBreadcrumb(prev => prev.slice(0, idx + 1)); setCurrentFolderId(breadcrumb[idx].id); }
    setSelected(new Set());
  };

  // ─── Sélection ─────────────────────────────────────────────

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ─── CRUD ──────────────────────────────────────────────────

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const item: DriveItem = { id: `f-${Date.now()}`, name: newFolderName.trim(), type: 'folder', parentId: currentFolderId, modifiedAt: nowLabel(), owner: 'Me Diallo' };
    setItems(prev => [item, ...prev]);
    audit('Création', `Dossier « ${item.name} » créé`);
    toast.success(`Dossier « ${item.name} » créé`);
    setShowNewFolder(false); setNewFolderName('');
  };

  const renameCommit = () => {
    if (!renameItem || !renameValue.trim()) return;
    const old = renameItem.name;
    setItems(prev => prev.map(i => i.id === renameItem.id ? { ...i, name: renameValue.trim(), modifiedAt: nowLabel() } : i));
    audit('Renommage', `« ${old} » → « ${renameValue.trim()} »`);
    toast.success(`Renommé en « ${renameValue.trim()} »`);
    setRenameItem(null);
  };

  const editCommit = () => {
    if (!editItem) return;
    setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, name: editName.trim() || i.name, docType: editDocType, modifiedAt: nowLabel() } : i));
    audit('Modification', `« ${editItem.name} » — type : ${editDocType}`);
    toast.success('Fichier modifié');
    setEditItem(null);
  };

  const moveCommit = (targetId: string | null) => {
    if (!moveItem) return;
    const dest = targetId ? items.find(i => i.id === targetId)?.name ?? targetId : 'Racine';
    setItems(prev => prev.map(i => i.id === moveItem.id ? { ...i, parentId: targetId, modifiedAt: nowLabel() } : i));
    audit('Déplacement', `« ${moveItem.name} » → ${dest}`);
    toast.success('Déplacé');
    setMoveItem(null);
  };

  const setFolderColor = (itemId: string, color: string | undefined) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, color } : i));
    audit('Couleur', 'Couleur de dossier modifiée');
  };

  const toggleStar = (item: DriveItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, starred: !i.starred } : i));
    audit('Favori', `« ${item.name} » ${item.starred ? 'retiré des' : 'ajouté aux'} favoris`);
    toast.success(item.starred ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const toggleTag = (itemId: string, tag: DriveTag) => {
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const tags = i.tags ?? [];
      return { ...i, tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] };
    }));
  };

  const download = (item: DriveItem) => {
    audit('Téléchargement', `« ${item.name} »`);
    toast.success(`Téléchargement de « ${item.name} »`);
  };

  // Corbeille (soft delete)
  const softDelete = (item: DriveItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isDeleted: true, deletedAt: nowLabel() } : i));
    audit('Corbeille', `« ${item.name} » — Motif : ${deleteReason || 'non précisé'}`);
    toast.info(`« ${item.name} » placé dans la corbeille`);
    setDeleteItem(null); setDeleteReason('');
  };

  const restoreItem = (item: DriveItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isDeleted: false, deletedAt: undefined } : i));
    audit('Restauration', `« ${item.name} » restauré`);
    toast.success(`« ${item.name} » restauré`);
  };

  const permanentDeleteItem = (item: DriveItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    audit('Suppression définitive', `« ${item.name} »`);
    toast.success('Supprimé définitivement');
  };

  const emptyTrash = () => {
    setItems(prev => prev.filter(i => !i.isDeleted));
    audit('Corbeille vidée', `${trashedCount} élément(s) supprimé(s) définitivement`);
    toast.success('Corbeille vidée');
  };

  const bulkStatusCommit = () => {
    if (!bulkStatusItem) return;
    const ids = new Set(bulkStatusItem.map(i => i.id));
    setItems(prev => prev.map(i => ids.has(i.id) && i.type === 'file' ? { ...i, statut: bulkNewStatus, modifiedAt: nowLabel() } : i));
    audit('Statut groupé', `${bulkStatusItem.length} fichier(s) → ${bulkNewStatus}`);
    toast.success(`Statut mis à jour pour ${bulkStatusItem.length} fichier(s)`);
    setBulkStatusItem(null);
    setSelected(new Set());
  };

  // ─── Import fichier ────────────────────────────────────────

  const importFile = (file: File) => {
    setImporting(true);
    setTimeout(() => {
      const item: DriveItem = {
        id: `d-${Date.now()}`, name: file.name, type: 'file',
        parentId: currentFolderId,
        docType: /\.pdf$/i.test(file.name) ? 'PDF'
          : /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(file.name) ? 'Image'
          : /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i.test(file.name) ? 'Vidéo'
          : /\.(mp3|wav|aac|flac|ogg|m4a|wma)$/i.test(file.name) ? 'Audio'
          : /\.(xlsx?|csv|ods)$/i.test(file.name) ? 'Tableur'
          : /\.(docx?|odt|rtf|txt)$/i.test(file.name) ? 'Texte'
          : /\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json|xml)$/i.test(file.name) ? 'Code'
          : 'Autre',
        sizeLabel: `${(file.size / 1_000_000).toFixed(1)} Mo`,
        statut: 'En traitement', modifiedAt: nowLabel(), owner: 'Me Diallo', version: 1,
      };
      setItems(prev => [item, ...prev]);
      audit('Import', `« ${file.name} » importé`);
      setImporting(false);
      toast.success(`« ${file.name} » importé`);
    }, 600);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPendingImportFile(f);
    setImportNewFolder('');
    setShowImportDest(true);
    if (e.target) e.target.value = '';
  };

  const confirmImport = () => {
    if (!pendingImportFile) return;
    let targetParentId = currentFolderId;
    if (importNewFolder.trim()) {
      const folderId = `f-${Date.now()}`;
      const folder: DriveItem = {
        id: folderId, name: importNewFolder.trim(), type: 'folder',
        parentId: currentFolderId, modifiedAt: nowLabel(), owner: 'Me Diallo',
      };
      setItems(prev => [folder, ...prev]);
      audit('Nouveau dossier', `Dossier « ${importNewFolder.trim()} » créé`);
      targetParentId = folderId;
    }
    setImporting(true);
    setTimeout(() => {
      const file = pendingImportFile;
      const item: DriveItem = {
        id: `d-${Date.now()}`, name: file.name, type: 'file',
        parentId: targetParentId,
        docType: /\.pdf$/i.test(file.name) ? 'PDF'
          : /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(file.name) ? 'Image'
          : /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i.test(file.name) ? 'Vidéo'
          : /\.(mp3|wav|aac|flac|ogg|m4a|wma)$/i.test(file.name) ? 'Audio'
          : /\.(xlsx?|csv|ods)$/i.test(file.name) ? 'Tableur'
          : /\.(docx?|odt|rtf|txt)$/i.test(file.name) ? 'Texte'
          : /\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json|xml)$/i.test(file.name) ? 'Code'
          : 'Autre',
        sizeLabel: `${(file.size / 1_000_000).toFixed(1)} Mo`,
        statut: 'En traitement', modifiedAt: nowLabel(), owner: 'Me Diallo', version: 1,
      };
      setItems(prev => [item, ...prev]);
      audit('Import', `« ${file.name} » importé${importNewFolder.trim() ? ` dans « ${importNewFolder.trim()} »` : ''}`);
      setImporting(false);
      toast.success(`« ${file.name} » importé${importNewFolder.trim() ? ` dans « ${importNewFolder.trim()} »` : ''}`);
    }, 600);
    setShowImportDest(false);
    setPendingImportFile(null);
    setImportNewFolder('');
  };

  const handleImportFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    const folderName = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split('/')[0] ?? files[0].name;
    const item: DriveItem = { id: `f-${Date.now()}`, name: folderName, type: 'folder', parentId: currentFolderId, modifiedAt: nowLabel(), owner: 'Me Diallo' };
    setItems(prev => [item, ...prev]);
    audit('Import dossier', `« ${folderName} » — ${files.length} fichier(s)`);
    toast.success(`Dossier « ${folderName} » importé (${files.length} fichier${files.length > 1 ? 's' : ''})`);
    if (e.target) e.target.value = '';
  };

  const handleCtxImportFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !ctxImportTarget) return;
    files.forEach(file => {
      const item: DriveItem = {
        id: `d-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, type: 'file',
        parentId: ctxImportTarget.id,
        docType: /\.pdf$/i.test(file.name) ? 'PDF'
          : /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(file.name) ? 'Image'
          : /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i.test(file.name) ? 'Vidéo'
          : /\.(mp3|wav|aac|flac|ogg|m4a|wma)$/i.test(file.name) ? 'Audio'
          : /\.(xlsx?|csv|ods)$/i.test(file.name) ? 'Tableur'
          : /\.(docx?|odt|rtf|txt)$/i.test(file.name) ? 'Texte'
          : 'Autre',
        sizeLabel: `${(file.size / 1_000_000).toFixed(1)} Mo`,
        statut: 'En traitement', modifiedAt: nowLabel(), owner: 'Me Diallo', version: 1,
      };
      setItems(prev => [item, ...prev]);
      audit('Import', `« ${file.name} » → « ${ctxImportTarget.name} »`);
    });
    toast.success(files.length === 1
      ? `« ${files[0].name} » importé dans « ${ctxImportTarget.name} »`
      : `${files.length} fichiers importés dans « ${ctxImportTarget.name} »`
    );
    if (e.target) e.target.value = '';
    setCtxImportTarget(null);
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !replaceTarget) return;
    setItems(prev => prev.map(i => i.id === replaceTarget.id
      ? { ...i, name: f.name, sizeLabel: `${(f.size / 1_000_000).toFixed(1)} Mo`, modifiedAt: nowLabel(), statut: 'En traitement', version: (i.version ?? 1) + 1 }
      : i
    ));
    audit('Remplacement', `« ${replaceTarget.name} » → « ${f.name} » (v${(replaceTarget.version ?? 1) + 1})`);
    toast.success(`Fichier remplacé par « ${f.name} »`);
    setReplaceTarget(null);
    if (e.target) e.target.value = '';
  };

  // ─── Drag & Drop ───────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false); setIsDragOver(false);
    Array.from(e.dataTransfer.files).forEach(importFile);
  };

  // ─── Menu contextuel ──────────────────────────────────────

  const ContextMenu = ({ item }: { item: DriveItem }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/70"
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {item.type === 'file' && (
          <DropdownMenuItem onClick={() => setPanelItem(item)}>
            <Eye className="h-4 w-4 mr-2" /> Aperçu
          </DropdownMenuItem>
        )}
        {item.type === 'folder' && (
          <DropdownMenuItem onClick={() => { setCtxImportTarget(item); ctxImportInputRef.current?.click(); }}>
            <Upload className="h-4 w-4 mr-2" /> Importer des fichiers
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => download(item)}>
          <Download className="h-4 w-4 mr-2" /> Télécharger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setRenameItem(item); setRenameValue(item.name); }}>
          <Pencil className="h-4 w-4 mr-2" /> Renommer
        </DropdownMenuItem>
        {item.type === 'file' && (
          <>
            <DropdownMenuItem onClick={() => { setEditItem(item); setEditName(item.name); setEditDocType(item.docType ?? 'PDF'); }}>
              <Edit3 className="h-4 w-4 mr-2" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setReplaceTarget(item); replaceInputRef.current?.click(); }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Remplacer (v{(item.version ?? 1) + 1})
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setShareItem(item)}>
          <Share2 className="h-4 w-4 mr-2" /> Partager
          <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput className="h-4 w-4 mr-2" /> Organiser
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setMoveItem(item)}>
              <MoveRight className="h-4 w-4 mr-2" /> Déplacer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Raccourci non disponible en démo')}>
              <Link2 className="h-4 w-4 mr-2" /> Ajouter un raccourci
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStar(item)}>
              <Star className={cn('h-4 w-4 mr-2', item.starred && 'fill-yellow-400 text-yellow-400')} />
              {item.starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="h-4 w-4 mr-2" /> Étiquettes
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            {ALL_TAGS.map(tag => {
              const active = item.tags?.includes(tag);
              const m = TAG_META[tag];
              return (
                <DropdownMenuItem key={tag} onClick={() => toggleTag(item.id, tag)}>
                  <span className={cn('h-3 w-3 rounded-full mr-2 shrink-0', m.bg, 'flex items-center justify-center')}>
                    {active && <Check className="h-2 w-2" />}
                  </span>
                  <span className={m.text}>{tag}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setInfoItem(item)}>
          <Info className="h-4 w-4 mr-2" /> Informations
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => { setDeleteItem(item); setDeleteReason(''); }}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Placer dans la corbeille
        </DropdownMenuItem>

        {item.type === 'folder' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5" onClick={e => e.stopPropagation()}>
              <p className="text-xs font-medium text-muted-foreground mb-2">Couleur du dossier</p>
              <div className="grid grid-cols-6 gap-1">
                <button title={t("archNum.noColor")}
                  className="h-5 w-5 rounded-full border-2 border-border flex items-center justify-center"
                  onClick={() => setFolderColor(item.id, undefined)}>
                  {!item.color && <Check className="h-2.5 w-2.5" />}
                </button>
                {FOLDER_COLORS.map(c => (
                  <button key={c.value} title={c.name}
                    className="h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: c.value }}
                    onClick={() => setFolderColor(item.id, c.value)}>
                    {item.color === c.value && <Check className="h-2.5 w-2.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ─── Corbeille : menu contextuel ───────────────────────────

  const TrashContextMenu = ({ item }: { item: DriveItem }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/70" onClick={e => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => restoreItem(item)}>
          <RotateCcw className="h-4 w-4 mr-2" /> Restaurer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => permanentDeleteItem(item)}>
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ─── Carte dossier ─────────────────────────────────────────

  const FolderCard = ({ folder }: { folder: DriveItem }) => {
    const isSel = selected.has(folder.id);
    const color = folder.color ?? '#94A3B8';
    const childCount = items.filter(i => i.parentId === folder.id && !i.isDeleted).length;
    return (
      <div
        className={cn('group relative flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 cursor-pointer select-none transition-all hover:border-primary/30 hover:bg-accent/40',
          isSel && 'border-primary bg-primary/5 ring-2 ring-primary/20')}
        onClick={() => openFolder(folder)}
      >
        <div
          className={cn('absolute top-1.5 left-1.5 z-10 h-4 w-4 rounded border-2 border-muted-foreground/40 bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity', isSel && 'opacity-100 border-primary bg-primary')}
          onClick={e => toggleSelect(folder.id, e)}
        >
          {isSel && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
        <Folder className="h-7 w-7 shrink-0" style={{ color, fill: color, fillOpacity: 0.18 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{folder.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <p className="text-xs text-muted-foreground">{childCount} élément{childCount > 1 ? 's' : ''}</p>
            {folder.tags?.map(tag => <TagBadge key={tag} tag={tag} />)}
          </div>
        </div>
        {folder.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
        <div onClick={e => e.stopPropagation()}>
          {showTrash ? <TrashContextMenu item={folder} /> : <ContextMenu item={folder} />}
        </div>
      </div>
    );
  };

  // ─── Carte fichier ─────────────────────────────────────────

  const FileCard = ({ file }: { file: DriveItem }) => {
    const isSel    = selected.has(file.id);
    const IconComp = fileIconComp(file);
    const hasErr   = file.statut === 'Erreur';
    return (
      <div
        className={cn('group relative flex flex-col rounded-xl border bg-card overflow-hidden cursor-pointer select-none transition-all hover:border-primary/30 hover:shadow-sm',
          isSel && 'border-primary bg-primary/5 ring-2 ring-primary/20',
          hasErr && 'border-red-200 dark:border-red-900')}
        onClick={e => toggleSelect(file.id, e)}
      >
        <div
          className={cn('absolute top-2 left-2 z-10 h-4 w-4 rounded border-2 border-muted-foreground/40 bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity', isSel && 'opacity-100 border-primary bg-primary')}
          onClick={e => toggleSelect(file.id, e)}
        >
          {isSel && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
        <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
          {showTrash ? <TrashContextMenu item={file} /> : <ContextMenu item={file} />}
        </div>
        {/* Aperçu */}
        <div
          className="h-24 flex flex-col items-center justify-center bg-muted/30 border-b border-border gap-1 cursor-zoom-in relative"
          onClick={e => { e.stopPropagation(); setPanelItem(file); }}
        >
          <IconComp className={cn('h-10 w-10', hasErr ? 'text-red-400' : 'text-muted-foreground/40')} />
          {hasErr && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {(file.version ?? 1) > 1 && (
            <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-muted text-muted-foreground px-1 rounded font-mono">
              v{file.version}
            </span>
          )}
          {file.docType === 'PDF' && file.statut === 'Indexé' && (
            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1 py-px rounded bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 leading-tight">
              OCR
            </span>
          )}
        </div>
        <div className="px-2.5 py-2">
          <p className="text-xs font-medium truncate leading-snug">{file.name}</p>
          <div className="flex items-center justify-between mt-1 gap-1">
            <span className="text-xs text-muted-foreground">{file.sizeLabel}</span>
            {file.statut && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', STATUS_STYLES[file.statut])}>
                {file.statut}
              </span>
            )}
          </div>
          {file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {file.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Ligne liste ───────────────────────────────────────────

  const ItemRow = ({ item, compact = false }: { item: DriveItem; compact?: boolean }) => {
    const isSel    = selected.has(item.id);
    const IconComp = item.type === 'folder' ? Folder : fileIconComp(item);
    const color    = item.type === 'folder' ? (item.color ?? '#94A3B8') : undefined;
    return (
      <div
        className={cn('group flex items-center gap-3 px-3 rounded-lg cursor-pointer hover:bg-accent/50 select-none',
          compact ? 'py-1' : 'py-2',
          isSel && 'bg-primary/5')}
        onClick={() => item.type === 'folder' ? openFolder(item) : setPanelItem(item)}
      >
        <div
          className={cn('h-4 w-4 rounded border-2 border-muted-foreground/40 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity', isSel && 'opacity-100 border-primary bg-primary')}
          onClick={e => toggleSelect(item.id, e)}
        >
          {isSel && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
        <IconComp className="h-5 w-5 shrink-0" style={color ? { color, fill: color, fillOpacity: 0.2 } : { color: '#64748B' }} />
        <span className="flex-1 text-sm truncate">{item.name}</span>
        {/* Tags compacts */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {item.tags?.slice(0, 2).map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
        {item.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
        {item.type === 'file' && item.docType === 'PDF' && item.statut === 'Indexé' && (
          <span className="text-[9px] font-bold px-1 py-px rounded bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 shrink-0 hidden sm:block">OCR</span>
        )}
        {item.type === 'file' && item.statut && (
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', STATUS_STYLES[item.statut])}>
            {item.statut}
          </span>
        )}
        {item.type === 'file' && (item.version ?? 1) > 1 && (
          <span className="text-[10px] text-muted-foreground font-mono shrink-0 hidden sm:block">v{item.version}</span>
        )}
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-24">{item.owner}</span>
        <span className="text-xs text-muted-foreground shrink-0 hidden md:block w-28 text-right">{item.modifiedAt}</span>
        <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">{item.sizeLabel ?? '—'}</span>
        <div onClick={e => e.stopPropagation()}>
          {showTrash ? <TrashContextMenu item={item} /> : <ContextMenu item={item} />}
        </div>
      </div>
    );
  };

  // ─── Render ─────────────────────────────────────────────────

  const activeFilterCount = [filterType !== 'all', filterStatus !== 'all', filterDate !== 'all', filterTag !== 'all'].filter(Boolean).length;
  const hasContent        = folders.length > 0 || files.length > 0;

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-background"
      onDragOver={e => { e.preventDefault(); setDragging(true); setIsDragOver(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDragging(false); setIsDragOver(false); } }}
      onDrop={handleDrop}
    >
      {/* ── Barre stockage + statistiques ── */}
      <div className="px-4 py-2.5 border-b border-border bg-card/50 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{usedGb} Go utilisés sur {totalGb} Go</span>
              <span className={cn('font-medium', usedPct > 80 ? 'text-destructive' : usedPct > 60 ? 'text-amber-500' : 'text-muted-foreground')}>
                {usedPct}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', usedPct > 80 ? 'bg-destructive' : usedPct > 60 ? 'bg-amber-500' : 'bg-primary')}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowStats(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <BarChart2 className="h-3.5 w-3.5" /> Statistiques
        </button>
      </div>

      {/* ── En-tête : breadcrumb + corbeille + toggles + audit ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <nav className="flex items-center gap-1 text-sm font-medium min-w-0">
          {showTrash ? (
            <>
              <button className="hover:text-primary transition-colors text-muted-foreground shrink-0" onClick={() => setShowTrash(false)}>
                Mon Drive
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex items-center gap-1.5 text-foreground">
                <Trash2 className="h-4 w-4 text-muted-foreground" /> Corbeille
              </span>
            </>
          ) : (
            <>
              <button className="hover:text-primary transition-colors shrink-0" onClick={() => goToBreadcrumb(-1)}>
                Mon Drive
              </button>
              {breadcrumb.map((crumb, idx) => (
                <span key={crumb.id} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <button className="hover:text-primary transition-colors truncate max-w-[160px]" onClick={() => goToBreadcrumb(idx)}>
                    {crumb.name}
                  </button>
                </span>
              ))}
            </>
          )}
        </nav>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} title={t("archNum.viewList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'compact' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('compact')} title={t("archNum.viewCompact")}>
            <Rows3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} title={t("archNum.viewGrid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => setShowAudit(true)} title="Journal d'audit">
            <History className="h-4 w-4" />
            {auditLog.length > 0 && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />}
          </Button>
          <Button
            variant={showTrash ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 relative"
            onClick={() => { setShowTrash(v => !v); setSearch(''); }}
            title={t("archNum.trash")}
          >
            <Trash2 className="h-4 w-4" />
            {trashedCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{trashedCount}</span>}
          </Button>
        </div>
      </div>

      {/* ── Barre d'actions ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
        {selected.size > 0 ? (
          <>
            <button className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground shrink-0" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
            <div className="flex items-center gap-1 ml-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title={t("archNum.download")} onClick={() => [...selected].forEach(id => { const it = items.find(i => i.id === id); if (it) download(it); })}>
                <Download className="h-4 w-4" />
              </Button>
              {showTrash ? (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Restaurer la sélection" onClick={() => { [...selected].forEach(id => { const it = items.find(i => i.id === id); if (it) restoreItem(it); }); setSelected(new Set()); }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Supprimer définitivement" onClick={() => { [...selected].forEach(id => { const it = items.find(i => i.id === id); if (it) permanentDeleteItem(it); }); setSelected(new Set()); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Changer le statut en masse */}
                  {[...selected].some(id => items.find(i => i.id === id)?.type === 'file') && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" title={t("archNum.changeStatus")} onClick={() => {
                      const fileItems = [...selected].map(id => items.find(i => i.id === id)).filter(Boolean).filter(i => i!.type === 'file') as DriveItem[];
                      setBulkStatusItem(fileItems); setBulkNewStatus('Indexé');
                    }}>
                      <Clock className="h-3.5 w-3.5" /> Statut
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title={t("archNum.moveToTrash")} onClick={() => {
                    [...selected].forEach(id => { const it = items.find(i => i.id === id); if (it) softDelete(it); });
                    setSelected(new Set());
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {showTrash ? (
              <>
                <span className="text-sm text-muted-foreground">{trashedCount} élément{trashedCount !== 1 ? 's' : ''} dans la corbeille</span>
                {trashedCount > 0 && (
                  <Button variant="destructive" size="sm" className="gap-1.5 text-xs ml-auto" onClick={emptyTrash}>
                    <Trash2 className="h-3.5 w-3.5" /> Vider la corbeille
                  </Button>
                )}
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1.5 shrink-0">
                      {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Nouveau
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem onClick={() => { setNewFolderName(''); setShowNewFolder(true); }}>
                      <FolderPlus className="h-4 w-4 mr-2" /> Nouveau dossier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
                      <FolderInput className="h-4 w-4 mr-2" /> Importer un dossier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Importer un fichier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Rechercher dans Mon Drive" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
                </div>

                {hasContent && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden lg:flex items-center gap-1.5">
                    {folders.length > 0 && `${folders.length} dossier${folders.length > 1 ? 's' : ''}`}
                    {folders.length > 0 && files.length > 0 && ' · '}
                    {files.length > 0 && `${files.length} fichier${files.length > 1 ? 's' : ''} (${totalSizeMo.toFixed(1)} Mo)`}
                  </span>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Barre de filtres ── */}
      {!showTrash && (() => {
        const resetFilters = () => { setFilterType('all'); setFilterStatus('all'); setFilterDate('all'); setFilterTag('all'); setSortBy('name-asc'); };
        const TYPE_LABELS: Record<typeof filterType, string>     = { all: 'Type', folders: 'Dossiers', pdf: 'PDF', image: 'Images', other: 'Autres' };
        const STATUS_LABELS: Record<typeof filterStatus, string> = { all: 'Statut', 'Indexé': 'Indexé', 'En traitement': 'En traitement', 'Erreur': 'Erreur', starred: 'Favoris' };
        const DATE_LABELS: Record<typeof filterDate, string>     = { all: 'Date', month: 'Ce mois', 'year-2026': '2026', 'year-2025': '2025' };
        const SORT_LABELS: Record<typeof sortBy, string>         = { 'name-asc': 'Nom A→Z', 'name-desc': 'Nom Z→A', 'date-desc': 'Récent', 'date-asc': 'Ancien', 'size-desc': 'Taille ↓', 'size-asc': 'Taille ↑' };
        return (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-0.5" />

            <FilterChip label={TYPE_LABELS[filterType]} active={filterType !== 'all'}>
              {(['all','folders','pdf','image','other'] as (typeof filterType)[]).map(v => (
                <DropdownMenuItem key={v} onClick={() => setFilterType(v)}>
                  {filterType === v ? <Check className="h-3.5 w-3.5 mr-2 text-primary" /> : <span className="w-5 mr-0.5 shrink-0" />}
                  {{ all:'Tout', folders:'Dossiers uniquement', pdf:'PDF', image:'Images', other:'Autres fichiers' }[v]}
                </DropdownMenuItem>
              ))}
            </FilterChip>

            <FilterChip label={STATUS_LABELS[filterStatus]} active={filterStatus !== 'all'}>
              {(['all','Indexé','En traitement','Erreur','starred'] as (typeof filterStatus)[]).map(v => (
                <DropdownMenuItem key={v} onClick={() => setFilterStatus(v)}>
                  {filterStatus === v ? <Check className="h-3.5 w-3.5 mr-2 text-primary" /> : <span className="w-5 mr-0.5 shrink-0" />}
                  {{ all:'Tout', 'Indexé':'Indexé', 'En traitement':'En traitement', 'Erreur':'Erreur', starred:'Favoris ⭐' }[v]}
                </DropdownMenuItem>
              ))}
            </FilterChip>

            <FilterChip label={filterTag !== 'all' ? filterTag : 'Étiquette'} active={filterTag !== 'all'}>
              <DropdownMenuItem onClick={() => setFilterTag('all')}>
                {filterTag === 'all' ? <Check className="h-3.5 w-3.5 mr-2 text-primary" /> : <span className="w-5 mr-0.5 shrink-0" />}
                Toutes
              </DropdownMenuItem>
              {ALL_TAGS.map(tag => {
                const m = TAG_META[tag];
                return (
                  <DropdownMenuItem key={tag} onClick={() => setFilterTag(tag)}>
                    {filterTag === tag ? <Check className="h-3.5 w-3.5 mr-2 text-primary" /> : <span className="w-5 mr-0.5 shrink-0" />}
                    <span className={m.text}>{tag}</span>
                  </DropdownMenuItem>
                );
              })}
            </FilterChip>

            <FilterChip label={DATE_LABELS[filterDate]} active={filterDate !== 'all'}>
              {(['all','month','year-2026','year-2025'] as (typeof filterDate)[]).map(v => (
                <DropdownMenuItem key={v} onClick={() => setFilterDate(v)}>
                  {filterDate === v ? <Check className="h-3.5 w-3.5 mr-2 text-primary" /> : <span className="w-5 mr-0.5 shrink-0" />}
                  {{ all:'Toutes les dates', month:'Ce mois (mars 2026)', 'year-2026':'Année 2026', 'year-2025':'Année 2025' }[v]}
                </DropdownMenuItem>
              ))}
            </FilterChip>

            <FilterChip label={SORT_LABELS[sortBy]} active={sortBy !== 'name-asc'}>
              {(['name-asc','name-desc','date-desc','date-asc','size-desc','size-asc'] as (typeof sortBy)[]).map(v => (
                <DropdownMenuItem key={v} onClick={() => setSortBy(v)}>
                  {sortBy === v ? <Check className="h-3.5 w-3.5 mr-2 text-primary" /> : <span className="w-5 mr-0.5 shrink-0" />}
                  {{ 'name-asc':'Nom A → Z', 'name-desc':'Nom Z → A', 'date-desc':'Plus récent', 'date-asc':'Plus ancien', 'size-desc':'Taille ↓', 'size-asc':'Taille ↑' }[v]}
                </DropdownMenuItem>
              ))}
            </FilterChip>

            {(activeFilterCount > 0 || sortBy !== 'name-asc') && (
              <>
                <div className="w-px h-4 bg-border mx-0.5 shrink-0" />
                <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 px-1" onClick={resetFilters}>
                  <X className="h-3 w-3" /> Réinitialiser
                </button>
              </>
            )}
            {activeFilterCount > 0 && (
              <span className="ml-auto text-xs text-muted-foreground shrink-0 pl-2">
                {currentItems.length} résultat{currentItems.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      })()}

      {/* Inputs cachés */}
      <input ref={fileInputRef}      type="file"          className="hidden" onChange={handleImportFile} accept="*/*" />
      <input ref={folderInputRef}    type="file" multiple className="hidden" onChange={handleImportFolder} />
      <input ref={replaceInputRef}   type="file"          className="hidden" onChange={handleReplaceFile} />
      <input ref={ctxImportInputRef} type="file" multiple className="hidden" onChange={handleCtxImportFiles} accept="*/*" />

      {/* ── Overlay drag & drop ── */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50/90 dark:bg-blue-950/80 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400">
            <Upload className="h-14 w-14" />
            <p className="text-xl font-bold">Déposez vos fichiers ici</p>
            <p className="text-sm opacity-80">Ils seront importés dans le dossier courant</p>
          </div>
        </div>
      )}

      {/* ── Contenu principal + panneau latéral ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Zone de contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-w-0">

          {/* Accès rapide (racine, hors corbeille, si des favoris existent) */}
          {!showTrash && !currentFolderId && !search && activeFilterCount === 0 && quickAccessItems.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Accès rapide
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {quickAccessItems.map(f => (
                  <div
                    key={f.id}
                    className="group relative flex items-center gap-2.5 rounded-xl border bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-700/30 px-3 py-2.5 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                    onClick={() => openFolder(f)}
                  >
                    <Folder className="h-6 w-6 shrink-0" style={{ color: f.color ?? '#F59E0B', fill: f.color ?? '#F59E0B', fillOpacity: 0.18 }} />
                    <p className="text-xs font-medium truncate">{f.name}</p>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 ml-auto shrink-0" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hasContent ? (
            /* ── État vide illustré ── */
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className={cn(
                'h-28 w-28 rounded-3xl flex items-center justify-center mb-6 shadow-inner',
                showTrash ? 'bg-red-50 dark:bg-red-950/30' :
                search ? 'bg-blue-50 dark:bg-blue-950/30' :
                activeFilterCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30' :
                'bg-muted/60'
              )}>
                {showTrash
                  ? <Trash2 className="h-12 w-12 text-red-300 dark:text-red-700" />
                  : search
                  ? <Search className="h-12 w-12 text-blue-300 dark:text-blue-700" />
                  : activeFilterCount > 0
                  ? <SlidersHorizontal className="h-12 w-12 text-amber-400 dark:text-amber-600" />
                  : <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                }
              </div>
              <p className="text-base font-semibold mb-1">
                {showTrash ? 'La corbeille est vide'
                 : search ? `Aucun résultat pour « ${search} »`
                 : activeFilterCount > 0 ? 'Aucun élément ne correspond aux filtres'
                 : 'Ce dossier est vide'}
              </p>
              <p className="text-xs opacity-60 text-center max-w-xs">
                {showTrash ? 'Les fichiers supprimés apparaissent ici avant suppression définitive.'
                 : search ? 'Vérifiez l\'orthographe ou essayez un autre terme de recherche.'
                 : activeFilterCount > 0 ? 'Modifiez ou réinitialisez les filtres actifs pour voir plus d\'éléments.'
                 : 'Glissez des fichiers ici ou utilisez le bouton « Nouveau » pour commencer.'}
              </p>
              {!search && activeFilterCount === 0 && !showTrash && (
                <Button size="sm" className="mt-5 gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Importer un fichier
                </Button>
              )}
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" className="mt-4 gap-1.5"
                  onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterDate('all'); setFilterTag('all'); setSortBy('name-asc'); }}>
                  <X className="h-3.5 w-3.5" /> Réinitialiser les filtres
                </Button>
              )}
              {search && (
                <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setSearch('')}>
                  <X className="h-3.5 w-3.5" /> Effacer la recherche
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="space-y-6">
              {folders.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {showTrash ? 'Dossiers dans la corbeille' : 'Dossiers'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {folders.map(f => <FolderCard key={f.id} folder={f} />)}
                  </div>
                </section>
              )}
              {files.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {showTrash ? 'Fichiers dans la corbeille' : 'Fichiers'}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {files.map(f => <FileCard key={f.id} file={f} />)}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* Vue liste + vue compacte */
            <div>
              <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                <div className="w-4 shrink-0" /><div className="w-5 shrink-0" />
                <span className="flex-1">Nom</span>
                <span className="hidden sm:block w-16">OCR</span>
                <span className="hidden lg:block w-28">Étiquettes</span>
                <span className="hidden sm:block w-24">Propriétaire</span>
                <span className="hidden md:block w-28 text-right">Modifié</span>
                <span className="w-14 text-right">Taille</span>
                <div className="w-7 shrink-0" />
              </div>
              {[...folders, ...files].map(i => (
                <ItemRow key={i.id} item={i} compact={viewMode === 'compact'} />
              ))}
            </div>
          )}
        </div>

        {/* ── Panneau latéral d'aperçu ── */}
        {panelItem && (
          <aside className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
            {/* En-tête du panneau */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold truncate flex-1 mr-2">{panelItem.name}</span>
              <button
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0"
                onClick={() => setPanelItem(null)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Zone d'aperçu simulée */}
            <div className="mx-4 mt-4 rounded-xl border border-border bg-muted/30 h-40 flex flex-col items-center justify-center gap-2 shrink-0">
              {(() => {
                const I = fileIconComp(panelItem);
                return <I className="h-12 w-12 text-muted-foreground/25" />;
              })()}
              <p className="text-[11px] text-muted-foreground text-center px-3">Aperçu non disponible</p>
              {panelItem.docType === 'PDF' && panelItem.statut === 'Indexé' && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                  OCR indexé
                </span>
              )}
            </div>

            {/* Métadonnées */}
            <div className="px-4 py-3 space-y-3 flex-1">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("archNum.info")}</p>
                <dl className="space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{t("archNum.labelType")}</dt>
                    <dd className="font-medium text-right">{panelItem.docType ?? '—'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{t("archNum.labelSize")}</dt>
                    <dd className="font-medium text-right">{formatSize(panelItem.sizeLabel)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{t("archNum.labelVersion")}</dt>
                    <dd className="font-medium text-right font-mono">v{panelItem.version ?? 1}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{t("archNum.labelStatus")}</dt>
                    <dd>
                      {panelItem.statut && (
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', STATUS_STYLES[panelItem.statut])}>
                          {panelItem.statut}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{t("archNum.labelOwner")}</dt>
                    <dd className="font-medium text-right">{panelItem.owner}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{t("archNum.labelModified")}</dt>
                    <dd className="font-medium text-right">{panelItem.modifiedAt}</dd>
                  </div>
                  {panelItem.client && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-muted-foreground shrink-0">{t("archNum.labelClient")}</dt>
                      <dd className="font-medium text-right truncate max-w-[130px]">{panelItem.client}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {panelItem.tags && panelItem.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("archNum.labelTags")}</p>
                  <div className="flex flex-wrap gap-1">
                    {panelItem.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="px-4 pb-4 pt-2 border-t border-border space-y-2">
              <Button size="sm" className="w-full gap-1.5 justify-start" onClick={() => { setPreviewItem(panelItem); }}>
                <Eye className="h-3.5 w-3.5" /> {t("archNum.openPreview")}
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-1.5 justify-start" onClick={() => download(panelItem)}>
                <Download className="h-3.5 w-3.5" /> {t("archNum.download")}
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-1.5 justify-start" onClick={() => setShareItem(panelItem)}>
                <Share2 className="h-3.5 w-3.5" /> {t("archNum.share")}
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-1.5 justify-start text-destructive hover:text-destructive"
                onClick={() => { setDeleteItem(panelItem); setDeleteReason(''); setPanelItem(null); }}>
                <Trash2 className="h-3.5 w-3.5" /> {t("archNum.moveToTrash")}
              </Button>
            </div>
          </aside>
        )}

        {/* ── Barre latérale activité (sidebar droite quand pas de panneau) ── */}
        {!panelItem && auditLog.length > 0 && (
          <aside className="w-56 shrink-0 border-l border-border bg-card/50 flex flex-col overflow-y-auto hidden xl:flex">
            <div className="px-3 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3 w-3" /> Activité récente
              </p>
            </div>
            <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
              {auditLog.slice(0, 5).map((entry, idx) => (
                <div key={entry.id} className="flex items-start gap-2 text-xs relative">
                  {idx < Math.min(4, auditLog.length - 1) && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                  )}
                  <div className="h-3.5 w-3.5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground leading-snug truncate">{entry.action}</p>
                    <p className="text-muted-foreground truncate text-[10px] leading-snug">{entry.detail}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">{entry.date.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 pb-3">
              <button
                className="w-full text-[10px] text-muted-foreground hover:text-foreground text-center transition-colors"
                onClick={() => setShowAudit(true)}
              >
                Voir tout le journal →
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ════ Modals ════ */}

      {/* Nouveau dossier */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("archNum.newFolder")}</DialogTitle></DialogHeader>
          <Input placeholder={t("archNum.folderNamePlaceholder")} value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder()} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewFolder(false)}>{t("action.cancel")}</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>{t("archNum.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destination d'import */}
      <Dialog open={showImportDest} onOpenChange={o => { setShowImportDest(o); if (!o) setPendingImportFile(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              {t("archNum.importFile")}
            </DialogTitle>
            <DialogDescription className="truncate text-xs">
              {pendingImportFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Emplacement actuel */}
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
              <p className="text-xs text-muted-foreground mb-0.5">{t("archNum.currentLocation")}</p>
              <p className="font-medium truncate">
                {breadcrumb.length > 0 ? breadcrumb.map(b => b.name).join(' / ') : t("archNum.root")}
              </p>
            </div>
            {/* Option: nouveau dossier */}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("archNum.createNewFolder")} <span className="text-muted-foreground font-normal">{t("archNum.optional")}</span></Label>
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder={t("archNum.newFolderPlaceholder")}
                  value={importNewFolder}
                  onChange={e => setImportNewFolder(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && pendingImportFile && confirmImport()}
                />
              </div>
              {importNewFolder.trim() && (
                <p className="text-xs text-muted-foreground pl-6">
                  {t("archNum.fileAddedToNewFolder")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowImportDest(false); setPendingImportFile(null); }}>
              {t("action.cancel")}
            </Button>
            <Button onClick={confirmImport} disabled={!pendingImportFile}>
              <Upload className="h-4 w-4 mr-1.5" />
              {t("archNum.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renommer */}
      <Dialog open={!!renameItem} onOpenChange={o => !o && setRenameItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("archNum.rename")}</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameCommit()} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameItem(null)}>{t("action.cancel")}</Button>
            <Button onClick={renameCommit} disabled={!renameValue.trim()}>{t("archNum.rename")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier (fichier) */}
      <Dialog open={!!editItem} onOpenChange={o => !o && setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("archNum.editFile")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("archNum.name")}</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("archNum.docType")}</Label>
              <Select value={editDocType} onValueChange={v => setEditDocType(v as DocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['PDF', 'Image', 'Vidéo', 'Audio', 'Texte', 'Tableur', 'Code', 'Autre'] as DocType[]).map(dt => (
                    <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>{t("action.cancel")}</Button>
            <Button onClick={editCommit}>{t("archNum.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Déplacer */}
      <Dialog open={!!moveItem} onOpenChange={o => !o && setMoveItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("archNum.move")} « {moveItem?.name} »</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-left" onClick={() => moveCommit(null)}>
              <Folder className="h-4 w-4 text-muted-foreground" /> {t("archNum.myDrive")}
            </button>
            {items.filter(i => i.type === 'folder' && i.id !== moveItem?.id && !i.isDeleted).map(f => (
              <button key={f.id} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-left" onClick={() => moveCommit(f.id)}>
                <Folder className="h-4 w-4" style={{ color: f.color ?? '#94A3B8' }} />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setMoveItem(null)}>{t("action.cancel")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aperçu */}
      <Dialog open={!!previewItem} onOpenChange={o => !o && setPreviewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base truncate pr-8">
              {previewItem && (() => { const I = fileIconComp(previewItem); return <I className="h-5 w-5 shrink-0 text-muted-foreground" />; })()}
              {previewItem?.name}
            </DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/40 border border-border h-48 flex flex-col items-center justify-center gap-2">
                {(() => { const I = fileIconComp(previewItem); return <I className="h-14 w-14 text-muted-foreground/30" />; })()}
                <p className="text-xs text-muted-foreground">{t("archNum.previewUnavailable")}</p>
              </div>
              <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">{t("archNum.labelType")}</dt><dd>{previewItem.docType}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelSize")}</dt><dd>{previewItem.sizeLabel}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelVersion")}</dt><dd>v{previewItem.version ?? 1}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelStatus")}</dt>
                <dd>{previewItem.statut && <span className={cn('px-1.5 py-0.5 rounded-full font-medium', STATUS_STYLES[previewItem.statut])}>{previewItem.statut}</span>}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelClient")}</dt><dd>{previewItem.client ?? '—'}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelModified")}</dt><dd>{previewItem.modifiedAt}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelOwner")}</dt><dd>{previewItem.owner}</dd>
                {previewItem.tags && previewItem.tags.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">{t("archNum.labelTags")}</dt>
                    <dd className="flex flex-wrap gap-1">
                      {previewItem.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => previewItem && download(previewItem)}>
              <Download className="h-4 w-4 mr-1.5" /> {t("archNum.download")}
            </Button>
            <Button variant="ghost" onClick={() => setPreviewItem(null)}>{t("action.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Informations */}
      <Dialog open={!!infoItem} onOpenChange={o => !o && setInfoItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("archNum.info")}</DialogTitle></DialogHeader>
          {infoItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                {infoItem.type === 'folder'
                  ? <Folder className="h-10 w-10 shrink-0" style={{ color: infoItem.color ?? '#94A3B8', fill: infoItem.color ?? '#94A3B8', fillOpacity: 0.2 }} />
                  : <FileText className="h-10 w-10 shrink-0 text-muted-foreground" />
                }
                <span className="font-medium text-sm leading-snug">{infoItem.name}</span>
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-xs">
                <dt className="text-muted-foreground">{t("archNum.labelType")}</dt><dd>{infoItem.type === 'folder' ? t("archNum.folder") : infoItem.docType}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelOwner")}</dt><dd>{infoItem.owner}</dd>
                <dt className="text-muted-foreground">{t("archNum.labelModifiedOn")}</dt><dd>{infoItem.modifiedAt}</dd>
                {infoItem.type === 'file' && <><dt className="text-muted-foreground">{t("archNum.labelVersion")}</dt><dd>v{infoItem.version ?? 1}</dd></>}
                {infoItem.sizeLabel && <><dt className="text-muted-foreground">{t("archNum.labelSize")}</dt><dd>{infoItem.sizeLabel}</dd></>}
                {infoItem.client && <><dt className="text-muted-foreground">{t("archNum.labelClient")}</dt><dd>{infoItem.client}</dd></>}
                {infoItem.tags && infoItem.tags.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">{t("archNum.labelTags")}</dt>
                    <dd className="flex flex-wrap gap-1">{infoItem.tags.map(tag => <TagBadge key={tag} tag={tag} />)}</dd>
                  </>
                )}
              </dl>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setInfoItem(null)}>{t("action.close")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partage */}
      <Dialog open={!!shareItem} onOpenChange={o => !o && setShareItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> {t("archNum.share")}</DialogTitle>
            <DialogDescription>« {shareItem?.name} »</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder={t("archNum.emailPlaceholder")} className="flex-1" />
              <Select defaultValue="viewer">
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{t("archNum.readAccess")}</SelectItem>
                  <SelectItem value="editor">{t("archNum.editAccess")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
              {t("archNum.currentAccess")} <span className="text-foreground font-medium">Me Diallo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareItem(null)}>{t("action.cancel")}</Button>
            <Button onClick={() => { toast.success(t("archNum.invitationSent")); setShareItem(null); }}>{t("archNum.invite")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Corbeille (suppression douce avec motif) */}
      <Dialog open={!!deleteItem} onOpenChange={o => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> {t("archNum.trashTitle")}
            </DialogTitle>
            <DialogDescription>
              « {deleteItem?.name} » {t("archNum.trashDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>{t("archNum.reasonLabel")}</Label>
            <Textarea placeholder={t("archNum.reasonPlaceholder")} value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={3} className="resize-none" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>{t("action.cancel")}</Button>
            <Button variant="destructive" onClick={() => deleteItem && softDelete(deleteItem)}>{t("archNum.moveToTrash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Changement de statut en masse */}
      <Dialog open={!!bulkStatusItem} onOpenChange={o => !o && setBulkStatusItem(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t("archNum.editStatus")}</DialogTitle>
            <DialogDescription>{bulkStatusItem?.length} {t("archNum.filesSelected")}</DialogDescription>
          </DialogHeader>
          <Select value={bulkNewStatus} onValueChange={v => setBulkNewStatus(v as DocStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['Indexé', 'En traitement', 'Erreur'] as DocStatus[]).map(s => (
                <SelectItem key={s} value={s}>
                  <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', STATUS_STYLES[s])}>{s}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkStatusItem(null)}>{t("action.cancel")}</Button>
            <Button onClick={bulkStatusCommit}>{t("archNum.apply")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistiques */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> {t("archNum.statsTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("archNum.statFolders"), value: items.filter(i => i.type === 'folder' && !i.isDeleted).length, color: 'text-blue-500' },
                { label: t("archNum.statFiles"), value: items.filter(i => i.type === 'file' && !i.isDeleted).length, color: 'text-green-500' },
                { label: t("archNum.statFavorites"), value: items.filter(i => i.starred && !i.isDeleted).length, color: 'text-amber-500' },
                { label: t("archNum.trash"), value: trashedCount, color: 'text-destructive' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1">
                  <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("archNum.byStatus")}</p>
              {(['Indexé', 'En traitement', 'Erreur'] as DocStatus[]).map(s => {
                const count = items.filter(i => i.type === 'file' && i.statut === s && !i.isDeleted).length;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full w-24 text-center', STATUS_STYLES[s])}>{s}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(5, (count / Math.max(1, items.filter(i => i.type === 'file' && !i.isDeleted).length)) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("archNum.byTag")}</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map(tag => {
                  const count = items.filter(i => i.tags?.includes(tag) && !i.isDeleted).length;
                  if (!count) return null;
                  return (
                    <span key={tag} className="flex items-center gap-1">
                      <TagBadge tag={tag} />
                      <span className="text-xs text-muted-foreground">×{count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setShowStats(false)}>{t("action.close")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Journal d'audit */}
      <Dialog open={showAudit} onOpenChange={setShowAudit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> {t("audit.title")}</DialogTitle>
          </DialogHeader>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("archNum.noActions")}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditLog.map((entry, idx) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm pb-2 last:pb-0 relative">
                  {idx < auditLog.length - 1 && <div className="absolute left-[19px] top-7 bottom-0 w-px bg-border" />}
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">{entry.action}</Badge>
                      <p className="text-foreground text-xs truncate">{entry.detail}</p>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">{entry.user} · {entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            {auditLog.length > 0 && <Button variant="ghost" size="sm" onClick={() => setAuditLog([])}>{t("archNum.clearHistory")}</Button>}
            <Button variant="ghost" onClick={() => setShowAudit(false)}>{t("action.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raccourcis clavier */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" /> {t("archNum.shortcuts")}
            </DialogTitle>
            <DialogDescription>{t("archNum.shortcutsDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {[
              { keys: ['N'],         desc: t("archNum.scNewFolder") },
              { keys: ['U'],         desc: t("archNum.scImport") },
              { keys: ['Del'],       desc: t("archNum.scDelete") },
              { keys: ['Ctrl', 'A'], desc: t("archNum.scSelectAll") },
              { keys: ['Esc'],       desc: t("archNum.scClose") },
            ].map(({ keys, desc }) => (
              <div key={desc} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm text-foreground">{desc}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center min-w-[2rem] h-6 px-1.5 rounded border border-border bg-muted text-xs font-mono font-medium shadow-sm">
                        {k}
                      </kbd>
                      {i < keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowShortcuts(false)}>{t("action.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bouton flottant raccourcis */}
      <button
        className="fixed bottom-6 right-6 z-40 h-8 w-8 rounded-full border border-border bg-card shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all hover:scale-110"
        title={t("archNum.shortcuts")}
        onClick={() => setShowShortcuts(true)}
      >
        <span className="text-sm font-bold leading-none">?</span>
      </button>
    </div>
  );
}
