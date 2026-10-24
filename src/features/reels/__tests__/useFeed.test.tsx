import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { FeedItem } from '@/shared';

import { useFeed } from '../hooks/useFeed';

// A server feed that ends after one page.
jest.mock('@/services/api/queries', () => {
  const { infiniteQueryOptions: options } = jest.requireActual('@tanstack/react-query');
  return {
    feedQuery: () =>
      options({
        queryKey: ['feed'],
        queryFn: async () => ({
          items: ['stack', 'hop', 'pop'].map((id) => ({ kind: 'game', game: { id, best: null } })),
          nextCursor: null,
        }),
        initialPageParam: null,
        getNextPageParam: (last: { nextCursor: string | null }) => last.nextCursor,
      }),
  };
});
// gcTime: Infinity so the client schedules no cache timers that would keep Jest running.
const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
afterEach(() => client.clear());

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

it('keeps dealing reshuffled laps after the server feed ends', async () => {
  const { result } = await renderHook(() => useFeed(), { wrapper });
  await waitFor(() => expect(result.current.items).toHaveLength(3));

  await act(() => result.current.loadMore());
  await act(() => result.current.loadMore());

  const ids = result.current.items.map((it: { game: FeedItem['game'] }) => it.game.id);
  expect(ids).toHaveLength(9);
  // Every lap holds each game once, and no game ever appears twice in a row.
  expect(ids.slice(3, 6).sort()).toEqual(['hop', 'pop', 'stack']);
  expect(ids.slice(6, 9).sort()).toEqual(['hop', 'pop', 'stack']);
  expect(ids.some((id: string, i: number) => i > 0 && id === ids[i - 1])).toBe(false);
  // Keys stay unique so the list never confuses two reels of the same game.
  expect(new Set(result.current.items.map((it: { key: string }) => it.key)).size).toBe(9);
});
