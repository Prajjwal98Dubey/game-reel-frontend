import { env } from '@/config/env';
import type { EventName, EventProps } from '@/shared';

import { createBackendProvider } from './backendProvider';
import { createPostHogProvider } from './posthogProvider';
import type { AnalyticsProvider } from './types';

export type { AnalyticsProvider, TrackedEvent } from './types';

const devLogger: AnalyticsProvider = {
  name: 'console',
  track: ({ name, props }) => console.log(`[track] ${name}`, props),
};

let providers: AnalyticsProvider[] | null = null;

function getProviders(): AnalyticsProvider[] {
  if (!providers) {
    providers = [createBackendProvider()];
    if (env.posthogKey) providers.push(createPostHogProvider(env.posthogKey));
    if (__DEV__) providers.push(devLogger);
  }
  return providers;
}

/** Replaces the providers (tests, or a different analytics vendor). */
export function setAnalyticsProviders(next: AnalyticsProvider[]): void {
  providers = next;
}

/** The only way features send analytics. Never throws. */
export function track<E extends EventName>(name: E, props: EventProps[E]): void {
  const event = { name, props, clientTs: new Date().toISOString() };
  for (const p of getProviders()) {
    try {
      p.track(event);
    } catch (err) {
      if (__DEV__) console.warn(`[analytics] ${p.name} failed`, err);
    }
  }
}

export function identify(playerId: string): void {
  for (const p of getProviders()) p.identify?.(playerId);
}

export async function flushAnalytics(): Promise<void> {
  await Promise.all(getProviders().map((p) => p.flush?.().catch(() => undefined)));
}
