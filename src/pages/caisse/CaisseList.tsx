import { useState, useCallback } from 'react';
import { Wallet } from 'lucide-react';
import { useInfiniteCaisse } from '@/hooks/useInfiniteCaisse';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { EcritureCaisseCard } from '@/components/caisse/EcritureCaisseCard';
import { EcritureCaisseCardSkeleton } from '@/components/caisse/EcritureCaisseCardSkeleton';
import type { TypeEcriture } from '@/types/caisse';

export default function CaisseList() {
  const [search, setSearch] = useState('');
  const [typeEcriture, setTypeEcriture] = useState<TypeEcriture | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteCaisse({ search: debouncedSearch, typeEcriture, size: 20, sortBy: 'dateEcriture', sortDir: 'desc' });

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
      title="Caisse"
      icon={<Wallet className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher une écriture…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucune écriture enregistrée."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <EcritureCaisseCardSkeleton />}
      filters={
        <select
          value={typeEcriture ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setTypeEcriture(v === '' ? undefined : v as TypeEcriture);
          }}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="RECETTE">Recette</option>
          <option value="DEPENSE">Dépense</option>
          <option value="DEBOURS">Débours</option>
        </select>
      }
    >
      {items.map((item) => <EcritureCaisseCard key={item.id} ecriture={item} />)}
    </InfiniteListLayout>
  );
}
