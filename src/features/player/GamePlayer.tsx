import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '@/services/analytics';
import type { GameManifest, GameSource } from '@/shared';
import { colors } from '@/theme';

import { FeedbackSticker } from './components/FeedbackSticker';
import { GameWebView } from './components/GameWebView';
import type { GameWebViewHandle } from './components/GameWebView.types';
import { NO_INSETS, type OverlayInsets } from './components/overlayInsets';
import { ResultOverlay } from './components/ResultOverlay';
import { ScoreSticker } from './components/ScoreSticker';
import { PausedOverlay, StartOverlay } from './components/StartOverlay';
import { ErrorOverlay, LoadingOverlay } from './components/StatusOverlays';
import { TapSurface } from './components/TapSurface';
import { useGameSession, type PlayerState } from './hooks/useGameSession';
import { useScreenReader } from './hooks/useScreenReader';

/** Leaving a reel this soon without playing counts as a skip (FRONTEND.md §10). */
export const SKIP_DWELL_MS = 2500;

export type GamePlayerHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
};

type Props = {
  game: GameManifest;
  source: GameSource;
  /** Position in the feed (reels) or list (catalogue), for analytics. */
  position: number;
  /**
   * Whether this is the game the player is looking at. Only an active player accepts taps.
   * Becoming inactive is "leaving": a live round is quit and the game resets.
   */
  active: boolean;
  /** App backgrounded or screen unfocused: a live round is paused, not reset. */
  suspended?: boolean;
  seed?: number;
  /** Reels: show "Swipe up for the next game" under the result card. */
  showSwipeHint?: boolean;
  /** Where the live score sticker sits (below the safe area / any top bar). */
  scoreTop?: number;
  /** Chrome drawn over the game; start, paused and result content stays clear of it. */
  overlayInsets?: OverlayInsets;
  onStateChange?: (state: PlayerState) => void;
};

/**
 * The one game player, shared by Reels and Catalogue (and later leaderboards, dares, daily).
 * Hosts the WebView and draws every overlay in React Native so they look the same for every game.
 * It fills its parent, which in both entry points is the whole screen.
 */
export const GamePlayer = forwardRef<GamePlayerHandle, Props>(function GamePlayer(
  {
    game,
    source,
    position,
    active,
    suspended = false,
    seed,
    showSwipeHint = false,
    scoreTop = 12,
    overlayInsets = NO_INSETS,
    onStateChange,
  },
  ref,
) {
  const webviewRef = useRef<GameWebViewHandle>(null);
  const session = useGameSession({ game, webviewRef, seed });
  const screenReader = useScreenReader();
  const { state, quitIfLive, roundsPlayed, reset, pause } = session;

  useImperativeHandle(ref, () => ({
    start: session.start,
    pause: session.pause,
    resume: session.resume,
    reset: session.reset,
  }));

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // A visit: entering sends game_view; leaving quits a live round, reports a quick skip, and resets.
  // The session controls are stable, so this only re-runs when the visit itself changes.
  useEffect(() => {
    if (!active) return;
    const enteredAt = Date.now();
    const roundsAtEntry = roundsPlayed();
    track('game_view', { gameId: game.id, source, position });
    return () => {
      const quit = quitIfLive();
      const dwellMs = Date.now() - enteredAt;
      if (!quit && source === 'reels' && roundsPlayed() === roundsAtEntry && dwellMs < SKIP_DWELL_MS) {
        track('game_skip', { gameId: game.id, dwellMs });
      }
      reset();
    };
  }, [active, game.id, source, position, quitIfLive, roundsPlayed, reset]);

  useEffect(() => {
    if (suspended) pause();
  }, [suspended, pause]);

  const inputDisabled = !active || suspended;

  return (
    <View style={styles.root}>
      {/* The game only takes touches during a live round; before and after one, swipes must reach the feed. */}
      <View style={StyleSheet.absoluteFill} pointerEvents={state === 'playing' ? 'auto' : 'none'}>
        <GameWebView
          key={session.loadKey}
          ref={webviewRef}
          uri={game.bundleUrl}
          onMessage={session.handleMessage}
          onLoadError={session.onLoadError}
        />
      </View>

      {state === 'loading' && <LoadingOverlay thumbnailUrl={game.thumbnailUrl} />}
      {(state === 'playing' || state === 'paused') && <ScoreSticker score={session.score} top={scoreTop} />}
      {state === 'playing' && session.feedback && (
        <FeedbackSticker key={session.feedback.id} feedback={session.feedback} />
      )}
      {state === 'idle' && (
        <StartOverlay
          controls={game.controls}
          onStart={session.start}
          disabled={inputDisabled}
          insets={overlayInsets}
        />
      )}
      {state === 'paused' && (
        <PausedOverlay onResume={session.resume} disabled={inputDisabled} insets={overlayInsets} />
      )}
      {state === 'over' && session.result && (
        <ResultOverlay
          gameName={game.name}
          result={session.result}
          onRetry={session.start}
          showSwipeHint={showSwipeHint}
          disabled={inputDisabled}
          insets={overlayInsets}
        />
      )}
      {state === 'error' && <ErrorOverlay onRetry={session.reload} disabled={inputDisabled} />}
      {state === 'playing' && screenReader && (
        <TapSurface style={StyleSheet.absoluteFill} onTap={session.tap} accessibilityLabel={`Play ${game.name}`} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.surface, overflow: 'hidden' },
});
