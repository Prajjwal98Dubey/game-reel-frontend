import { StyleSheet } from 'react-native';

import { HIT_SIZE, radius, tagColor } from '@/theme';

import { AppText } from './AppText';
import { Sticker } from './Sticker';

type Props = {
  label: string;
  /** Picks the fill from the tag colour map (§17.4). Defaults to `label`. */
  tag?: string;
  /** Selected "All" chip: ink fill, white text. */
  selected?: boolean;
  /** Without onPress the chip is a static tag. */
  onPress?: () => void;
  /** `sm` is the compact tag row under a reel; `md` is the spec'd 6×13 pill. */
  size?: 'sm' | 'md';
};

/** Pill with a thin ink outline, filled by tag colour (§17.7). */
export function Chip({ label, tag, selected = false, onPress, size = 'md' }: Props) {
  return (
    <Sticker
      fill={selected ? 'ink' : tagColor(tag ?? label.replace(/^#/, ''))}
      radius={radius.pill}
      border="sm"
      contentStyle={size === 'md' ? styles.md : styles.sm}
      onPress={onPress}
      accessibilityLabel={onPress ? label : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      style={onPress ? styles.hit : undefined}
    >
      <AppText variant="labelSm" tone={selected ? 'onInk' : 'ink'} style={size === 'sm' && styles.smText}>
        {label}
      </AppText>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  md: { paddingVertical: 6, paddingHorizontal: 13 },
  sm: { paddingVertical: 3, paddingHorizontal: 10 },
  smText: { fontSize: 12, lineHeight: 16 },
  hit: { minHeight: HIT_SIZE - 12, justifyContent: 'center' },
});
