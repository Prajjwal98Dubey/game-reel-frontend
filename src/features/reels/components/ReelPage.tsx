import { Image } from 'expo-image';
import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GamePlayer, type OverlayInsets, type PlayerState } from '@/features/player';
import { useBestScore } from '@/stores/scores';
import { colors } from '@/theme';

import type { ReelItem } from '../hooks/useFeed';
import { useReelsStore } from '../store';
import { ReelMeta } from './ReelMeta';

type Props = {
  item: ReelItem;
  index: number;
  height: number;
  /** In the 3-player pool: mounts a live WebView. Otherwise only the thumbnail is shown. */
  live: boolean;
  active: boolean;
  suspended: boolean;
  /** Where the score sticker sits when the header is hidden during play. */
  scoreTop: number;
  /** Header above, meta + tab bar below: overlays keep their content between them. */
  overlayInsets: OverlayInsets;
  /** Bottom of the meta block and rail, just above the tab bar. */
  metaBottom: number;
};

const LIVE_ROUND: readonly PlayerState[] = ['playing', 'paused'];

/** One reel: the game covers the whole page; name, tags and actions float above it between rounds. */
export const ReelPage = memo(function ReelPage(props: Props) {
  const { item, index, height, live, active, suspended, scoreTop, overlayInsets, metaBottom } = props;
  const { game } = item;
  const best = useBestScore(game.id, game.best);
  const [state, setState] = useState<PlayerState>('loading');
  const setImmersive = useReelsStore((s) => s.setImmersive);

  const liveRound = live && LIVE_ROUND.includes(state);
  // The result card carries its own actions, so the meta stays out of the way until the next round.
  const showMeta = !live || !(liveRound || state === 'over');

  useEffect(() => {
    if (active) setImmersive(liveRound);
  }, [active, liveRound, setImmersive]);

  return (
    <View style={[styles.page, { height }]} accessibilityLabel={`${game.name} game`}>
      {live ? (
        // Keyed by item so a recycled cell never reuses another game's WebView or round state.
        <GamePlayer
          key={item.key}
          game={game}
          source="reels"
          position={index}
          active={active}
          suspended={suspended}
          showSwipeHint
          scoreTop={scoreTop}
          overlayInsets={overlayInsets}
          onStateChange={setState}
        />
      ) : (
        <Image source={{ uri: game.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      {showMeta && <ReelMeta game={game} best={best} bottom={metaBottom} />}
    </View>
  );
});

const styles = StyleSheet.create({
  page: { width: '100%', overflow: 'hidden', backgroundColor: colors.ink },
});
