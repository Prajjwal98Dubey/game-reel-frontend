import type { GameManifest } from '@/shared';

/** Each distinct game once, in first-seen order. */
export function uniqueGames(games: readonly GameManifest[]): GameManifest[] {
  const seen = new Set<string>();
  return games.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
}

/**
 * One more lap of the feed once the server has nothing new: every known game in a fresh random
 * order (Fisher–Yates), never starting with the game the player is already looking at, so the same
 * game never appears twice in a row and laps are not predictable.
 */
export function reshuffle(
  games: readonly GameManifest[],
  avoidFirstId: string | undefined,
  random: () => number = Math.random,
): GameManifest[] {
  const deck = uniqueGames(games);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  if (deck.length > 1 && deck[0].id === avoidFirstId) {
    const k = 1 + Math.floor(random() * (deck.length - 1));
    [deck[0], deck[k]] = [deck[k], deck[0]];
  }
  return deck;
}
