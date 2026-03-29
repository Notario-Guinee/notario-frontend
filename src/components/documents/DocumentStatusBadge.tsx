// ═══════════════════════════════════════════════════════════════
// DocumentStatusBadge — Badge de statut réutilisable
// ═══════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@/types/documents';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; classes: string }
> = {
  brouillon: {
    label: 'Brouillon',
    classes: 'bg-muted text-muted-foreground border-border',
  },
  en_revision: {
    label: 'En révision',
    classes: 'bg-warning/15 text-warning border-warning/30',
  },
  valide: {
    label: 'Validé',
    classes: 'bg-success/15 text-success border-success/30',
  },
  archive: {
    label: 'Archivé',
    classes: 'bg-muted/50 text-muted-foreground/60 border-border/50',
  },
};

export function DocumentStatusBadge({ status, size = 'sm' }: DocumentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        config.classes
      )}
    >
      {config.label}
    </span>
  );
}
