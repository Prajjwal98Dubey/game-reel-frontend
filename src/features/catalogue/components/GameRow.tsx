import { ScrollView, StyleSheet } from 'react-native';

import type { GameManifest } from '@/shared';
import { space } from '@/theme';

import { GameCardTall } from './GameCardTall';

type Props = { games: GameManifest[]; onPress: (game: GameManifest) => void; accessibilityLabel: string };

/**
 * Horizontal row of tall cards (§17.7 GameRow). It runs to the right edge of the screen with no
 * right padding at rest, so the cut-off card reads as "scroll for more".
 */
export function GameRow({ games, onPress, accessibilityLabel }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      accessibilityLabel={accessibilityLabel}
    >
      {games.map((g) => (
        <GameCardTall key={g.id} game={g} onPress={onPress} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A horizontal ScrollView otherwise grows to fill the column.
  scroller: { flexGrow: 0, marginRight: -space.gutter },
  // Room below for the cards' hard shadows, which the scroll view would otherwise clip.
  row: { gap: space.item, paddingRight: space.gutter, paddingBottom: 6, alignItems: 'flex-start' },
});
