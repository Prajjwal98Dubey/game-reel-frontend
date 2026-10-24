import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Sticker } from '@/components/Sticker';
import type { Control } from '@/shared';
import { border, colors, radius } from '@/theme';

import { NO_INSETS, type OverlayInsets } from './overlayInsets';
import { TapSurface } from './TapSurface';

/** How the game is controlled once the round starts. */
export function controlHint(controls: Control[]): string {
  return controls.includes('drag-x') ? 'Drag sideways to move' : 'Tap the game to play';
}

type ButtonProps = {
  title: string;
  hint: string;
  onTap: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  insets: OverlayInsets;
};

/**
 * A small start sticker centred on the game (§17.8): an accent play disc beside the title and a
 * one-line control hint. Only the sticker is tappable, and only on a clean tap (gesture rule 2);
 * the rest of the game stays visible and swipes go to the feed.
 */
function PlayButton({ title, hint, onTap, disabled, accessibilityLabel, insets }: ButtonProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <TapSurface onTap={onTap} disabled={disabled} accessibilityLabel={accessibilityLabel} accessibilityHint={hint}>
        <Sticker radius={20} shadow="sm" contentStyle={styles.face}>
          <View style={styles.disc}>
            <Icon name="play" size={22} />
          </View>
          <View>
            <AppText variant="cardTitle">{title}</AppText>
            <AppText variant="bodySm" tone="muted">
              {hint}
            </AppText>
          </View>
        </Sticker>
      </TapSurface>
    </View>
  );
}

export function StartOverlay({
  controls,
  onStart,
  disabled,
  insets = NO_INSETS,
}: {
  controls: Control[];
  onStart: () => void;
  disabled?: boolean;
  insets?: OverlayInsets;
}) {
  return (
    <PlayButton
      title="Tap to play"
      hint={controlHint(controls)}
      onTap={onStart}
      disabled={disabled}
      accessibilityLabel="Tap to play"
      insets={insets}
    />
  );
}

export function PausedOverlay({
  onResume,
  disabled,
  insets = NO_INSETS,
}: {
  onResume: () => void;
  disabled?: boolean;
  insets?: OverlayInsets;
}) {
  return (
    <PlayButton
      title="Paused"
      hint="Tap to resume"
      onTap={onResume}
      disabled={disabled}
      accessibilityLabel="Paused. Tap to resume"
      insets={insets}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  face: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 10, paddingRight: 18 },
  disc: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: border.sm,
    borderColor: colors.ink,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
});
