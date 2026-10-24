/**
 * Feature flags. Every non-MVP feature ships behind one of these.
 * Later they can be overridden by `GET /v1/config`.
 */
export const flags = {
  share: false,
  dareLinks: false,
  leaderboards: false,
  dailyChallenge: false,
} as const;

export type FlagName = keyof typeof flags;

export function isEnabled(flag: FlagName): boolean {
  return flags[flag];
}
