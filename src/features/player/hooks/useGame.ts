import { useQuery, type InfiniteData } from '@tanstack/react-query';

import { api, queryClient, qk, type Page } from '@/services/api';
import type { GameManifest } from '@/shared';

/** A manifest already loaded by the catalogue, so opening a card renders without a round-trip. */
function fromCatalogueCache(id: string): GameManifest | undefined {
  const cached = queryClient.getQueriesData<InfiniteData<Page<GameManifest>>>({ queryKey: ['games'] });
  for (const [, data] of cached) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((g) => g.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function useGame(id: string) {
  return useQuery({
    queryKey: qk.game(id),
    queryFn: () => api.getGame(id),
    initialData: () => fromCatalogueCache(id),
    // Cached catalogue data is treated as stale so the manifest is refreshed in the background.
    initialDataUpdatedAt: 0,
    enabled: id.length > 0,
  });
}
