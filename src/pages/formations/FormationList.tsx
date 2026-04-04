import { useState, useCallback } from 'react';
import { GraduationCap } from 'lucide-react';
import { useInfiniteFormations } from '@/hooks/useInfiniteFormations';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { FormationCard } from '@/components/formations/FormationCard';
import { FormationCardSkeleton } from '@/components/formations/FormationCardSkeleton';
import type { StatutFormation } from '@/types/formation';
import { useLanguage } from '@/context/LanguageContext';

export default function FormationList() {
  const { t } = useLanguage();
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
      title={t("list.formations.title")}
      icon={<GraduationCap className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder={t("list.formations.searchPlaceholder")}
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage={t("list.formations.emptyMessage")}
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
          <option value="">{t("list.formations.allStatuses")}</option>
          <option value="PLANIFIEE">{t("list.formations.planned")}</option>
          <option value="EN_COURS">{t("list.formations.inProgress")}</option>
          <option value="TERMINEE">{t("list.formations.completed")}</option>
          <option value="ANNULEE">{t("list.formations.cancelled")}</option>
        </select>
      }
    >
      {items.map((item) => <FormationCard key={item.id} formation={item} />)}
    </InfiniteListLayout>
  );
}
