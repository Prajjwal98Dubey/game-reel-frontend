// Mirror: drag to steer two orbs that move as reflections of each other. Walls fall with gaps,
// and some gaps only fit one orb. Both must get through.
GameReels.defineGame({
  id: 'mirror',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let rnd = function (a, b) {
      return a + rng() * (b - a);
    };
    let g = { score: 0, over: false };
    let r = 12;
    let oy = H * 0.72;
    let T = 18;
    let x = W * 0.3;
    let tx = x;
    let v = 170;
    let rows = [];
    let nextIn = 0;
    let crash = null;

    let minX = r + 4;
    let maxX = W - r - 4;

    // Free intervals for a new wall: the true gaps at s and W - s, plus a decoy that fits only one orb.
    let makeRow = function () {
      let gap = Math.max(2 * r + 18, 2 * r + 60 - g.score * 1.4);
      let s = rnd(minX + gap / 2 - r, W / 2 - 4);
      let d = rnd(gap / 2, W - gap / 2);
      let free = [
        [s - gap / 2, s + gap / 2],
        [W - s - gap / 2, W - s + gap / 2],
        [d - gap / 2, d + gap / 2],
      ].sort(function (a, b) {
        return a[0] - b[0];
      });
      let merged = [free[0].slice()];
      for (let i = 1; i < free.length; i++) {
        let last = merged[merged.length - 1];
        if (free[i][0] <= last[1]) last[1] = Math.max(last[1], free[i][1]);
        else merged.push(free[i].slice());
      }
      return { y: -T, free: merged, passed: false };
    };

    let fits = function (row, cxp) {
      for (let i = 0; i < row.free.length; i++) {
        if (cxp - r >= row.free[i][0] && cxp + r <= row.free[i][1]) return true;
      }
      return false;
    };

    g.move = function (px) {
      tx = px;
    };
    g.tap = function (px) {
      tx = px;
    };

    g.update = function (dt) {
      if (g.over) {
        if (crash) crash.a += dt;
        return;
      }
      x += (u.clamp(tx, minX, maxX) - x) * Math.min(1, dt * 14);
      v = Math.min(360, v + dt * 4);
      nextIn -= v * dt;
      if (nextIn <= 0) {
        rows.push(makeRow());
        nextIn = Math.max(230, 330 - g.score * 3);
      }
      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        row.y += v * dt;
        if (!row.passed && Math.abs(row.y - oy) < T / 2 + r - 2) {
          let a = fits(row, x);
          let b = fits(row, W - x);
          if (!a || !b) {
            g.over = true;
            crash = { x: a ? W - x : x, a: 0 };
            return;
          }
        }
        if (!row.passed && row.y - T / 2 > oy + r) {
          row.passed = true;
          g.score++;
        }
      }
      rows = rows.filter(function (row) {
        return row.y < H + T;
      });
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#14202B', '#1F3A4A');
      // Mirror axis.
      ctx.strokeStyle = 'rgba(246,245,250,.12)';
      ctx.lineWidth = 2;
      for (let yy = 0; yy < H; yy += 22) {
        ctx.beginPath();
        ctx.moveTo(W / 2, yy);
        ctx.lineTo(W / 2, yy + 11);
        ctx.stroke();
      }
      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let start = 0;
        ctx.fillStyle = row.passed ? 'rgba(246,245,250,.35)' : '#F6F5FA';
        for (let k = 0; k <= row.free.length; k++) {
          let end = k < row.free.length ? row.free[k][0] : W;
          if (end > start) {
            u.roundRect(ctx, start, row.y - T / 2, end - start, T, 4);
            ctx.fill();
          }
          if (k < row.free.length) start = row.free[k][1];
        }
      }
      // Tether between the twins.
      ctx.strokeStyle = 'rgba(246,245,250,.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(W - x, oy);
      ctx.stroke();
      u.circle(ctx, x, oy, r, '#5BC0FF');
      u.circle(ctx, W - x, oy, r, '#FF5C8A');
      u.circle(ctx, x - 4, oy - 4, 3.5, 'rgba(255,255,255,.7)');
      u.circle(ctx, W - x - 4, oy - 4, 3.5, 'rgba(255,255,255,.7)');
      if (crash) {
        ctx.strokeStyle = '#FFD23F';
        ctx.globalAlpha = Math.max(0, 1 - crash.a / 0.6);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(crash.x, oy, r + crash.a * 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };
    return g;
  },
});
