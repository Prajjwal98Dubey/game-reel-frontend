#!/usr/bin/env node
/**
 * Headless check for every game (FRONTEND.md §15): with a fixed seed, simulate rounds of input
 * at 60 fps and assert the game never throws, stays deterministic, keeps frames within budget,
 * and that its round eventually ends.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');
const W = 390;
const H = 760;
const DT = 1 / 60;
const MAX_SECONDS = 120;
const FRAME_BUDGET_MS = 4;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A Canvas 2D context that accepts every call and property. */
function fakeContext() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === 'createLinearGradient' || prop === 'createRadialGradient' ? () => gradient : () => {},
      set: () => true,
    },
  );
}

function loadGame(id) {
  const code = readFileSync(join(gamesDir, id, 'game.js'), 'utf8');
  let def = null;
  const util = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    roundRect() {},
    verticalGradient() {},
    circle() {},
  };
  const sandbox = { GameReels: { util, muted: true, defineGame: (d) => (def = d) }, Math };
  vm.runInNewContext(code, sandbox, { filename: `${id}/game.js` });
  if (!def) throw new Error(`${id} did not call GameReels.defineGame`);
  return def;
}

/** Plays one round with a seeded "player" that taps and drags at random. */
function simulate(def, seed) {
  const inst = def.create(W, H, mulberry32(seed));
  const input = mulberry32(seed ^ 0x5bd1e995);
  const ctx = fakeContext();
  inst.begin?.();
  let worstFrame = 0;
  let t = 0;
  for (; t < MAX_SECONDS && !inst.over; t += DT) {
    if (input() < 0.04) inst.tap(input() * W, input() * H);
    if (inst.move && input() < 0.2) inst.move(input() * W);
    const start = performance.now();
    inst.update(DT);
    inst.draw(ctx);
    worstFrame = Math.max(worstFrame, performance.now() - start);
  }
  return { score: inst.score, over: inst.over, seconds: t, worstFrame };
}

let failed = 0;
const ids = readdirSync(gamesDir).filter((n) => n !== 'dist' && statSync(join(gamesDir, n)).isDirectory());
for (const id of ids) {
  try {
    const def = loadGame(id);
    const a = simulate(def, 1234);
    const b = simulate(def, 1234);
    if (a.score !== b.score || a.seconds !== b.seconds) throw new Error('not deterministic for a fixed seed');
    if (!a.over) throw new Error(`round did not end within ${MAX_SECONDS}s`);
    if (a.worstFrame > FRAME_BUDGET_MS) throw new Error(`worst frame ${a.worstFrame.toFixed(2)}ms`);
    for (let s = 1; s <= 20; s++) simulate(def, s);
    console.log(
      `✓ ${id}  score=${a.score} ended at ${a.seconds.toFixed(1)}s, worst frame ${a.worstFrame.toFixed(2)}ms`,
    );
  } catch (err) {
    failed++;
    console.error(`✗ ${id}: ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
