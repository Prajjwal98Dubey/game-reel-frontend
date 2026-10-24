import { router, useIsFocused } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { StateView } from '@/components/StateView';
import { Sticker } from '@/components/Sticker';
import { ApiError, isPlayable } from '@/services/api';
import { useSettingsStore } from '@/stores/settings';
import { ROUND_BUTTON, colors, radius, space } from '@/theme';
import { useAppActive } from '@/utils/useAppActive';

import { GamePlayer } from './GamePlayer';
import { useGame } from './hooks/useGame';

type Props = {
  gameId: string;
  /** From a dare / challenge deep link; reserved for later features. */
  seed?: number;
};

/**
 * Full-screen player opened from the Catalogue or a deep link (`gamereels://play/<id>`). The game
 * fills the screen like a reel; close, name and mute float above it as stickers.
 */
export function PlayScreen({ gameId, seed }: Props) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const appActive = useAppActive();
  const { data: game, isPending, isError, error, refetch } = useGame(gameId);
  const muted = useSettingsStore((s) => s.muted);
  const toggleMuted = useSettingsStore((s) => s.toggleMuted);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/reels'));
  const barTop = insets.top + 8;
  const belowBar = barTop + ROUND_BUTTON + 12;

  let content;
  if (game && !isPlayable(game)) {
    content = <StateView kind="empty" message="Update the app to play this game." />;
  } else if (game) {
    content = (
      <GamePlayer
        key={game.id}
        game={game}
        source="catalogue"
        position={0}
        active
        suspended={!focused || !appActive}
        seed={seed}
        scoreTop={belowBar}
        overlayInsets={{ top: belowBar, bottom: insets.bottom + 16 }}
      />
    );
  } else if (isPending) {
    content = <StateView kind="loading" />;
  } else if (isError && error instanceof ApiError && error.status === 404) {
    content = <StateView kind="empty" message="This game isn't available." />;
  } else {
    content = <StateView kind="error" message="Couldn't load this game." onRetry={() => void refetch()} />;
  }

  return (
    <View style={styles.root}>
      {content}
      <View pointerEvents="box-none" style={[styles.bar, { top: barTop }]}>
        <IconButton icon="close" accessibilityLabel="Close game" onPress={close} />
        {game && (
          <Sticker radius={radius.label} border="sm" shadow="xs" contentStyle={styles.name}>
            <AppText variant="cardTitle" numberOfLines={1} accessibilityRole="header">
              {game.name}
            </AppText>
          </Sticker>
        )}
        <IconButton
          icon={muted ? 'volumeOff' : 'volume'}
          accessibilityLabel={muted ? 'Unmute game' : 'Mute game'}
          onPress={toggleMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  bar: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.item,
  },
  name: { paddingVertical: 6, paddingHorizontal: 12 },
});
