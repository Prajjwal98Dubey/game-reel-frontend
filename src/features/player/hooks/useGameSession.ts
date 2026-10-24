import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { track } from '@/services/analytics';
import { submitPlay } from '@/services/api';
import type { GameManifest } from '@/shared';
import { useHistoryStore } from '@/stores/history';
import { useScoresStore } from '@/stores/scores';
import { useSettingsStore } from '@/stores/settings';
import { haptics } from '@/utils/haptics';

import { parseGameMessage } from '../bridge';
import type { GameWebViewHandle } from '../components/GameWebView.types';

/**
 * loading -> idle ("Tap to play") -> playing <-> paused
 *                ^                      |
 *                +------- over <--------+   (retry starts a new round)
 */
export type PlayerState = 'loading' | 'idle' | 'playing' | 'paused' | 'over' | 'error';

export type RoundResult = {
  score: number;
  best: number;
  isNewBest: boolean;
  /** Best before this round, or null on a first play. Drives "<n> away from your best". */
  previousBest: number | null;
};

/** A feedback sticker popped over the game (§17.9). `id` changes for every new pop. */
export type Feedback = { id: number; label: string };

/** A retry tap right after game over is almost always a leftover in-game tap. */
export const RETRY_LOCKOUT_MS = 500;

type Options = {
  game: GameManifest;
  webviewRef: RefObject<GameWebViewHandle | null>;
  /** Fixed seed (dare links, daily challenge). Omit for a random round. */
  seed?: number;
};

export function useGameSession({ game, webviewRef, seed }: Options) {
  const [state, setState] = useState<PlayerState>('loading');
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const stateRef = useRef<PlayerState>('loading');
  const scoreRef = useRef(0);
  const roundsRef = useRef(0);
  const startedAtRef = useRef(0);
  const overAtRef = useRef(0);
  /** Best going into the current round; the live score passing it pops "New best!" once. */
  const priorBestRef = useRef<number | null>(null);
  const celebratedRef = useRef(false);
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const go = useCallback((next: PlayerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const send = useCallback<GameWebViewHandle['send']>((cmd) => webviewRef.current?.send(cmd), [webviewRef]);

  const clearRound = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setResult(null);
    setFeedback(null);
    celebratedRef.current = false;
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number, durationMs: number, roundSeed?: number) => {
      const g = gameRef.current;
      useScoresStore.getState().recordScore(g.id, finalScore);
      const priorBest = priorBestRef.current;
      const isNewBest = finalScore > 0 && (priorBest == null || finalScore > priorBest);
      const best = Math.max(finalScore, priorBest ?? 0);

      track('game_over', { gameId: g.id, score: finalScore, durationMs, isNewBest });
      submitPlay({
        gameId: g.id,
        gameVersion: g.version,
        score: Math.max(0, Math.round(finalScore)),
        durationMs: Math.max(0, Math.round(durationMs)),
        seed: roundSeed,
      });
      haptics.gameOver();

      scoreRef.current = finalScore;
      setScore(finalScore);
      setResult({ score: finalScore, best, isNewBest, previousBest: priorBest });
      overAtRef.current = Date.now();
      go('over');
    },
    [go],
  );

  const handleMessage = useCallback(
    (raw: unknown) => {
      const msg = parseGameMessage(raw);
      if (!msg) return;
      switch (msg.type) {
        case 'ready':
          // Also fires after the WebView process is restarted; the game is back at its start frame.
          send({ type: 'setMuted', muted: useSettingsStore.getState().muted });
          clearRound();
          go('idle');
          break;
        case 'started':
          track('game_start', { gameId: gameRef.current.id, round: roundsRef.current });
          break;
        case 'score':
          if (msg.score !== scoreRef.current) {
            scoreRef.current = msg.score;
            setScore(msg.score);
            haptics.score();
            const prior = priorBestRef.current;
            if (!celebratedRef.current && prior != null && prior > 0 && msg.score > prior) {
              celebratedRef.current = true;
              setFeedback({ id: Date.now(), label: 'New best!' });
              haptics.newBest();
            }
          }
          break;
        case 'gameOver':
          if (stateRef.current === 'playing' || stateRef.current === 'paused') {
            handleGameOver(msg.score, msg.durationMs, msg.seed);
          }
          break;
        case 'error':
          if (__DEV__) console.warn(`[game:${gameRef.current.id}]`, msg.message);
          if (stateRef.current === 'loading') {
            setError(msg.message);
            go('error');
          }
          break;
      }
    },
    [clearRound, go, handleGameOver, send],
  );

  const controls = useMemo(
    () => ({
      start() {
        const s = stateRef.current;
        if (s !== 'idle' && s !== 'over') return;
        if (s === 'over' && Date.now() - overAtRef.current < RETRY_LOCKOUT_MS) return;
        roundsRef.current += 1;
        clearRound();
        const g = gameRef.current;
        const local = useScoresStore.getState().bestByGame[g.id];
        priorBestRef.current = local == null && g.best == null ? null : Math.max(local ?? 0, g.best ?? 0);
        useHistoryStore.getState().recordPlay(g.id);
        startedAtRef.current = Date.now();
        send({ type: 'start', seed });
        go('playing');
      },
      pause() {
        if (stateRef.current !== 'playing') return;
        send({ type: 'pause' });
        go('paused');
      },
      resume() {
        if (stateRef.current !== 'paused') return;
        send({ type: 'resume' });
        go('playing');
      },
      reset() {
        const s = stateRef.current;
        if (s === 'loading' || s === 'error' || s === 'idle') return;
        send({ type: 'reset' });
        clearRound();
        go('idle');
      },
      /** Accessibility / keyboard tap while playing. */
      tap() {
        if (stateRef.current === 'playing') send({ type: 'tap' });
      },
      /** Sends `game_quit` if a round is live. Returns whether it was. */
      quitIfLive(): boolean {
        const s = stateRef.current;
        if (s !== 'playing' && s !== 'paused') return false;
        track('game_quit', {
          gameId: gameRef.current.id,
          score: scoreRef.current,
          durationMs: Date.now() - startedAtRef.current,
        });
        return true;
      },
      reload() {
        setError(null);
        setLoadKey((k) => k + 1);
        go('loading');
      },
      onLoadError(message: string) {
        setError(message);
        go('error');
      },
      roundsPlayed: () => roundsRef.current,
    }),
    [clearRound, go, send, seed],
  );

  const muted = useSettingsStore((s) => s.muted);
  useEffect(() => {
    if (stateRef.current !== 'loading' && stateRef.current !== 'error') send({ type: 'setMuted', muted });
  }, [muted, send]);

  return { state, score, result, feedback, error, loadKey, handleMessage, ...controls };
}

export type GameSession = ReturnType<typeof useGameSession>;
