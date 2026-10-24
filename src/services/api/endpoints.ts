import { env } from '@/config/env';
import {
  FeedItemSchema,
  FeedPageSchema,
  GameManifestSchema,
  GamesPageSchema,
  PlayResponseSchema,
  SUPPORTED_SDK_VERSIONS,
  type EventBatch,
  type FeedItem,
  type GameManifest,
  type PlayRequest,
  type PlayResponse,
} from '@/shared';
import { satisfiesMin } from '@/utils/semver';

import { request } from './client';

export type Page<T> = { items: T[]; nextCursor: string | null };

/** Hides games this build cannot run (FRONTEND.md §7.1, §7.2). */
export function isPlayable(game: GameManifest): boolean {
  return SUPPORTED_SDK_VERSIONS.includes(game.sdkVersion) && satisfiesMin(env.appVersion, game.minAppVersion);
}

function parseGames(items: unknown[]): GameManifest[] {
  const games: GameManifest[] = [];
  for (const item of items) {
    const parsed = GameManifestSchema.safeParse(item);
    if (parsed.success && isPlayable(parsed.data)) games.push(parsed.data);
    else if (!parsed.success && __DEV__) console.warn('[api] dropped invalid game manifest', parsed.error.message);
  }
  return games;
}

function parseFeedItems(items: unknown[]): FeedItem[] {
  const out: FeedItem[] = [];
  for (const item of items) {
    // Unknown kinds (sponsored, daily...) fail the union and are skipped by this build.
    const parsed = FeedItemSchema.safeParse(item);
    if (parsed.success && isPlayable(parsed.data.game)) out.push(parsed.data);
  }
  return out;
}

export const api = {
  async getGames(params: { tag?: string; cursor?: string | null; limit?: number }): Promise<Page<GameManifest>> {
    const page = await request('/v1/games', {
      query: { tag: params.tag, cursor: params.cursor, limit: params.limit ?? 24 },
      schema: GamesPageSchema,
    });
    return { items: parseGames(page.items), nextCursor: page.nextCursor };
  },

  getGame(id: string): Promise<GameManifest> {
    return request(`/v1/games/${encodeURIComponent(id)}`, { schema: GameManifestSchema });
  },

  async getFeed(params: { cursor?: string | null; limit?: number }): Promise<Page<FeedItem>> {
    const page = await request('/v1/feed', {
      query: { cursor: params.cursor, limit: params.limit ?? 10 },
      schema: FeedPageSchema,
    });
    return { items: parseFeedItems(page.items), nextCursor: page.nextCursor };
  },

  submitPlay(body: PlayRequest): Promise<PlayResponse> {
    return request('/v1/plays', { method: 'POST', body, schema: PlayResponseSchema });
  },

  sendEvents(body: EventBatch): Promise<void> {
    return request('/v1/events', { method: 'POST', body });
  },
};
