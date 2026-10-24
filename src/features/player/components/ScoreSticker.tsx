import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Sticker } from '@/components/Sticker';

type Props = { score: number; top: number };

/** White pill with the live score, tilted −3°, centred near the top of the screen (§17.7). */
export function ScoreSticker({ score, top }: Props) {
  return (
    <View pointerEvents="none" style={[styles.row, { top }]}>
      <Sticker radius={16} style={styles.sticker} contentStyle={styles.face}>
        <AppText variant="score" accessibilityLiveRegion="polite" accessibilityLabel={`Score ${score}`}>
          {score}
        </AppText>
      </Sticker>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  sticker: { transform: [{ rotate: '-3deg' }] },
  face: { paddingVertical: 2, paddingHorizontal: 20, minWidth: 64, alignItems: 'center' },
});
