// ═══════════════════════════════════════════════════════════════
// EmailTemplate — Prévisualisation d'un email d'invitation
// à la collaboration sur un document notarial
// ═══════════════════════════════════════════════════════════════

import { cn } from "@/lib/utils";
import type { DocumentRole } from "@/types/documents";

// ─── Props ─────────────────────────────────────────────────────

export interface EmailTemplateProps {
  inviterName: string;     // "Maître Mamadou Diallo"
  documentTitle: string;
  dossierRef: string;
  role: DocumentRole;
  expiresAt?: Date;
  accessUrl?: string;
}

// ─── Helpers ───────────────────────────────────────────────────

function roleLabel(role: DocumentRole): string {
  const map: Record<DocumentRole, string> = {
    lecteur: "Lecteur",
    commentateur: "Commentateur",
    editeur: "Éditeur",
    proprietaire: "Co-propriétaire",
  };
  return map[role];
}

function roleBadgeClass(role: DocumentRole): string {
  const map: Record<DocumentRole, string> = {
    lecteur: "bg-gray-100 text-gray-700",
    commentateur: "bg-blue-100 text-blue-700",
    editeur: "bg-indigo-100 text-indigo-700",
    proprietaire: "bg-amber-100 text-amber-800",
  };
  return map[role];
}

// ─── Composant ─────────────────────────────────────────────────

export default function EmailTemplate({
  inviterName,
  documentTitle,
  dossierRef,
  role,
  expiresAt,
  accessUrl = "#",
}: EmailTemplateProps) {
  return (
    <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg font-sans">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-white font-heading font-bold text-lg">
            N
          </div>
          <div>
            <p className="text-white font-heading font-semibold text-base leading-tight">
              Notario
            </p>
            <p className="text-white/80 text-xs">Cabinet notarial</p>
          </div>
        </div>
      </div>

      {/* ── Corps ───────────────────────────────────────────── */}
      <div className="px-6 py-6 space-y-4">
        {/* Accroche */}
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{inviterName}</span> vous invite à
          collaborer sur :
        </p>

        {/* Titre du document */}
        <p className="font-heading text-xl font-semibold text-gray-900 leading-tight">
          {documentTitle}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
            Dossier {dossierRef}
          </span>
          <span
            className={cn(
              "text-xs rounded-full px-3 py-1 font-medium",
              roleBadgeClass(role)
            )}
          >
            {roleLabel(role)}
          </span>
        </div>

        {/* Bouton CTA simulé */}
        <div className="pt-2">
          <a
            href={accessUrl}
            className="inline-block bg-primary text-white rounded-lg px-6 py-3 text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}
          >
            Accéder au document →
          </a>
        </div>

        {/* Expiration */}
        {expiresAt && (
          <p className="text-xs text-gray-500">
            Accès valable jusqu'au{" "}
            <span className="font-medium text-gray-700">
              {expiresAt.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        )}

        <hr className="border-gray-100" />

        <p className="text-xs text-gray-500">
          Cet email a été envoyé automatiquement par la plateforme Notario.
          Si vous ne connaissez pas l'expéditeur, ignorez ce message.
        </p>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="bg-gray-50 px-6 py-4 text-xs text-gray-400">
        Cabinet Diallo &amp; Associés · Conakry, Guinée · contact@notario.gn
      </div>
    </div>
  );
}
