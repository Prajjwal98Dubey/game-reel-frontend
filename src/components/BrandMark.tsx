import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { brand } from '@/config/brand';
import { typography } from '@/theme';

import { AppText } from './AppText';
import { Sticker } from './Sticker';

type Props = {
  /** `md` in screen headers, `xl` on the launch screen. */
  size?: 'md' | 'xl';
  style?: StyleProp<ViewStyle>;
};

/**
 * The logo: the brand name as a wordmark on a white sticker, tilted −2° (decorative, §17.3 rule 6).
 * The name comes from `brand.json`, so renaming the app changes every logo at once.
 */
export function BrandMark({ size = 'md', style }: Props) {
  const xl = size === 'xl';
  return (
    <Sticker
      radius={xl ? 22 : 12}
      shadow={xl ? 'lg' : 'sm'}
      style={[styles.tilt, style]}
      contentStyle={xl ? styles.faceXl : styles.face}
      accessibilityLabel={brand.name}
      accessibilityRole="header"
    >
      <AppText variant="wordmark" style={xl && styles.textXl}>
        {brand.wordmark}
      </AppText>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  tilt: { transform: [{ rotate: '-2deg' }] },
  face: { paddingVertical: 3, paddingHorizontal: 10 },
  faceXl: { paddingVertical: 10, paddingHorizontal: 26 },
  textXl: { fontSize: typography.scoreLarge.fontSize * 0.6, lineHeight: typography.scoreLarge.fontSize * 0.68 },
});
