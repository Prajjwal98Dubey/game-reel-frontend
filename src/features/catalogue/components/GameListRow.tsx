import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Sticker } from '@/components/Sticker';
import type { GameManifest } from '@/shared';
import { useBestScore } from '@/stores/scores';
import { border, colors, radius } from '@/theme';

import { controlLabel } from '../collections';

type Props = { game: GameManifest; onPress: (game: GameManifest) => void };

/**
 * List row (§17.7 RecentRow): 44×44 thumbnail, name, "<control> · Best <n>", accent Play pill.
 * Used for Recently played, search results and "See all" lists.
 */
export const GameListRow = memo(function GameListRow({ game, onPress }: Props) {
  const best = useBestScore(game.id, game.best);
  const subtitle = best != null ? `${controlLabel(game)} · Best ${best}` : controlLabel(game);

  return (
    <Sticker
      radius={radius.row}
      shadow="sm"
      contentStyle={styles.face}
      onPress={() => onPress(game)}
      accessibilityLabel={`${game.name}. ${subtitle}. Play`}
    >
      <View style={styles.thumb}>
        <Image
          source={{ uri: game.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={game.id}
        />
      </View>
      <View style={styles.text}>
        <AppText variant="cardTitle" numberOfLines={1}>
          {game.name}
        </AppText>
        <AppText variant="bodySm" tone="muted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Sticker fill="accent" radius={radius.pill} border="sm" contentStyle={styles.pill}>
        <AppText variant="labelStrong">Play</AppText>
      </Sticker>
    </Sticker>
  );
});

const styles = StyleSheet.create({
  face: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingLeft: 8, paddingRight: 10 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.thumb,
    borderWidth: border.sm,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  text: { flex: 1, minWidth: 0 },
  pill: { paddingVertical: 6, paddingHorizontal: 14 },
});
