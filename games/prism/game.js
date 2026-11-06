// Prism: drops of colour fall onto a four-colour wheel. Tap to turn the wheel a quarter so the
// matching colour faces up. Three mismatches end the round.
GameReels.defineGame({
  id: 'prism',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let Q = Math.PI / 2;
    let g = { score: 0, over: false, lives: 3 };
    let cols = ['#FF5C8A', '#FFD23F', '#5BC0FF', '#7BE0B5'];
    let cx = W / 2;
    let cy = H * 0.68;
    let rad = u.clamp(W * 0.13, 40, 60);
    let turns = 0;
    let vis = 0;
    let drops = [];
    let splashes = [];
    let spawnT = 0.6;
    let rate = 1.5;
    let fall = H * 0.22;
    let last = -1;

    // Segment i sits at angle i·Q + rotation (0 = up). The one facing up after `turns` clockwise turns.
    let topIndex = function () {
      return (((-turns) % 4) + 4) % 4;
    };

    g.tap = function () {
      if (!g.over) turns++;
    };

    g.update = function (dt) {
      vis += (turns * Q - vis) * Math.min(1, dt * 18);
      for (let i = 0; i < splashes.length; i++) splashes[i].a += dt;
      splashes = splashes.filter(function (s) {
        return s.a < 0.45;
      });
      if (g.over) return;

      if ((spawnT -= dt) <= 0) {
        spawnT = rate;
        rate = Math.max(0.55, rate * 0.965);
        fall = Math.min(H * 0.6, fall * 1.02);
        let c = Math.floor(rng() * 4);
        // Never three of the same in a row: keep the player turning.
        if (c === last && rng() < 0.6) c = (c + 1 + Math.floor(rng() * 3)) % 4;
        last = c;
        drops.push({ y: H * 0.14, c: c, done: false });
      }
      for (let i = 0; i < drops.length; i++) {
        let d = drops[i];
        d.y += fall * dt;
        if (!d.done && d.y >= cy - rad - 8) {
          d.done = true;
          let ok = d.c === topIndex();
          if (ok) g.score++;
          splashes.push({ c: ok ? cols[d.c] : '#F6F5FA', ok: ok, a: 0 });
          if (!ok && --g.lives <= 0) {
            g.lives = 0;
            g.over = true;
          }
        }
      }
      drops = drops.filter(function (d) {
        return !d.done;
      });
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#1C1430', '#3B1F4F');
      // Drop lane.
      u.roundRect(ctx, cx - 14, H * 0.12, 28, cy - rad - H * 0.12, 14);
      ctx.fillStyle = 'rgba(246,245,250,.06)';
      ctx.fill();
      for (let i = 0; i < drops.length; i++) {
        let d = drops[i];
        u.circle(ctx, cx, d.y, 11, cols[d.c]);
        u.circle(ctx, cx - 3.5, d.y - 3.5, 3, 'rgba(255,255,255,.7)');
      }
      // Wheel.
      for (let i = 0; i < 4; i++) {
        let mid = -Math.PI / 2 + i * Q + vis;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rad, mid - Q / 2 + 0.04, mid + Q / 2 - 0.04);
        ctx.closePath();
        ctx.fillStyle = cols[i];
        ctx.fill();
      }
      u.circle(ctx, cx, cy, rad * 0.32, '#1C1430');
      // Pointer showing the active slot.
      ctx.fillStyle = '#F6F5FA';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - rad - 14);
      ctx.lineTo(cx + 9, cy - rad - 14);
      ctx.lineTo(cx, cy - rad - 4);
      ctx.closePath();
      ctx.fill();
      for (let k = 0; k < splashes.length; k++) {
        let s = splashes[k];
        ctx.globalAlpha = 1 - s.a / 0.45;
        ctx.strokeStyle = s.c;
        ctx.lineWidth = s.ok ? 4 : 6;
        ctx.beginPath();
        ctx.arc(cx, cy, rad + 6 + s.a * 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };
    return g;
  },
});
