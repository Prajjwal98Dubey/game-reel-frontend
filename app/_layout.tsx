import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchGate } from '@/features/launch/LaunchGate';
import { queryClient } from '@/services/api';
import { useAppLifecycle } from '@/services/lifecycle';
import { colors } from '@/theme';
import { useAppFonts } from '@/theme/fonts';

// Keep the native splash up until Archivo is loaded, so text never flashes in a fallback font (§17.5).
// The animated launch screen (LaunchGate) takes over from there while the app warms up.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useAppLifecycle();
  const [fontsLoaded, fontError] = useAppFonts();
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <LaunchGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="play/[gameId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="collection/[id]" />
          </Stack>
        </LaunchGate>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
});
