import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { NameLabel } from '@/components/NameLabel';
import { Sticker } from '@/components/Sticker';
import type { GameManifest } from '@/shared';
import { useBestScore } from '@/stores/scores';
import { radius } from '@/theme';

type Props = { game: GameManifest; onPress: (game: GameManifest) => void };

/** 112×140 card: art fills it, white name label bottom-left (§17.7 GameCardTall). */
export const GameCardTall = memo(function GameCardTall({ game, onPress }: Props) {
  const best = useBestScore(game.id, game.best);
  return (
    <Sticker
      radius={radius.card}
      shadow="sm"
      clip
      style={styles.card}
      onPress={() => onPress(game)}
      accessibilityLabel={`${game.name}. ${game.tags.join(', ')}.${best != null ? ` Best ${best}.` : ''}`}
      accessibilityHint="Opens the game"
    >
      <Image
        source={{ uri: game.thumbnailUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={150}
        recyclingKey={game.id}
      />
      <NameLabel name={game.name} />
    </Sticker>
  );
});

const styles = StyleSheet.create({
  card: { width: 112, height: 140 },
});
