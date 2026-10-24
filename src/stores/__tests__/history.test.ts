import { MAX_RECENT, useHistoryStore } from '../history';

beforeEach(() => useHistoryStore.setState({ recent: [] }));

describe('history store', () => {
  it('keeps the most recent play first, one entry per game', () => {
    const { recordPlay } = useHistoryStore.getState();
    recordPlay('stack');
    recordPlay('hop');
    recordPlay('stack');
    expect(useHistoryStore.getState().recent.map((r) => r.gameId)).toEqual(['stack', 'hop']);
  });

  it('is capped', () => {
    const { recordPlay } = useHistoryStore.getState();
    for (let i = 0; i < MAX_RECENT + 5; i++) recordPlay(`g${i}`);
    expect(useHistoryStore.getState().recent).toHaveLength(MAX_RECENT);
    expect(useHistoryStore.getState().recent[0].gameId).toBe(`g${MAX_RECENT + 4}`);
  });
});
