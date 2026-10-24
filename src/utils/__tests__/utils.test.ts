import { isCleanTap } from '../cleanTap';
import { compareVersions, satisfiesMin } from '../semver';

describe('compareVersions', () => {
  it('orders dotted versions numerically', () => {
    expect(compareVersions('1.2.0', '1.10.0')).toBe(-1);
    expect(compareVersions('2.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.2.0-beta.1', '1.2.0')).toBe(0);
  });

  it('checks a minimum app version', () => {
    expect(satisfiesMin('1.0.0', '1.0.0')).toBe(true);
    expect(satisfiesMin('1.0.0', '1.1.0')).toBe(false);
  });
});

describe('isCleanTap', () => {
  const down = { x: 100, y: 100, t: 0 };

  it('accepts a short, still tap', () => {
    expect(isCleanTap(down, { x: 105, y: 104, t: 120 })).toBe(true);
  });

  it('rejects a swipe', () => {
    expect(isCleanTap(down, { x: 100, y: 60, t: 120 })).toBe(false);
  });

  it('rejects a long press', () => {
    expect(isCleanTap(down, { x: 100, y: 100, t: 600 })).toBe(false);
  });
});
