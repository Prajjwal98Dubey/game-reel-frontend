import { z } from 'zod';

/**
 * API contracts shared with the backend (REF_BACKEND.md §6).
 * When the monorepo lands, this folder moves to `packages/shared` unchanged.
 */

export const ControlSchema = z.enum(['tap', 'drag-x']);
export type Control = z.infer<typeof ControlSchema>;

export const GameManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  bundleUrl: z.url(),
  thumbnailUrl: z.url(),
  description: z.string(),
  tags: z.array(z.string()),
  controls: z.array(ControlSchema),
  avgRoundSeconds: z.number(),
  minAppVersion: z.string(),
  sdkVersion: z.number().int(),
  /** This player's best on the server; null if never played. */
  best: z.number().int().nullable().optional(),
});
export type GameManifest = z.infer<typeof GameManifestSchema>;

/** A page of catalogue results. Items are validated one by one so a single bad row never blanks the grid. */
export const GamesPageSchema = z.object({
  items: z.array(z.unknown()),
  nextCursor: z.string().nullable(),
});

export const GameFeedItemSchema = z.object({
  kind: z.literal('game'),
  game: GameManifestSchema,
});
/**
 * Feed items are a tagged union so new kinds (sponsored, daily) can be added without a breaking
 * change. The app renders only the kinds it knows and drops the rest.
 */
export const FeedItemSchema = z.discriminatedUnion('kind', [GameFeedItemSchema]);
export type FeedItem = z.infer<typeof FeedItemSchema>;

export const FeedPageSchema = z.object({
  items: z.array(z.unknown()),
  nextCursor: z.string().nullable(),
});

export const GuestRequestSchema = z.object({ deviceId: z.string().min(1) });
export type GuestRequest = z.infer<typeof GuestRequestSchema>;

export const GuestResponseSchema = z.object({
  playerId: z.string(),
  token: z.string(),
  expiresIn: z.number(),
});
export type GuestResponse = z.infer<typeof GuestResponseSchema>;

export const PlayRequestSchema = z.object({
  gameId: z.string(),
  gameVersion: z.string(),
  score: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  seed: z.number().int().optional(),
});
export type PlayRequest = z.infer<typeof PlayRequestSchema>;

export const PlayResponseSchema = z.object({
  best: z.number().int(),
  isNewBest: z.boolean(),
});
export type PlayResponse = z.infer<typeof PlayResponseSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.array(z.unknown()).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
