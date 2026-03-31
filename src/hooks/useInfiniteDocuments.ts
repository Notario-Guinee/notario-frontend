import { useInfiniteQuery } from '@tanstack/react-query';
import { getDocumentItems } from '@/api/documentItems';
import type { PageResponse } from '@/types/pagination';
import type { DocumentItem, TypeDocument } from '@/types/documentItem';

interface Options {
  search?: string;
  typeDocument?: TypeDocument;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useInfiniteDocuments(options: Options = {}) {
  return useInfiniteQuery<PageResponse<DocumentItem>, Error>({
    queryKey: ['documents', options],
    queryFn: ({ pageParam }) =>
      getDocumentItems({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
