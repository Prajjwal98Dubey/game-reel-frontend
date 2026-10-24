import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Sticker } from './Sticker';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Height 52, radius 16, ink label. Primary = accent fill, secondary = surface fill (§17.7). */
export function StickerButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  return (
    <Sticker
      fill={variant === 'primary' ? 'accent' : 'surface'}
      radius={16}
      shadow="sm"
      style={[styles.button, style]}
      contentStyle={styles.face}
      onPress={onPress}
      disabled={disabled}
      haptic
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
    >
      {icon && <Icon name={icon} />}
      <AppText variant="label" numberOfLines={1}>
        {label}
      </AppText>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  button: { height: 52 },
  face: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
});
