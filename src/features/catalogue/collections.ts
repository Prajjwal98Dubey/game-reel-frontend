import type { GameManifest } from '@/shared';

/** A titled, filtered slice of the catalogue: a row on the Catalogue tab and its "See all" list. */
export type Collection = { id: string; title: string; matches: (game: GameManifest) => boolean };

/** MVP rows (FRONTEND.md §6.1). */
export const COLLECTIONS: readonly Collection[] = [
  {
    id: 'one-thumb',
    title: 'One-thumb games',
    matches: (g) => g.controls.length === 1 && g.controls[0] === 'tap',
  },
  {
    id: 'drag',
    title: 'Drag games',
    matches: (g) => g.controls.includes('drag-x'),
  },
];

export function findCollection(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

/** How a game is played, for row subtitles ("Drag sideways · Best 31"). */
export function controlLabel(game: GameManifest): string {
  return game.controls.includes('drag-x') ? 'Drag sideways' : 'One tap';
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Game of the day, picked on the client in the MVP: stable for a calendar day (local time) and
 * independent of the order the API returns games in. Later this comes from the API.
 */
export function gameOfTheDay(games: readonly GameManifest[], date: Date = new Date()): GameManifest | undefined {
  if (!games.length) return undefined;
  const sorted = [...games].sort((a, b) => a.id.localeCompare(b.id));
  let hash = 2166136261;
  for (const ch of dayKey(date)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return sorted[hash % sorted.length];
}

/** Case-insensitive match on name, tags and description. */
export function matchesQuery(game: GameManifest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    game.name.toLowerCase().includes(q) ||
    game.tags.some((t) => t.toLowerCase().includes(q)) ||
    game.description.toLowerCase().includes(q)
  );
}
