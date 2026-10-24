import { EventBatchSchema, FeedItemSchema, GameManifestSchema } from '..';

const manifest = {
  id: 'stack',
  name: 'Stack',
  version: '1.2.0',
  bundleUrl: 'https://cdn.gamereels.app/games/stack/1.2.0/index.html',
  thumbnailUrl: 'https://cdn.gamereels.app/games/stack/1.2.0/thumb.webp',
  description: 'Drop each block on the last one.',
  tags: ['timing', 'one-tap'],
  controls: ['tap'],
  avgRoundSeconds: 25,
  minAppVersion: '1.0.0',
  sdkVersion: 1,
  best: 42,
};

describe('shared schemas', () => {
  it('accepts the documented manifest', () => {
    expect(GameManifestSchema.parse(manifest)).toEqual(manifest);
  });

  it('rejects unknown controls', () => {
    expect(GameManifestSchema.safeParse({ ...manifest, controls: ['swipe-y'] }).success).toBe(false);
  });

  it('drops feed item kinds this build does not know', () => {
    expect(FeedItemSchema.safeParse({ kind: 'game', game: manifest }).success).toBe(true);
    expect(FeedItemSchema.safeParse({ kind: 'sponsored', campaign: {} }).success).toBe(false);
  });

  it('validates event batches', () => {
    const event = { type: 'game_view', gameId: 'hop', clientTs: '2026-10-22T10:15:03.120Z', props: { position: 3 } };
    expect(EventBatchSchema.safeParse({ events: [event] }).success).toBe(true);
    expect(EventBatchSchema.safeParse({ events: [{ ...event, type: 'game_teleport' }] }).success).toBe(false);
    expect(EventBatchSchema.safeParse({ events: Array(101).fill(event) }).success).toBe(false);
  });
});
