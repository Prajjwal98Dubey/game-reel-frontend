import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { SearchField } from '@/components/SearchField';
import { StateView } from '@/components/StateView';
import { useTabBarClearance } from '@/components/TabBar';
import { track } from '@/services/analytics';
import type { GameManifest } from '@/shared';
import { useHistoryStore } from '@/stores/history';
import { colors, space } from '@/theme';

import { COLLECTIONS, gameOfTheDay, matchesQuery } from './collections';
import { GameListRow } from './components/GameListRow';
import { GameRow } from './components/GameRow';
import { HeroCard } from './components/HeroCard';
import { SectionHeader } from './components/SectionHeader';
import { useCatalogue } from './hooks/useCatalogue';

/**
 * Catalogue tab (artboard "B · Sticker Deck · Catalogue"). Fixed order: title → search →
 * Game of the day → game rows → Recently played. While searching, matches replace the sections.
 */
export function CatalogueScreen() {
  const insets = useSafeAreaInsets();
  const tabClearance = useTabBarClearance();
  const catalogue = useCatalogue();
  const { games } = catalogue;
  const [query, setQuery] = useState('');
  const recent = useHistoryStore((s) => s.recent);

  useFocusEffect(
    useCallback(() => {
      track('tab_view', { tab: 'catalogue' });
    }, []),
  );

  const open = useCallback((game: GameManifest) => {
    router.push({ pathname: '/play/[gameId]', params: { gameId: game.id } });
  }, []);

  const hero = useMemo(() => gameOfTheDay(games), [games]);
  const rows = useMemo(
    () => COLLECTIONS.map((c) => ({ ...c, games: games.filter(c.matches) })).filter((c) => c.games.length > 0),
    [games],
  );
  const recentGames = useMemo(() => {
    const byId = new Map(games.map((g) => [g.id, g]));
    return recent.map((r) => byId.get(r.gameId)).filter((g): g is GameManifest => g != null);
  }, [games, recent]);
  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? games.filter((g) => matchesQuery(g, query)) : []),
    [games, query, searching],
  );

  let body;
  if (catalogue.isPending) body = <StateView kind="loading" />;
  else if (catalogue.isError && !games.length)
    body = <StateView kind="error" message="Couldn't load the catalogue." onRetry={() => void catalogue.refetch()} />;
  else if (!games.length) body = <StateView kind="empty" message="No games yet. Check back soon." />;
  else if (searching)
    body = (
      <>
        <SectionHeader title={results.length ? 'Results' : 'No matches'} />
        {results.length ? (
          <View style={styles.list}>
            {results.map((g) => (
              <GameListRow key={g.id} game={g} onPress={open} />
            ))}
          </View>
        ) : (
          <AppText tone="muted">Nothing matches “{query.trim()}”. Try a game name or a tag like timing.</AppText>
        )}
      </>
    );
  else
    body = (
      <>
        {hero && (
          <View style={styles.hero}>
            <HeroCard game={hero} onPress={open} />
          </View>
        )}
        {rows.map((row) => (
          <View key={row.id}>
            <SectionHeader
              title={row.title}
              onSeeAll={() => router.push({ pathname: '/collection/[id]', params: { id: row.id } })}
            />
            <GameRow games={row.games} onPress={open} accessibilityLabel={row.title} />
          </View>
        ))}
        {recentGames.length > 0 && (
          <>
            <SectionHeader title="Recently played" />
            <View style={styles.list}>
              {recentGames.map((g) => (
                <GameListRow key={g.id} game={g} onPress={open} />
              ))}
            </View>
          </>
        )}
      </>
    );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: tabClearance + 24 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          tintColor={colors.ink}
          refreshing={catalogue.isRefetching && !catalogue.isFetchingNextPage}
          onRefresh={() => void catalogue.refetch()}
        />
      }
    >
      <AppText variant="display" accessibilityRole="header">
        Catalogue
      </AppText>
      <View style={styles.search}>
        <SearchField value={query} onChangeText={setQuery} />
      </View>
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  content: { flexGrow: 1, paddingHorizontal: space.gutter },
  search: { marginTop: 14 },
  hero: { marginTop: 18 },
  list: { gap: space.rowGap, paddingBottom: 4 },
});
