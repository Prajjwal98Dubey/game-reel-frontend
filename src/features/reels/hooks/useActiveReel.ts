import { useCallback } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useReelsStore } from '../store';

/** A page becomes active once at least this much of it is visible (FRONTEND.md §6.2). */
export const ACTIVE_VISIBLE_RATIO = 0.6;

/**
 * Active page for a vertical, full-page list. Between the two thresholds neither page is 60%
 * visible, so the previous active page is kept (hysteresis: no flicker mid-swipe).
 */
export function activeIndexForOffset(offsetY: number, pageHeight: number, count: number, previous: number): number {
  if (pageHeight <= 0 || count <= 0) return 0;
  const position = Math.max(0, offsetY) / pageHeight;
  const base = Math.floor(position);
  const fraction = position - base;
  let next = previous;
  if (1 - fraction >= ACTIVE_VISIBLE_RATIO) next = base;
  else if (fraction >= ACTIVE_VISIBLE_RATIO) next = base + 1;
  return Math.min(Math.max(next, 0), count - 1);
}

/** Scroll handler that keeps the reels store's activeIndex in sync with the list offset. */
export function useActiveReel(pageHeight: number, count: number) {
  const activeIndex = useReelsStore((s) => s.activeIndex);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { activeIndex: previous, setActiveIndex } = useReelsStore.getState();
      const next = activeIndexForOffset(e.nativeEvent.contentOffset.y, pageHeight, count, previous);
      if (next !== previous) setActiveIndex(next);
    },
    [pageHeight, count],
  );

  return { activeIndex, onScroll };
}
