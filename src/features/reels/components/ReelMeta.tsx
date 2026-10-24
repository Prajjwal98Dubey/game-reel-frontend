import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { Sticker } from '@/components/Sticker';
import { isEnabled } from '@/config/flags';
import type { GameManifest } from '@/shared';
import { useLibraryStore } from '@/stores/library';
import { radius, space } from '@/theme';

/** Width kept free on the right for the action rail. */
export const RAIL_SPACE = 46 + 12 + 12;

type Props = { game: GameManifest; best: number | null; bottom: number };

/**
 * Reel overlay over the full-screen game (§17.8): the name and tags on a white sticker bottom-left,
 * and a vertical rail of Like / Save / Dare stickers on the right. Hidden while a round is on.
 */
export function ReelMeta({ game, best, bottom }: Props) {
  const liked = useLibraryStore((s) => s.liked[game.id] != null);
  const saved = useLibraryStore((s) => s.saved[game.id] != null);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const toggleSave = useLibraryStore((s) => s.toggleSave);
  const dareEnabled = isEnabled('share');

  return (
    <>
      <View pointerEvents="none" style={[styles.info, { bottom }]}>
        <Sticker radius={radius.label} shadow="sm" style={styles.label} contentStyle={styles.labelFace}>
          <AppText variant="title" numberOfLines={1}>
            {game.name}
          </AppText>
          {best != null && (
            <AppText variant="bodySm" tone="muted">
              Best {best}
            </AppText>
          )}
        </Sticker>
        <View style={styles.chips}>
          {game.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={`#${tag}`} tag={tag} size="sm" />
          ))}
        </View>
      </View>
      <View style={[styles.rail, { bottom }]}>
        <IconButton
          icon="heart"
          on={liked}
          accessibilityLabel={liked ? `Unlike ${game.name}` : `Like ${game.name}`}
          onPress={() => toggleLike(game.id)}
        />
        <IconButton
          icon="bookmark"
          filled={saved}
          accessibilityLabel={saved ? `Remove ${game.name} from saved` : `Save ${game.name}`}
          onPress={() => toggleSave(game.id)}
        />
        <IconButton
          icon="share"
          disabled={!dareEnabled}
          accessibilityLabel={dareEnabled ? `Dare a friend to play ${game.name}` : 'Dare a friend, coming soon'}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  info: { position: 'absolute', left: space.gutter, right: RAIL_SPACE, alignItems: 'flex-start', gap: 8 },
  label: { maxWidth: '100%' },
  labelFace: { paddingVertical: 8, paddingHorizontal: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rail: { position: 'absolute', right: 12, gap: space.item },
});
