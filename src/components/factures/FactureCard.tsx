import { format, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Facture, StatutFacture } from '@/types/facture';

interface FactureCardProps {
  facture: Facture;
}

const statutConfig: Record<StatutFacture, { label: string; className: string; lineThrough?: boolean }> = {
  BROUILLON: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  },
  ENVOYEE: {
    label: 'Envoyée',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  PAYEE: {
    label: 'Payée',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  EN_RETARD: {
    label: 'En retard',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    lineThrough: true,
  },
};

function formatMontant(montant: number, devise: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      maximumFractionDigits: devise === 'GNF' || devise === 'XOF' ? 0 : 2,
    }).format(montant);
  } catch {
    return `${montant.toLocaleString('fr-FR')} ${devise}`;
  }
}

export function FactureCard({ facture }: FactureCardProps) {
  const statut = statutConfig[facture.statut];
  const echeancePast = isPast(parseISO(facture.dateEcheance));

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
          {facture.numero}
        </span>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
            statut.className,
            statut.lineThrough && 'line-through',
          )}
        >
          {statut.label}
        </span>
      </div>
      <p className="font-semibold text-sm text-foreground truncate">{facture.clientNomComplet}</p>
      {facture.dossierReference && (
        <p className="text-xs text-muted-foreground">
          Dossier : <span className="font-mono">{facture.dossierReference}</span>
        </p>
      )}
      <p className="text-lg font-bold text-foreground">
        {formatMontant(facture.montantTTC, facture.devise)}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Émise le {format(parseISO(facture.dateEmission), 'd MMM yyyy', { locale: fr })}
        </span>
        <span className={cn('font-medium', echeancePast && facture.statut !== 'PAYEE' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          Éch. {format(parseISO(facture.dateEcheance), 'd MMM yyyy', { locale: fr })}
        </span>
      </div>
    </div>
  );
}
