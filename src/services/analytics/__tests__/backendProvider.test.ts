import { toEnvelope } from '../backendProvider';

jest.mock('@/services/api', () => ({ api: { sendEvents: jest.fn() } }));

describe('toEnvelope', () => {
  it('lifts gameId out of props into the wire shape', () => {
    expect(
      toEnvelope({
        name: 'game_view',
        props: { gameId: 'hop', source: 'reels', position: 3 },
        clientTs: '2026-10-22T10:15:03.120Z',
      }),
    ).toEqual({
      type: 'game_view',
      gameId: 'hop',
      clientTs: '2026-10-22T10:15:03.120Z',
      props: { source: 'reels', position: 3 },
    });
  });

  it('leaves gameId undefined for events without one', () => {
    expect(toEnvelope({ name: 'tab_view', props: { tab: 'reels' }, clientTs: 'now' })).toEqual({
      type: 'tab_view',
      gameId: undefined,
      clientTs: 'now',
      props: { tab: 'reels' },
    });
  });
});
