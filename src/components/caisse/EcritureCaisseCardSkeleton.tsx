// ═══════════════════════════════════════════════════════════════
// EcritureCaisseCardSkeleton — Placeholder de chargement d'une écriture de caisse
// ═══════════════════════════════════════════════════════════════

import { Skeleton } from '@/components/ui/skeleton';

export function EcritureCaisseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-1/3" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
