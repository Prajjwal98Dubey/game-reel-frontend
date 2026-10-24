import { Platform, TurboModuleRegistry } from 'react-native';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** The synchronous key-value API the app needs. Both backends below implement it. */
type KeyValueBackend = {
  readonly name: 'mmkv' | 'sqlite-kv';
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
};

/**
 * MMKV needs the Nitro native module, which development and store builds include but Expo Go
 * does not. Importing react-native-mmkv without it throws at import time, so check first.
 */
function hasNitro(): boolean {
  if (Platform.OS === 'web') return true; // MMKV's web build uses localStorage, no Nitro.
  return (
    (globalThis as { NitroModulesProxy?: unknown }).NitroModulesProxy != null ||
    TurboModuleRegistry.get('NitroModules') != null
  );
}

function createBackend(): KeyValueBackend {
  if (hasNitro()) {
    // Loaded lazily: a static import would crash Expo Go before this check runs.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = createMMKV({ id: 'game-reels' });
    return {
      name: 'mmkv',
      getString: (key) => mmkv.getString(key),
      set: (key, value) => mmkv.set(key, value),
      remove: (key) => {
        mmkv.remove(key);
      },
    };
  }
  // Expo Go fallback: expo-sqlite's key-value store ships in Expo Go and is also synchronous,
  // so stores still hydrate before the first render.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const kv = (require('expo-sqlite/kv-store') as typeof import('expo-sqlite/kv-store')).default;
  return {
    name: 'sqlite-kv',
    getString: (key) => kv.getItemSync(key) ?? undefined,
    set: (key, value) => kv.setItemSync(key, value),
    remove: (key) => {
      kv.removeItemSync(key);
    },
  };
}

/**
 * The single local store for the app (FRONTEND.md §8): MMKV in development and store builds,
 * expo-sqlite's key-value store in Expo Go. Everything persisted locally goes through here.
 */
export const storage: KeyValueBackend = createBackend();

export function getJSON<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setJSON(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  storage.remove(key);
}

const stateStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.remove(key),
};

/** Synchronous storage for Zustand `persist`, so stores are hydrated before first render. */
export const zustandStorage = createJSONStorage(() => stateStorage);

/** Every key the app writes, in one place to avoid collisions. */
export const storageKeys = {
  session: 'store.session',
  settings: 'store.settings',
  scores: 'store.scores',
  library: 'store.library',
  history: 'store.history',
  playsQueue: 'queue.plays',
  eventsQueue: 'queue.events',
} as const;
