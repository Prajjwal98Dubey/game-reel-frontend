import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { Sticker } from '@/components/Sticker';
import { brand } from '@/config/brand';
import { colors, type ColorToken } from '@/theme';

import type { BootPhase } from './bootstrap';

const STATUS: Record<BootPhase, string> = {
  connecting: 'Shuffling the deck…',
  dealing: 'Dealing your games…',
  ready: 'Ready!',
};

/** The three cards of the loader, dealt left to right in a loop. */
const CARDS: readonly { fill: ColorToken; tilt: number }[] = [
  { fill: 'mint', tilt: -8 },
  { fill: 'sun', tilt: 0 },
  { fill: 'sky', tilt: 8 },
];
const HOP_MS = 260;

function DealtCard({ index, fill, tilt, still }: { index: number; fill: ColorToken; tilt: number; still: boolean }) {
  const lift = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    lift.set(
      withDelay(
        index * 140,
        withRepeat(
          withSequence(
            withTiming(1, { duration: HOP_MS }),
            withTiming(0, { duration: HOP_MS }),
            withTiming(0, { duration: CARDS.length * 140 }),
          ),
          -1,
        ),
      ),
    );
  }, [index, lift, still]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateY: -14 * lift.get() }, { rotate: `${tilt * (1 - lift.get())}deg` }],
  }));

  return (
    <Animated.View style={motion}>
      <Sticker fill={fill} radius={8} shadow="sm" style={styles.card} />
    </Animated.View>
  );
}

function usePop(still: boolean): SharedValue<number> {
  const pop = useSharedValue(still ? 1 : 0.6);
  useEffect(() => {
    if (still) return;
    pop.set(withSequence(withTiming(1.08, { duration: 220 }), withTiming(1, { duration: 140 })));
  }, [pop, still]);
  return pop;
}

/**
 * Launch screen shown while the app gets ready (session, first reels, catalogue, thumbnails):
 * the logo pops onto the desk and a little deck of sticker cards deals itself as the loader.
 */
export function LaunchScreen({ phase }: { phase: BootPhase }) {
  const reduceMotion = useReducedMotion();
  const pop = usePop(reduceMotion);
  const logoMotion = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Loading ${brand.name}. ${STATUS[phase]}`}
    >
      <Animated.View style={logoMotion}>
        <BrandMark size="xl" />
      </Animated.View>
      <AppText variant="bodySm" tone="muted" style={styles.tagline}>
        {brand.tagline}
      </AppText>
      <View style={styles.deck}>
        {CARDS.map((c, i) => (
          <DealtCard key={c.fill} index={i} fill={c.fill} tilt={c.tilt} still={reduceMotion} />
        ))}
      </View>
      <AppText variant="labelSm">{STATUS[phase]}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground, padding: 24 },
  tagline: { marginTop: 18 },
  deck: { flexDirection: 'row', gap: 12, marginTop: 44, marginBottom: 22, height: 64, alignItems: 'flex-end' },
  card: { width: 34, height: 46 },
});
