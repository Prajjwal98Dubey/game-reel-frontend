/**
 * At most 3 live WebViews: previous, current and next (FRONTEND.md §6.2, §11).
 * WebView memory is the main performance risk, so every other page shows a thumbnail.
 */
export const POOL_RADIUS = 1;
export const MAX_LIVE_PLAYERS = POOL_RADIUS * 2 + 1;

export function isInPool(index: number, activeIndex: number): boolean {
  return Math.abs(index - activeIndex) <= POOL_RADIUS;
}

export function usePlayerPool(activeIndex: number) {
  return (index: number) => isInPool(index, activeIndex);
}
