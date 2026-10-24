import { useEffect, useRef } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ROUND_BUTTON, radius } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Sticker } from './Sticker';

type Props = {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  /** "On" state (liked): accent fill and a filled icon, with a small pop when it turns on (§17.9). */
  on?: boolean;
  /** Fills the icon without the accent fill (e.g. a saved bookmark). */
  filled?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Round 46×46 sticker button with one stroke icon (§17.7). */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  on = false,
  filled = false,
  disabled = false,
  accessibilityHint,
  style,
}: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasOn = useRef(on);
  const iconMotion = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  useEffect(() => {
    if (on && !wasOn.current && !reduceMotion) {
      scale.set(withSequence(withTiming(1.2, { duration: 90 }), withTiming(1, { duration: 90 })));
    }
    wasOn.current = on;
  }, [on, reduceMotion, scale]);

  return (
    <Sticker
      fill={on ? 'accent' : 'surface'}
      radius={radius.pill}
      shadow="sm"
      style={[styles.button, style]}
      contentStyle={styles.face}
      onPress={onPress ?? noop}
      disabled={disabled}
      haptic
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: on }}
    >
      <Animated.View style={iconMotion}>
        <Icon name={icon} size={icon === 'heart' ? 20 : 18} filled={on || filled} />
      </Animated.View>
    </Sticker>
  );
}

function noop() {}

const styles = StyleSheet.create({
  button: { width: ROUND_BUTTON, height: ROUND_BUTTON },
  face: { alignItems: 'center', justifyContent: 'center' },
});
