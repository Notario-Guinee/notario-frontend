// ═══════════════════════════════════════════════════════════════
// Page Historique des Versions — /documents/:documentId/versions
// ═══════════════════════════════════════════════════════════════

import { useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { mockDocuments } from "@/data/documentsData";
import type { DocumentVersion, DocumentStatus } from "@/types/documents";
const VersionPanel = lazy(() => import("@/components/documents/VersionPanel"));

// ─── Utilitaires ──────────────────────────────────────────────

function statusLabel(status: DocumentStatus): string {
  const map: Record<DocumentStatus, string> = {
    brouillon: "Brouillon",
    en_revision: "En révision",
    valide: "Validé",
    archive: "Archivé",
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

// ─── Page ──────────────────────────────────────────────────────

export default function DocumentVersionsPage() {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();

  const doc = mockDocuments.find((d) => d.id === documentId);

  // Redirect si doc introuvable
  if (!doc) {
    navigate("/documents");
    return null;
  }

  // ── États
  const [autoSave, setAutoSave] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState(doc.currentVersion.id);
  const [versions, setVersions] = useState<DocumentVersion[]>(doc.versions);

  // ── Handlers
  const handleRestore = (v: DocumentVersion) => {
    setCurrentVersionId(v.id);
    toast.success(`Version v${v.versionLabel} restaurée comme version courante`);
  };

  const handleCompare = (v1: DocumentVersion, v2: DocumentVersion) => {
    // La comparaison est gérée en interne par VersionPanel — ce callback est informatif
    toast.info(`Comparaison : ${v1.versionLabel} ↔ ${v2.versionLabel}`);
  };

  const handleDownload = (v: DocumentVersion) => {
    // Délégué à VersionPanel via handleDownloadVersion interne
    toast.info(`Téléchargement de "${v.versionLabel}" en cours...`);
  };

  const handleVersionsChange = (updated: DocumentVersion[]) => {
    setVersions(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ Header ═══════════════════════════════════════════ */}
      <div className="border-b border-border bg-card px-6 py-4">
        {/* Fil d'Ariane */}
        <button
          onClick={() => navigate(`/documents/${documentId}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au document
        </button>

        {/* Titre + badge statut */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-heading text-xl text-foreground font-semibold">
            {doc.title}
          </h1>
          <span
            className={cn(
              "text-xs rounded px-2 py-0.5 font-medium",
              statusClasses(doc.status)
            )}
          >
            {statusLabel(doc.status)}
          </span>
        </div>

        {/* Sous-titre */}
        <p className="text-sm text-muted-foreground mt-1">
          Historique des {doc.versions.length} version
          {doc.versions.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* ═══ Contenu ══════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Barre d'actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Auto-save */}
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={autoSave}
              onClick={() => {
                setAutoSave((v) => !v);
                toast.info(
                  autoSave
                    ? "Sauvegarde automatique désactivée"
                    : "Sauvegarde automatique activée"
                );
              }}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                autoSave ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform",
                  autoSave ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">Sauvegarde automatique</p>
              <p className="text-xs text-muted-foreground">
                {autoSave
                  ? "Auto-save toutes les 30 secondes"
                  : "Sauvegarde manuelle uniquement"}
              </p>
            </div>
          </div>

          {/* Bouton Créer une version */}
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <GitCompare className="h-4 w-4" />
            Créer une version
          </Button>
        </div>

        {/* Timeline des versions */}
        <Suspense fallback={<div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Chargement des versions…</div>}>
          <VersionPanel
            versions={versions}
            currentVersionId={currentVersionId}
            onRestore={handleRestore}
            onCompare={handleCompare}
            onDownload={handleDownload}
            externalCreateOpen={createModalOpen}
            onExternalCreateClose={() => setCreateModalOpen(false)}
            onVersionsChange={handleVersionsChange}
          />
        </Suspense>
      </div>
    </div>
  );
}
