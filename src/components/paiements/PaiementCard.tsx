import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Smartphone, ArrowRightLeft, Landmark, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Paiement, ModePaiement, StatutPaiement } from '@/types/paiement';

interface PaiementCardProps {
  paiement: Paiement;
}

const statutConfig: Record<StatutPaiement, { label: string; className: string }> = {
  EN_ATTENTE: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  CONFIRME: {
    label: 'Confirmé',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  ECHEC: {
    label: 'Échec',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  REMBOURSE: {
    label: 'Remboursé',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const modePaiementConfig: Record<ModePaiement, { label: string; colorClass: string }> = {
  WAVE: { label: 'Wave', colorClass: 'text-orange-500' },
  ORANGE_MONEY: { label: 'Orange Money', colorClass: 'text-orange-700' },
  MTN_MONEY: { label: 'MTN Money', colorClass: 'text-yellow-600' },
  VIREMENT: { label: 'Virement', colorClass: 'text-blue-500' },
  CHEQUE: { label: 'Chèque', colorClass: 'text-violet-500' },
  ESPECES: { label: 'Espèces', colorClass: 'text-emerald-500' },
};

function ModeIcon({ mode }: { mode: ModePaiement }) {
  const cls = cn('h-4 w-4', modePaiementConfig[mode].colorClass);
  if (mode === 'WAVE' || mode === 'ORANGE_MONEY' || mode === 'MTN_MONEY') {
    return <Smartphone className={cls} />;
  }
  if (mode === 'VIREMENT') return <ArrowRightLeft className={cls} />;
  if (mode === 'CHEQUE') return <Landmark className={cls} />;
  return <Banknote className={cls} />;
}

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

export function PaiementCard({ paiement }: PaiementCardProps) {
  const statut = statutConfig[paiement.statut];
  const mode = modePaiementConfig[paiement.modePaiement];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
          {paiement.reference}
        </span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', statut.className)}>
          {statut.label}
        </span>
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground truncate">{paiement.clientNomComplet}</p>
        <p className="text-xs text-muted-foreground">
          Facture : <span className="font-mono">{paiement.factureNumero}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ModeIcon mode={paiement.modePaiement} />
        <span className={cn('text-xs font-medium', modePaiementConfig[paiement.modePaiement].colorClass)}>
          {mode.label}
        </span>
        {paiement.referenceMobileMoney && (
          <span className="text-xs text-muted-foreground font-mono ml-auto">{paiement.referenceMobileMoney}</span>
        )}
      </div>
      <p className="text-lg font-bold text-foreground">
        {formatMontant(paiement.montant, paiement.devise)}
      </p>
      <p className="text-xs text-muted-foreground">
        {format(parseISO(paiement.datePaiement), 'd MMM yyyy', { locale: fr })}
      </p>
    </div>
  );
}
