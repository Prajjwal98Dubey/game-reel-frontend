import { Text, type TextProps } from 'react-native';

import { MAX_DISPLAY_FONT_SCALE, colors, typography, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  /** Text is ink by default; muted for secondary copy on surface/ground only (§17.4). */
  tone?: 'ink' | 'muted' | 'onInk';
};

const LARGE: ReadonlySet<TypographyVariant> = new Set([
  'display',
  'title',
  'score',
  'scoreLarge',
  'wordmark',
  'heroTitle',
]);

const TONES = { ink: colors.ink, muted: colors.inkMuted, onInk: colors.onInk } as const;

/** Text in the Sticker Deck type scale. Scales with the system font size (§12). */
export function AppText({ variant = 'body', tone = 'ink', style, ...rest }: Props) {
  return (
    <Text
      maxFontSizeMultiplier={LARGE.has(variant) ? MAX_DISPLAY_FONT_SCALE : undefined}
      style={[typography[variant], { color: TONES[tone] }, style]}
      {...rest}
    />
  );
}
