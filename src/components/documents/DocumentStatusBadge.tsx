// ═══════════════════════════════════════════════════════════════
// DocumentStatusBadge — Badge de statut réutilisable
// ═══════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import type { DocumentStatus } from '@/types/documents';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

const statusClasses: Record<DocumentStatus, string> = {
  brouillon: 'bg-muted text-muted-foreground border-border',
  en_revision: 'bg-warning/15 text-warning border-warning/30',
  valide: 'bg-success/15 text-success border-success/30',
  archive: 'bg-muted/50 text-muted-foreground/60 border-border/50',
};

export function DocumentStatusBadge({ status, size = 'sm' }: DocumentStatusBadgeProps) {
  const { t } = useLanguage();

  const statusLabels: Record<DocumentStatus, string> = {
    brouillon: t('collab.statusBrouillon'),
    en_revision: t('collab.statusEnRevision'),
    valide: t('collab.statusValide'),
    archive: t('collab.statusArchive'),
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        statusClasses[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
