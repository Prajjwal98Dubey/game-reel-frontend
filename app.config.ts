import type { ExpoConfig } from 'expo/config';

import brand from './brand.json';

const APP_ENV = process.env.EXPO_PUBLIC_ENV ?? 'development';

const config: ExpoConfig = {
  // Display name comes from brand.json, the single place the brand is set.
  name: APP_ENV === 'production' ? brand.name : `${brand.name} (${APP_ENV})`,
  slug: 'game-reels',
  scheme: 'gamereels',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Light theme only in the MVP; system dark mode must not invert the Sticker Deck colours (§17.4).
  userInterfaceStyle: 'light',
  backgroundColor: '#E6EDFF',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'app.gamereels.mobile',
  },
  android: {
    package: 'app.gamereels.mobile',
    adaptiveIcon: {
      backgroundColor: '#E6EDFF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-image',
    'expo-localization',
    'expo-font',
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 160, backgroundColor: '#E6EDFF' }],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    env: APP_ENV,
  },
};

export default config;
