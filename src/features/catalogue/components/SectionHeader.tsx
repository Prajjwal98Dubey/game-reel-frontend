import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { HIT_SIZE, space } from '@/theme';

type Props = { title: string; onSeeAll?: () => void };

/** Section heading with an optional "See all" link (§17.8). */
export function SectionHeader({ title, onSeeAll }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="link"
          accessibilityLabel={`See all ${title}`}
          hitSlop={{ top: (HIT_SIZE - 18) / 2, bottom: (HIT_SIZE - 18) / 2, left: 8, right: 8 }}
        >
          <AppText variant="labelSm" style={styles.link}>
            See all
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: space.section,
    marginBottom: space.item,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.item,
  },
  title: { flexShrink: 1 },
  link: { textDecorationLine: 'underline' },
});
