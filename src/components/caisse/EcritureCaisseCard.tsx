import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { EcritureCaisse, TypeEcriture } from '@/types/caisse';

interface EcritureCaisseCardProps {
  ecriture: EcritureCaisse;
}

const typeConfig: Record<TypeEcriture, { label: string; className: string }> = {
  RECETTE: {
    label: 'Recette',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  DEPENSE: {
    label: 'Dépense',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  DEBOURS: {
    label: 'Débours',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
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

export function EcritureCaisseCard({ ecriture }: EcritureCaisseCardProps) {
  const type = typeConfig[ecriture.typeEcriture];
  const isRecette = ecriture.typeEcriture === 'RECETTE';

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-sm text-foreground">{ecriture.libelle}</p>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', type.className)}>
          {type.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{ecriture.categorie}</p>
      <p className={cn('text-lg font-bold', isRecette ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
        {isRecette ? '+' : '-'}{formatMontant(ecriture.montant, ecriture.devise)}
      </p>
      {ecriture.dossierReference && (
        <p className="text-xs text-muted-foreground">
          Dossier : <span className="font-mono">{ecriture.dossierReference}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground truncate">{ecriture.responsableNomComplet}</p>
      <p className="text-xs text-muted-foreground">
        Solde après : {formatMontant(ecriture.soldeApres, ecriture.devise)}
      </p>
      <p className="text-xs text-muted-foreground">
        {format(parseISO(ecriture.dateEcriture), 'd MMM yyyy', { locale: fr })}
      </p>
    </div>
  );
}
