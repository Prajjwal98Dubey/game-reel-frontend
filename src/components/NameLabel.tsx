import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme';

import { AppText } from './AppText';
import { Sticker } from './Sticker';

type Props = { name: string; style?: StyleProp<ViewStyle> };

/** White name label sitting on game art, 8 px from the bottom-left corner of a card (§17.7). */
export function NameLabel({ name, style }: Props) {
  return (
    <Sticker radius={radius.labelSm} border="sm" style={[styles.pos, style]} contentStyle={styles.face}>
      <AppText variant="cardTitleSm" numberOfLines={1}>
        {name}
      </AppText>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  pos: { position: 'absolute', left: 8, bottom: 8, maxWidth: '85%' },
  face: { paddingVertical: 2, paddingHorizontal: 8 },
});
