// Stack: drop each block on the last one; the overhang is cut off.
GameReels.defineGame({
  id: 'stack',
  create: function (W, H) {
    let u = GameReels.util;
    let g = { score: 0, over: false };
    let bh = Math.round(u.clamp(H * 0.045, 16, 32));
    let baseY = H * 0.72;
    let blocks = [{ x: W * 0.2, w: W * 0.6 }];
    let falling = [];
    let cur;
    let dir = 1;
    let speed = W * 0.5;
    let cam = 0;
    let flash = 0;
    let top = function (i) {
      return baseY - (i + 1) * bh;
    };
    let col = function (i, a) {
      return 'hsla(' + ((28 + i * 7) % 360) + ', 90%, ' + (58 + (i % 2) * 5) + '%, ' + (a == null ? 1 : a) + ')';
    };
    let spawn = function () {
      let w = blocks[blocks.length - 1].w;
      dir = blocks.length % 2 ? 1 : -1;
      cur = { x: dir > 0 ? 0 : W - w, w: w };
    };
    spawn();

    g.tap = function () {
      if (g.over) return;
      let t = blocks[blocks.length - 1];
      let i = blocks.length;
      let l = Math.max(cur.x, t.x);
      let r = Math.min(cur.x + cur.w, t.x + t.w);
      if (Math.abs(cur.x - t.x) < W * 0.012) {
        // Near-perfect drop snaps into place.
        l = t.x;
        r = t.x + t.w;
        flash = 1;
      } else {
        if (cur.x < t.x) falling.push({ x: cur.x, w: Math.min(t.x - cur.x, cur.w), y: top(i), vy: 0, i: i });
        let ce = cur.x + cur.w;
        let te = t.x + t.w;
        if (ce > te) {
          let fx = Math.max(te, cur.x);
          falling.push({ x: fx, w: ce - fx, y: top(i), vy: 0, i: i });
        }
      }
      if (r - l <= 1) {
        g.over = true;
        return;
      }
      blocks.push({ x: l, w: r - l });
      g.score++;
      speed = Math.min(speed * 1.04, W * 1.6);
      spawn();
    };

    g.update = function (dt) {
      if (!g.over) {
        cur.x += dir * speed * dt;
        if (cur.x < 0) {
          cur.x = 0;
          dir = 1;
        }
        if (cur.x + cur.w > W) {
          cur.x = W - cur.w;
          dir = -1;
        }
      }
      for (let k = 0; k < falling.length; k++) {
        falling[k].vy += H * 2.4 * dt;
        falling[k].y += falling[k].vy * dt;
      }
      let target = Math.max(0, (blocks.length + 1) * bh - (baseY - H * 0.38));
      cam += (target - cam) * Math.min(1, dt * 6);
      flash = Math.max(0, flash - dt * 2.5);
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#2B1840', '#5A2A4A');
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.fillRect(0, baseY + cam, W, H);
      for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        let y = top(i) + cam;
        if (y > H || y < -bh) continue;
        ctx.fillStyle = col(i);
        ctx.fillRect(b.x, y, b.w, bh - 2);
      }
      if (flash > 0) {
        let lb = blocks[blocks.length - 1];
        ctx.strokeStyle = 'rgba(255,255,255,' + flash + ')';
        ctx.lineWidth = 3;
        ctx.strokeRect(lb.x - 3, top(blocks.length - 1) + cam - 3, lb.w + 6, bh + 4);
      }
      if (!g.over) {
        ctx.fillStyle = col(blocks.length);
        ctx.fillRect(cur.x, top(blocks.length) + cam, cur.w, bh - 2);
      }
      for (let f = 0; f < falling.length; f++) {
        ctx.fillStyle = col(falling[f].i, 0.85);
        ctx.fillRect(falling[f].x, falling[f].y + cam, falling[f].w, bh - 2);
      }
    };
    return g;
  },
});
