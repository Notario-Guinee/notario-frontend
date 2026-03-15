// ═══════════════════════════════════════════════════════════════
// JaugeStockage — Affichage du quota de stockage du cabinet
// Barre de progression colorée, détail plan + packs actifs,
// badge du plan actuel et résumé chiffré complet
// ═══════════════════════════════════════════════════════════════

import { HardDrive, FileStack, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuotaStockage, NiveauAlerte } from '@/types/stockage';
import { Skeleton } from '@/components/ui/skeleton';

interface JaugeStockageProps {
  quota: QuotaStockage | null;
  niveauAlerte: NiveauAlerte;
  isLoading: boolean;
}

/** Couleur CSS de la barre de progression selon le niveau d'alerte */
function couleurBarre(niveau: NiveauAlerte): string {
  switch (niveau) {
    case 'plein':    return 'bg-destructive animate-pulse';
    case 'urgent':   return 'bg-orange-500';
    case 'attention': return 'bg-yellow-500';
    default:         return 'bg-emerald-500';
  }
}

/** Formate un nombre de GB avec une décimale si nécessaire */
function afficherGb(val: number): string {
  return Number.isInteger(val) ? `${val} GB` : `${val.toFixed(1)} GB`;
}

export function JaugeStockage({ quota, niveauAlerte, isLoading }: JaugeStockageProps) {
  if (isLoading || !quota) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
    );
  }

  const { plan_actuel, stockage_plan_gb, stockage_packs_gb, stockage_total_gb, stockage_utilise_gb, pourcentage_utilise, packs_actifs } = quota;
  // Clamp entre 0 et 100 pour l'affichage
  const pctAffiche = Math.min(pourcentage_utilise, 100);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {/* ── En-tête : titre + badge plan ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Espace de stockage
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {plan_actuel.nom}
        </span>
      </div>

      {/* ── Barre de progression ── */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Espace utilisé</span>
          <span className={cn('font-semibold', pourcentage_utilise >= 90 ? 'text-destructive' : 'text-foreground')}>
            {pctAffiche}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', couleurBarre(niveauAlerte))}
            style={{ width: `${pctAffiche}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {afficherGb(stockage_utilise_gb)} utilisés sur {afficherGb(stockage_total_gb)}
        </p>
      </div>

      {/* ── Détail du stockage ── */}
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        {/* Stockage inclus dans le plan */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileStack className="h-3.5 w-3.5" />
            Inclus dans le plan
          </span>
          <span className="font-medium text-foreground">{afficherGb(stockage_plan_gb)}</span>
        </div>

        {/* Packs mensuels actifs */}
        <div className="flex items-start justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Packs mensuels actifs
          </span>
          <span className="font-medium text-foreground">{afficherGb(stockage_packs_gb)}</span>
        </div>

        {/* Détail des packs actifs */}
        {packs_actifs.length > 0 && (
          <ul className="pl-5 space-y-0.5">
            {packs_actifs.map(pack => (
              <li key={pack.id} className="text-xs text-muted-foreground">
                └─ {pack.nom} · +{pack.stockage_gb} GB/mois
              </li>
            ))}
          </ul>
        )}

        {/* Total disponible */}
        <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
          <span className="font-semibold text-foreground">Total disponible</span>
          <span className="font-bold text-foreground">{afficherGb(stockage_total_gb)}</span>
        </div>
      </div>
    </div>
  );
}
