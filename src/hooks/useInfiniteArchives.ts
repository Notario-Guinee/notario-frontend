import { useInfiniteQuery } from '@tanstack/react-query';
import { getArchives } from '@/api/archives';
import type { PageResponse } from '@/types/pagination';
import type { Archive, TypeArchive } from '@/types/archive';

interface Options {
  search?: string;
  typeArchive?: TypeArchive;
  annee?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfiniteArchives(options: Options = {}) {
  return useInfiniteQuery<PageResponse<Archive>, Error>({
    queryKey: ['archives', options],
    queryFn: ({ pageParam }) => getArchives({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
