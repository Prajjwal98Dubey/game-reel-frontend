// Echo: four pads light up in a sequence; tap it back. From round 4 two pads swap places after the
// sequence plays, so follow the colour, not the spot. Three mistakes end the round.
GameReels.defineGame({
  id: 'echo',
  create: function (W, H, rng) {
    let u = GameReels.util;
    let g = { score: 0, over: false, lives: 3 };
    let cols = ['#FF5C8A', '#FFD23F', '#5BC0FF', '#7BE0B5'];
    // Keep clear of the action rail on the right.
    let areaW = W - 64;
    let size = Math.min(areaW - 24, H * 0.42);
    let gap = 14;
    let p = (size - gap) / 2;
    let left = (areaW - size) / 2;
    let top = H * 0.27;
    let slotXY = function (s) {
      return { x: left + (s % 2) * (p + gap), y: top + Math.floor(s / 2) * (p + gap) };
    };
    // slot[i] = where pad i currently sits.
    let slot = [0, 1, 2, 3];
    let seq = [];
    let phase = 'pause';
    let timer = 0.6;
    let idx = 0;
    let idle = 0;
    let lit = -1;
    let litT = 0;
    let wrong = 0;
    let swap = null;
    let round = 0;

    let stepLen = function () {
      return Math.max(0.3, 0.62 - seq.length * 0.025);
    };
    let flash = function (pad, len) {
      lit = pad;
      litT = len;
    };
    let nextRound = function () {
      round++;
      seq.push(Math.floor(rng() * 4));
      phase = 'show';
      idx = 0;
      timer = 0.35;
    };
    let mistake = function () {
      wrong = 0.5;
      lit = -1;
      if (--g.lives <= 0) {
        g.lives = 0;
        g.over = true;
        return;
      }
      // Replay the same sequence.
      phase = 'replay';
      timer = 0.9;
    };
    let padAt = function (x, y) {
      for (let i = 0; i < 4; i++) {
        let q = slotXY(slot[i]);
        if (x >= q.x && x <= q.x + p && y >= q.y && y <= q.y + p) return i;
      }
      return -1;
    };

    g.tap = function (x, y) {
      if (g.over || phase !== 'input') return;
      let pad = padAt(x, y);
      if (pad < 0) return;
      idle = 0;
      if (pad === seq[idx]) {
        flash(pad, 0.18);
        g.score++;
        idx++;
        if (idx >= seq.length) {
          phase = 'pause';
          timer = 0.7;
        }
      } else {
        mistake();
      }
    };

    g.update = function (dt) {
      if (litT > 0 && (litT -= dt) <= 0) lit = -1;
      if (wrong > 0) wrong -= dt;
      if (g.over) return;
      if (phase === 'pause') {
        if ((timer -= dt) <= 0) nextRound();
      } else if (phase === 'replay') {
        if ((timer -= dt) <= 0) {
          phase = 'show';
          idx = 0;
          timer = 0.2;
        }
      } else if (phase === 'show') {
        if ((timer -= dt) <= 0) {
          if (idx < seq.length) {
            flash(seq[idx], stepLen() * 0.7);
            idx++;
            timer = stepLen();
          } else if (round >= 4) {
            // Shuffle two pads in plain sight before the player answers.
            let a = Math.floor(rng() * 4);
            let b = (a + 1 + Math.floor(rng() * 3)) % 4;
            swap = { a: a, b: b, t: 0, len: Math.max(0.35, 0.6 - round * 0.015) };
            phase = 'swap';
          } else {
            phase = 'input';
            idx = 0;
            idle = 0;
          }
        }
      } else if (phase === 'swap') {
        swap.t += dt;
        if (swap.t >= swap.len) {
          let s = slot[swap.a];
          slot[swap.a] = slot[swap.b];
          slot[swap.b] = s;
          swap = null;
          phase = 'input';
          idx = 0;
          idle = 0;
        }
      } else if (phase === 'input') {
        // Too long without an answer counts as a mistake.
        if ((idle += dt) > 5) {
          idle = 0;
          mistake();
        }
      }
    };

    g.draw = function (ctx) {
      u.verticalGradient(ctx, W, H, '#10241F', '#1D4A3C');
      if (wrong > 0) {
        ctx.fillStyle = 'rgba(255,90,95,' + (wrong * 0.5).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      for (let i = 0; i < 4; i++) {
        let q = slotXY(slot[i]);
        if (swap && (i === swap.a || i === swap.b)) {
          let other = slotXY(slot[i === swap.a ? swap.b : swap.a]);
          let k = swap.t / swap.len;
          k = k * k * (3 - 2 * k);
          // Arc the two pads past each other so the swap is easy to follow.
          let lift = Math.sin(k * Math.PI) * p * 0.25 * (i === swap.a ? 1 : -1);
          q = { x: q.x + (other.x - q.x) * k + lift, y: q.y + (other.y - q.y) * k - lift };
        }
        let on = lit === i;
        ctx.globalAlpha = on ? 1 : phase === 'input' ? 0.6 : 0.4;
        u.roundRect(ctx, q.x, q.y, p, p, 18);
        ctx.fillStyle = cols[i];
        ctx.fill();
        ctx.globalAlpha = 1;
        if (on) {
          ctx.strokeStyle = '#F6F5FA';
          ctx.lineWidth = 5;
          u.roundRect(ctx, q.x - 4, q.y - 4, p + 8, p + 8, 22);
          ctx.stroke();
        }
      }
      // Progress dots for the current sequence.
      let n = seq.length;
      let dotY = top + size + 30;
      for (let k = 0; k < n && k < 20; k++) {
        let done = phase === 'input' ? k < idx : phase === 'pause';
        u.circle(ctx, areaW / 2 + (k - (Math.min(n, 20) - 1) / 2) * 14, dotY, 4, done ? '#F6F5FA' : 'rgba(246,245,250,.25)');
      }
    };
    return g;
  },
});
