import * as Crypto from 'expo-crypto';

import type { PlayRequest } from '@/shared';
import { getJSON, setJSON, storageKeys } from '@/services/storage';
import { useScoresStore } from '@/stores/scores';

import { api } from './endpoints';
import { ApiError } from './errors';

type QueuedPlay = PlayRequest & { localId: string };

const MAX_QUEUE = 200;
let flushing: Promise<void> | null = null;

function readQueue(): QueuedPlay[] {
  return getJSON<QueuedPlay[]>(storageKeys.playsQueue) ?? [];
}

function writeQueue(queue: QueuedPlay[]): void {
  setJSON(storageKeys.playsQueue, queue.slice(-MAX_QUEUE));
}

/**
 * Score submission is fire-and-forget (FRONTEND.md §9). Every round goes into an MMKV-backed
 * queue first, so rounds played offline are sent the next time a flush succeeds.
 */
export function submitPlay(play: PlayRequest): void {
  writeQueue([...readQueue(), { ...play, localId: Crypto.randomUUID() }]);
  void flushPlays();
}

export function flushPlays(): Promise<void> {
  if (!flushing) {
    flushing = drain().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function drain(): Promise<void> {
  // Re-read after every send: new rounds may be queued while a request is in flight.
  for (let play = readQueue()[0]; play; play = readQueue()[0]) {
    try {
      const { localId: _localId, ...body } = play;
      const res = await api.submitPlay(body);
      useScoresStore.getState().mergeBest(play.gameId, res.best);
    } catch (err) {
      // Permanent rejections are dropped; anything else (offline, 5xx, 429) waits for the next flush.
      if (!(err instanceof ApiError && err.isPermanent)) return;
    }
    writeQueue(readQueue().filter((p) => p.localId !== play.localId));
  }
}
