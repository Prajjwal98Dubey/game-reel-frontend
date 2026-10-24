import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Sticker } from '@/components/Sticker';

import type { Feedback } from '../hooks/useGameSession';

const POP_MS = 220;
const HOLD_MS = 900;
const FADE_MS = 200;

/**
 * A sun sticker ("New best!", later "PERFECT!") that pops over the game: scale 0.6 → 1.08 → 1 with a
 * small rotation, then fades after 900 ms (§17.9). Reduced motion: a plain fade.
 */
export function FeedbackSticker({ feedback }: { feedback: Feedback }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(feedback.label);
    if (reduceMotion) {
      scale.set(1);
      opacity.set(
        withSequence(withTiming(1, { duration: 120 }), withDelay(HOLD_MS, withTiming(0, { duration: FADE_MS }))),
      );
      return;
    }
    scale.set(0.6);
    scale.set(withSequence(withTiming(1.08, { duration: POP_MS * 0.6 }), withTiming(1, { duration: POP_MS * 0.4 })));
    opacity.set(
      withSequence(withTiming(1, { duration: 80 }), withDelay(HOLD_MS, withTiming(0, { duration: FADE_MS }))),
    );
  }, [feedback.id, feedback.label, opacity, reduceMotion, scale]);

  const motion = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }, { rotate: `${8 - (scale.get() - 0.6) * 5}deg` }],
  }));

  return (
    <View pointerEvents="none" style={styles.anchor}>
      <Animated.View style={motion}>
        <Sticker fill="sun" radius={10} contentStyle={styles.face}>
          <AppText variant="cardTitleSm">{feedback.label}</AppText>
        </Sticker>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', top: '36%', left: 0, right: 0, alignItems: 'center' },
  face: { paddingVertical: 4, paddingHorizontal: 10 },
});
