import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type AppEnv = 'development' | 'staging' | 'production';

const DEV_API_PORT = 3000;

/**
 * In development without EXPO_PUBLIC_API_URL, talk to the API on the machine running Metro,
 * so the same config works on a simulator, an emulator and a phone on the LAN.
 */
function devApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${DEV_API_PORT}`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${DEV_API_PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${DEV_API_PORT}` : `http://localhost:${DEV_API_PORT}`;
}

function readEnv(): AppEnv {
  const value = process.env.EXPO_PUBLIC_ENV;
  return value === 'staging' || value === 'production' ? value : 'development';
}

export const env = {
  appEnv: readEnv(),
  apiUrl: (process.env.EXPO_PUBLIC_API_URL || devApiUrl()).replace(/\/+$/, ''),
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || null,
  appVersion: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0',
} as const;
