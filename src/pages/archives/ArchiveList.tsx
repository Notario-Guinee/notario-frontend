import { useState, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { useInfiniteArchives } from '@/hooks/useInfiniteArchives';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { ArchiveCard } from '@/components/archives/ArchiveCard';
import { ArchiveCardSkeleton } from '@/components/archives/ArchiveCardSkeleton';
import type { TypeArchive } from '@/types/archive';

export default function ArchiveList() {
  const [search, setSearch] = useState('');
  const [typeArchive, setTypeArchive] = useState<TypeArchive | undefined>(undefined);
  const [annee, setAnnee] = useState<number | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteArchives({ search: debouncedSearch, typeArchive, annee, size: 20, sortBy: 'dateArchivage', sortDir: 'desc' });

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
      title="Archives"
      icon={<Archive className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher une archive…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucune archive enregistrée."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <ArchiveCardSkeleton />}
      filters={
        <>
          <select
            value={typeArchive ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setTypeArchive(v === '' ? undefined : v as TypeArchive);
            }}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">Tous les types</option>
            <option value="ACTE_NOTARIE">Acte notarié</option>
            <option value="REGISTRE">Registre</option>
            <option value="REPERTOIRE">Répertoire</option>
            <option value="DOSSIER_CLOTURE">Dossier clôturé</option>
            <option value="AUTRE">Autre</option>
          </select>
          <input
            type="number"
            placeholder="Année"
            value={annee ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setAnnee(v === '' ? undefined : Number(v));
            }}
            className="h-9 w-28 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </>
      }
    >
      {items.map((item) => <ArchiveCard key={item.id} archive={item} />)}
    </InfiniteListLayout>
  );
}
