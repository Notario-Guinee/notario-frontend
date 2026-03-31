// ═══════════════════════════════════════════════════════════════
// ArchivesNumeriques — Gestionnaire de fichiers style Google Drive
// Navigation, drag-drop, couleurs, aperçu, audit, corbeille,
// tags, quota stockage, accès rapide, versions, filtres avancés
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Folder, FileText, Image, File, Plus, Upload, FolderInput,
  Search, List, MoreVertical, Download, Pencil, Share2, MoveRight,
  Info, Trash2, Star, Link2, ChevronRight, ChevronDown, X, Loader2,
  LayoutGrid, FolderPlus, Check, Eye, RefreshCw, History,
  AlertTriangle, HardDrive, Edit3, SlidersHorizontal, Tag,
  RotateCcw, Flame, Lock, Clock, Bookmark, BarChart2,
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
type DocType   = 'PDF' | 'Image' | 'Texte' | 'Tableur' | 'Autre';
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
  if (t === 'image' || /\.(png|jpe?g|gif|webp)$/i.test(item.name)) return Image;
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
  useLanguage();

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const folderInputRef  = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { folderInputRef.current?.setAttribute('webkitdirectory', ''); }, []);

  // ─── État principal ────────────────────────────────────────
  const [items, setItems]                     = useState<DriveItem[]>(INITIAL_ITEMS);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb]           = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [viewMode, setViewMode]               = useState<'grid' | 'list'>('grid');
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

  // ─── Audit ────────────────────────────────────────────────

  const audit = (action: string, detail: string) =>
    setAuditLog(prev => [{
      id: String(Date.now()), action, detail, user: 'Me Diallo',
      date: new Date().toLocaleString('fr-FR'),
    }, ...prev]);

  // ─── Quota (simulé) ────────────────────────────────────────
  const usedGb   = useMemo(() => {
    const totalMo = items.filter(i => i.type === 'file' && !i.isDeleted)
      .reduce((acc, f) => acc + parseFloat(f.sizeLabel ?? '0'), 0);
    return (totalMo / 1000).toFixed(2);
  }, [items]);
  const totalGb  = 15;
  const usedPct  = Math.min(100, Math.round((parseFloat(usedGb) / totalGb) * 100));

  // ─── Items courants (drive ou corbeille) ───────────────────

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
        docType: /\.pdf$/i.test(file.name) ? 'PDF' : /\.(png|jpe?g|gif|webp)$/i.test(file.name) ? 'Image' : 'Autre',
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
    importFile(f);
    if (e.target) e.target.value = '';
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
    e.preventDefault(); setDragging(false);
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
          <DropdownMenuItem onClick={() => setPreviewItem(item)}>
            <Eye className="h-4 w-4 mr-2" /> Aperçu
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
                <button title="Aucune couleur"
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
          onClick={e => { e.stopPropagation(); setPreviewItem(file); }}
        >
          <IconComp className={cn('h-10 w-10', hasErr ? 'text-red-400' : 'text-muted-foreground/40')} />
          {hasErr && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {(file.version ?? 1) > 1 && (
            <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-muted text-muted-foreground px-1 rounded font-mono">
              v{file.version}
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

  const ItemRow = ({ item }: { item: DriveItem }) => {
    const isSel    = selected.has(item.id);
    const IconComp = item.type === 'folder' ? Folder : fileIconComp(item);
    const color    = item.type === 'folder' ? (item.color ?? '#94A3B8') : undefined;
    return (
      <div
        className={cn('group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 select-none', isSel && 'bg-primary/5')}
        onClick={() => item.type === 'folder' ? openFolder(item) : setPreviewItem(item)}
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
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
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
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} title="Vue liste">
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} title="Vue grille">
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
            title="Corbeille"
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
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Télécharger" onClick={() => [...selected].forEach(id => { const it = items.find(i => i.id === id); if (it) download(it); })}>
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
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" title="Changer le statut" onClick={() => {
                      const fileItems = [...selected].map(id => items.find(i => i.id === id)).filter(Boolean).filter(i => i!.type === 'file') as DriveItem[];
                      setBulkStatusItem(fileItems); setBulkNewStatus('Indexé');
                    }}>
                      <Clock className="h-3.5 w-3.5" /> Statut
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Mettre à la corbeille" onClick={() => {
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
      <input ref={fileInputRef}    type="file"          className="hidden" onChange={handleImportFile} />
      <input ref={folderInputRef}  type="file" multiple className="hidden" onChange={handleImportFolder} />
      <input ref={replaceInputRef} type="file"          className="hidden" onChange={handleReplaceFile} />

      {/* ── Overlay drag & drop ── */}
      {dragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-4 border-dashed border-primary rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-primary">
            <Upload className="h-12 w-12" />
            <p className="text-lg font-semibold">Déposez vos fichiers ici</p>
            <p className="text-sm text-muted-foreground">Ils seront importés dans le dossier courant</p>
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

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
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              {showTrash ? <Trash2 className="h-9 w-9 opacity-30" /> : <Upload className="h-9 w-9 opacity-30" />}
            </div>
            <p className="text-sm font-medium">
              {showTrash ? 'La corbeille est vide' :
               search ? `Aucun résultat pour « ${search} »` :
               activeFilterCount > 0 ? 'Aucun élément ne correspond aux filtres' :
               'Ce dossier est vide'}
            </p>
            {!search && activeFilterCount === 0 && !showTrash && (
              <p className="text-xs mt-1 opacity-60">Glissez des fichiers ici ou utilisez le bouton « Nouveau »</p>
            )}
            {activeFilterCount > 0 && (
              <button className="text-xs mt-2 text-primary hover:underline"
                onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterDate('all'); setFilterTag('all'); setSortBy('name-asc'); }}>
                Réinitialiser les filtres
              </button>
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
          <div>
            <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
              <div className="w-4 shrink-0" /><div className="w-5 shrink-0" />
              <span className="flex-1">Nom</span>
              <span className="hidden lg:block w-28">Étiquettes</span>
              <span className="hidden sm:block w-24">Propriétaire</span>
              <span className="hidden md:block w-28 text-right">Modifié</span>
              <span className="w-14 text-right">Taille</span>
              <div className="w-7 shrink-0" />
            </div>
            {[...folders, ...files].map(i => <ItemRow key={i.id} item={i} />)}
          </div>
        )}
      </div>

      {/* ════ Modals ════ */}

      {/* Nouveau dossier */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nouveau dossier</DialogTitle></DialogHeader>
          <Input placeholder="Nom du dossier" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder()} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewFolder(false)}>Annuler</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renommer */}
      <Dialog open={!!renameItem} onOpenChange={o => !o && setRenameItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Renommer</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameCommit()} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameItem(null)}>Annuler</Button>
            <Button onClick={renameCommit} disabled={!renameValue.trim()}>Renommer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier (fichier) */}
      <Dialog open={!!editItem} onOpenChange={o => !o && setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Modifier le fichier</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Type de document</Label>
              <Select value={editDocType} onValueChange={v => setEditDocType(v as DocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['PDF', 'Image', 'Texte', 'Tableur', 'Autre'] as DocType[]).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Annuler</Button>
            <Button onClick={editCommit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Déplacer */}
      <Dialog open={!!moveItem} onOpenChange={o => !o && setMoveItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Déplacer « {moveItem?.name} »</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-left" onClick={() => moveCommit(null)}>
              <Folder className="h-4 w-4 text-muted-foreground" /> Mon Drive (racine)
            </button>
            {items.filter(i => i.type === 'folder' && i.id !== moveItem?.id && !i.isDeleted).map(f => (
              <button key={f.id} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-left" onClick={() => moveCommit(f.id)}>
                <Folder className="h-4 w-4" style={{ color: f.color ?? '#94A3B8' }} />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setMoveItem(null)}>Annuler</Button></DialogFooter>
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
                <p className="text-xs text-muted-foreground">Aperçu non disponible en mode démo</p>
              </div>
              <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Type</dt><dd>{previewItem.docType}</dd>
                <dt className="text-muted-foreground">Taille</dt><dd>{previewItem.sizeLabel}</dd>
                <dt className="text-muted-foreground">Version</dt><dd>v{previewItem.version ?? 1}</dd>
                <dt className="text-muted-foreground">Statut</dt>
                <dd>{previewItem.statut && <span className={cn('px-1.5 py-0.5 rounded-full font-medium', STATUS_STYLES[previewItem.statut])}>{previewItem.statut}</span>}</dd>
                <dt className="text-muted-foreground">Client</dt><dd>{previewItem.client ?? '—'}</dd>
                <dt className="text-muted-foreground">Modifié</dt><dd>{previewItem.modifiedAt}</dd>
                <dt className="text-muted-foreground">Propriétaire</dt><dd>{previewItem.owner}</dd>
                {previewItem.tags && previewItem.tags.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">Étiquettes</dt>
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
              <Download className="h-4 w-4 mr-1.5" /> Télécharger
            </Button>
            <Button variant="ghost" onClick={() => setPreviewItem(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Informations */}
      <Dialog open={!!infoItem} onOpenChange={o => !o && setInfoItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Informations</DialogTitle></DialogHeader>
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
                <dt className="text-muted-foreground">Type</dt><dd>{infoItem.type === 'folder' ? 'Dossier' : infoItem.docType}</dd>
                <dt className="text-muted-foreground">Propriétaire</dt><dd>{infoItem.owner}</dd>
                <dt className="text-muted-foreground">Modifié le</dt><dd>{infoItem.modifiedAt}</dd>
                {infoItem.type === 'file' && <><dt className="text-muted-foreground">Version</dt><dd>v{infoItem.version ?? 1}</dd></>}
                {infoItem.sizeLabel && <><dt className="text-muted-foreground">Taille</dt><dd>{infoItem.sizeLabel}</dd></>}
                {infoItem.client && <><dt className="text-muted-foreground">Client</dt><dd>{infoItem.client}</dd></>}
                {infoItem.tags && infoItem.tags.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">Étiquettes</dt>
                    <dd className="flex flex-wrap gap-1">{infoItem.tags.map(t => <TagBadge key={t} tag={t} />)}</dd>
                  </>
                )}
              </dl>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setInfoItem(null)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partage */}
      <Dialog open={!!shareItem} onOpenChange={o => !o && setShareItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Partager</DialogTitle>
            <DialogDescription>« {shareItem?.name} »</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Adresse e-mail du collaborateur" className="flex-1" />
              <Select defaultValue="viewer">
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Lecture</SelectItem>
                  <SelectItem value="editor">Édition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
              Actuellement : accessible uniquement par <span className="text-foreground font-medium">Me Diallo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareItem(null)}>Annuler</Button>
            <Button onClick={() => { toast.success('Invitation envoyée'); setShareItem(null); }}>Inviter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Corbeille (suppression douce avec motif) */}
      <Dialog open={!!deleteItem} onOpenChange={o => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Placer dans la corbeille
            </DialogTitle>
            <DialogDescription>
              « {deleteItem?.name} » sera placé dans la corbeille. Vous pourrez le restaurer ultérieurement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>Motif (optionnel)</Label>
            <Textarea placeholder="Précisez la raison…" value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={3} className="resize-none" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteItem && softDelete(deleteItem)}>Mettre à la corbeille</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Changement de statut en masse */}
      <Dialog open={!!bulkStatusItem} onOpenChange={o => !o && setBulkStatusItem(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
            <DialogDescription>{bulkStatusItem?.length} fichier(s) sélectionné(s)</DialogDescription>
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
            <Button variant="ghost" onClick={() => setBulkStatusItem(null)}>Annuler</Button>
            <Button onClick={bulkStatusCommit}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistiques */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Statistiques du Drive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Dossiers', value: items.filter(i => i.type === 'folder' && !i.isDeleted).length, color: 'text-blue-500' },
                { label: 'Fichiers', value: items.filter(i => i.type === 'file' && !i.isDeleted).length, color: 'text-green-500' },
                { label: 'Favoris', value: items.filter(i => i.starred && !i.isDeleted).length, color: 'text-amber-500' },
                { label: 'Corbeille', value: trashedCount, color: 'text-destructive' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1">
                  <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Par statut</p>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Par étiquette</p>
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
          <DialogFooter><Button variant="ghost" onClick={() => setShowStats(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Journal d'audit */}
      <Dialog open={showAudit} onOpenChange={setShowAudit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Journal d'audit</DialogTitle>
          </DialogHeader>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune action enregistrée</p>
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
            {auditLog.length > 0 && <Button variant="ghost" size="sm" onClick={() => setAuditLog([])}>Effacer l'historique</Button>}
            <Button variant="ghost" onClick={() => setShowAudit(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
