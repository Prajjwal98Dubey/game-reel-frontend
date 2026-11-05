// Orbit: a moon circles its planet. Tap to reverse, grab each star before it burns out, and never
// touch a comet.
GameReels.defineGame({
  id: 'orbit',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let TAU = Math.PI * 2;
    let g = { score: 0, over: false };
    let cx = W / 2;
    let cy = H * 0.46;
    let R = u.clamp(Math.min(W, H) * 0.3, 90, 140);
    let ang = -Math.PI / 2;
    let dir = 1;
    let spd = 1.9;
    let starLife = function () {
      return Math.max(3.2, 6 - g.score * 0.08);
    };
    let star = { a: Math.PI / 2, t: 0, life: 6 };
    let comets = [];
    let cometT = 1.6;
    let sparks = [];
    let t = 0;

    let diff = function (a, b) {
      return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    };
    let px = function (a) {
      return cx + Math.cos(a) * R;
    };
    let py = function (a) {
      return cy + Math.sin(a) * R;
    };
    let wrap = function (a) {
      return ((a % TAU) + TAU) % TAU;
    };
    // Whether the moon can reach the star going direction d without crossing a comet in `list`.
    let pathClear = function (target, d, list) {
      let end = wrap((target - ang) * d);
      for (let i = 0; i < list.length; i++) if (wrap((list[i].a - ang) * d) < end) return false;
      return true;
    };
    // Rule of fairness: one way round to the star is always open.
    let reachable = function (target, list) {
      return pathClear(target, 1, list) || pathClear(target, -1, list);
    };
    // A random spot on the ring at least `gap` radians from the moon and clear of everything else,
    // or -1 when none turned up. `ok` vetoes a candidate.
    let freeAngle = function (gap, ok) {
      for (let tries = 0; tries < 16; tries++) {
        let a = rng() * TAU;
        if (diff(a, ang) < gap) continue;
        if (diff(a, star.a) < 0.4) continue;
        let clear = true;
        for (let i = 0; i < comets.length; i++) if (diff(a, comets[i].a) < 0.4) clear = false;
        if (clear && ok(a)) return a;
      }
      return -1;
    };
    let burst = function (a, c, n) {
      for (let i = 0; i < n; i++) {
        let d = rng() * TAU;
        let v = 60 + rng() * 140;
        sparks.push({ x: px(a), y: py(a), vx: Math.cos(d) * v, vy: Math.sin(d) * v, a: 0, c: c });
      }
    };

    g.tap = function () {
      if (!g.over) dir = -dir;
    };

    g.update = function (dt) {
      t += dt;
      for (let i = 0; i < sparks.length; i++) {
        let s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.a += dt;
      }
      sparks = sparks.filter(function (s) {
        return s.a < 0.6;
      });
      if (g.over) return;

      ang += dir * spd * dt;
      star.t += dt;
      if (star.t >= star.life) {
        g.over = true;
        burst(star.a, '#FF9F1C', 16);
        return;
      }
      if (diff(ang, star.a) < 0.2) {
        g.score++;
        spd = Math.min(3.4, spd + 0.06);
        burst(star.a, '#FFD23F', 10);
        let next = freeAngle(1.3, function (a) {
          return reachable(a, comets);
        });
        // Fall back to the far side of the ring and clear anything walling it off.
        if (next < 0) {
          next = wrap(ang + Math.PI);
          comets = comets.filter(function (c) {
            return diff(c.a, next) > 0.4;
          });
          if (!reachable(next, comets)) comets = [];
        }
        star = { a: next, t: 0, life: starLife() };
      }

      if ((cometT -= dt) <= 0) {
        cometT = Math.max(0.8, 2.1 - g.score * 0.05);
        let at = freeAngle(1.1, function (a) {
          return reachable(star.a, comets.concat([{ a: a }]));
        });
        if (at >= 0) comets.push({ a: at, age: 0, life: 4.5 + rng() * 2 });
      }
      for (let i = 0; i < comets.length; i++) {
        let c = comets[i];
        c.age += dt;
        // Comets warn for 0.7s before they become solid.
        if (c.age > 0.7 && c.age < c.life && diff(ang, c.a) < 0.15) {
          g.over = true;
          burst(ang, '#F6F5FA', 24);
        }
      }
      comets = comets.filter(function (c) {
        return c.age < c.life;
      });
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#0E1838', '#1E2E66');
      // Distant stars, fixed per round.
      for (let i = 0; i < 24; i++) {
        let sx = ((i * 97) % 389) / 389;
        let sy = ((i * 53) % 271) / 271;
        u.circle(ctx, sx * W, sy * H, 1.2, 'rgba(255,255,255,.35)');
      }
      ctx.strokeStyle = 'rgba(246,245,250,.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      u.circle(ctx, cx, cy, R * 0.42, '#5BC0FF');
      u.circle(ctx, cx - R * 0.12, cy - R * 0.1, R * 0.14, 'rgba(255,255,255,.25)');
      u.circle(ctx, cx + R * 0.15, cy + R * 0.12, R * 0.08, 'rgba(14,24,56,.25)');

      // Star.
      // Star, with a fuse ring that burns down.
      if (!g.over) {
        let pulse = 1 + Math.sin(t * (6 + star.t * 3)) * 0.15;
        u.circle(ctx, px(star.a), py(star.a), 15 * pulse, 'rgba(255,210,63,.25)');
        u.circle(ctx, px(star.a), py(star.a), 9 * pulse, '#FFD23F');
        ctx.strokeStyle = star.t > star.life * 0.7 ? '#FF5A5F' : 'rgba(255,210,63,.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px(star.a), py(star.a), 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - star.t / star.life));
        ctx.stroke();
      }

      // Comets: faint while warning, solid when deadly, fading at end of life.
      for (let i = 0; i < comets.length; i++) {
        let c = comets[i];
        let warn = c.age < 0.7;
        ctx.globalAlpha = warn ? 0.25 + 0.25 * Math.sin(c.age * 30) : Math.min(1, (c.life - c.age) / 0.4);
        let x = px(c.a);
        let y = py(c.a);
        u.circle(ctx, x, y, 11, '#FF5A5F');
        ctx.strokeStyle = '#FF9F1C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(c.a) * 22, y + Math.sin(c.a) * 22);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (!g.over) {
        // Direction hint trailing behind the moon.
        for (let k = 1; k <= 4; k++) {
          ctx.globalAlpha = 0.25 - k * 0.05;
          u.circle(ctx, px(ang - dir * k * 0.08), py(ang - dir * k * 0.08), 10 - k, '#F6F5FA');
        }
        ctx.globalAlpha = 1;
        u.circle(ctx, px(ang), py(ang), 11, '#F6F5FA');
      }
      for (let i = 0; i < sparks.length; i++) {
        let s = sparks[i];
        ctx.globalAlpha = 1 - s.a / 0.6;
        u.circle(ctx, s.x, s.y, 3, s.c);
      }
      ctx.globalAlpha = 1;
    };
    return g;
  },
});
