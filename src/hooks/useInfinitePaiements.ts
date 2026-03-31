import { useInfiniteQuery } from '@tanstack/react-query';
import { getPaiements } from '@/api/paiements';
import type { PageResponse } from '@/types/pagination';
import type { Paiement, ModePaiement, StatutPaiement } from '@/types/paiement';

interface Options {
  search?: string;
  modePaiement?: ModePaiement;
  statut?: StatutPaiement;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfinitePaiements(options: Options = {}) {
  return useInfiniteQuery<PageResponse<Paiement>, Error>({
    queryKey: ['paiements', options],
    queryFn: ({ pageParam }) =>
      getPaiements({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
