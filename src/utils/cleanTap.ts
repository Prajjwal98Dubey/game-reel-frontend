/** Gesture rule 2 (FRONTEND.md §6.4): a start or retry needs a clean tap. */
export const CLEAN_TAP_MAX_MOVE_PX = 10;
export const CLEAN_TAP_MAX_MS = 500;

export type TouchSample = { x: number; y: number; t: number };

export function isCleanTap(down: TouchSample, up: TouchSample): boolean {
  const moved = Math.hypot(up.x - down.x, up.y - down.y);
  return moved < CLEAN_TAP_MAX_MOVE_PX && up.t - down.t < CLEAN_TAP_MAX_MS;
}
