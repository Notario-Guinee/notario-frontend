// ═══════════════════════════════════════════════════════════════
// PaiementCardSkeleton — Placeholder de chargement d'une carte paiement
// ═══════════════════════════════════════════════════════════════

import { Skeleton } from '@/components/ui/skeleton';

export function PaiementCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
