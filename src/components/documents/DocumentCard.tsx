// ═══════════════════════════════════════════════════════════════
// DocumentCard — Carte document réutilisable
// Utilisée dans DocumentsPage et DossierDocumentsPage
// ═══════════════════════════════════════════════════════════════

import { History, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import type { NotarioDocument, DocumentType } from '@/types/documents';

// ─── Utilitaires ──────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffH < 1) return "moins d'1h";
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return '1j';
  return `${diffD}j`;
}

function typeLabel(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    contrat: 'Contrat',
    acte: 'Acte',
    courrier: 'Courrier',
    attestation: 'Attestation',
    note: 'Note',
    autre: 'Autre',
  };
  return map[type];
}

function typeClasses(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    contrat: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    acte: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    courrier: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    attestation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    note: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    autre: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return map[type];
}

// ─── Props ────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: NotarioDocument;
  onOpen: () => void;
  onHistory: () => void;
  onShare: () => void;
}

// ─── Composant ────────────────────────────────────────────────

export function DocumentCard({ doc, onOpen, onHistory, onShare }: DocumentCardProps) {
  const visibleCollabs = doc.collaborators.slice(0, 4);
  const extraCollabs = doc.collaborators.length - 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all flex flex-col gap-3"
    >
      {/* Ligne 1 : Badge dossier + badge type */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
          {doc.dossierRef}
        </span>
        <span className={cn('text-xs rounded px-2 py-0.5 font-medium', typeClasses(doc.type))}>
          {typeLabel(doc.type)}
        </span>
      </div>

      {/* Ligne 2 : Titre + DocumentStatusBadge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
          {doc.title}
        </h3>
        <DocumentStatusBadge status={doc.status} size="sm" />
      </div>

      {/* Ligne 3 : Version + compteur mots */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>v{doc.currentVersion.versionLabel}</span>
        <span>·</span>
        <span>{doc.metadata.wordCount.toLocaleString('fr-FR')} mots</span>
      </div>

      {/* Ligne 4 : Modifié par + avatar + nom + temps relatif */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="shrink-0">Modifié par</span>
        <CollaboratorAvatar
          user={doc.updatedBy}
          color="#3b82f6"
          size="sm"
        />
        <span className="truncate">
          {doc.updatedBy.prenom} {doc.updatedBy.nom}
        </span>
        <span className="shrink-0">· il y a {formatRelativeTime(doc.updatedAt)}</span>
      </div>

      {/* Ligne 5 : Avatars collaborateurs empilés */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {visibleCollabs.map(collab => (
            <div key={collab.id} className="relative">
              <CollaboratorAvatar
                user={collab.user}
                color={collab.cursorColor}
                isOnline={collab.isOnline}
                size="sm"
              />
            </div>
          ))}
          {extraCollabs > 0 && (
            <div className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
              +{extraCollabs}
            </div>
          )}
        </div>
        {doc.collaborators.some(c => c.isOnline) && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {doc.collaborators.filter(c => c.isOnline).length} en ligne
          </span>
        )}
      </div>

      {/* Footer : actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={onOpen}>
          Ouvrir
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onHistory}>
          <History className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onShare}>
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
