/**
 * Sticker Deck design tokens (FRONTEND.md §17.10). Every colour, font, outline, radius, shadow
 * and spacing value in the app comes from here; no hex values or font names anywhere else.
 */

export const colors = {
  ground: '#E6EDFF',
  surface: '#FFFFFF',
  ink: '#15131C',
  inkMuted: '#4A4858',
  accent: '#FF5A36',
  sun: '#FFC93C',
  mint: '#3DD6A0',
  sky: '#7CA0FF',
  onInk: '#FFFFFF',
  /** Start/paused overlay: ink at 35% over the game art (§17.8). */
  dim: 'rgba(21, 19, 28, 0.35)',
} as const;

export type ColorToken = keyof typeof colors;

export const tagColors: Record<string, ColorToken> = {
  timing: 'sun',
  reflex: 'mint',
  drag: 'sky',
  tap: 'accent',
  'one-tap': 'accent',
};

/** Unknown tags render on `surface` (§17.4). */
export function tagColor(tag: string): ColorToken {
  return tagColors[tag] ?? 'surface';
}

export const fonts = {
  expandedBlack: 'ArchivoExpanded-Black',
  expandedExtraBold: 'ArchivoExpanded-ExtraBold',
  semiBold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extraBold: 'Archivo_800ExtraBold',
  black: 'Archivo_900Black',
} as const;

export const border = { lg: 2.5, sm: 2 } as const;

export const radius = { reel: 28, hero: 24, card: 18, row: 16, label: 14, labelSm: 8, thumb: 10, pill: 999 } as const;

/** Hard offset shadows: x = y = value, blur 0, colour = colors.ink. */
export const shadow = { lg: 6, md: 4, hero: 5, sm: 3, xs: 2 } as const;
export type ShadowToken = keyof typeof shadow;

export const space = { gutter: 16, section: 22, block: 16, item: 12, rowGap: 10, inner: 10 } as const;

/** Minimum touch target; round buttons are 46 (§17.6). */
export const HIT_SIZE = 44;
export const ROUND_BUTTON = 46;

/** Compact floating tab bar, close to the bottom edge (§17.7 TabBar). Screens pad content by `useTabBarClearance()`. */
export const tabBar = { height: 52, bottom: 10, tab: 42 } as const;
