import PostHog from 'posthog-react-native';

import type { AnalyticsProvider } from './types';

export function createPostHogProvider(apiKey: string): AnalyticsProvider {
  const client = new PostHog(apiKey, { host: 'https://us.i.posthog.com' });
  return {
    name: 'posthog',
    track: ({ name, props }) => client.capture(name, props),
    identify: (playerId) => client.identify(playerId),
    flush: () => client.flush(),
  };
}
