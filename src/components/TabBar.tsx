import type { BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, tabBar } from '@/theme';

import { AppText } from './AppText';
import { Sticker } from './Sticker';

/** Space a screen must leave at the bottom so content can scroll clear of the floating tab bar. */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return tabBar.height + tabBar.bottom + insets.bottom;
}

/**
 * Compact floating tab bar (§17.7): a small sticker pill sitting just above the bottom edge, as
 * narrow as its content. Text labels only, no icons; the active tab is a tomato pill with its label
 * in Expanded Black. The bar never tilts.
 */
export function TabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: tabBar.bottom + insets.bottom }]}>
      <Sticker
        radius={radius.pill}
        shadow="md"
        style={styles.bar}
        contentStyle={styles.face}
        accessibilityRole="tablist"
        accessibilityLabel="Main"
      >
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const options = descriptors[route.key]?.options;
          const label = typeof options?.title === 'string' ? options.title : route.name;
          return (
            <Sticker
              key={route.key}
              fill={focused ? 'accent' : 'surface'}
              border={focused ? 'sm' : 'none'}
              radius={radius.pill}
              style={styles.tab}
              contentStyle={styles.tabFace}
              onPress={() => {
                if (!focused) navigateToTab(route.key);
              }}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
            >
              <AppText variant={focused ? 'labelStrong' : 'label'}>{label}</AppText>
            </Sticker>
          );
        })}
      </Sticker>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: { height: tabBar.height },
  face: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4 },
  tab: { height: tabBar.tab },
  tabFace: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
