import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef, type ReactElement } from 'react';
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import type { ReelItem } from '../hooks/useFeed';

/** Web has no native paging, so the list snaps itself once scrolling has been idle this long. */
const WEB_SNAP_IDLE_MS = 120;

type Props = {
  items: ReelItem[];
  pageHeight: number;
  /** Re-render pages when the active index changes (pool membership depends on it). */
  activeIndex: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  renderPage: (item: ReelItem, index: number) => ReactElement;
};

/**
 * The vertical, snap-paged feed. Built on FlashList with paging; the list implementation is
 * hidden here so it can be swapped for react-native-pager-view after the device spike (§6.2).
 */
export function ReelsList({ items, pageHeight, activeIndex, onScroll, renderPage }: Props) {
  const listRef = useRef<FlashListRef<ReelItem>>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
    },
    [],
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(e);
    if (Platform.OS !== 'web' || pageHeight <= 0) return;
    const y = e.nativeEvent.contentOffset.y;
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const target = Math.round(y / pageHeight) * pageHeight;
      if (Math.abs(target - y) > 1) listRef.current?.scrollToOffset({ offset: target, animated: true });
    }, WEB_SNAP_IDLE_MS);
  };

  return (
    <FlashList
      ref={listRef}
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={({ item, index }) => renderPage(item, index)}
      extraData={activeIndex}
      pagingEnabled
      snapToInterval={pageHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      drawDistance={pageHeight}
      maintainVisibleContentPosition={{ disabled: true }}
      bounces={false}
      overScrollMode="never"
    />
  );
}
