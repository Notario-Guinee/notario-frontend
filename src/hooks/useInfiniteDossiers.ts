import { useInfiniteQuery } from '@tanstack/react-query';
import { getDossiers } from '@/api/dossiers';
import type { PageResponse } from '@/types/pagination';
import type { Dossier, StatutDossier } from '@/types/dossier';

interface Options {
  search?: string;
  statut?: StatutDossier;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfiniteDossiers(options: Options = {}) {
  return useInfiniteQuery<PageResponse<Dossier>, Error>({
    queryKey: ['dossiers', options],
    queryFn: ({ pageParam }) =>
      getDossiers({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
