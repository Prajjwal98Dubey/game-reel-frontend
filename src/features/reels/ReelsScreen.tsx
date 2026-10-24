import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { StateView } from '@/components/StateView';
import { Sticker } from '@/components/Sticker';
import { useTabBarClearance } from '@/components/TabBar';
import { track } from '@/services/analytics';
import { colors, radius, space } from '@/theme';
import { useAppActive } from '@/utils/useAppActive';

import { ReelPage } from './components/ReelPage';
import { ReelsList } from './components/ReelsList';
import { useActiveReel } from './hooks/useActiveReel';
import { PREFETCH_DISTANCE, useFeed, type ReelItem } from './hooks/useFeed';
import { isInPool } from './hooks/usePlayerPool';
import { useReelsStore } from './store';

const HEADER_HEIGHT = 40;

/**
 * Reels tab: every reel is a full-screen game, like a video reel. The wordmark, name, tags and
 * actions float on top as stickers between rounds and step aside while a round is live.
 */
export function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const tabClearance = useTabBarClearance();
  const focused = useIsFocused();
  const appActive = useAppActive();
  const suspended = !focused || !appActive;
  const immersive = useReelsStore((s) => s.immersive);

  const feed = useFeed();
  const { items, loadMore } = feed;
  const [pageHeight, setPageHeight] = useState(0);
  const { activeIndex, onScroll } = useActiveReel(pageHeight, items.length);

  const headerTop = insets.top + 8;
  const metaBottom = tabClearance + 14;
  const overlayInsets = useMemo(
    () => ({ top: headerTop + HEADER_HEIGHT + 8, bottom: metaBottom + 24 }),
    [headerTop, metaBottom],
  );

  useFocusEffect(
    useCallback(() => {
      track('tab_view', { tab: 'reels' });
    }, []),
  );

  useEffect(() => {
    // The feed is endless: near the end, load the next page or deal another shuffled lap.
    if (items.length && activeIndex >= items.length - PREFETCH_DISTANCE) loadMore();
  }, [activeIndex, items.length, loadMore]);

  const onLayout = (e: LayoutChangeEvent) => setPageHeight(Math.round(e.nativeEvent.layout.height));

  const renderPage = useCallback(
    (item: ReelItem, index: number) => (
      <ReelPage
        item={item}
        index={index}
        height={pageHeight}
        live={isInPool(index, activeIndex)}
        active={index === activeIndex}
        suspended={suspended}
        scoreTop={headerTop}
        overlayInsets={overlayInsets}
        metaBottom={metaBottom}
      />
    ),
    [pageHeight, activeIndex, suspended, headerTop, overlayInsets, metaBottom],
  );

  let content;
  if (feed.isPending) content = <StateView kind="loading" />;
  else if (feed.isError && !items.length)
    content = <StateView kind="error" message="Couldn't load games." onRetry={() => void feed.refetch()} />;
  else if (!items.length) content = <StateView kind="empty" message="No games yet. Check back soon." />;
  else if (pageHeight > 0)
    content = (
      <ReelsList
        items={items}
        pageHeight={pageHeight}
        activeIndex={activeIndex}
        onScroll={onScroll}
        renderPage={renderPage}
      />
    );

  return (
    <View style={styles.root} onLayout={onLayout}>
      {content}
      {!immersive && (
        <View pointerEvents="box-none" style={[styles.header, { top: headerTop }]}>
          <BrandMark />
          <Sticker
            radius={radius.pill}
            border="sm"
            shadow="xs"
            contentStyle={styles.pill}
            accessibilityLabel="For you feed"
          >
            <AppText variant="labelSm">For you</AppText>
          </Sticker>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // The desk shows only behind loading / empty states; reels themselves are edge-to-edge game art.
  root: { flex: 1, backgroundColor: colors.ground },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
  },
  pill: { paddingVertical: 6, paddingHorizontal: 14 },
});
