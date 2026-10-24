import { useScoresStore } from '../scores';

beforeEach(() => useScoresStore.setState({ bestByGame: {} }));

describe('scores store', () => {
  it('records the first positive score as a new best', () => {
    expect(useScoresStore.getState().recordScore('stack', 5)).toEqual({ isNewBest: true, previousBest: null });
    expect(useScoresStore.getState().bestByGame.stack).toBe(5);
  });

  it('only replaces the best with a higher score', () => {
    const { recordScore } = useScoresStore.getState();
    recordScore('stack', 5);
    expect(recordScore('stack', 3)).toEqual({ isNewBest: false, previousBest: 5 });
    expect(useScoresStore.getState().bestByGame.stack).toBe(5);
    expect(recordScore('stack', 8).isNewBest).toBe(true);
  });

  it('merges a higher server best and ignores lower or missing ones', () => {
    const { mergeBest, recordScore } = useScoresStore.getState();
    recordScore('hop', 4);
    mergeBest('hop', 2);
    mergeBest('hop', null);
    expect(useScoresStore.getState().bestByGame.hop).toBe(4);
    mergeBest('hop', 9);
    expect(useScoresStore.getState().bestByGame.hop).toBe(9);
  });
});
