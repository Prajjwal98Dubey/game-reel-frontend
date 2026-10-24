import { z } from 'zod';

/**
 * App <-> game bridge protocol (FRONTEND.md §7.2).
 * The in-bundle side lives in `game-sdk/runtime.js` and must speak the same version.
 */

export const BRIDGE_VERSION = 1;
export const SUPPORTED_SDK_VERSIONS: readonly number[] = [1];

export const GameToAppSchema = z.discriminatedUnion('type', [
  z.object({ v: z.literal(1), type: z.literal('ready') }),
  z.object({ v: z.literal(1), type: z.literal('started') }),
  z.object({ v: z.literal(1), type: z.literal('score'), score: z.number() }),
  z.object({
    v: z.literal(1),
    type: z.literal('gameOver'),
    score: z.number(),
    durationMs: z.number(),
    seed: z.number().optional(),
  }),
  z.object({ v: z.literal(1), type: z.literal('error'), message: z.string() }),
]);
export type GameToApp = z.infer<typeof GameToAppSchema>;

export type AppToGame =
  | { v: 1; type: 'start'; seed?: number }
  | { v: 1; type: 'tap' }
  | { v: 1; type: 'pause' }
  | { v: 1; type: 'resume' }
  | { v: 1; type: 'reset' }
  | { v: 1; type: 'setMuted'; muted: boolean };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type AppToGameCommand = DistributiveOmit<AppToGame, 'v'>;
