export const qk = {
  games: (tag?: string) => ['games', { tag }] as const,
  game: (id: string) => ['game', id] as const,
  feed: () => ['feed'] as const,
};
