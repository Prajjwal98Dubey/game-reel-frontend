import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storageKeys, zustandStorage } from '@/services/storage';

/** How many games "Recently played" remembers. */
export const MAX_RECENT = 10;

export type RecentPlay = { gameId: string; playedAt: number };

type HistoryState = {
  /** Most recent first, one entry per game. */
  recent: RecentPlay[];
  recordPlay: (gameId: string) => void;
};

/** Local play history behind the Catalogue's "Recently played" rows (FRONTEND.md §6.1). */
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      recent: [],
      recordPlay: (gameId) =>
        set((s) => ({
          recent: [{ gameId, playedAt: Date.now() }, ...s.recent.filter((r) => r.gameId !== gameId)].slice(
            0,
            MAX_RECENT,
          ),
        })),
    }),
    { name: storageKeys.history, storage: zustandStorage },
  ),
);
