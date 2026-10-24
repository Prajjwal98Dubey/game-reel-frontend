import { z } from 'zod';

/** Analytics events (FRONTEND.md §10). Names and props are defined once and used by app and API. */

export type GameSource = 'reels' | 'catalogue';

export type EventProps = {
  game_view: { gameId: string; source: GameSource; position: number };
  game_start: { gameId: string; round: number };
  game_over: { gameId: string; score: number; durationMs: number; isNewBest: boolean };
  game_quit: { gameId: string; score: number; durationMs: number };
  game_skip: { gameId: string; dwellMs: number };
  game_like: { gameId: string };
  game_unlike: { gameId: string };
  game_save: { gameId: string };
  game_unsave: { gameId: string };
  tab_view: { tab: 'reels' | 'catalogue' };
};

export type EventName = keyof EventProps;

export const EVENT_NAMES = [
  'game_view',
  'game_start',
  'game_over',
  'game_quit',
  'game_skip',
  'game_like',
  'game_unlike',
  'game_save',
  'game_unsave',
  'tab_view',
] as const satisfies readonly EventName[];

export const MAX_EVENTS_PER_BATCH = 100;

/** Wire shape for `POST /v1/events` (REF_BACKEND.md §6.2). */
export const EventEnvelopeSchema = z.object({
  type: z.enum(EVENT_NAMES),
  gameId: z.string().optional(),
  clientTs: z.string(),
  props: z.record(z.string(), z.unknown()),
});
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export const EventBatchSchema = z.object({
  events: z.array(EventEnvelopeSchema).max(MAX_EVENTS_PER_BATCH),
});
export type EventBatch = z.infer<typeof EventBatchSchema>;
