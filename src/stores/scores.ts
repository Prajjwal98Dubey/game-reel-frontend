import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storageKeys, zustandStorage } from '@/services/storage';

type ScoresState = {
  bestByGame: Record<string, number>;
  /** Records a finished round locally and reports whether it beat the previous best. */
  recordScore: (gameId: string, score: number) => { isNewBest: boolean; previousBest: number | null };
  /** Takes the higher of the local and server best (e.g. from a manifest or a play response). */
  mergeBest: (gameId: string, best: number | null | undefined) => void;
};

export const useScoresStore = create<ScoresState>()(
  persist(
    (set, get) => ({
      bestByGame: {},
      recordScore: (gameId, score) => {
        const previousBest = get().bestByGame[gameId] ?? null;
        const isNewBest = previousBest == null ? score > 0 : score > previousBest;
        if (previousBest == null || score > previousBest) {
          set((s) => ({ bestByGame: { ...s.bestByGame, [gameId]: score } }));
        }
        return { isNewBest, previousBest };
      },
      mergeBest: (gameId, best) => {
        if (best == null) return;
        const current = get().bestByGame[gameId];
        if (current == null || best > current) {
          set((s) => ({ bestByGame: { ...s.bestByGame, [gameId]: best } }));
        }
      },
    }),
    { name: storageKeys.scores, storage: zustandStorage },
  ),
);

export function useBestScore(gameId: string, serverBest?: number | null): number | null {
  const local = useScoresStore((s) => s.bestByGame[gameId]);
  if (local == null) return serverBest ?? null;
  return serverBest != null ? Math.max(local, serverBest) : local;
}
