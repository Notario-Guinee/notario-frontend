import { useInfiniteQuery } from '@tanstack/react-query';
import { getClients, type GetClientsParams } from '@/api/clients';
import type { PageResponse } from '@/types/pagination';
import type { Client } from '@/types/client';

type Options = Omit<GetClientsParams, 'page'>;

export function useInfiniteClients(options: Options = {}) {
  return useInfiniteQuery<PageResponse<Client>, Error>({
    queryKey: ['clients', options],
    queryFn: ({ pageParam }) =>
      getClients({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 0,
    retry: 2,
  });
}
