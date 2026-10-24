import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storageKeys, zustandStorage } from '@/services/storage';

type SessionState = {
  /** Random ID generated on first launch; identifies this install as a guest. */
  deviceId: string;
  playerId: string | null;
  token: string | null;
  /** Epoch ms after which the token must be refreshed. */
  tokenExpiresAt: number | null;
  setSession: (s: { playerId: string; token: string; expiresInSec: number }) => void;
  clearToken: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      deviceId: Crypto.randomUUID(),
      playerId: null,
      token: null,
      tokenExpiresAt: null,
      setSession: ({ playerId, token, expiresInSec }) =>
        set({ playerId, token, tokenExpiresAt: Date.now() + expiresInSec * 1000 }),
      clearToken: () => set({ token: null, tokenExpiresAt: null }),
    }),
    { name: storageKeys.session, storage: zustandStorage },
  ),
);

/** A token is usable if it exists and has more than a minute left. */
export function hasValidToken(state: Pick<SessionState, 'token' | 'tokenExpiresAt'>): boolean {
  return state.token != null && (state.tokenExpiresAt ?? 0) - Date.now() > 60_000;
}
