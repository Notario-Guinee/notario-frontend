import { useInfiniteQuery } from '@tanstack/react-query';
import { getFactures } from '@/api/factures';
import type { PageResponse } from '@/types/pagination';
import type { Facture, StatutFacture } from '@/types/facture';

interface Options {
  search?: string;
  statut?: StatutFacture;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfiniteFactures(options: Options = {}) {
  return useInfiniteQuery<PageResponse<Facture>, Error>({
    queryKey: ['factures', options],
    queryFn: ({ pageParam }) =>
      getFactures({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
