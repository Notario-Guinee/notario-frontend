import { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useInfiniteDocuments } from '@/hooks/useInfiniteDocuments';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { DocumentItemCard } from '@/components/documentItems/DocumentItemCard';
import { DocumentItemCardSkeleton } from '@/components/documentItems/DocumentItemCardSkeleton';
import type { TypeDocument } from '@/types/documentItem';

export default function DocumentFileList() {
  const [search, setSearch] = useState('');
  const [typeDocument, setTypeDocument] = useState<TypeDocument | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteDocuments({ search: debouncedSearch, typeDocument, size: 20, sortBy: 'createdAt', sortDir: 'desc' });

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
      title="Documents"
      icon={<FileText className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher un document…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucun document enregistré."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <DocumentItemCardSkeleton />}
      filters={
        <select
          value={typeDocument ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setTypeDocument(v === '' ? undefined : v as TypeDocument);
          }}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="ACTE">Acte</option>
          <option value="ANNEXE">Annexe</option>
          <option value="COURRIER">Courrier</option>
          <option value="MODELE">Modèle</option>
          <option value="AUTRE">Autre</option>
        </select>
      }
    >
      {items.map((item) => <DocumentItemCard key={item.id} document={item} />)}
    </InfiniteListLayout>
  );
}
