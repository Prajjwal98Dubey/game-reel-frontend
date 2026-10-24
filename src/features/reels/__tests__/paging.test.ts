import { activeIndexForOffset } from '../hooks/useActiveReel';
import { MAX_LIVE_PLAYERS, isInPool } from '../hooks/usePlayerPool';

const H = 800;

describe('activeIndexForOffset', () => {
  it('keeps the current page until the next one is 60% visible', () => {
    expect(activeIndexForOffset(0, H, 10, 0)).toBe(0);
    expect(activeIndexForOffset(H * 0.3, H, 10, 0)).toBe(0);
    // 50/50: neither page is 60% visible, so the previous one stays active.
    expect(activeIndexForOffset(H * 0.5, H, 10, 0)).toBe(0);
    expect(activeIndexForOffset(H * 0.6, H, 10, 0)).toBe(1);
  });

  it('has hysteresis when scrolling back', () => {
    expect(activeIndexForOffset(H * 0.5, H, 10, 1)).toBe(1);
    expect(activeIndexForOffset(H * 0.4, H, 10, 1)).toBe(0);
  });

  it('clamps to the list bounds', () => {
    expect(activeIndexForOffset(-50, H, 10, 0)).toBe(0);
    expect(activeIndexForOffset(H * 20, H, 3, 2)).toBe(2);
    expect(activeIndexForOffset(100, 0, 3, 2)).toBe(0);
  });
});

describe('player pool', () => {
  it('keeps exactly previous, current and next live', () => {
    const live = Array.from({ length: 10 }, (_, i) => i).filter((i) => isInPool(i, 5));
    expect(live).toEqual([4, 5, 6]);
    expect(live).toHaveLength(MAX_LIVE_PLAYERS);
  });

  it('has only two live players at the start of the feed', () => {
    expect([0, 1, 2].filter((i) => isInPool(i, 0))).toEqual([0, 1]);
  });
});
