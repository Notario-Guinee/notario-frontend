// ═══════════════════════════════════════════════════════════════
// ArchiveModals — Tous les Dialog de la page ArchivesNumeriques
// Props : états de modaux + handlers fournis par ArchivesNumeriques.tsx
// ═══════════════════════════════════════════════════════════════

import { useRef } from "react";
import {
  Upload, FileText, X, Loader2, Eye, Pencil, RefreshCw,
  MoveRight, Download, Trash2, History, FolderOpen, FolderEdit,
  AlertTriangle, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { mockDossiers } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ArchiveDoc } from "./ArchiveTable";

export type AuditEntry = {
  id: string;
  action: string;
  detail: string;
  user: string;
  date: string;
};

interface ArchiveModalsProps {
  fr: boolean;
  archives: ArchiveDoc[];

  // Preview
  previewDoc: ArchiveDoc | null;
  setPreviewDoc: (doc: ArchiveDoc | null) => void;

  // Edit doc
  editDoc: ArchiveDoc | null;
  setEditDoc: (doc: ArchiveDoc | null) => void;
  editDocName: string;
  setEditDocName: (v: string) => void;
  editDocType: string;
  setEditDocType: (v: string) => void;
  handleEditDoc: () => void;

  // Replace doc
  replaceDoc: ArchiveDoc | null;
  setReplaceDoc: (doc: ArchiveDoc | null) => void;
  replaceFileName: string;
  setReplaceFileName: (v: string) => void;
  replacing: boolean;
  handleReplaceDoc: () => void;

  // Delete doc
  deleteDoc: ArchiveDoc | null;
  setDeleteDoc: (doc: ArchiveDoc | null) => void;
  deleteReason: string;
  setDeleteReason: (v: string) => void;
  handleDeleteDoc: () => void;

  // Edit dossier
  editDossierCode: string | null;
  setEditDossierCode: (v: string | null) => void;
  editDossierLabel: string;
  setEditDossierLabel: (v: string) => void;
  handleEditDossier: () => void;

  // Delete dossier
  deleteDossierCode: string | null;
  setDeleteDossierCode: (v: string | null) => void;
  deleteDossierReason: string;
  setDeleteDossierReason: (v: string) => void;
  handleDeleteDossier: () => void;

  // Move doc
  moveDoc: ArchiveDoc | null;
  setMoveDoc: (doc: ArchiveDoc | null) => void;
  targetDossier: string;
  setTargetDossier: (v: string) => void;
  handleMoveDoc: () => void;

  // Import in dossier
  showImportModal: boolean;
  setShowImportModal: (v: boolean) => void;
  importDossier: string;
  setImportDossier: (v: string) => void;
  importFileName: string;
  setImportFileName: (v: string) => void;
  importing: boolean;
  handleImportInDossier: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Audit log
  showAuditLog: boolean;
  setShowAuditLog: (v: boolean) => void;
  auditLog: AuditEntry[];
}

export function ArchiveModals({
  fr,
  archives,
  previewDoc, setPreviewDoc,
  editDoc, setEditDoc,
  editDocName, setEditDocName,
  editDocType, setEditDocType,
  handleEditDoc,
  replaceDoc, setReplaceDoc,
  replaceFileName, setReplaceFileName,
  replacing, handleReplaceDoc,
  deleteDoc, setDeleteDoc,
  deleteReason, setDeleteReason,
  handleDeleteDoc,
  editDossierCode, setEditDossierCode,
  editDossierLabel, setEditDossierLabel,
  handleEditDossier,
  deleteDossierCode, setDeleteDossierCode,
  deleteDossierReason, setDeleteDossierReason,
  handleDeleteDossier,
  moveDoc, setMoveDoc,
  targetDossier, setTargetDossier,
  handleMoveDoc,
  showImportModal, setShowImportModal,
  importDossier, setImportDossier,
  importFileName, setImportFileName,
  importing, handleImportInDossier, handleFileSelect,
  showAuditLog, setShowAuditLog,
  auditLog,
}: ArchiveModalsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
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
    </>
  );
}
