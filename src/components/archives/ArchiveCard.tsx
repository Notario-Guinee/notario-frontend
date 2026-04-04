import { format, parseISO } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import type { Archive, TypeArchive } from '@/types/archive';

interface ArchiveCardProps {
  archive: Archive;
}

const typeArchiveColors: Record<TypeArchive, string> = {
  ACTE_NOTARIE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REGISTRE: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  REPERTOIRE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  DOSSIER_CLOTURE: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  AUTRE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const MAX_KEYWORDS = 3;

export function ArchiveCard({ archive }: ArchiveCardProps) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === 'EN' ? enGB : fr;

  const typeArchiveLabels: Record<TypeArchive, string> = {
    ACTE_NOTARIE: t('archiveCard.typeActe'),
    REGISTRE: t('archiveCard.typeRegistre'),
    REPERTOIRE: t('archiveCard.typeRepertoire'),
    DOSSIER_CLOTURE: t('archiveCard.typeDossier'),
    AUTRE: t('archiveCard.typeAutre'),
  };

  const shownKeywords = archive.indexMotsCles.slice(0, MAX_KEYWORDS);
  const extraCount = archive.indexMotsCles.length - MAX_KEYWORDS;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
          {archive.reference}
        </span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', typeArchiveColors[archive.typeArchive])}>
          {typeArchiveLabels[archive.typeArchive]}
        </span>
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{archive.titre}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t('archiveCard.year')} {archive.annee}</p>
      </div>
      {shownKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {shownKeywords.map((kw) => (
            <span key={kw} className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
              {kw}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
              +{extraCount}
            </span>
          )}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground truncate">{archive.responsableNomComplet}</p>
        {archive.localisationPhysique && (
          <p className="text-xs text-muted-foreground truncate">
            {t('archiveCard.location')} {archive.localisationPhysique}
          </p>
        )}
        {archive.nombrePages !== undefined && (
          <p className="text-xs text-muted-foreground">{archive.nombrePages} {t('archiveCard.pages')}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('archiveCard.archivedOn')} {format(parseISO(archive.dateArchivage), 'd MMM yyyy', { locale: dateLocale })}
        </p>
      </div>
      <a
        href={archive.localisationNumerique}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {t('archiveCard.view')}
      </a>
    </div>
  );
}
