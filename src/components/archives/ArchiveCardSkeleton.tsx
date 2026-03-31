// ═══════════════════════════════════════════════════════════════
// ArchiveCardSkeleton — Placeholder de chargement d'une carte archive
// ═══════════════════════════════════════════════════════════════

import { Skeleton } from '@/components/ui/skeleton';

export function ArchiveCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-10 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  );
}
