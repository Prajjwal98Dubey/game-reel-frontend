import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Sticker } from '@/components/Sticker';
import { StickerButton } from '@/components/StickerButton';
import { Tag } from '@/components/Tag';
import { isEnabled } from '@/config/flags';
import { colors, radius } from '@/theme';

import type { RoundResult } from '../hooks/useGameSession';
import { NO_INSETS, type OverlayInsets } from './overlayInsets';

/** Lets the game's final moment (falling blocks, crash) show before the card covers it (§17.9). */
export const REVEAL_DELAY_MS = 350;
const REVEAL_MS = 200;
const SLIDE_PX = 24;

type Props = {
  gameName: string;
  result: RoundResult;
  onRetry: () => void;
  /** Reels only: "Swipe up for the next game" under the card. */
  showSwipeHint?: boolean;
  disabled?: boolean;
  insets?: OverlayInsets;
};

export function bestLine(result: RoundResult): string | null {
  if (result.isNewBest || result.previousBest == null) return null;
  const gap = result.best - result.score;
  return gap <= 0 ? 'Matched your best' : `${gap} away from your best`;
}

/**
 * Game over: a white sticker card tilted −1.5° with a mint "GAME OVER" tag on its edge, the score
 * in `scoreLarge`, best-score feedback, then Play again / Dare a friend (§17.8).
 */
export function ResultOverlay({
  gameName,
  result,
  onRetry,
  showSwipeHint = false,
  disabled,
  insets = NO_INSETS,
}: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const dareEnabled = isEnabled('dareLinks');
  const comparison = bestLine(result);

  useEffect(() => {
    progress.set(withDelay(REVEAL_DELAY_MS, withTiming(1, { duration: REVEAL_MS })));
    const t = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(
        `Game over. Score ${result.score}. ${result.isNewBest ? 'New best!' : (comparison ?? `Best ${result.best}`)}`,
      );
    }, REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [progress, result.score, result.best, result.isNewBest, comparison]);

  const motion = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.get()) * SLIDE_PX }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.veil, { paddingTop: insets.top, paddingBottom: insets.bottom }, motion]}
    >
      <Sticker radius={24} shadow="lg" style={styles.card} contentStyle={styles.cardFace}>
        <Tag label="Game over" fill="mint" rotate={-4} style={styles.tag} />
        <AppText variant="bodySm" tone="muted">
          {gameName} · your score
        </AppText>
        <AppText
          variant="scoreLarge"
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`Score ${result.score}`}
        >
          {result.score}
        </AppText>
        <View style={styles.bestRow}>
          {result.isNewBest ? (
            <Tag label="New best!" fill="sun" rotate={-3} />
          ) : (
            <>
              <Sticker fill="sun" radius={radius.pill} border="sm" contentStyle={styles.pill}>
                <AppText variant="labelSm">Best {result.best}</AppText>
              </Sticker>
              {comparison && (
                <AppText variant="bodySm" tone="muted" style={styles.flex}>
                  {comparison}
                </AppText>
              )}
            </>
          )}
        </View>
        <View style={styles.actions}>
          <StickerButton label="Play again" icon="replay" onPress={onRetry} disabled={disabled} />
          <StickerButton
            label={dareEnabled ? 'Dare a friend' : 'Dare a friend · soon'}
            icon="share"
            variant="secondary"
            onPress={noop}
            disabled={!dareEnabled}
            accessibilityLabel={dareEnabled ? 'Dare a friend' : 'Dare a friend, coming soon'}
          />
        </View>
      </Sticker>
      {showSwipeHint && (
        <Sticker radius={radius.pill} border="sm" style={styles.hint} contentStyle={styles.hintFace}>
          <Icon name="chevronUp" size={18} />
          <AppText variant="labelSm">Swipe up for the next game</AppText>
        </Sticker>
      )}
    </Animated.View>
  );
}

function noop() {}

const styles = StyleSheet.create({
  veil: { backgroundColor: colors.dim, justifyContent: 'center', paddingHorizontal: 24, gap: 18 },
  card: { transform: [{ rotate: '-1.5deg' }] },
  cardFace: { paddingTop: 26, paddingHorizontal: 20, paddingBottom: 20 },
  tag: { position: 'absolute', left: 18, top: -18 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, minHeight: 28 },
  pill: { paddingVertical: 3, paddingHorizontal: 10 },
  flex: { flex: 1 },
  actions: { marginTop: 18, gap: 10 },
  hint: { alignSelf: 'center' },
  hintFace: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
});
