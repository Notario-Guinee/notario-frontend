import { useState, useCallback } from 'react';
import { UserRound } from 'lucide-react';
import { useInfiniteClients } from '@/hooks/useInfiniteClients';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientCardSkeleton } from '@/components/clients/ClientCardSkeleton';

export default function ClientList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteClients({ search: debouncedSearch, size: 20, sortBy: 'createdAt', sortDir: 'desc' });

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
      title="Clients"
      icon={<UserRound className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher un client…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucun client enregistré."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <ClientCardSkeleton />}
    >
      {items.map((item) => <ClientCard key={item.id} client={item} />)}
    </InfiniteListLayout>
  );
}
