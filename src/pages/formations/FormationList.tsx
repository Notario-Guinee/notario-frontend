import { useState, useCallback } from 'react';
import { GraduationCap } from 'lucide-react';
import { useInfiniteFormations } from '@/hooks/useInfiniteFormations';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { FormationCard } from '@/components/formations/FormationCard';
import { FormationCardSkeleton } from '@/components/formations/FormationCardSkeleton';
import type { StatutFormation } from '@/types/formation';

export default function FormationList() {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<StatutFormation | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteFormations({ search: debouncedSearch, statut, size: 20, sortBy: 'dateDebut', sortDir: 'desc' });

  const handleIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver({
    onIntersect: handleIntersect,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  const items = data?.pages.flatMap((p) => p.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements;

  return (
    <InfiniteListLayout
      title="Formations"
      icon={<GraduationCap className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher une formation…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucune formation enregistrée."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <FormationCardSkeleton />}
      filters={
        <select
          value={statut ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setStatut(v === '' ? undefined : v as StatutFormation);
          }}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="PLANIFIEE">Planifiée</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINEE">Terminée</option>
          <option value="ANNULEE">Annulée</option>
        </select>
      }
    >
      {items.map((item) => <FormationCard key={item.id} formation={item} />)}
    </InfiniteListLayout>
  );
}
