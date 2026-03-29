// ═══════════════════════════════════════════════════════════════
// AutoSaveIndicator — Indicateur d'état de sauvegarde automatique
// ═══════════════════════════════════════════════════════════════

import { CircleCheck, Loader2, CircleAlert } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'saved' | 'saving' | 'unsaved';
  lastSaved: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  if (status === 'saving') {
    return (
      <span className="text-xs flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Sauvegarde...
      </span>
    );
  }

  if (status === 'unsaved') {
    return (
      <span className="text-xs flex items-center gap-1 text-warning">
        <CircleAlert className="h-3.5 w-3.5" />
        Modifications non sauvegardées
      </span>
    );
  }

  // saved
  return (
    <span className="text-xs flex items-center gap-1 text-success">
      <CircleCheck className="h-3.5 w-3.5" />
      Sauvegardé à {formatTime(lastSaved)}
    </span>
  );
}
