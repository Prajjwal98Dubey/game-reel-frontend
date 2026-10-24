import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { catalogueQuery } from '@/services/api/queries';
import type { GameManifest } from '@/shared';
import { useScoresStore } from '@/stores/scores';

/**
 * The whole catalogue. Rows, Game of the day and search are all derived from it on the client,
 * so remaining pages are fetched in the background until the list is complete.
 */
export function useCatalogue() {
  const query = useInfiniteQuery(catalogueQuery());
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const games = useMemo<GameManifest[]>(() => {
    const seen = new Set<string>();
    const out: GameManifest[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const g of page.items) {
        if (!seen.has(g.id)) {
          seen.add(g.id);
          out.push(g);
        }
      }
    }
    return out;
  }, [query.data]);

  useEffect(() => {
    const { mergeBest } = useScoresStore.getState();
    for (const g of games) mergeBest(g.id, g.best);
  }, [games]);

  return { ...query, games };
}
