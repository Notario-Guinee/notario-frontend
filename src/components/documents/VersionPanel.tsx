// ═══════════════════════════════════════════════════════════════
// VersionPanel — Timeline des versions avec modaux Créer / Restaurer / Comparer
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import {
  Eye,
  RotateCcw,
  GitCompare,
  Download,
  Pencil,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocumentVersion } from "@/types/documents";

// ─── Utilitaires ──────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  return `il y a ${Math.floor(diffH / 24)}j`;
}

// Extraire les paragraphes d'un HTML
function extractParagraphs(html: string): string[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const texts: string[] = [];
  div.querySelectorAll("p, h1, h2, h3, li").forEach((el) => {
    const t = el.textContent?.trim();
    if (t) texts.push(t);
  });
  if (texts.length === 0) {
    // fallback : split sur <p>
    return html
      .split(/<\/?p[^>]*>/i)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
  }
  return texts;
}

// Diff basique entre deux listes de paragraphes
type DiffLine = { text: string; type: "added" | "removed" | "unchanged" };

function computeDiff(left: string[], right: string[]): { left: DiffLine[]; right: DiffLine[] } {
  const leftResult: DiffLine[] = [];
  const rightResult: DiffLine[] = [];
  const rightSet = new Set(right);
  const leftSet = new Set(left);

  // Pour chaque paragraphe gauche : supprimé ou inchangé
  for (const line of left) {
    if (rightSet.has(line)) {
      leftResult.push({ text: line, type: "unchanged" });
    } else {
      leftResult.push({ text: line, type: "removed" });
    }
  }
  // Pour chaque paragraphe droit : ajouté ou inchangé
  for (const line of right) {
    if (leftSet.has(line)) {
      rightResult.push({ text: line, type: "unchanged" });
    } else {
      rightResult.push({ text: line, type: "added" });
    }
  }
  return { left: leftResult, right: rightResult };
}

// ─── Props ─────────────────────────────────────────────────────

interface VersionPanelProps {
  versions: DocumentVersion[];
  currentVersionId: string;
  onRestore: (v: DocumentVersion) => void;
  onCompare: (v1: DocumentVersion, v2: DocumentVersion) => void;
  onDownload: (v: DocumentVersion) => void;
  /** Si fourni, rend le bouton "Créer une version" visible */
  showCreateButton?: boolean;
  /** Contrôle externe du modal Créer */
  externalCreateOpen?: boolean;
  onExternalCreateClose?: () => void;
  onCreateVersion?: (label: string, notes: string, isMajor: boolean) => void;
  onVersionsChange?: (versions: DocumentVersion[]) => void;
}

// ─── Composant principal ────────────────────────────────────────

export default function VersionPanel({
  versions,
  currentVersionId,
  onRestore,
  onCompare,
  onDownload,
  showCreateButton = false,
  externalCreateOpen,
  onExternalCreateClose,
  onCreateVersion,
  onVersionsChange,
}: VersionPanelProps) {
  // ── États modaux
  const [createOpen, setCreateOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DocumentVersion | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  // ── Formulaire création
  const [newLabel, setNewLabel] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [newNote, setNewNote] = useState("");

  // ── Édition label inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [localVersions, setLocalVersions] = useState<DocumentVersion[]>(versions);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Notifier le parent des changements de versions
  useEffect(() => {
    onVersionsChange?.(localVersions);
  }, [localVersions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Aperçu version
  const [viewingVersion, setViewingVersion] = useState<DocumentVersion | null>(null);

  // ── Comparaison
  const [compareLeft, setCompareLeft] = useState(versions[0]?.id ?? "");
  const [compareRight, setCompareRight] = useState(versions[1]?.id ?? versions[0]?.id ?? "");
  const [compareNavIdx, setCompareNavIdx] = useState(0);

  // Sync si externalCreateOpen change
  const isCreateOpen = externalCreateOpen !== undefined ? externalCreateOpen : createOpen;
  const handleCloseCreate = () => {
    if (onExternalCreateClose) onExternalCreateClose();
    else setCreateOpen(false);
    setNewLabel("");
    setIsOfficial(false);
    setNewNote("");
  };

  // ── Calcul des stats comparaison
  const leftVersion = localVersions.find((v) => v.id === compareLeft);
  const rightVersion = localVersions.find((v) => v.id === compareRight);

  const leftParas = leftVersion ? extractParagraphs(leftVersion.content) : [];
  const rightParas = rightVersion ? extractParagraphs(rightVersion.content) : [];
  const diff = computeDiff(leftParas, rightParas);

  const insertions = diff.right.filter((l) => l.type === "added").length;
  const suppressions = diff.left.filter((l) => l.type === "removed").length;
  const modifications = Math.min(insertions, suppressions);

  // Nombre de "changements" pour navigation
  const changesCount = insertions + suppressions;

  // Aperçu auto pour le formulaire
  const latestVersion = [...localVersions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];
  const approxWords = latestVersion?.wordCount ?? 0;
  const lastModified = latestVersion
    ? formatRelative(latestVersion.createdAt)
    : "—";

  // ── Fonctions

  const handleDownloadVersion = (version: DocumentVersion) => {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${version.versionLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 794px; margin: 0 auto; padding: 60px; line-height: 1.6; color: #111; }
    h1,h2,h3 { color: #1e293b; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <p style="color:#6b7280;font-size:12px;margin-bottom:2em;">
    Version ${version.versionLabel} · Créée le ${formatDateTime(version.createdAt)} par ${version.createdBy.prenom} ${version.createdBy.nom}
  </p>
  ${version.content}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version_${version.versionLabel.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Version ${version.versionLabel} téléchargée`);
  };

  const handleSaveLabel = (versionId: string) => {
    if (!editingLabel.trim()) return;
    const updated = localVersions.map((v) =>
      v.id === versionId ? { ...v, versionLabel: editingLabel.trim() } : v
    );
    setLocalVersions(updated);
    onVersionsChange?.(updated);
    setEditingId(null);
    toast.success("Label mis à jour");
  };

  const handleCreateVersion = () => {
    if (!newLabel.trim()) return;
    const newV: DocumentVersion = {
      id: `v-new-${Date.now()}`,
      documentId: latestVersion?.documentId ?? "",
      versionNumber: (Math.max(...localVersions.map(v => v.versionNumber), 0)) + 1,
      versionLabel: newLabel.trim(),
      content: latestVersion?.content ?? "",
      contentSnapshot: latestVersion?.contentSnapshot ?? "",
      createdAt: new Date(),
      createdBy: latestVersion?.createdBy ?? {
        id: "u1",
        nom: "Diallo",
        prenom: "Mamadou",
        initiales: "MD",
        role: "Notaire Gérant",
      },
      changesSummary: newNote.trim() || `Version ${newLabel} créée manuellement`,
      isDraft: !isOfficial,
      isMajorVersion: isOfficial,
      wordCount: latestVersion?.wordCount ?? 0,
      sizeBytes: latestVersion?.sizeBytes ?? 0,
    };
    const updated = [newV, ...localVersions];
    setLocalVersions(updated);
    onCreateVersion?.(newLabel.trim(), newNote.trim(), isOfficial);
    onVersionsChange?.(updated);
    toast.success(`Version "${newLabel}" créée`);
    handleCloseCreate();
  };

  const handleRestoreConfirm = () => {
    if (!restoreTarget) return;
    onRestore(restoreTarget);
    const label = restoreTarget.versionLabel;
    setRestoreTarget(null);
    toast.success(`Version v${label} restaurée comme version courante`);
  };

  const sortedVersions = [...localVersions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Couleur du bullet selon type
  const bulletClass = (v: DocumentVersion) => {
    if (v.isMajorVersion) return "bg-amber-500";
    if (!v.isDraft) return "bg-primary";
    return "bg-muted-foreground";
  };

  return (
    <>
      {/* ── Bouton Créer (si showCreateButton) */}
      {showCreateButton && (
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <GitCompare className="h-4 w-4" />
          Créer une version
        </Button>
      )}

      {/* ── Timeline */}
      <div className="relative ml-6 border-l-2 border-border space-y-5">
        {sortedVersions.map((version) => {
          const isCurrent = version.id === currentVersionId;
          const isEditing = editingId === version.id;

          return (
            <div key={version.id} className="relative pl-6 -ml-px">
              {/* Bullet */}
              <div
                className={cn(
                  "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full",
                  bulletClass(version)
                )}
              />

              {/* Carte */}
              <div
                className={cn(
                  "rounded-lg border p-3 space-y-2",
                  isCurrent ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Label (éditable inline) */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          ref={labelInputRef}
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveLabel(version.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-6 text-xs px-1.5"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleSaveLabel(version.id)}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {version.versionLabel}
                        </span>
                        {version.isMajorVersion && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide">
                            Version officielle
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                            Actuelle
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date / auteur */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">
                        {version.createdBy.initiales}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {version.createdBy.prenom} {version.createdBy.nom} ·{" "}
                        {formatDateTime(version.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Bouton Nommer */}
                  {!isEditing && (
                    <button
                      title="Renommer"
                      className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                      onClick={() => {
                        setEditingId(version.id);
                        setEditingLabel(version.versionLabel);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Résumé */}
                <p className="text-xs text-foreground">{version.changesSummary}</p>
                <p className="text-[10px] text-muted-foreground">{version.wordCount} mots</p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={() => setViewingVersion(version)}
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </Button>
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[10px] gap-1"
                      onClick={() => setRestoreTarget(version)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurer
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={() => {
                      setCompareLeft(version.id);
                      setCompareRight(
                        sortedVersions.find((v) => v.id !== version.id)?.id ?? version.id
                      );
                      setCompareOpen(true);
                    }}
                  >
                    <GitCompare className="h-3 w-3" />
                    Comparer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={() => handleDownloadVersion(version)}
                  >
                    <Download className="h-3 w-3" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Modal : Créer une version manuelle ══════════════════ */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => !o && handleCloseCreate()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Créer une version manuelle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nom */}
            <div className="space-y-1.5">
              <Label>Nom de la version</Label>
              <Input
                placeholder='ex: "v2.0 - Après relecture"'
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>

            {/* Checkbox Version officielle */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={isOfficial}
                onClick={() => setIsOfficial((v) => !v)}
                className={cn(
                  "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  isOfficial
                    ? "bg-primary border-primary"
                    : "border-border bg-background"
                )}
              >
                {isOfficial && <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground" />}
              </button>
              <div className="space-y-0.5">
                <Label className="cursor-pointer" onClick={() => setIsOfficial((v) => !v)}>
                  Version officielle (notariée)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marque cette version comme document notarié final
                </p>
              </div>
            </div>

            {/* Note de version */}
            <div className="space-y-1.5">
              <Label>Note de version</Label>
              <Textarea
                placeholder="Décrivez les modifications apportées..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Aperçu auto */}
            <div className="bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Aperçu du résumé</p>
              <p className="text-xs text-muted-foreground">
                ~{approxWords} mots, dernière modification {lastModified}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreate}>
              Annuler
            </Button>
            <Button onClick={handleCreateVersion} disabled={!newLabel.trim()}>
              Créer la version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ AlertDialog : Restauration ═══════════════════════════ */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la restauration</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez restaurer la version{" "}
              <strong>{restoreTarget?.versionLabel}</strong> du{" "}
              {restoreTarget ? formatDate(restoreTarget.createdAt) : ""}. La version
              actuelle sera sauvegardée comme archive. Cette action est traçable et
              réversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreTarget(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm}>
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Dialog : Comparaison de versions ════════════════════ */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>Comparaison de versions</DialogTitle>
          </DialogHeader>

          {/* Sélecteurs */}
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Label className="shrink-0 text-xs">Version gauche</Label>
              <Select value={compareLeft} onValueChange={setCompareLeft}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localVersions.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.versionLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Label className="shrink-0 text-xs">Version droite</Label>
              <Select value={compareRight} onValueChange={setCompareRight}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localVersions.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.versionLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Compteur */}
          <div className="text-xs text-muted-foreground flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-foreground font-medium">
              {changesCount} modification{changesCount > 1 ? "s" : ""}
            </span>
            <span className="text-success">{insertions} insertion{insertions > 1 ? "s" : ""}</span>
            <span className="text-destructive">
              {suppressions} suppression{suppressions > 1 ? "s" : ""}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setCompareNavIdx((i) => Math.max(0, i - 1))}
                disabled={compareNavIdx === 0}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() =>
                  setCompareNavIdx((i) => Math.min(changesCount - 1, i + 1))
                }
                disabled={compareNavIdx >= changesCount - 1}
              >
                ↓
              </Button>
            </div>
          </div>

          {/* Contenu 2 colonnes */}
          <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            {/* Gauche */}
            <div className="border-r">
              <div className="bg-muted/50 px-3 py-2 border-b">
                <p className="text-xs font-semibold text-foreground">
                  {leftVersion?.versionLabel ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {leftVersion?.createdBy.prenom} {leftVersion?.createdBy.nom} ·{" "}
                  {leftVersion ? formatDate(leftVersion.createdAt) : "—"}
                </p>
              </div>
              <div className="p-3 space-y-1">
                {diff.left.map((line, i) => (
                  <p
                    key={i}
                    className={cn(
                      "text-xs rounded px-1.5 py-0.5 leading-relaxed",
                      line.type === "removed" &&
                        "bg-destructive/10 text-destructive line-through",
                      line.type === "unchanged" && "text-foreground"
                    )}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </div>

            {/* Droite */}
            <div>
              <div className="bg-muted/50 px-3 py-2 border-b">
                <p className="text-xs font-semibold text-foreground">
                  {rightVersion?.versionLabel ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {rightVersion?.createdBy.prenom} {rightVersion?.createdBy.nom} ·{" "}
                  {rightVersion ? formatDate(rightVersion.createdAt) : "—"}
                </p>
              </div>
              <div className="p-3 space-y-1">
                {diff.right.map((line, i) => (
                  <p
                    key={i}
                    className={cn(
                      "text-xs rounded px-1.5 py-0.5 leading-relaxed",
                      line.type === "added" &&
                        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
                      line.type === "unchanged" && "text-foreground"
                    )}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCompareOpen(false)}>
              Fermer
            </Button>
            {rightVersion && (
              <Button
                onClick={() => {
                  setRestoreTarget(rightVersion);
                  setCompareOpen(false);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurer cette version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Dialog : Aperçu de version ═══════════════════════════ */}
      <Dialog open={!!viewingVersion} onOpenChange={(o) => !o && setViewingVersion(null)}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>
              Aperçu — {viewingVersion?.versionLabel}
            </DialogTitle>
          </DialogHeader>
          {viewingVersion && (
            <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground border-b pb-3 mb-3 flex-wrap">
                <span>
                  Créée le {formatDateTime(viewingVersion.createdAt)} par{" "}
                  {viewingVersion.createdBy.prenom} {viewingVersion.createdBy.nom}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span>{viewingVersion.wordCount} mots</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{(viewingVersion.sizeBytes / 1024).toFixed(1)} Ko</span>
                {viewingVersion.isMajorVersion && (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide text-[10px]">
                    Version officielle
                  </span>
                )}
              </div>
              <div
                className="max-h-[60vh] overflow-y-auto rounded-lg border bg-white dark:bg-zinc-950 p-8"
                style={{ fontFamily: "serif", lineHeight: 1.7, color: "#111827" }}
                dangerouslySetInnerHTML={{ __html: viewingVersion.content || "<p><em>Contenu vide</em></p>" }}
              />
            </>
          )}
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setViewingVersion(null)}>
              Fermer
            </Button>
            {viewingVersion && !sortedVersions.find(v => v.id === viewingVersion.id && v.id === currentVersionId) && (
              <Button
                variant="outline"
                onClick={() => {
                  setRestoreTarget(viewingVersion);
                  setViewingVersion(null);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurer
              </Button>
            )}
            {viewingVersion && (
              <Button onClick={() => handleDownloadVersion(viewingVersion)}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
