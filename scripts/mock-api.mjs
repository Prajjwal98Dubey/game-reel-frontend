#!/usr/bin/env node
/**
 * Development stand-in for the Game Reels API (REF_BACKEND.md §6), so the app runs before
 * the real backend exists. In-memory, zero dependencies. Also serves the built game bundles
 * as the "CDN" at /cdn/games/<id>/<version>/.
 *
 *   npm run mock-api            # builds games, then listens on :3000
 *   PORT=4000 node scripts/mock-api.mjs
 *   MOCK_LATENCY_MS=400 ...     # simulate a slow network
 *   MOCK_FEED_END=8 ...         # end the feed after 8 items (tests the app's endless fallback)
 */
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'games', 'dist');
const PORT = Number(process.env.PORT ?? 3000);
const LATENCY = Number(process.env.MOCK_LATENCY_MS ?? 0);
const FEED_END = Number(process.env.MOCK_FEED_END ?? 0);
const CURSOR_SECRET = 'mock-cursor-secret';
const EVENT_TYPES = new Set([
  'game_view',
  'game_start',
  'game_over',
  'game_quit',
  'game_skip',
  'game_like',
  'game_unlike',
  'game_save',
  'game_unsave',
  'tab_view',
]);

const catalogPath = join(distDir, 'catalog.json');
if (!existsSync(catalogPath)) {
  console.error('games/dist/catalog.json not found. Run `npm run games:build` first.');
  process.exit(1);
}
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

// ---------- in-memory state ----------

const playersByDevice = new Map(); // deviceId -> playerId
const tokens = new Map(); // token -> playerId
const bests = new Map(); // `${playerId}:${gameId}` -> score
let eventCount = 0;

// ---------- helpers ----------

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'VALIDATION_FAILED', 'Body is not valid JSON');
  }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

function publishedFor(appVersion) {
  return catalog.filter((g) => compareVersions(appVersion ?? '0.0.0', g.minAppVersion) >= 0);
}

function manifest(game, req, playerId) {
  const base = `http://${req.headers.host}/cdn/games/${game.id}/${game.version}`;
  const { maxScorePerSec: _m, ...rest } = game;
  return {
    ...rest,
    bundleUrl: `${base}/index.html`,
    thumbnailUrl: `${base}/thumb.svg`,
    best: bests.get(`${playerId}:${game.id}`) ?? null,
  };
}

function auth(req) {
  const header = req.headers.authorization ?? '';
  const playerId = tokens.get(header.replace(/^Bearer\s+/i, ''));
  if (!playerId) throw new HttpError(401, 'UNAUTHORIZED', 'Missing or invalid token');
  return playerId;
}

// Signed, opaque cursors: base64url(JSON) + "." + HMAC.
function encodeCursor(data) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', CURSOR_SECRET).update(body).digest('base64url').slice(0, 16);
  return `${body}.${sig}`;
}
function decodeCursor(cursor) {
  if (!cursor) return null;
  const [body, sig] = cursor.split('.');
  const expected = createHmac('sha256', CURSOR_SECRET)
    .update(body ?? '')
    .digest('base64url')
    .slice(0, 16);
  if (sig !== expected) throw new HttpError(400, 'INVALID_CURSOR', 'Cursor is invalid');
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

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

/** ShuffledFeedStrategy (REF_BACKEND.md §7.2): repeated seeded shuffles, never the same game twice in a row. */
function feedSlice(games, seed, offset, limit) {
  const rng = mulberry32(seed);
  const seq = [];
  while (seq.length < offset + limit) {
    const deck = games.slice();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (deck.length > 1 && seq.length && deck[0].id === seq[seq.length - 1].id) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
    seq.push(...deck);
  }
  return seq.slice(offset, offset + limit);
}

function clampLimit(value, fallback, max) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : fallback;
}

// ---------- routes ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.js': 'text/javascript',
};

async function route(req, res, url) {
  const { pathname, searchParams } = url;
  const appVersion = req.headers['x-app-version'];

  if (req.method === 'GET' && (pathname === '/health' || pathname === '/health/ready')) {
    return send(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && pathname.startsWith('/cdn/games/')) {
    const rel = normalize(pathname.slice('/cdn/games/'.length)).replace(/^(\.\.[/\\])+/, '');
    const file = join(distDir, rel);
    if (!file.startsWith(distDir) || !existsSync(file)) throw new HttpError(404, 'NOT_FOUND', 'No such file');
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    return res.end(readFileSync(file));
  }

  if (req.method === 'POST' && pathname === '/v1/players/guest') {
    const { deviceId } = await readBody(req);
    if (typeof deviceId !== 'string' || !deviceId) {
      throw new HttpError(400, 'VALIDATION_FAILED', 'deviceId is required', [
        { path: 'deviceId', message: 'Required' },
      ]);
    }
    let playerId = playersByDevice.get(deviceId);
    if (!playerId) {
      playerId = randomUUID();
      playersByDevice.set(deviceId, playerId);
    }
    const token = createHash('sha256').update(`${playerId}:${randomUUID()}`).digest('hex');
    tokens.set(token, playerId);
    return send(res, 200, { playerId, token, expiresIn: 2592000 });
  }

  const playerId = auth(req);

  if (req.method === 'GET' && pathname === '/v1/games') {
    const tag = searchParams.get('tag');
    const limit = clampLimit(searchParams.get('limit'), 24, 50);
    const offset = decodeCursor(searchParams.get('cursor'))?.offset ?? 0;
    const games = publishedFor(appVersion).filter((g) => !tag || g.tags.includes(tag));
    const page = games.slice(offset, offset + limit);
    const nextCursor = offset + limit < games.length ? encodeCursor({ offset: offset + limit }) : null;
    return send(res, 200, { items: page.map((g) => manifest(g, req, playerId)), nextCursor });
  }

  const gameMatch = pathname.match(/^\/v1\/games\/([^/]+)$/);
  if (req.method === 'GET' && gameMatch) {
    const id = decodeURIComponent(gameMatch[1]);
    const game = catalog.find((g) => g.id === id);
    if (!game) throw new HttpError(404, 'GAME_NOT_FOUND', `No published game with id '${id}'.`);
    return send(res, 200, manifest(game, req, playerId));
  }

  if (req.method === 'GET' && pathname === '/v1/feed') {
    const limit = clampLimit(searchParams.get('limit'), 10, 30);
    const cursor = decodeCursor(searchParams.get('cursor')) ?? { seed: Math.floor(Math.random() * 2 ** 31), offset: 0 };
    const games = publishedFor(appVersion);
    if (!games.length) return send(res, 200, { items: [], nextCursor: null });
    const items = feedSlice(games, cursor.seed, cursor.offset, limit).map((g) => ({
      kind: 'game',
      game: manifest(g, req, playerId),
    }));
    const next = cursor.offset + limit;
    if (FEED_END && next >= FEED_END)
      return send(res, 200, { items: items.slice(0, Math.max(0, FEED_END - cursor.offset)), nextCursor: null });
    return send(res, 200, { items, nextCursor: encodeCursor({ seed: cursor.seed, offset: next }) });
  }

  if (req.method === 'POST' && pathname === '/v1/plays') {
    const body = await readBody(req);
    const issues = [];
    if (typeof body.gameId !== 'string') issues.push({ path: 'gameId', message: 'Required' });
    if (typeof body.gameVersion !== 'string') issues.push({ path: 'gameVersion', message: 'Required' });
    if (!Number.isInteger(body.score) || body.score < 0)
      issues.push({ path: 'score', message: 'Non-negative integer' });
    if (!Number.isInteger(body.durationMs) || body.durationMs < 0)
      issues.push({ path: 'durationMs', message: 'Non-negative integer' });
    if (issues.length) throw new HttpError(400, 'VALIDATION_FAILED', 'Invalid play', issues);

    const game = catalog.find((g) => g.id === body.gameId);
    // PlausibilityScoreValidator (§8.1): flagged plays are accepted but never update the best.
    const flagged =
      !game ||
      game.version !== body.gameVersion ||
      body.durationMs < 1000 ||
      body.durationMs > 600000 ||
      body.score > game.maxScorePerSec * (body.durationMs / 1000) + 3;
    const key = `${playerId}:${body.gameId}`;
    const prev = bests.get(key) ?? null;
    const isNewBest = !flagged && (prev == null || body.score > prev);
    if (isNewBest) bests.set(key, body.score);
    console.log(`  play ${body.gameId} score=${body.score} ${body.durationMs}ms${flagged ? ' FLAGGED' : ''}`);
    return send(res, 200, { best: bests.get(key) ?? 0, isNewBest });
  }

  if (req.method === 'POST' && pathname === '/v1/events') {
    const { events } = await readBody(req);
    if (!Array.isArray(events) || events.length > 100) {
      throw new HttpError(400, 'VALIDATION_FAILED', 'events must be an array of at most 100 items');
    }
    const unknown = events.filter((e) => !EVENT_TYPES.has(e?.type));
    if (unknown.length) throw new HttpError(400, 'VALIDATION_FAILED', `Unknown event type '${unknown[0]?.type}'`);
    eventCount += events.length;
    console.log(`  events +${events.length} (${events.map((e) => e.type).join(', ')}) total=${eventCount}`);
    return send(res, 202);
  }

  throw new HttpError(404, 'NOT_FOUND', `No route for ${req.method} ${pathname}`);
}

const server = createServer(async (req, res) => {
  const requestId = randomUUID();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-App-Version');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('X-Request-Id', requestId);
  if (req.method === 'OPTIONS') return send(res, 204);

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (!url.pathname.startsWith('/cdn/')) console.log(`${req.method} ${url.pathname}${url.search}`);
  if (LATENCY) await new Promise((r) => setTimeout(r, LATENCY));

  try {
    await route(req, res, url);
  } catch (err) {
    if (err instanceof HttpError) {
      return send(res, err.status, {
        error: { code: err.code, message: err.message, requestId, details: err.details },
      });
    }
    console.error(err);
    send(res, 500, { error: { code: 'INTERNAL', message: 'Internal error', requestId } });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock Game Reels API on http://0.0.0.0:${PORT} (${catalog.length} games)`);
});
