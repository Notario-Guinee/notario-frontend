import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Formation, StatutFormation } from '@/types/formation';

interface FormationCardProps {
  formation: Formation;
}

const statutConfig: Record<StatutFormation, { label: string; className: string }> = {
  PLANIFIEE: {
    label: 'Planifiée',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  EN_COURS: {
    label: 'En cours',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  TERMINEE: {
    label: 'Terminée',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function FormationCard({ formation }: FormationCardProps) {
  const statut = statutConfig[formation.statut];
  const ratio = formation.capaciteMax > 0 ? formation.nombreParticipants / formation.capaciteMax : 0;
  const progressColor =
    ratio >= 1
      ? 'bg-red-500'
      : ratio >= 0.8
        ? 'bg-orange-500'
        : 'bg-emerald-500';

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-sm text-foreground">{formation.titre}</p>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', statut.className)}>
          {statut.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{formation.formateurNomComplet}</p>
      <div className="text-xs text-muted-foreground">
        {format(parseISO(formation.dateDebut), 'd MMM yyyy', { locale: fr })}
        {' → '}
        {format(parseISO(formation.dateFin), 'd MMM yyyy', { locale: fr })}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{formation.lieu}</span>
      </div>
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', progressColor)}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {formation.nombreParticipants} / {formation.capaciteMax} participants
        </p>
      </div>
    </div>
  );
}
