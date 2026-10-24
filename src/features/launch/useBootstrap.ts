import { useEffect, useState } from 'react';

import { bootstrap, type BootPhase } from './bootstrap';

/** Long enough for the logo animation to land, so a fast network never just flashes it. */
export const MIN_LAUNCH_MS = 1400;
/** Never hold the player on the launch screen longer than this, even on a slow network. */
export const MAX_LAUNCH_MS = 8000;

/** Runs the bootstrap once; `done` turns true after it finishes (bounded by the min/max above). */
export function useBootstrap(): { phase: BootPhase; done: boolean } {
  const [phase, setPhase] = useState<BootPhase>('connecting');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const minWait = new Promise((r) => setTimeout(r, MIN_LAUNCH_MS));
    const maxWait = new Promise((r) => setTimeout(r, MAX_LAUNCH_MS));
    const work = bootstrap((p) => !cancelled && setPhase(p)).catch(() => undefined);

    void Promise.race([Promise.all([work, minWait]), maxWait]).then(() => {
      if (!cancelled) setDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { phase, done };
}
