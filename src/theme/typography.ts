import type { TextStyle } from 'react-native';

import { colors, fonts } from './tokens';

/**
 * Type scale (§17.5). Archivo Expanded Black for names, titles, headings and scores;
 * normal-width Archivo for everything else. Text is ink unless a component says otherwise.
 */
export const typography = {
  wordmark: { fontFamily: fonts.expandedBlack, fontSize: 22, lineHeight: 26, letterSpacing: -0.2 },
  display: { fontFamily: fonts.expandedBlack, fontSize: 30, lineHeight: 33, letterSpacing: -0.3 },
  title: { fontFamily: fonts.expandedBlack, fontSize: 26, lineHeight: 29 },
  score: { fontFamily: fonts.expandedBlack, fontSize: 34, lineHeight: 40, fontVariant: ['tabular-nums'] },
  scoreLarge: { fontFamily: fonts.expandedBlack, fontSize: 88, lineHeight: 92, fontVariant: ['tabular-nums'] },
  heroTitle: { fontFamily: fonts.expandedBlack, fontSize: 20, lineHeight: 22 },
  heading: { fontFamily: fonts.expandedBlack, fontSize: 18, lineHeight: 22 },
  cardTitle: { fontFamily: fonts.expandedBlack, fontSize: 15, lineHeight: 18 },
  cardTitleSm: { fontFamily: fonts.expandedBlack, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20 },
  bodySm: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.extraBold, fontSize: 14, lineHeight: 18 },
  labelSm: { fontFamily: fonts.extraBold, fontSize: 13, lineHeight: 18 },
  /** Active tab label and accent pills ("Play"): label size in Expanded Black. */
  labelStrong: { fontFamily: fonts.expandedBlack, fontSize: 13, lineHeight: 18 },
  tag: { fontFamily: fonts.black, fontSize: 12, lineHeight: 16, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Large display styles stop growing past this system font scale so cards keep their shape. */
export const MAX_DISPLAY_FONT_SCALE = 1.3;

export const defaultTextColor = colors.ink;
