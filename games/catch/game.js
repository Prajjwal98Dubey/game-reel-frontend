// Catch: drag sideways to catch fruit and dodge bombs. Three missed fruit end the round.
GameReels.defineGame({
  id: 'catch',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let rnd = function (a, b) {
      return a + rng() * (b - a);
    };
    let g = { score: 0, over: false, lives: 3 };
    let bw = u.clamp(W * 0.26, 70, 110);
    let by = H * 0.74;
    let fruit = ['#FFD23F', '#7BE0B5', '#5BC0FF', '#FF9F1C'];
    let bx = W / 2;
    let tx = W / 2;
    let items = [];
    let spawnT = 0.4;
    let rate = 0.9;
    let fall = H * 0.3;

    g.move = function (x) {
      tx = x;
    };
    g.tap = function (x) {
      tx = x;
    };

    g.update = function (dt) {
      bx += (tx - bx) * Math.min(1, dt * 16);
      bx = u.clamp(bx, bw / 2, W - bw / 2);
      if (g.over) return;
      if ((spawnT -= dt) <= 0) {
        spawnT = rate;
        rate = Math.max(0.36, rate * 0.975);
        fall = Math.min(fall * 1.012, H * 0.8);
        items.push({
          x: rnd(18, W - 18),
          y: -16,
          bomb: g.score > 2 && rng() < 0.24,
          v: fall * rnd(0.85, 1.2),
          c: fruit[Math.floor(rng() * fruit.length)],
          done: false,
        });
      }
      for (let i = 0; i < items.length; i++) {
        let it = items[i];
        it.y += it.v * dt;
        if (!it.done && it.y > by - 10 && it.y < by + 16 && Math.abs(it.x - bx) < bw / 2 + 6) {
          it.done = true;
          if (it.bomb) g.over = true;
          else g.score++;
        } else if (!it.done && it.y > H + 16) {
          it.done = true;
          if (!it.bomb && --g.lives <= 0) g.over = true;
        }
      }
      items = items.filter(function (it) {
        return !it.done;
      });
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#241B55', '#4B2C83');
      for (let i = 0; i < items.length; i++) {
        let it = items[i];
        if (it.bomb) {
          u.circle(ctx, it.x, it.y, 13, '#15121F');
          ctx.strokeStyle = '#FF5A5F';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(it.x, it.y, 13, 0, Math.PI * 2);
          ctx.stroke();
          u.circle(ctx, it.x + 8, it.y - 13, 3.5, '#FFD23F');
        } else {
          u.circle(ctx, it.x, it.y, 11, it.c);
          u.circle(ctx, it.x - 4, it.y - 4, 3, 'rgba(255,255,255,.7)');
        }
      }
      u.roundRect(ctx, bx - bw / 2, by, bw, 16, 8);
      ctx.fillStyle = '#F6F5FA';
      ctx.fill();
      u.roundRect(ctx, bx - bw / 2 + 6, by + 16, bw - 12, 6, 3);
      ctx.fillStyle = 'rgba(246,245,250,.45)';
      ctx.fill();
    };
    return g;
  },
});
