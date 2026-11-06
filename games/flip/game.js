// Flip: a runner on a corridor floor. Tap to flip gravity and run on the ceiling instead.
// Clear the blocks; touching one ends the run.
GameReels.defineGame({
  id: 'flip',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let rnd = function (a, b) {
      return a + rng() * (b - a);
    };
    let g = { score: 0, over: false };
    let ceil = H * 0.24;
    let floor = H * 0.74;
    let span = floor - ceil;
    let s = 24;
    let px = W * 0.2;
    let py = floor - s;
    let vy = 0;
    let grav = 1;
    let pull = u.clamp(span * 9, 2600, 5200);
    let speed = 210;
    let blocks = [];
    let nextIn = W * 0.6;
    let scroll = 0;
    let trail = [];
    let shards = [];
    let spin = 0;

    let addBlock = function () {
      let side = rng() < 0.5 ? 1 : -1;
      let h = rnd(span * 0.18, span * 0.42);
      let w = rnd(26, 44);
      blocks.push({ x: W + 10, w: w, h: h, side: side, passed: false });
      // Later on, a block may come with a partner on the other side just behind it.
      // Returns how much extra room the pattern takes, so the next block keeps its distance.
      if (g.score > 8 && rng() < 0.35) {
        let off = w + speed * rnd(0.5, 0.7);
        blocks.push({ x: W + 10 + off, w: rnd(26, 40), h: rnd(span * 0.18, span * 0.35), side: -side, passed: false });
        return off + 40;
      }
      return 0;
    };
    let rect = function (b) {
      return b.side === 1 ? { y: floor - b.h, h: b.h } : { y: ceil, h: b.h };
    };

    g.tap = function () {
      if (g.over) return;
      grav = -grav;
      vy = grav * 120;
    };

    g.update = function (dt) {
      for (let i = 0; i < shards.length; i++) {
        let sh = shards[i];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.vy += 900 * dt;
        sh.a += dt;
      }
      shards = shards.filter(function (sh) {
        return sh.a < 1;
      });
      if (g.over) return;

      speed = Math.min(430, speed + dt * 5);
      scroll += speed * dt;
      vy += grav * pull * dt;
      py += vy * dt;
      if (py > floor - s) {
        py = floor - s;
        vy = 0;
      } else if (py < ceil) {
        py = ceil;
        vy = 0;
      }
      spin += ((grav === 1 ? 0 : Math.PI) - spin) * Math.min(1, dt * 14);
      trail.push({ x: px, y: py });
      if (trail.length > 6) trail.shift();

      if ((nextIn -= speed * dt) <= 0) {
        nextIn = addBlock() + speed * rnd(0.7, 1.25) + 40;
      }
      for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        b.x -= speed * dt;
        let r = rect(b);
        if (px + s > b.x + 3 && px < b.x + b.w - 3 && py + s > r.y + 3 && py < r.y + r.h - 3) {
          g.over = true;
          for (let k = 0; k < 14; k++) {
            shards.push({ x: px + s / 2, y: py + s / 2, vx: rnd(-200, 120), vy: rnd(-320, 120), a: 0 });
          }
          return;
        }
        if (!b.passed && b.x + b.w < px) {
          b.passed = true;
          g.score++;
        }
      }
      blocks = blocks.filter(function (b) {
        return b.x + b.w > -10;
      });
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#2A1A12', '#5A3220');
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(0, 0, W, ceil);
      ctx.fillRect(0, floor, W, H - floor);
      // Rails with scrolling ticks for a sense of speed.
      ctx.fillStyle = '#FF9F1C';
      ctx.fillRect(0, ceil - 4, W, 4);
      ctx.fillRect(0, floor, W, 4);
      ctx.fillStyle = 'rgba(255,159,28,.35)';
      let off = scroll % 40;
      for (let x = -off; x < W; x += 40) {
        ctx.fillRect(x, ceil - 14, 14, 6);
        ctx.fillRect(x, floor + 8, 14, 6);
      }
      for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        let r = rect(b);
        u.roundRect(ctx, b.x, r.y, b.w, r.h, 5);
        ctx.fillStyle = '#F6F5FA';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,90,95,.85)';
        ctx.fillRect(b.x + 4, b.side === 1 ? r.y + 4 : r.y + r.h - 10, b.w - 8, 6);
      }
      if (!g.over) {
        for (let k = 0; k < trail.length; k++) {
          ctx.globalAlpha = (k / trail.length) * 0.3;
          u.roundRect(ctx, trail[k].x - (trail.length - k) * 5, trail[k].y, s, s, 6);
          ctx.fillStyle = '#FFD23F';
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        u.roundRect(ctx, px, py, s, s, 6);
        ctx.fillStyle = '#FFD23F';
        ctx.fill();
        // Eye on the side facing away from the rail, so the runner visibly turns over.
        let eyeY = spin > Math.PI / 2 ? py + s - 11 : py + 7;
        u.circle(ctx, px + s - 7, eyeY + 2, 3, '#2A1A12');
      }
      for (let i = 0; i < shards.length; i++) {
        let sh = shards[i];
        ctx.globalAlpha = 1 - sh.a;
        ctx.fillStyle = '#FFD23F';
        ctx.fillRect(sh.x, sh.y, 6, 6);
      }
      ctx.globalAlpha = 1;
    };
    return g;
  },
});
