import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { feedQuery } from '@/services/api/queries';
import type { GameManifest } from '@/shared';
import { useScoresStore } from '@/stores/scores';

import { reshuffle } from '../feedLoop';

export type ReelItem = { key: string; game: GameManifest };

/** Load more when the player is this many items from the end. */
export const PREFETCH_DISTANCE = 3;

/**
 * The Reels feed, and it never ends: server pages come first; once the server has no next page
 * (or stops answering), the feed keeps going with reshuffled laps of the games already seen.
 */
export function useFeed() {
  const query = useInfiniteQuery(feedQuery());
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query;
  const [laps, setLaps] = useState<GameManifest[][]>([]);

  const serverItems = useMemo<ReelItem[]>(() => {
    const out: ReelItem[] = [];
    query.data?.pages.forEach((page, p) =>
      page.items.forEach((item, i) => out.push({ key: `${p}:${i}:${item.game.id}`, game: item.game })),
    );
    return out;
  }, [query.data]);

  const items = useMemo<ReelItem[]>(() => {
    if (!laps.length) return serverItems;
    const recycled = laps.flatMap((lap, l) => lap.map((game, i) => ({ key: `lap${l}:${i}:${game.id}`, game })));
    return [...serverItems, ...recycled];
  }, [serverItems, laps]);

  // Once looping, stay looping: a late server page would be inserted behind the player.
  const looping = laps.length > 0 || (serverItems.length > 0 && (!hasNextPage || isFetchNextPageError));

  const loadMore = useCallback(() => {
    if (!looping) {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
      return;
    }
    setLaps((prev) => {
      const lastId = (prev.at(-1) ?? []).at(-1)?.id ?? serverItems.at(-1)?.game.id;
      return [
        ...prev,
        reshuffle(
          serverItems.map((it) => it.game),
          lastId,
        ),
      ];
    });
  }, [looping, hasNextPage, isFetchingNextPage, fetchNextPage, serverItems]);

  useEffect(() => {
    const { mergeBest } = useScoresStore.getState();
    for (const { game } of serverItems) mergeBest(game.id, game.best);
  }, [serverItems]);

  return { ...query, items, loadMore };
}
