import { useState, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { useInfiniteDossiers } from '@/hooks/useInfiniteDossiers';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { DossierCard } from '@/components/dossiers/DossierCard';
import { DossierCardSkeleton } from '@/components/dossiers/DossierCardSkeleton';
import type { StatutDossier } from '@/types/dossier';

export default function DossierList() {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<StatutDossier | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteDossiers({ search: debouncedSearch, statut, size: 20, sortBy: 'dateCreation', sortDir: 'desc' });

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
      title="Dossiers"
      icon={<FolderOpen className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher un dossier…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucun dossier enregistré."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <DossierCardSkeleton />}
      filters={
        <select
          value={statut ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setStatut(v === '' ? undefined : v as StatutDossier);
          }}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="OUVERT">Ouvert</option>
          <option value="EN_COURS">En cours</option>
          <option value="CLOTURE">Clôturé</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
      }
    >
      {items.map((item) => <DossierCard key={item.id} dossier={item} />)}
    </InfiniteListLayout>
  );
}
