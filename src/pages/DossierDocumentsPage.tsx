// ═══════════════════════════════════════════════════════════════
// DossierDocumentsPage — Documents d'un dossier notarial
// Route : /documents/dossier/:dossierId
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Clock,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { mockDocuments, userMamadou } from '@/data/documentsData';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentKPICard } from '@/components/documents/DocumentKPICard';
import { CollaboratorAvatar } from '@/components/documents/CollaboratorAvatar';
import type { NotarioDocument, DocumentType, DocumentCollaborator } from '@/types/documents';
import { useLanguage } from '@/context/LanguageContext';

// ─── Utilitaires ──────────────────────────────────────────────

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────

export default function DossierDocumentsPage() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const locale = lang === "EN" ? "en-GB" : "fr-FR";

  const typeLabel = (type: DocumentType): string => {
    const map: Record<DocumentType, string> = {
      contrat: t("dossierDoc.typeContrat"),
      acte: t("dossierDoc.typeActe"),
      courrier: t("dossierDoc.typeCourrier"),
      attestation: t("dossierDoc.typeAttestation"),
      note: t("dossierDoc.typeNote"),
      autre: t("dossierDoc.typeAutre"),
    };
    return map[type];
  };

  const roleLabel = (role: string): string => {
    const map: Record<string, string> = {
      proprietaire: t("collab.roleProprietaire"),
      editeur: t("collab.roleEditeur"),
      commentateur: t("collab.roleCommentateur"),
      lecteur: t("collab.roleLecteur"),
    };
    return map[role] ?? role;
  };

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<DocumentType>('acte');

  // ── Import de fichier ─────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTitle, setImportTitle] = useState('');
  const [importPreview, setImportPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Local docs state — allows new documents to appear without navigation
  const [localDocs, setLocalDocs] = useState<NotarioDocument[]>(() =>
    mockDocuments.filter(d => d.dossierId === dossierId)
  );

  const handleImportFile = (file: File) => {
    setImportFile(file);
    setImportTitle(file.name.replace(/\.[^.]+$/, ''));
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = e => setImportPreview(e.target?.result as string ?? '');
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'html') {
      const reader = new FileReader();
      reader.onload = e => setImportPreview(e.target?.result as string ?? '');
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'docx' || ext === 'doc') {
      const reader = new FileReader();
      reader.onload = e => {
        const raw = e.target?.result as string ?? '';
        const readable = raw.replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F]/g, ' ').replace(/\s{3,}/g, '\n\n').trim();
        setImportPreview(readable.slice(0, 2000) + (readable.length > 2000 ? '\n\n[…]' : ''));
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'pdf') {
      setImportPreview('[Aperçu PDF — le contenu sera chargé dans l\'éditeur]');
    }
  };

  const handleImportCreate = () => {
    if (!importFile || !importTitle.trim()) return;
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview('');
    setImportTitle('');
    // Navigation vers l'éditeur avec le contenu importé
    // (mock — en prod on passerait le contenu via state/context)
    import('sonner').then(({ toast }) => toast.success(`Document "${importTitle}" importé avec succès`));
  };

  // docs is now localDocs (kept as alias for existing code)
  const docs = localDocs;

  const activeDocs = docs.filter(d => d.status !== 'archive');
  const archivedDocs = docs.filter(d => d.status === 'archive');

  const firstDoc = localDocs[0];
  const dossierRef = firstDoc?.dossierRef ?? dossierId ?? 'Inconnu';

  // KPI — collaborateurs uniques
  const uniqueCollaborators = useMemo(() => {
    const seen = new Set<string>();
    const result: DocumentCollaborator[] = [];
    docs.forEach(doc => {
      doc.collaborators.forEach(c => {
        if (!seen.has(c.userId)) {
          seen.add(c.userId);
          result.push(c);
        }
      });
    });
    return result;
  }, [docs]);

  // KPI — dernière modification
  const lastModified = useMemo(() => {
    if (docs.length === 0) return null;
    return docs.reduce((latest, doc) =>
      doc.updatedAt > latest.updatedAt ? doc : latest
    ).updatedAt;
  }, [docs]);

  if (localDocs.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("dossierDoc.noDocsTitle")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("dossierDoc.noDocsDesc")}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dossiers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("dossierDoc.backToCases")}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("dossierDoc.newDocument")}
            </Button>
          </div>
        </div>

        {/* Dialog nouveau document (empty state) */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("dossierDoc.newDocument")}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doc-title-empty">{t("dossierDoc.titleLabel")}</Label>
                <Input
                  id="doc-title-empty"
                  placeholder={t("dossierDoc.titlePlaceholder")}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doc-type-empty">{t("dossierDoc.typeLabel")}</Label>
                <Select
                  value={newType}
                  onValueChange={v => setNewType(v as DocumentType)}
                >
                  <SelectTrigger id="doc-type-empty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acte">{t("dossierDoc.typeActe")}</SelectItem>
                    <SelectItem value="contrat">{t("dossierDoc.typeContrat")}</SelectItem>
                    <SelectItem value="courrier">{t("dossierDoc.typeCourrier")}</SelectItem>
                    <SelectItem value="attestation">{t("dossierDoc.typeAttestation")}</SelectItem>
                    <SelectItem value="note">{t("dossierDoc.typeNote")}</SelectItem>
                    <SelectItem value="autre">{t("dossierDoc.typeAutre")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("action.cancel")}
              </Button>
              <Button
                disabled={!newTitle.trim()}
                onClick={() => {
                  if (!newTitle.trim()) return;
                  const id = `doc-${Date.now()}`;
                  const now = new Date();
                  const newDoc: NotarioDocument = {
                    id,
                    dossierId: dossierId ?? '',
                    dossierRef: dossierRef,
                    title: newTitle.trim(),
                    type: newType,
                    status: 'brouillon',
                    currentVersion: {
                      id: `v-${id}`,
                      documentId: id,
                      versionNumber: 1,
                      versionLabel: '1.0',
                      content: `<h2>${newTitle.trim()}</h2><p>${t("docs.startWriting")}</p>`,
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
                  setLocalDocs(prev => [...prev, newDoc]);
                  setDialogOpen(false);
                  setNewTitle('');
                  import('sonner').then(({ toast }) => {
                    toast.success(`Document "${newDoc.title}" créé`);
                  });
                  navigate(`/documents/${id}`);
                }}
              >
                {t("action.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
            <Link
              to="/dossiers"
              className="hover:text-foreground transition-colors"
            >
              Dossiers
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-mono text-primary">{dossierRef}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground">{t("nav.documents")}</span>
          </nav>

          {/* Titre */}
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Documents — {dossierRef}
          </h1>

          {/* Sous-titre type */}
          {firstDoc && (
            <p className="text-sm text-muted-foreground">
              {typeLabel(firstDoc.type)} · {docs.length} {docs.length > 1 ? t("dossierDoc.documents") : t("dossierDoc.document")}
            </p>
          )}
        </div>

        {/* Actions header */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dossiers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("dossierDoc.backToCases")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t("dossierDoc.import")}
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("dossierDoc.newDocument")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DocumentKPICard
          title={t("dossierDoc.totalDocuments")}
          value={docs.length}
          icon={FileText}
          color="primary"
        />
        <DocumentKPICard
          title={t("dossierDoc.collaborators")}
          value={uniqueCollaborators.length}
          icon={Users}
          color="secondary"
          subtitle={t("dossierDoc.collaboratorsSubtitle")}
        />
        <DocumentKPICard
          title={t("dossierDoc.lastModified")}
          value={lastModified ? formatDate(lastModified, locale) : '—'}
          icon={Clock}
          color="warning"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonne principale */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Documents actifs */}
          {activeDocs.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t("dossierDoc.activeDocs")}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({activeDocs.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeDocs.map(doc => (
                  <div
                    key={doc.id}
                    onDoubleClick={() => navigate(`/documents/${doc.id}`)}
                    className="relative group"
                  >
                    <DocumentCard
                      doc={doc}
                      onOpen={() => navigate(`/documents/${doc.id}`)}
                      onHistory={() => navigate(`/documents/${doc.id}/versions`)}
                      onShare={() => window.open(`/documents/${doc.id}`, '_blank')}
                    />
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                      <span className="text-[9px] bg-black/60 text-white rounded px-1.5 py-0.5">
                        Double-clic pour ouvrir
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Documents archivés (collapsible) */}
          {archivedDocs.length > 0 && (
            <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left py-2 border-t border-border">
                  {archiveOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                  {t("dossierDoc.archivedDocs")} ({archivedDocs.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                  {archivedDocs.map(doc => (
                    <div
                      key={doc.id}
                      onDoubleClick={() => navigate(`/documents/${doc.id}`)}
                      className="relative group"
                    >
                      <DocumentCard
                        doc={doc}
                        onOpen={() => navigate(`/documents/${doc.id}`)}
                        onHistory={() => navigate(`/documents/${doc.id}/versions`)}
                        onShare={() => window.open(`/documents/${doc.id}`, '_blank')}
                      />
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                        <span className="text-[9px] bg-black/60 text-white rounded px-1.5 py-0.5">
                          {t("dossierDoc.dblClickOpen")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Colonne latérale — Équipe du dossier */}
        <div className="w-full lg:w-64 shrink-0">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
              {t("dossierDoc.caseTeam")}
            </h3>
            {uniqueCollaborators.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("dossierDoc.noCollaborators")}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {uniqueCollaborators.map(c => (
                  <li key={c.userId} className="flex items-center gap-2.5">
                    <CollaboratorAvatar
                      user={c.user}
                      color={c.cursorColor}
                      isOnline={c.isOnline}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {c.user.prenom} {c.user.nom}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {roleLabel(c.role)}
                      </p>
                    </div>
                    {c.isOnline && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Modal Import ───────────────────────────────────────── */}
      <Dialog open={showImportModal} onOpenChange={o => { if (!o) { setShowImportModal(false); setImportFile(null); setImportPreview(''); setImportTitle(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dossierDoc.importTitle")} {dossierRef}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {/* Zone drag & drop */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleImportFile(file); }}
              onClick={() => importFileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
            >
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              {importFile ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{importFile.name}</span>
                  <button onMouseDown={e => { e.stopPropagation(); setImportFile(null); setImportPreview(''); setImportTitle(''); }} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">{t("dossierDoc.dropHere")}</p>
                  <p className="text-xs text-muted-foreground">{t("dossierDoc.acceptedFormats")}</p>
                </>
              )}
            </div>
            <input ref={importFileRef} type="file" accept=".docx,.doc,.pdf,.txt,.html" className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) handleImportFile(file); e.target.value = ''; }} />

            {/* Titre */}
            {importFile && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("dossierDoc.docTitleLabel")}</Label>
                <Input value={importTitle} onChange={e => setImportTitle(e.target.value)} placeholder={t("dossierDoc.namePlaceholder")} />
              </div>
            )}

            {/* Aperçu contenu */}
            {importPreview && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("dossierDoc.contentPreview")}</Label>
                <Textarea value={importPreview} readOnly rows={5} className="resize-none font-mono text-xs bg-muted/30" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview(''); setImportTitle(''); }}>
              {t("action.cancel")}
            </Button>
            <Button disabled={!importFile || !importTitle.trim()} onClick={handleImportCreate}>
              <Upload className="h-4 w-4 mr-2" />
              {t("dossierDoc.importAndEdit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nouveau document */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dossierDoc.newDocument")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-title">{t("dossierDoc.titleLabel")}</Label>
              <Input
                id="doc-title"
                placeholder={t("dossierDoc.titlePlaceholder")}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-type">{t("dossierDoc.typeLabel")}</Label>
              <Select
                value={newType}
                onValueChange={v => setNewType(v as DocumentType)}
              >
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acte">{t("dossierDoc.typeActe")}</SelectItem>
                  <SelectItem value="contrat">{t("dossierDoc.typeContrat")}</SelectItem>
                  <SelectItem value="courrier">{t("dossierDoc.typeCourrier")}</SelectItem>
                  <SelectItem value="attestation">{t("dossierDoc.typeAttestation")}</SelectItem>
                  <SelectItem value="note">{t("dossierDoc.typeNote")}</SelectItem>
                  <SelectItem value="autre">{t("dossierDoc.typeAutre")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              disabled={!newTitle.trim()}
              onClick={() => {
                if (!newTitle.trim()) return;
                const id = `doc-${Date.now()}`;
                const now = new Date();
                const newDoc: NotarioDocument = {
                  id,
                  dossierId: dossierId ?? '',
                  dossierRef: dossierRef,
                  title: newTitle.trim(),
                  type: newType,
                  status: 'brouillon',
                  currentVersion: {
                    id: `v-${id}`,
                    documentId: id,
                    versionNumber: 1,
                    versionLabel: '1.0',
                    content: `<h2>${newTitle.trim()}</h2><p>${t("docs.startWriting")}</p>`,
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
                setLocalDocs(prev => [...prev, newDoc]);
                setDialogOpen(false);
                setNewTitle('');
                import('sonner').then(({ toast }) => {
                  toast.success(`Document "${newDoc.title}" ${t("action.create").toLowerCase()}`)
                });
                navigate(`/documents/${id}`);
              }}
            >
              {t("action.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
