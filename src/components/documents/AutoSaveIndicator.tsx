// ═══════════════════════════════════════════════════════════════
// AutoSaveIndicator — Indicateur d'état de sauvegarde automatique
// ═══════════════════════════════════════════════════════════════

import { CircleCheck, Loader2, CircleAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AutoSaveIndicatorProps {
  status: 'saved' | 'saving' | 'unsaved';
  lastSaved: Date;
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  const { t, lang } = useLanguage();
  const locale = lang === 'EN' ? 'en-GB' : 'fr-FR';

  if (status === 'saving') {
    return (
      <span className="text-xs flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('autosave.saving')}
      </span>
    );
  }

  if (status === 'unsaved') {
    return (
      <span className="text-xs flex items-center gap-1 text-warning">
        <CircleAlert className="h-3.5 w-3.5" />
        {t('autosave.unsaved')}
      </span>
    );
  }

  // saved
  return (
    <span className="text-xs flex items-center gap-1 text-success">
      <CircleCheck className="h-3.5 w-3.5" />
      {t('autosave.savedAt')} {formatTime(lastSaved, locale)}
    </span>
  );
}
