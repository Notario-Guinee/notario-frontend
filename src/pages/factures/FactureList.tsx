import { useState, useCallback } from 'react';
import { Receipt } from 'lucide-react';
import { useInfiniteFactures } from '@/hooks/useInfiniteFactures';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { FactureCard } from '@/components/factures/FactureCard';
import { FactureCardSkeleton } from '@/components/factures/FactureCardSkeleton';
import type { StatutFacture } from '@/types/facture';
import { useLanguage } from '@/context/LanguageContext';

export default function FactureList() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<StatutFacture | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteFactures({ search: debouncedSearch, statut, size: 20, sortBy: 'dateEmission', sortDir: 'desc' });

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
      title={t("list.factures.title")}
      icon={<Receipt className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder={t("list.factures.searchPlaceholder")}
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage={t("list.factures.emptyMessage")}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <FactureCardSkeleton />}
      filters={
        <select
          value={statut ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setStatut(v === '' ? undefined : v as StatutFacture);
          }}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">{t("list.factures.allStatuses")}</option>
          <option value="BROUILLON">{t("list.factures.draft")}</option>
          <option value="ENVOYEE">{t("list.factures.sent")}</option>
          <option value="PAYEE">{t("list.factures.paid")}</option>
          <option value="EN_RETARD">{t("list.factures.overdue")}</option>
          <option value="ANNULEE">{t("list.factures.cancelled")}</option>
        </select>
      }
    >
      {items.map((item) => <FactureCard key={item.id} facture={item} />)}
    </InfiniteListLayout>
  );
}
