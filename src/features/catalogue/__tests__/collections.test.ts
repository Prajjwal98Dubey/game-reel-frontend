import type { GameManifest } from '@/shared';

import { COLLECTIONS, controlLabel, findCollection, gameOfTheDay, matchesQuery } from '../collections';

const make = (id: string, controls: GameManifest['controls'], tags: string[] = []): GameManifest => ({
  id,
  name: id[0].toUpperCase() + id.slice(1),
  version: '1.0.0',
  bundleUrl: `https://cdn.example/${id}/index.html`,
  thumbnailUrl: `https://cdn.example/${id}/thumb.svg`,
  description: `${id} description`,
  tags,
  controls,
  avgRoundSeconds: 20,
  minAppVersion: '1.0.0',
  sdkVersion: 1,
});

const games = [
  make('stack', ['tap'], ['timing', 'one-tap']),
  make('catch', ['drag-x'], ['drag', 'arcade']),
  make('hop', ['tap'], ['reflex']),
  make('hybrid', ['tap', 'drag-x']),
];

describe('collections', () => {
  it('splits one-thumb (tap only) and drag games', () => {
    const oneThumb = findCollection('one-thumb')!;
    const drag = findCollection('drag')!;
    expect(games.filter(oneThumb.matches).map((g) => g.id)).toEqual(['stack', 'hop']);
    expect(games.filter(drag.matches).map((g) => g.id)).toEqual(['catch', 'hybrid']);
    expect(COLLECTIONS.map((c) => c.id)).toEqual(['one-thumb', 'drag']);
    expect(findCollection('nope')).toBeUndefined();
  });

  it('labels how a game is played', () => {
    expect(controlLabel(games[0])).toBe('One tap');
    expect(controlLabel(games[1])).toBe('Drag sideways');
  });
});

describe('gameOfTheDay', () => {
  it('is stable for a day regardless of list order', () => {
    const morning = new Date(2026, 9, 23, 8);
    const night = new Date(2026, 9, 23, 23);
    expect(gameOfTheDay(games, morning)).toBe(gameOfTheDay([...games].reverse(), night));
  });

  it('changes across days', () => {
    const picks = new Set(Array.from({ length: 14 }, (_, d) => gameOfTheDay(games, new Date(2026, 9, 1 + d))?.id));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('handles an empty catalogue', () => {
    expect(gameOfTheDay([])).toBeUndefined();
  });
});

describe('matchesQuery', () => {
  it('matches name, tag and description case-insensitively', () => {
    expect(matchesQuery(games[0], 'STA')).toBe(true);
    expect(matchesQuery(games[0], 'timing')).toBe(true);
    expect(matchesQuery(games[1], 'description')).toBe(true);
    expect(matchesQuery(games[1], 'zzz')).toBe(false);
    expect(matchesQuery(games[1], '   ')).toBe(true);
  });
});
