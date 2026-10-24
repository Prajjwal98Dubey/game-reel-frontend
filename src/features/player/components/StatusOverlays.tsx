import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Sticker } from '@/components/Sticker';
import { StickerButton } from '@/components/StickerButton';
import { colors, radius } from '@/theme';

/**
 * Thumbnail shown until the bundle reports `ready`, so there is never a blank flash. Before the
 * thumbnail itself loads, the card shows its plain surface fill (§17.4).
 */
export function LoadingOverlay({ thumbnailUrl }: { thumbnailUrl: string }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none">
      <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Sticker radius={radius.pill} shadow="sm" style={styles.spinner} contentStyle={styles.center}>
          <ActivityIndicator color={colors.ink} accessibilityLabel="Loading game" />
        </Sticker>
      </View>
    </View>
  );
}

export function ErrorOverlay({ onRetry, disabled }: { onRetry: () => void; disabled?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.surface, styles.center, styles.pad]}>
      <Sticker radius={24} shadow="sm" style={styles.card} contentStyle={styles.cardFace}>
        <Icon name="alert" size={28} />
        <AppText variant="heading" style={styles.text}>
          Couldn&apos;t load this game
        </AppText>
        <AppText variant="bodySm" tone="muted" style={styles.text}>
          Check your connection and try again.
        </AppText>
        <StickerButton label="Try again" icon="replay" onPress={onRetry} disabled={disabled} style={styles.button} />
      </Sticker>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: colors.surface },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 20 },
  spinner: { width: 56, height: 56 },
  card: { alignSelf: 'stretch' },
  cardFace: { padding: 20, gap: 8, alignItems: 'center' },
  text: { textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: 10 },
});
