import { api } from '@/services/api';
import { ApiError } from '@/services/api/errors';
import { getJSON, setJSON, storageKeys } from '@/services/storage';
import { MAX_EVENTS_PER_BATCH, type EventEnvelope } from '@/shared';

import type { AnalyticsProvider, TrackedEvent } from './types';

const FLUSH_AT = 20;
const FLUSH_INTERVAL_MS = 10_000;
/** Cap the offline backlog so a long offline session cannot grow storage without bound. */
const MAX_BACKLOG = 1000;

export function toEnvelope({ name, props, clientTs }: TrackedEvent): EventEnvelope {
  const { gameId, ...rest } = props as { gameId?: string } & Record<string, unknown>;
  return { type: name, gameId, clientTs, props: rest };
}

/**
 * Batches events to `POST /v1/events`, which the backend uses for the feed.
 * The queue lives in MMKV so events survive restarts and offline periods.
 */
export function createBackendProvider(): AnalyticsProvider {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;

  const read = () => getJSON<EventEnvelope[]>(storageKeys.eventsQueue) ?? [];
  const write = (q: EventEnvelope[]) => setJSON(storageKeys.eventsQueue, q.slice(-MAX_BACKLOG));

  async function drain(): Promise<void> {
    for (
      let batch = read().slice(0, MAX_EVENTS_PER_BATCH);
      batch.length;
      batch = read().slice(0, MAX_EVENTS_PER_BATCH)
    ) {
      try {
        await api.sendEvents({ events: batch });
      } catch (err) {
        if (!(err instanceof ApiError && err.isPermanent)) return;
        // A permanently rejected batch is dropped so it cannot block the queue.
      }
      write(read().slice(batch.length));
    }
  }

  function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!inFlight) {
      inFlight = drain().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }

  return {
    name: 'backend',
    track(event) {
      const queue = [...read(), toEnvelope(event)];
      write(queue);
      if (queue.length >= FLUSH_AT) void flush();
      else if (!timer) timer = setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
    },
    flush,
  };
}
