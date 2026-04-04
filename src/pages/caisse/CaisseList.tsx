import { useState, useCallback } from 'react';
import { Wallet } from 'lucide-react';
import { useInfiniteCaisse } from '@/hooks/useInfiniteCaisse';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { EcritureCaisseCard } from '@/components/caisse/EcritureCaisseCard';
import { EcritureCaisseCardSkeleton } from '@/components/caisse/EcritureCaisseCardSkeleton';
import type { TypeEcriture } from '@/types/caisse';
import { useLanguage } from '@/context/LanguageContext';

export default function CaisseList() {
  const { t } = useLanguage();
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
      title={t("list.caisse.title")}
      icon={<Wallet className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder={t("list.caisse.searchPlaceholder")}
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage={t("list.caisse.emptyMessage")}
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
          <option value="">{t("list.caisse.allTypes")}</option>
          <option value="RECETTE">{t("list.caisse.income")}</option>
          <option value="DEPENSE">{t("list.caisse.expense")}</option>
          <option value="DEBOURS">{t("list.caisse.disbursement")}</option>
        </select>
      }
    >
      {items.map((item) => <EcritureCaisseCard key={item.id} ecriture={item} />)}
    </InfiniteListLayout>
  );
}
