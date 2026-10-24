import { useRef, type ReactNode } from 'react';
import { Platform, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { isCleanTap, type TouchSample } from '@/utils/cleanTap';

type Props = {
  onTap: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

type Point = { pageX: number; pageY: number };

/**
 * Fires `onTap` only for a clean tap (finger up, moved < 10 px, < 500 ms), so a swipe through
 * the feed never starts a game (gesture rule 2). It observes raw touches without claiming the
 * responder, so the feed's scroll view still receives the swipe.
 */
export function TapSurface({ onTap, disabled, accessibilityLabel, accessibilityHint, style, children }: Props) {
  const down = useRef<TouchSample | null>(null);

  const begin = ({ pageX, pageY }: Point) => {
    down.current = { x: pageX, y: pageY, t: Date.now() };
  };
  const end = ({ pageX, pageY }: Point) => {
    const start = down.current;
    down.current = null;
    if (!start || disabled) return;
    if (isCleanTap(start, { x: pageX, y: pageY, t: Date.now() })) onTap();
  };
  const cancel = () => {
    down.current = null;
  };

  const handlers =
    Platform.OS === 'web'
      ? {
          onPointerDown: (e: { nativeEvent: Point }) => begin(e.nativeEvent),
          onPointerUp: (e: { nativeEvent: Point }) => end(e.nativeEvent),
          onPointerCancel: cancel,
        }
      : {
          onTouchStart: (e: GestureResponderEvent) => {
            if (e.nativeEvent.touches.length > 1) return cancel();
            begin(e.nativeEvent);
          },
          onTouchEnd: (e: GestureResponderEvent) => end(e.nativeEvent),
          onTouchCancel: cancel,
        };

  return (
    <View
      style={style}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      onAccessibilityTap={disabled ? undefined : onTap}
      {...handlers}
    >
      {children}
    </View>
  );
}
