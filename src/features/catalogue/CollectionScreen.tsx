import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { StateView } from '@/components/StateView';
import type { GameManifest } from '@/shared';
import { colors, space } from '@/theme';

import { findCollection } from './collections';
import { GameListRow } from './components/GameListRow';
import { useCatalogue } from './hooks/useCatalogue';

/** "See all" for a catalogue row: every game in that collection as a list. */
export function CollectionScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const collection = findCollection(id);
  const catalogue = useCatalogue();
  const games = useMemo(
    () => (collection ? catalogue.games.filter(collection.matches) : []),
    [catalogue.games, collection],
  );

  const open = useCallback((game: GameManifest) => {
    router.push({ pathname: '/play/[gameId]', params: { gameId: game.id } });
  }, []);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/catalogue'));

  let body;
  if (!collection) body = <StateView kind="empty" message="This list doesn't exist." />;
  else if (catalogue.isPending) body = <StateView kind="loading" />;
  else if (catalogue.isError && !games.length)
    body = <StateView kind="error" message="Couldn't load the catalogue." onRetry={() => void catalogue.refetch()} />;
  else if (!games.length) body = <StateView kind="empty" message="No games here yet." />;
  else
    body = (
      <View style={styles.list}>
        {games.map((g) => (
          <GameListRow key={g.id} game={g} onPress={open} />
        ))}
      </View>
    );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={styles.header}>
        <IconButton icon="chevronLeft" accessibilityLabel="Back" onPress={back} />
        <AppText variant="display" accessibilityRole="header" numberOfLines={2} style={styles.title}>
          {collection?.title ?? 'Games'}
        </AppText>
      </View>
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  content: { flexGrow: 1, paddingHorizontal: space.gutter },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.item, marginBottom: space.section },
  title: { flex: 1 },
  list: { gap: space.rowGap },
});
