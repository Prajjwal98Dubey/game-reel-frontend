// Minimal Reanimated stub. Reanimated 4's own mock boots the worklet runtime, which Jest cannot run;
// the app only uses a handful of APIs for overlay animations, so they render statically here.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const entering = { duration: () => entering, delay: () => entering };
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial: unknown) => {
      const sv = {
        value: initial,
        get: () => sv.value,
        set: (next: unknown) => {
          sv.value = next;
        },
      };
      return sv;
    },
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => false,
    withTiming: (value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withDelay: (_ms: number, value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    cancelAnimation: () => undefined,
    FadeIn: entering,
    FadeOut: entering,
  };
});

// In-memory MMKV: the native Nitro module is not available under Jest.
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const data = new Map<string, string | number | boolean>();
    return {
      set: (key: string, value: string | number | boolean) => data.set(key, value),
      getString: (key: string) => {
        const v = data.get(key);
        return typeof v === 'string' ? v : undefined;
      },
      getNumber: (key: string) => {
        const v = data.get(key);
        return typeof v === 'number' ? v : undefined;
      },
      getBoolean: (key: string) => {
        const v = data.get(key);
        return typeof v === 'boolean' ? v : undefined;
      },
      contains: (key: string) => data.has(key),
      remove: (key: string) => data.delete(key),
      getAllKeys: () => [...data.keys()],
      clearAll: () => data.clear(),
    };
  },
}));

// In-memory expo-sqlite key-value store (the Expo Go storage backend).
jest.mock('expo-sqlite/kv-store', () => {
  const data = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItemSync: (key: string) => data.get(key) ?? null,
      setItemSync: (key: string, value: string) => void data.set(key, value),
      removeItemSync: (key: string) => data.delete(key),
    },
  };
});
