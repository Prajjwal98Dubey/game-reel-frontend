import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme';

import { AppText } from './AppText';
import { Sticker } from './Sticker';
import { StickerButton } from './StickerButton';

type Props =
  | { kind: 'loading'; message?: string }
  | { kind: 'error'; message: string; onRetry: () => void }
  | { kind: 'empty'; message: string };

/** Loading, error and empty states: a plain sticker card on the desk. */
export function StateView(props: Props) {
  if (props.kind === 'loading') {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.ink} size="large" accessibilityLabel="Loading" />
        {props.message && <AppText tone="muted">{props.message}</AppText>}
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <Sticker radius={radius.row} shadow="sm" style={styles.card} contentStyle={styles.cardFace}>
        <AppText style={styles.center}>{props.message}</AppText>
        {props.kind === 'error' && <StickerButton label="Try again" icon="replay" onPress={props.onRetry} />}
      </Sticker>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.item, padding: space.gutter },
  card: { alignSelf: 'stretch' },
  cardFace: { padding: 20, gap: 16, alignItems: 'stretch' },
  center: { textAlign: 'center' },
});
