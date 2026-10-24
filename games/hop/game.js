// Hop: tap to flap through the gaps.
GameReels.defineGame({
  id: 'hop',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let rnd = function (a, b) {
      return a + rng() * (b - a);
    };
    let g = { score: 0, over: false };
    let r = u.clamp(W * 0.05, 12, 20);
    let b = { x: W * 0.3, y: H * 0.42, vy: 0 };
    let floor = H * 0.86;
    let grav = H * 2.3;
    let flap = -H * 0.72;
    let speed = W * 0.52;
    let gap = u.clamp(H * 0.27, 150, 230);
    let pw = u.clamp(W * 0.17, 48, 72);
    let pipes = [];
    let spawnT = 0.9;
    let t = 0;

    g.begin = function () {
      b.vy = flap;
    };
    g.tap = function () {
      if (!g.over) b.vy = flap;
    };

    g.update = function (dt) {
      t += dt;
      if (g.over) {
        if (b.y + r < floor) {
          b.vy += grav * dt;
          b.y = Math.min(floor - r, b.y + b.vy * dt);
        }
        return;
      }
      b.vy += grav * dt;
      b.y += b.vy * dt;
      if ((spawnT -= dt) <= 0) {
        spawnT = 1.5;
        pipes.push({ x: W, gy: rnd(H * 0.12, floor - gap - H * 0.06), passed: false });
      }
      for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.x -= speed * dt;
        if (!p.passed && p.x + pw < b.x - r) {
          p.passed = true;
          g.score++;
        }
        if (b.x + r * 0.8 > p.x && b.x - r * 0.8 < p.x + pw && (b.y - r * 0.8 < p.gy || b.y + r * 0.8 > p.gy + gap))
          g.over = true;
      }
      pipes = pipes.filter(function (p) {
        return p.x > -pw;
      });
      if (b.y + r >= floor) {
        b.y = floor - r;
        g.over = true;
      }
      if (b.y - r < 0) {
        b.y = r;
        b.vy = 0;
      }
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#0E3B4F', '#1E7D80');
      for (let i = 0; i < 4; i++) {
        let x = ((((i * W * 0.4 - t * speed * 0.25) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3;
        u.circle(ctx, x, floor, W * 0.28, 'rgba(255,255,255,.06)');
      }
      for (let k = 0; k < pipes.length; k++) {
        let p = pipes[k];
        ctx.fillStyle = '#7BE0B5';
        u.roundRect(ctx, p.x, -12, pw, p.gy + 12, 10);
        ctx.fill();
        u.roundRect(ctx, p.x, p.gy + gap, pw, floor - p.gy - gap + 12, 10);
        ctx.fill();
        ctx.fillStyle = '#4FBF92';
        ctx.fillRect(p.x - 4, p.gy - 14, pw + 8, 14);
        ctx.fillRect(p.x - 4, p.gy + gap, pw + 8, 14);
      }
      ctx.fillStyle = '#0A2A36';
      ctx.fillRect(0, floor, W, H - floor);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(u.clamp(b.vy / (H * 1.2), -0.5, 1.1));
      u.circle(ctx, 0, 0, r, '#FFD23F');
      ctx.beginPath();
      ctx.moveTo(r * 0.7, -r * 0.25);
      ctx.lineTo(r * 1.35, 0);
      ctx.lineTo(r * 0.7, r * 0.25);
      ctx.fillStyle = '#FF8A3D';
      ctx.fill();
      u.circle(ctx, r * 0.3, -r * 0.3, r * 0.3, '#FFFFFF');
      u.circle(ctx, r * 0.38, -r * 0.3, r * 0.14, '#16151D');
      ctx.restore();
    };
    return g;
  },
});
