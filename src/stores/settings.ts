import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storageKeys, zustandStorage } from '@/services/storage';

type SettingsState = {
  /** Audio stays off until the player unmutes (FRONTEND.md §7.4). */
  muted: boolean;
  haptics: boolean;
  toggleMuted: () => void;
  setHaptics: (on: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      muted: true,
      haptics: true,
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      setHaptics: (haptics) => set({ haptics }),
    }),
    { name: storageKeys.settings, storage: zustandStorage },
  ),
);
