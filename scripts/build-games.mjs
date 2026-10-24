#!/usr/bin/env node
/**
 * Builds every game in `games/<id>/` into a single-file bundle:
 *   games/dist/<id>/<version>/index.html   runtime shell + game, inlined
 *   games/dist/<id>/<version>/thumb.svg    catalogue / feed thumbnail
 *   games/dist/catalog.json                manifests consumed by the mock API
 *
 * Fails if a bundle breaks the size budget (FRONTEND.md §7.4).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');
const distDir = join(gamesDir, 'dist');
const TARGET_GZIP = 300 * 1024;
const LIMIT_GZIP = 500 * 1024;

const runtime = readFileSync(join(root, 'game-sdk', 'runtime.js'), 'utf8');
const template = readFileSync(join(root, 'game-sdk', 'template.html'), 'utf8');

const escapeXml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

function thumbnail(meta) {
  const { top, bottom, accent } = meta.theme;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
  <rect width="360" height="480" fill="url(#g)"/>
  <circle cx="180" cy="200" r="70" fill="${accent}" opacity="0.9"/>
  <circle cx="180" cy="200" r="96" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="6"/>
</svg>
`;
}

function build(id) {
  const dir = join(gamesDir, id);
  const meta = JSON.parse(readFileSync(join(dir, 'game.json'), 'utf8'));
  if (meta.id !== id) throw new Error(`games/${id}/game.json has id "${meta.id}"`);
  const code = readFileSync(join(dir, 'game.js'), 'utf8');

  if (/\bMath\.random\b/.test(code)) throw new Error(`${id}: use the seeded rng from create(), not Math.random`);
  if (/\b(fetch|XMLHttpRequest|WebSocket)\b/.test(code)) throw new Error(`${id}: bundles must not use the network`);

  const html = template
    .replace('{{TITLE}}', escapeXml(meta.name))
    .replace('{{BACKGROUND}}', meta.theme.top)
    .replace('{{RUNTIME}}', () => runtime)
    .replace('{{GAME}}', () => code);

  const gz = gzipSync(html).length;
  if (gz > LIMIT_GZIP) throw new Error(`${id}: ${gz} bytes gzipped exceeds the 500 KB limit`);
  if (gz > TARGET_GZIP) console.warn(`! ${id}: ${gz} bytes gzipped is over the 300 KB target`);

  const out = join(distDir, id, meta.version);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.html'), html);
  // A game may ship its own art (games/<id>/thumb.svg); otherwise a plain themed card is generated.
  const art = join(dir, 'thumb.svg');
  writeFileSync(join(out, 'thumb.svg'), existsSync(art) ? readFileSync(art, 'utf8') : thumbnail(meta));
  console.log(`✓ ${id}@${meta.version}  ${(gz / 1024).toFixed(1)} KB gzipped`);

  const { theme: _theme, ...manifest } = meta;
  return manifest;
}

rmSync(distDir, { recursive: true, force: true });
const ids = readdirSync(gamesDir).filter((name) => name !== 'dist' && statSync(join(gamesDir, name)).isDirectory());
const catalog = ids.map(build);
mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, 'catalog.json'), JSON.stringify(catalog, null, 2));
console.log(`Built ${catalog.length} games into games/dist`);
