import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { border as borders, colors, shadow as shadows, type ColorToken, type ShadowToken } from '@/theme';
import { haptics } from '@/utils/haptics';

const PRESS_IN_MS = 80;

type Props = {
  fill?: ColorToken;
  radius: number;
  border?: 'lg' | 'sm' | 'none';
  shadow?: ShadowToken | 'none';
  /** Outer box: size, margins, position, rotation. The shadow hangs outside it, like CSS box-shadow. */
  style?: StyleProp<ViewStyle>;
  /** The face: padding and the layout of its children. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Clip children to the rounded face (art, thumbnails, WebViews). */
  clip?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** Light haptic on press; buttons only (§17.9). */
  haptic?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  testID?: string;
  children?: ReactNode;
};

/**
 * Whether the outer box gets its height from its own style rather than from the face. Only then
 * may the face grow to fill it: a growing face inside an unsized box takes all the space Yoga
 * offers (on Android it stretched the launch-screen logo to the full screen height).
 */
function hasFixedSize(style: StyleProp<ViewStyle>): boolean {
  const s = StyleSheet.flatten(style);
  if (!s) return false;
  return (
    s.height != null ||
    s.minHeight != null ||
    s.flex != null ||
    s.flexGrow != null ||
    s.flexBasis != null ||
    s.aspectRatio != null
  );
}

/**
 * The base surface of the Sticker Deck design (§17.3, §17.7): a flat fill with an ink outline and a
 * hard ink shadow offset down-right. The shadow is a solid "back plate" behind the face, so it never
 * blurs on any platform. Pressing pushes the face onto the plate (the shadow disappears) and it
 * springs back on release.
 */
export function Sticker({
  fill = 'surface',
  radius,
  border = 'lg',
  shadow = 'none',
  style,
  contentStyle,
  clip = false,
  onPress,
  disabled = false,
  haptic = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  testID,
  children,
}: Props) {
  const offset = shadow === 'none' ? 0 : shadows[shadow];
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const faceMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: pressed.get() * offset }, { translateY: pressed.get() * offset }],
  }));

  const face = (
    <Animated.View
      style={[
        styles.face,
        hasFixedSize(style) && styles.fill,
        {
          backgroundColor: colors[fill],
          borderRadius: radius,
          borderWidth: border === 'none' ? 0 : borders[border],
        },
        clip && styles.clip,
        contentStyle,
        onPress && faceMotion,
      ]}
    >
      {children}
    </Animated.View>
  );

  const plate =
    offset > 0 ? (
      <View
        pointerEvents="none"
        style={[styles.plate, { top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius }]}
      />
    ) : null;

  if (!onPress) {
    return (
      <View
        style={[styles.outer, style]}
        accessible={accessibilityLabel != null}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        {plate}
        {face}
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.outer, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (haptic) haptics.press();
        pressed.set(withTiming(1, { duration: PRESS_IN_MS }));
      }}
      onPressOut={() => {
        pressed.set(
          reduceMotion ? withTiming(0, { duration: PRESS_IN_MS }) : withSpring(0, { damping: 12, stiffness: 420 }),
        );
      }}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled }}
      testID={testID}
    >
      {plate}
      {face}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'relative' },
  plate: { position: 'absolute', backgroundColor: colors.ink },
  face: { borderColor: colors.ink },
  fill: { flexGrow: 1 },
  clip: { overflow: 'hidden' },
  disabled: { opacity: 0.55 },
});
