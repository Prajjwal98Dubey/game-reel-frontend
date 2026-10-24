import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { track } from '@/services/analytics';
import { submitPlay } from '@/services/api';
import type { GameManifest } from '@/shared';
import { useHistoryStore } from '@/stores/history';
import { useScoresStore } from '@/stores/scores';

import { GamePlayer } from '../GamePlayer';

// The WebView is replaced by a stub that exposes the bridge callbacks to the test.
const bridge: { emit: (msg: object) => void; sent: object[] } = { emit: () => undefined, sent: [] };
jest.mock('../components/GameWebView', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GameWebView: React.forwardRef(function Stub(
      props: { onMessage: (raw: unknown) => void },
      ref: React.Ref<{ send: (cmd: object) => void }>,
    ) {
      React.useImperativeHandle(ref, () => ({ send: (cmd: object) => bridge.sent.push(cmd) }));
      bridge.emit = (msg) => props.onMessage(JSON.stringify({ v: 1, ...msg }));
      return null;
    }),
  };
});
jest.mock('@/services/analytics', () => ({ track: jest.fn() }));
jest.mock('@/services/api', () => ({ submitPlay: jest.fn() }));
jest.mock('@/utils/haptics', () => ({
  haptics: { score: jest.fn(), gameOver: jest.fn(), newBest: jest.fn(), press: jest.fn() },
}));

const game: GameManifest = {
  id: 'stack',
  name: 'Stack',
  version: '1.0.0',
  bundleUrl: 'https://cdn.example/stack/1.0.0/index.html',
  thumbnailUrl: 'https://cdn.example/stack/1.0.0/thumb.svg',
  description: 'Stack blocks',
  tags: ['timing'],
  controls: ['tap'],
  avgRoundSeconds: 20,
  minAppVersion: '1.0.0',
  sdkVersion: 1,
  best: null,
};

/** A clean tap: finger down and up in place, quickly. */
async function cleanTap(label: string) {
  const target = screen.getByLabelText(label);
  await fireEvent(target, 'touchStart', { nativeEvent: { pageX: 50, pageY: 50, touches: [{}] } });
  await fireEvent(target, 'touchEnd', { nativeEvent: { pageX: 52, pageY: 51 } });
}

beforeEach(() => {
  jest.useFakeTimers();
  bridge.sent = [];
  jest.mocked(track).mockClear();
  jest.mocked(submitPlay).mockClear();
  useScoresStore.setState({ bestByGame: {} });
  useHistoryStore.setState({ recent: [] });
});

afterEach(() => jest.useRealTimers());

it('walks loading -> idle -> playing -> over -> retry', async () => {
  await render(<GamePlayer game={game} source="catalogue" position={0} active />);
  expect(screen.getByLabelText('Loading game')).toBeTruthy();

  await act(() => bridge.emit({ type: 'ready' }));
  expect(bridge.sent).toContainEqual({ type: 'setMuted', muted: true });
  expect(screen.getByLabelText('Tap to play')).toBeTruthy();

  await cleanTap('Tap to play');
  expect(bridge.sent).toContainEqual({ type: 'start', seed: undefined });

  await act(() => bridge.emit({ type: 'started' }));
  expect(track).toHaveBeenCalledWith('game_start', { gameId: 'stack', round: 1 });

  await act(() => bridge.emit({ type: 'score', score: 4 }));
  expect(screen.getByText('4')).toBeTruthy();

  await act(() => bridge.emit({ type: 'gameOver', score: 7, durationMs: 12000, seed: 99 }));
  await act(() => jest.advanceTimersByTime(600));
  expect(screen.getByText('Stack · your score')).toBeTruthy();
  expect(screen.getByLabelText('Score 7')).toBeTruthy();
  expect(screen.getByLabelText('New best!')).toBeTruthy();
  expect(useHistoryStore.getState().recent.map((r) => r.gameId)).toEqual(['stack']);
  expect(track).toHaveBeenCalledWith('game_over', { gameId: 'stack', score: 7, durationMs: 12000, isNewBest: true });
  expect(submitPlay).toHaveBeenCalledWith({
    gameId: 'stack',
    gameVersion: '1.0.0',
    score: 7,
    durationMs: 12000,
    seed: 99,
  });
  expect(useScoresStore.getState().bestByGame.stack).toBe(7);

  await fireEvent.press(screen.getByLabelText('Play again'));
  expect(bridge.sent.filter((c) => (c as { type: string }).type === 'start')).toHaveLength(2);
});

it('does not start on a swipe', async () => {
  await render(<GamePlayer game={game} source="reels" position={0} active />);
  await act(() => bridge.emit({ type: 'ready' }));
  const target = screen.getByLabelText('Tap to play');
  await fireEvent(target, 'touchStart', { nativeEvent: { pageX: 50, pageY: 400, touches: [{}] } });
  await fireEvent(target, 'touchEnd', { nativeEvent: { pageX: 50, pageY: 120 } });
  expect(bridge.sent).not.toContainEqual(expect.objectContaining({ type: 'start' }));
});

it('ignores taps while inactive (a neighbouring reel)', async () => {
  await render(<GamePlayer game={game} source="reels" position={1} active={false} />);
  await act(() => bridge.emit({ type: 'ready' }));
  await cleanTap('Tap to play');
  expect(bridge.sent).not.toContainEqual(expect.objectContaining({ type: 'start' }));
});

it('reports a quick skip and a quit when leaving a reel', async () => {
  const { rerender } = await render(<GamePlayer game={game} source="reels" position={2} active />);
  await act(() => bridge.emit({ type: 'ready' }));
  expect(track).toHaveBeenCalledWith('game_view', { gameId: 'stack', source: 'reels', position: 2 });

  await act(() => jest.advanceTimersByTime(900));
  await rerender(<GamePlayer game={game} source="reels" position={2} active={false} />);
  expect(track).toHaveBeenCalledWith('game_skip', { gameId: 'stack', dwellMs: 900 });

  await rerender(<GamePlayer game={game} source="reels" position={2} active />);
  await cleanTap('Tap to play');
  await act(() => bridge.emit({ type: 'score', score: 2 }));
  await act(() => jest.advanceTimersByTime(3000));
  await rerender(<GamePlayer game={game} source="reels" position={2} active={false} />);
  expect(track).toHaveBeenCalledWith('game_quit', { gameId: 'stack', score: 2, durationMs: 3000 });
  expect(bridge.sent[bridge.sent.length - 1]).toEqual({ type: 'reset' });
  expect(screen.getByLabelText('Tap to play')).toBeTruthy();
});

it('pauses a live round when suspended and resumes on a clean tap', async () => {
  const { rerender } = await render(<GamePlayer game={game} source="catalogue" position={0} active />);
  await act(() => bridge.emit({ type: 'ready' }));
  await cleanTap('Tap to play');

  await rerender(<GamePlayer game={game} source="catalogue" position={0} active suspended />);
  expect(bridge.sent).toContainEqual({ type: 'pause' });

  await rerender(<GamePlayer game={game} source="catalogue" position={0} active />);
  await cleanTap('Paused. Tap to resume');
  expect(bridge.sent).toContainEqual({ type: 'resume' });
});

it('compares with the previous best and pops "New best!" when the live score passes it', async () => {
  useScoresStore.setState({ bestByGame: { stack: 5 } });
  await render(<GamePlayer game={game} source="catalogue" position={0} active />);
  await act(() => bridge.emit({ type: 'ready' }));

  // Round 1 ends below the best.
  await cleanTap('Tap to play');
  await act(() => bridge.emit({ type: 'gameOver', score: 3, durationMs: 4000 }));
  await act(() => jest.advanceTimersByTime(600));
  expect(screen.getByText('Best 5')).toBeTruthy();
  expect(screen.getByText('2 away from your best')).toBeTruthy();

  // Round 2 passes it mid-round.
  await fireEvent.press(screen.getByLabelText('Play again'));
  await act(() => bridge.emit({ type: 'score', score: 5 }));
  expect(screen.queryByLabelText('New best!')).toBeNull();
  await act(() => bridge.emit({ type: 'score', score: 6 }));
  expect(screen.getByText('New best!')).toBeTruthy();
});

it('keeps Dare a friend visible but disabled while the flag is off', async () => {
  await render(<GamePlayer game={game} source="reels" position={0} active showSwipeHint />);
  await act(() => bridge.emit({ type: 'ready' }));
  await cleanTap('Tap to play');
  await act(() => bridge.emit({ type: 'gameOver', score: 1, durationMs: 2000 }));
  await act(() => jest.advanceTimersByTime(600));
  expect(screen.getByLabelText('Dare a friend, coming soon')).toBeDisabled();
  expect(screen.getByText('Swipe up for the next game')).toBeTruthy();
});
