import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/stores/settings';

const enabled = () => Platform.OS !== 'web' && useSettingsStore.getState().haptics;

let lastScoreTick = 0;

/** Haptics per FRONTEND.md §17.9: light on buttons and likes, medium on game over and "New best!". */
export const haptics = {
  /** Light tick on score changes, throttled so fast games do not buzz continuously. */
  score() {
    const now = Date.now();
    if (!enabled() || now - lastScoreTick < 80) return;
    lastScoreTick = now;
    void Haptics.selectionAsync();
  },
  gameOver() {
    if (!enabled()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  newBest() {
    if (!enabled()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  press() {
    if (!enabled()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
};
