import { colors, tagColor } from '..';

describe('Sticker Deck tokens', () => {
  it('maps tags to their colours and unknown tags to surface (§17.4)', () => {
    expect(tagColor('timing')).toBe('sun');
    expect(tagColor('reflex')).toBe('mint');
    expect(tagColor('drag')).toBe('sky');
    expect(tagColor('tap')).toBe('accent');
    expect(tagColor('one-tap')).toBe('accent');
    expect(tagColor('arcade')).toBe('surface');
  });

  it('keeps the documented palette', () => {
    expect(colors).toMatchObject({
      ground: '#E6EDFF',
      surface: '#FFFFFF',
      ink: '#15131C',
      inkMuted: '#4A4858',
      accent: '#FF5A36',
      sun: '#FFC93C',
      mint: '#3DD6A0',
      sky: '#7CA0FF',
      onInk: '#FFFFFF',
    });
  });
});
