// ═══════════════════════════════════════════════════════════════
// RecapFacturationMensuelle — Résumé de la facture mensuelle
// Affiche le détail plan + packs, le total et la prochaine échéance
// ═══════════════════════════════════════════════════════════════

import { Receipt, CalendarDays, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecapFacturation } from '@/types/stockage';

interface RecapFacturationMensuelleProps {
  recap: RecapFacturation | null;
  isLoading: boolean;
}

/** Formate un montant GNF en chaîne lisible */
function formatGnf(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' GNF';
}

/** Formate une date ISO en format lisible français */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function RecapFacturationMensuelle({ recap, isLoading }: RecapFacturationMensuelleProps) {
  if (isLoading || !recap) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-3">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-5 w-40" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {/* ── En-tête ── */}
      <div className="flex items-center gap-2 mb-5">
        <Receipt className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-heading text-base font-semibold text-foreground">
          Récapitulatif de facturation mensuelle
        </h3>
      </div>

      {/* ── Lignes de détail ── */}
      <div className="space-y-2.5">
        {/* Plan */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{recap.plan_nom}</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatGnf(recap.plan_montant_gnf)}
          </span>
        </div>

        {/* Packs actifs */}
        {recap.packs.map((pack, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{pack.nom}</span>
            <span className="font-medium text-foreground tabular-nums">
              {formatGnf(pack.montant_gnf)}
            </span>
          </div>
        ))}

        {/* Séparateur */}
        <div className="flex items-center gap-2 pt-1">
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Total mensuel</span>
          <span className="text-base font-bold text-primary tabular-nums">
            {formatGnf(recap.total_mensuel_gnf)}
          </span>
        </div>
      </div>

      {/* ── Prochaine échéance ── */}
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span>
          Prochaine échéance : <strong className="text-foreground">{formatDate(recap.prochaine_echeance)}</strong>
        </span>
      </div>
    </div>
  );
}
