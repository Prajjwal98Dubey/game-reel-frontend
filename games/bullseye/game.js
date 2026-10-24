// Bullseye: stop the needle inside the zone. The zone shrinks with every hit.
GameReels.defineGame({
  id: 'bullseye',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let rnd = function (a, b) {
      return a + rng() * (b - a);
    };
    let g = { score: 0, over: false };
    let tx = W * 0.12;
    let tw = W * 0.76;
    let th = u.clamp(H * 0.05, 26, 40);
    let ty = H * 0.44;
    let p = 0;
    let dir = 1;
    let speed = 0.75;
    let zw = 0.28;
    let zc = 0.5;
    let ok = 0;
    let bad = 0;
    let t = 0;

    g.tap = function () {
      if (g.over) return;
      if (Math.abs(p - zc) <= zw / 2 + 0.01) {
        g.score++;
        speed = Math.min(speed * 1.08, 3);
        ok = 1;
        zw = Math.max(0.07, zw * 0.9);
        zc = rnd(zw / 2, 1 - zw / 2);
      } else {
        g.over = true;
        bad = 1;
      }
    };

    g.update = function (dt) {
      t += dt;
      if (!g.over) {
        p += dir * speed * dt;
        if (p > 1) {
          p = 1;
          dir = -1;
        }
        if (p < 0) {
          p = 0;
          dir = 1;
        }
      }
      ok = Math.max(0, ok - dt * 3);
      bad = Math.max(0, bad - dt * 1.2);
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#132E20', '#2C5A2B');
      let step = W * 0.16;
      ctx.strokeStyle = 'rgba(214,255,99,.09)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(W / 2, ty + th / 2, i * step + ((t * 14) % step), 0, Math.PI * 2);
        ctx.stroke();
      }
      u.roundRect(ctx, tx, ty, tw, th, th / 2);
      ctx.fillStyle = 'rgba(0,0,0,.38)';
      ctx.fill();
      u.roundRect(ctx, tx + (zc - zw / 2) * tw, ty, zw * tw, th, th / 2);
      ctx.fillStyle = ok > 0 ? '#FFFFFF' : '#D6FF63';
      ctx.fill();
      let nx = tx + p * tw;
      let nc = bad > 0 ? '#FF5A5F' : '#FFFFFF';
      ctx.fillStyle = nc;
      ctx.fillRect(nx - 2, ty - th * 0.8, 4, th * 2.6);
      u.circle(ctx, nx, ty - th * 0.8, 8, nc);
      if (bad > 0) {
        ctx.fillStyle = 'rgba(255,60,70,' + bad * 0.25 + ')';
        ctx.fillRect(0, 0, W, H);
      }
    };
    return g;
  },
});
