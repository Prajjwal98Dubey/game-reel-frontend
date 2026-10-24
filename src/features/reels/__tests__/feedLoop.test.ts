import type { GameManifest } from '@/shared';

import { reshuffle, uniqueGames } from '../feedLoop';

const game = (id: string) => ({ id }) as GameManifest;
const games = ['stack', 'hop', 'pop', 'catch', 'bullseye'].map(game);

/** Deterministic random source for tests. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

describe('uniqueGames', () => {
  it('keeps the first of each game', () => {
    expect(uniqueGames([...games, game('hop'), game('stack')]).map((g) => g.id)).toEqual(games.map((g) => g.id));
  });
});

describe('reshuffle', () => {
  it('deals every known game exactly once per lap', () => {
    const lap = reshuffle([...games, ...games], undefined, seeded(1));
    expect(lap.map((g) => g.id).sort()).toEqual(games.map((g) => g.id).sort());
  });

  it('never starts a lap with the game the player is on', () => {
    for (let s = 0; s < 200; s++) {
      const lap = reshuffle(games, 'pop', seeded(s));
      expect(lap[0].id).not.toBe('pop');
    }
  });

  it('produces different orders across laps', () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, s) =>
        reshuffle(games, undefined, seeded(s))
          .map((g) => g.id)
          .join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(10);
  });

  it('handles one or zero games', () => {
    expect(reshuffle([game('solo')], 'solo').map((g) => g.id)).toEqual(['solo']);
    expect(reshuffle([], undefined)).toEqual([]);
  });
});
