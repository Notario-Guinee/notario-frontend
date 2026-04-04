import { useState, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { useInfiniteArchives } from '@/hooks/useInfiniteArchives';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { ArchiveCard } from '@/components/archives/ArchiveCard';
import { ArchiveCardSkeleton } from '@/components/archives/ArchiveCardSkeleton';
import type { TypeArchive } from '@/types/archive';
import { useLanguage } from '@/context/LanguageContext';

export default function ArchiveList() {
  const { t } = useLanguage();
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
      title={t("list.archives.title")}
      icon={<Archive className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder={t("list.archives.searchPlaceholder")}
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage={t("list.archives.emptyMessage")}
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
            <option value="">{t("list.archives.allTypes")}</option>
            <option value="ACTE_NOTARIE">{t("list.archives.notarialDeed")}</option>
            <option value="REGISTRE">{t("list.archives.register")}</option>
            <option value="REPERTOIRE">{t("list.archives.repertoire")}</option>
            <option value="DOSSIER_CLOTURE">{t("list.archives.closedCase")}</option>
            <option value="AUTRE">{t("list.archives.other")}</option>
          </select>
          <input
            type="number"
            placeholder={t("list.archives.year")}
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
