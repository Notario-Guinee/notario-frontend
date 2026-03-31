import { useInfiniteQuery } from '@tanstack/react-query';
import { getUsers, type GetUsersParams } from '@/api/users';
import type { PageResponse } from '@/types/pagination';
import type { User } from '@/types/user';

type Options = Omit<GetUsersParams, 'page'>;

export function useInfiniteUsers(options: Options = {}) {
  return useInfiniteQuery<PageResponse<User>, Error>({
    queryKey: ['users', options],
    queryFn: ({ pageParam }) =>
      getUsers({ ...options, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
