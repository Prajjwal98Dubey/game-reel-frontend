import { StyleSheet, TextInput } from 'react-native';

import { colors, radius, typography } from '@/theme';

import { Icon } from './Icon';
import { Sticker } from './Sticker';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/** Height 50, surface fill, radius 16, small hard shadow; search icon + input (§17.7). */
export function SearchField({ value, onChangeText, placeholder = 'Search games' }: Props) {
  return (
    <Sticker radius={radius.row} shadow="sm" style={styles.field} contentStyle={styles.face}>
      <Icon name="search" size={18} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        selectionColor={colors.accent}
        style={styles.input}
      />
    </Sticker>
  );
}

const styles = StyleSheet.create({
  field: { height: 50 },
  face: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  input: { ...typography.body, flex: 1, minWidth: 0, color: colors.ink, paddingVertical: 0 },
});
