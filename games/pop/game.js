// Pop: pop every bubble before its ring runs out. Three escapes end the round.
GameReels.defineGame({
  id: 'pop',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let rnd = function (a, b) {
      return a + rng() * (b - a);
    };
    let g = { score: 0, over: false, lives: 3 };
    let cols = ['#FF6A8A', '#FFD23F', '#7BE0B5', '#9B8CFF', '#5BC0FF'];
    let maxR = u.clamp(W * 0.11, 30, 52);
    let bubbles = [];
    let rings = [];
    let spawnT = 0.2;
    let rate = 0.85;
    let life = 1.9;
    let radius = function (b) {
      return maxR * Math.min(1, b.a / 0.18) * Math.min(1, (b.life - b.a) / (b.life * 0.25));
    };

    g.tap = function (x, y) {
      if (g.over) return;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];
        if (Math.hypot(x - b.x, y - b.y) < radius(b) + 12) {
          bubbles.splice(i, 1);
          g.score++;
          rings.push({ x: b.x, y: b.y, c: b.c, a: 0 });
          return;
        }
      }
    };

    g.update = function (dt) {
      for (let r = 0; r < rings.length; r++) rings[r].a += dt;
      rings = rings.filter(function (ring) {
        return ring.a < 0.4;
      });
      if (g.over) return;
      if ((spawnT -= dt) <= 0) {
        spawnT = rate;
        rate = Math.max(0.42, rate * 0.97);
        life = Math.max(1.15, life * 0.985);
        // Keep clear of the action rail on the right and the meta block at the bottom.
        bubbles.push({
          x: rnd(maxR, W - maxR - 56),
          y: rnd(H * 0.18, H * 0.66),
          a: 0,
          life: life,
          c: cols[Math.floor(rng() * cols.length)],
        });
      }
      for (let i = 0; i < bubbles.length; i++) bubbles[i].a += dt;
      let gone = bubbles.filter(function (b) {
        return b.a >= b.life;
      }).length;
      if (gone) {
        g.lives -= gone;
        bubbles = bubbles.filter(function (b) {
          return b.a < b.life;
        });
        if (g.lives <= 0) {
          g.lives = 0;
          g.over = true;
        }
      }
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#3A1230', '#7A2550');
      for (let i = 0; i < bubbles.length; i++) {
        let b = bubbles[i];
        let rad = radius(b);
        if (rad <= 0) continue;
        ctx.globalAlpha = 0.92;
        u.circle(ctx, b.x, b.y, rad, b.c);
        ctx.globalAlpha = 1;
        u.circle(ctx, b.x - rad * 0.35, b.y - rad * 0.35, rad * 0.18, 'rgba(255,255,255,.75)');
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, rad + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - b.a / b.life));
        ctx.stroke();
      }
      for (let k = 0; k < rings.length; k++) {
        let ring = rings[k];
        ctx.strokeStyle = ring.c;
        ctx.globalAlpha = 1 - ring.a / 0.4;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, maxR * (1 + ring.a * 3), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };
    return g;
  },
});
