import { useEffect } from 'react';
import { AppState } from 'react-native';

import { flushAnalytics, identify } from '@/services/analytics';
import { flushPlays } from '@/services/api';
import { useSessionStore } from '@/stores/session';

/**
 * App-wide background work: retries queued plays when the app comes to the foreground,
 * flushes analytics when it leaves, and identifies the guest to analytics once known.
 */
export function useAppLifecycle(): void {
  useEffect(() => {
    void flushPlays();
    void flushAnalytics();

    const appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') void flushPlays();
      else if (status === 'background') void flushAnalytics();
    });

    const initial = useSessionStore.getState().playerId;
    if (initial) identify(initial);
    const unsubscribe = useSessionStore.subscribe((s, prev) => {
      if (s.playerId && s.playerId !== prev.playerId) identify(s.playerId);
    });

    return () => {
      appState.remove();
      unsubscribe();
    };
  }, []);
}
