import { infiniteQueryOptions } from '@tanstack/react-query';

import { api } from './endpoints';
import { qk } from './queryKeys';

/**
 * Query definitions shared by the screens that read the data and the launch screen that
 * prefetches it, so both always hit the same cache entry.
 */
export const feedQuery = () =>
  infiniteQueryOptions({
    queryKey: qk.feed(),
    queryFn: ({ pageParam }) => api.getFeed({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // Never reshuffle the feed under the player's thumb.
    staleTime: Infinity,
  });

export const catalogueQuery = () =>
  infiniteQueryOptions({
    queryKey: qk.games(),
    queryFn: ({ pageParam }) => api.getGames({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
