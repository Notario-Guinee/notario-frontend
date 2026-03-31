import { format, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dossier, StatutDossier } from '@/types/dossier';

interface DossierCardProps {
  dossier: Dossier;
}

const statutConfig: Record<StatutDossier, { label: string; className: string }> = {
  OUVERT: {
    label: 'Ouvert',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  EN_COURS: {
    label: 'En cours',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  CLOTURE: {
    label: 'Clôturé',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  ARCHIVE: {
    label: 'Archivé',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  },
};

export function DossierCard({ dossier }: DossierCardProps) {
  const statut = statutConfig[dossier.statut];
  const echeancePast = dossier.dateEcheance ? isPast(parseISO(dossier.dateEcheance)) : false;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
          {dossier.reference}
        </span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', statut.className)}>
          {statut.label}
        </span>
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{dossier.titre}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{dossier.typeActe}</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{dossier.clientNomComplet}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{dossier.notaireNomComplet}</p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {format(parseISO(dossier.dateCreation), 'd MMM yyyy', { locale: fr })}
        </span>
        {dossier.dateEcheance && (
          <span className={cn('font-medium', echeancePast ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
            Éch. {format(parseISO(dossier.dateEcheance), 'd MMM yyyy', { locale: fr })}
          </span>
        )}
      </div>
    </div>
  );
}
