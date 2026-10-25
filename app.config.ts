import type { ExpoConfig } from 'expo/config';

import brand from './brand.json';

const APP_ENV = process.env.EXPO_PUBLIC_ENV ?? 'development';

const config: ExpoConfig = {
  // Display name comes from brand.json, the single place the brand is set.
  name: APP_ENV === 'production' ? brand.name : `${brand.name} (${APP_ENV})`,
  slug: 'game-reels',
  scheme: 'gamereels',
  version: '1.0.0',
  // EAS Update (OTA): required by expo-updates; matches the project we linked in extra.eas.
  updates: {
    url: 'https://u.expo.dev/3343d0cd-9f7c-4dc8-8ee9-ee95877acf46',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
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
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 240, backgroundColor: '#E6EDFF' }],
    [
      'expo-build-properties',
      {
        android: {
          // Real phones are ARM. The x86 ABIs only run on emulators and were ~60 MB of the 122 MB
          // APK, so they ship in development builds only.
          buildArchs:
            APP_ENV === 'development'
              ? ['arm64-v8a', 'armeabi-v7a', 'x86_64']
              : ['arm64-v8a', 'armeabi-v7a'],
          // Store native libraries compressed inside sideloaded APKs (roughly halves them).
          // Play-distributed AABs are split per device by the store regardless.
          useLegacyPackaging: true,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    env: APP_ENV,
    // Links the local project to the EAS project (required for cloud builds, credentials, OTA updates).
    eas: {
      projectId: '3343d0cd-9f7c-4dc8-8ee9-ee95877acf46',
    },
  },
};

export default config;
