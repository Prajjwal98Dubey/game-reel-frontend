/*
 * Game Reels SDK runtime shell (protocol v1). Runs inside the WebView / iframe.
 *
 * It owns the canvas, the frame loop, resizing, input and the bridge to the app. A game only
 * implements the contract in FRONTEND.md §7.3 and registers it with `GameReels.defineGame`.
 * The message shapes must match `src/shared/bridge.ts` in the app.
 *
 * Gesture rules (§6.4): the canvas uses `touch-action: pan-y` and never calls preventDefault, so
 * vertical swipes scroll the feed. While playing, taps are delivered on touch-down.
 */
(function () {
  'use strict';

  const V = 1;
  /** Keep animating after game over so falling pieces / crashes finish on screen. */
  const OVER_ANIMATION_MS = 2500;
  const MAX_DT = 0.05;

  // ---------- seeded randomness (games must only use this) ----------

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    return Math.floor(Math.random() * 2147483647);
  }

  // ---------- bridge ----------

  function post(type, extra) {
    const msg = { v: V, type: type };
    if (extra) for (let k in extra) msg[k] = extra[k];
    const data = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(data);
    else if (window.parent && window.parent !== window) window.parent.postMessage(data, '*');
  }

  // ---------- drawing helpers shared by games ----------

  const util = {
    clamp: function (v, a, b) {
      return Math.max(a, Math.min(b, v));
    },
    roundRect: function (ctx, x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    },
    verticalGradient: function (ctx, W, H, top, bottom) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, top);
      g.addColorStop(1, bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    circle: function (ctx, x, y, r, fill) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    },
  };

  // ---------- runtime state ----------

  let def = null;
  let canvas = null;
  let ctx = null;
  let W = 0;
  let H = 0;
  let inst = null;
  let state = 'idle'; // idle | playing | paused | over
  let seed = 0;
  let startedAt = 0;
  let pausedAt = 0;
  let pausedTotal = 0;
  let overAt = 0;
  let lastFrame = 0;
  let raf = 0;
  let lastScore = -1;
  let pointerDown = false;
  let readySent = false;

  function now() {
    return performance.now();
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!w || !h) return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = w;
    H = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function fresh(s) {
    seed = s;
    inst = def.create(W, H, mulberry32(s));
    lastScore = -1;
  }

  function drawLives() {
    if (inst.lives == null) return;
    // Just under the app's score sticker (top 20, ~48 tall) on the game card.
    const y = Math.max(96, H * 0.18);
    for (let i = 0; i < 3; i++) {
      util.circle(ctx, W / 2 - 16 + i * 16, y, 5, i < inst.lives ? '#F6F5FA' : 'rgba(246,245,250,.25)');
    }
  }

  function render() {
    inst.draw(ctx);
    if (state !== 'idle') drawLives();
  }

  function emitScore() {
    if (inst.score !== lastScore) {
      lastScore = inst.score;
      post('score', { score: inst.score });
    }
  }

  function end() {
    state = 'over';
    overAt = now();
    pointerDown = false;
    post('gameOver', { score: inst.score, durationMs: Math.round(overAt - startedAt - pausedTotal), seed: seed });
  }

  function frame(t) {
    raf = 0;
    const dt = Math.min(MAX_DT, Math.max(0, (t - lastFrame) / 1000));
    lastFrame = t;
    if (state === 'playing') {
      inst.update(dt);
      render();
      emitScore();
      if (inst.over) end();
    } else if (state === 'over' && t - overAt < OVER_ANIMATION_MS) {
      inst.update(dt);
      render();
    } else {
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function loop() {
    if (!raf) {
      lastFrame = now();
      raf = requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // ---------- commands from the app ----------

  const commands = {
    start: function (msg) {
      if (state === 'playing' || state === 'paused') return;
      stop();
      fresh(typeof msg.seed === 'number' ? msg.seed : randomSeed());
      state = 'playing';
      startedAt = now();
      pausedTotal = 0;
      if (inst.begin) inst.begin();
      render();
      post('started');
      loop();
    },
    pause: function () {
      if (state !== 'playing') return;
      state = 'paused';
      pausedAt = now();
      pointerDown = false;
      stop();
    },
    resume: function () {
      if (state !== 'paused') return;
      pausedTotal += now() - pausedAt;
      state = 'playing';
      loop();
    },
    reset: function () {
      stop();
      state = 'idle';
      pointerDown = false;
      fresh(randomSeed());
      render();
    },
    tap: function () {
      if (state === 'playing') inst.tap(W / 2, H / 2);
    },
    setMuted: function (msg) {
      api.muted = !!msg.muted;
      if (inst && inst.setMuted) inst.setMuted(api.muted);
    },
  };

  function receive(raw) {
    let msg = raw;
    if (typeof raw === 'string') {
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
    }
    if (!msg || msg.v !== V || !commands[msg.type] || !def) return;
    try {
      commands[msg.type](msg);
    } catch (e) {
      post('error', { message: String((e && e.message) || e) });
    }
  }

  // ---------- input ----------

  function point(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function bindInput() {
    canvas.addEventListener('pointerdown', function (e) {
      if (state !== 'playing') return;
      pointerDown = true;
      const p = point(e);
      inst.tap(p.x, p.y);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (state !== 'playing' || !inst.move) return;
      if (pointerDown || e.pointerType === 'mouse') inst.move(point(e).x);
    });
    const release = function () {
      pointerDown = false;
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  // ---------- boot ----------

  function boot() {
    canvas = document.getElementById('game');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'game';
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext('2d');
    bindInput();

    const tryReady = function () {
      if (readySent || !resize()) return;
      fresh(randomSeed());
      render();
      readySent = true;
      post('ready');
    };

    window.addEventListener('resize', function () {
      if (!readySent) return tryReady();
      if (!resize()) return;
      if (state === 'idle') fresh(seed);
      render();
    });
    tryReady();
  }

  window.addEventListener('message', function (e) {
    receive(e.data);
  });
  // Android WebView delivers postMessage on document.
  document.addEventListener('message', function (e) {
    receive(e.data);
  });
  window.addEventListener('error', function (e) {
    post('error', { message: String(e.message || 'Script error') });
  });

  const api = {
    version: V,
    muted: true,
    util: util,
    defineGame: function (game) {
      if (def) throw new Error('defineGame called twice');
      def = game;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
      else boot();
      return game;
    },
  };

  window.GameReels = api;
  window.GameReelsBridge = { receive: receive };
})();
