import { useInfiniteQuery } from '@tanstack/react-query';
import { getCaisse } from '@/api/caisse';
import type { PageResponse } from '@/types/pagination';
import type { EcritureCaisse, TypeEcriture } from '@/types/caisse';

interface Options {
  search?: string;
  typeEcriture?: TypeEcriture;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfiniteCaisse(options: Options = {}) {
  return useInfiniteQuery<PageResponse<EcritureCaisse>, Error>({
    queryKey: ['caisse', options],
    queryFn: ({ pageParam }) =>
      getCaisse({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
