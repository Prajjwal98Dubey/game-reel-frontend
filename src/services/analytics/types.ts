import type { EventName, EventProps } from '@/shared';

export type TrackedEvent<E extends EventName = EventName> = {
  name: E;
  props: EventProps[E];
  /** ISO timestamp taken on the device when the event happened. */
  clientTs: string;
};

/** A destination for events. Swapping PostHog for another tool means writing one of these. */
export interface AnalyticsProvider {
  readonly name: string;
  track(event: TrackedEvent): void;
  identify?(playerId: string): void;
  flush?(): Promise<void>;
}
