import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { track } from '@/services/analytics';
import { storageKeys, zustandStorage } from '@/services/storage';

/**
 * Local likes and saves. Stored as `gameId -> timestamp` maps (JSON-friendly sets).
 * Each toggle is also sent as an event so the backend can use it for the feed later.
 */
type LibraryState = {
  liked: Record<string, number>;
  saved: Record<string, number>;
  toggleLike: (gameId: string) => boolean;
  toggleSave: (gameId: string) => boolean;
};

function toggle(map: Record<string, number>, id: string): [Record<string, number>, boolean] {
  const next = { ...map };
  if (next[id] != null) {
    delete next[id];
    return [next, false];
  }
  next[id] = Date.now();
  return [next, true];
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: {},
      saved: {},
      toggleLike: (gameId) => {
        const [liked, on] = toggle(get().liked, gameId);
        set({ liked });
        track(on ? 'game_like' : 'game_unlike', { gameId });
        return on;
      },
      toggleSave: (gameId) => {
        const [saved, on] = toggle(get().saved, gameId);
        set({ saved });
        track(on ? 'game_save' : 'game_unsave', { gameId });
        return on;
      },
    }),
    {
      name: storageKeys.library,
      storage: zustandStorage,
      partialize: (s) => ({ liked: s.liked, saved: s.saved }),
    },
  ),
);
