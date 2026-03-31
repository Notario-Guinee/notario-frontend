import { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { useInfiniteUsers } from '@/hooks/useInfiniteUsers';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { UserCard } from '@/components/users/UserCard';
import { UserCardSkeleton } from '@/components/users/UserCardSkeleton';

export default function UserList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteUsers({ search: debouncedSearch, size: 20, sortBy: 'createdAt', sortDir: 'desc' });

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
      title="Utilisateurs"
      icon={<Users className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher un utilisateur…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucun utilisateur enregistré."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <UserCardSkeleton />}
    >
      {items.map((item) => <UserCard key={item.id} user={item} />)}
    </InfiniteListLayout>
  );
}
