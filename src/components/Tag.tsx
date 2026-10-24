import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { ColorToken } from '@/theme';

import { AppText } from './AppText';
import { Sticker } from './Sticker';

type Props = {
  label: string;
  fill?: Extract<ColorToken, 'sun' | 'mint'>;
  /** Decorative tilt, −4° to +8° (§17.3 rule 6). */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
};

/** Decorative tilted label ("GAME OF THE DAY", "GAME OVER"). Not pressable. */
export function Tag({ label, fill = 'sun', rotate = -3, style }: Props) {
  return (
    <Sticker
      fill={fill}
      radius={10}
      style={[{ transform: [{ rotate: `${rotate}deg` }] }, styles.self, style]}
      contentStyle={styles.face}
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      <AppText variant="tag">{label}</AppText>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  face: { paddingVertical: 3, paddingHorizontal: 10 },
});
