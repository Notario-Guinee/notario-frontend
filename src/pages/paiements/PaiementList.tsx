import { useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { useInfinitePaiements } from '@/hooks/useInfinitePaiements';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { InfiniteListLayout } from '@/components/ui/InfiniteListLayout';
import { PaiementCard } from '@/components/paiements/PaiementCard';
import { PaiementCardSkeleton } from '@/components/paiements/PaiementCardSkeleton';
import type { ModePaiement, StatutPaiement } from '@/types/paiement';

export default function PaiementList() {
  const [search, setSearch] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement | undefined>(undefined);
  const [statut, setStatut] = useState<StatutPaiement | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfinitePaiements({ search: debouncedSearch, modePaiement, statut, size: 20, sortBy: 'datePaiement', sortDir: 'desc' });

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
      title="Paiements"
      icon={<CreditCard className="h-5 w-5" />}
      totalElements={totalElements}
      searchPlaceholder="Rechercher un paiement…"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      emptyMessage="Aucun paiement enregistré."
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      sentinelRef={sentinelRef}
      renderSkeleton={() => <PaiementCardSkeleton />}
      filters={
        <>
          <select
            value={modePaiement ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setModePaiement(v === '' ? undefined : v as ModePaiement);
            }}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">Tous les modes</option>
            <option value="ESPECES">Espèces</option>
            <option value="VIREMENT">Virement</option>
            <option value="CHEQUE">Chèque</option>
            <option value="WAVE">Wave</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="MTN_MONEY">MTN Money</option>
          </select>
          <select
            value={statut ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setStatut(v === '' ? undefined : v as StatutPaiement);
            }}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="CONFIRME">Confirmé</option>
            <option value="ECHEC">Échec</option>
            <option value="REMBOURSE">Remboursé</option>
          </select>
        </>
      }
    >
      {items.map((item) => <PaiementCard key={item.id} paiement={item} />)}
    </InfiniteListLayout>
  );
}
