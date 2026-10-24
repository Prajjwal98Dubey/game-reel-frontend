import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

import { colors } from '@/theme';

import { LaunchScreen } from './LaunchScreen';
import { useBootstrap } from './useBootstrap';

const FADE_MS = 280;

/**
 * Shows the launch screen while the app gets ready, then mounts the app (whose first screens now
 * read from a warm cache) and fades the launch screen away on top of it.
 */
export function LaunchGate({ children }: { children: ReactNode }) {
  const { phase, done } = useBootstrap();
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.root}>
      {done && children}
      {!done && (
        <Animated.View style={StyleSheet.absoluteFill} exiting={reduceMotion ? undefined : FadeOut.duration(FADE_MS)}>
          <LaunchScreen phase={phase} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
});
