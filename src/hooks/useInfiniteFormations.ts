import { useInfiniteQuery } from '@tanstack/react-query';
import { getFormations } from '@/api/formations';
import type { PageResponse } from '@/types/pagination';
import type { Formation, StatutFormation } from '@/types/formation';

interface Options {
  search?: string;
  statut?: StatutFormation;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfiniteFormations(options: Options = {}) {
  return useInfiniteQuery<PageResponse<Formation>, Error>({
    queryKey: ['formations', options],
    queryFn: ({ pageParam }) =>
      getFormations({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
