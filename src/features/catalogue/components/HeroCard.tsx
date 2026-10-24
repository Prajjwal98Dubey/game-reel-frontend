import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Sticker } from '@/components/Sticker';
import { Tag } from '@/components/Tag';
import type { GameManifest } from '@/shared';
import { radius } from '@/theme';

type Props = { game: GameManifest; onPress: (game: GameManifest) => void };

/**
 * Game of the day (§17.7 HeroCard): art fills the card, a sun "GAME OF THE DAY" tag top-left, a white
 * panel with name and one-line description bottom-left, a round accent Play button bottom-right.
 */
export function HeroCard({ game, onPress }: Props) {
  return (
    <Sticker
      radius={radius.hero}
      shadow="hero"
      clip
      style={styles.card}
      onPress={() => onPress(game)}
      accessibilityLabel={`Game of the day: ${game.name}. ${game.description}`}
      accessibilityHint="Opens the game"
    >
      <Image source={{ uri: game.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <Tag label="Game of the day" fill="sun" style={styles.tag} />
      <View style={styles.bottom} pointerEvents="none">
        <Sticker radius={radius.label} style={styles.panel} contentStyle={styles.panelFace}>
          <AppText variant="heroTitle" numberOfLines={1}>
            {game.name}
          </AppText>
          <AppText variant="bodySm" tone="muted" numberOfLines={1}>
            {game.description}
          </AppText>
        </Sticker>
        <Sticker fill="accent" radius={radius.pill} shadow="sm" style={styles.play} contentStyle={styles.playFace}>
          <Icon name="play" size={22} />
        </Sticker>
      </View>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  card: { height: 170 },
  tag: { position: 'absolute', left: 14, top: 14 },
  bottom: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  panel: { flex: 1, minWidth: 0 },
  panelFace: { paddingVertical: 8, paddingHorizontal: 12 },
  play: { width: 54, height: 54 },
  playFace: { alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
});
