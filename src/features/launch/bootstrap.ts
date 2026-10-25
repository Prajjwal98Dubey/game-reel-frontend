import type { InfiniteData } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { ensureToken, queryClient, type Page } from '@/services/api';
import { catalogueQuery, feedQuery } from '@/services/api/queries';
import type { FeedItem, GameManifest } from '@/shared';

export type BootPhase = 'connecting' | 'dealing' | 'ready';

/** Thumbnails warmed up front: the first reels plus the catalogue rows. */
const FEED_THUMBS = 4;
const CATALOGUE_THUMBS = 8;

/**
 * Everything the app wants before its first screen: a guest session, the first page of Reels,
 * the catalogue, and their thumbnails. Every step is best-effort: offline, the app still opens
 * and the screens show their own retry states.
 */
export async function bootstrap(onPhase: (phase: BootPhase) => void = () => undefined): Promise<void> {
  onPhase('connecting');
  const token = await ensureToken().catch(() => null);
  // No session means every catalogue request would fail too: open the app now and let the
  // screens show their retry states instead of holding the player on the launch screen.
  if (!token) {
    onPhase('ready');
    return;
  }

  onPhase('dealing');
  // prefetchInfiniteQuery never throws; a failure just leaves the screen to fetch and retry itself.
  // One quick try only: the default retry backoff (1s + 2s + 4s) would outlast the launch screen.
  await Promise.all([
    queryClient.prefetchInfiniteQuery({ ...feedQuery(), retry: 0 }),
    queryClient.prefetchInfiniteQuery({ ...catalogueQuery(), retry: 0 }),
  ]);

  const feed = queryClient.getQueryData<InfiniteData<Page<FeedItem>>>(feedQuery().queryKey);
  const games = queryClient.getQueryData<InfiniteData<Page<GameManifest>>>(catalogueQuery().queryKey);
  const urls = [
    ...(feed?.pages[0]?.items ?? []).slice(0, FEED_THUMBS).map((it) => it.game.thumbnailUrl),
    ...(games?.pages[0]?.items ?? []).slice(0, CATALOGUE_THUMBS).map((g) => g.thumbnailUrl),
  ];
  if (urls.length) await Image.prefetch([...new Set(urls)]).catch(() => false);

  onPhase('ready');
}
