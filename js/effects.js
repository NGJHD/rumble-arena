'use strict';
// Particles, hit sparks and comic pop-up text (world coordinates).
const COMIC = ['POW!', 'BAM!', 'WHAM!', 'BOOM!', 'KAPOW!', 'SMASH!', 'CRASH!', 'WHOOSH!', 'ZAP!'];

const FX = {
  parts: [], texts: [],
  clear() { this.parts.length = 0; this.texts.length = 0; },
  add(p) {
    p.max = p.life; p.vx = p.vx || 0; p.vy = p.vy || 0; p.g = p.g || 0; p.drag = p.drag == null ? 0.94 : p.drag; p.rot = p.rot || 0;
    if (this.parts.length < 900) this.parts.push(p);
  },
  burst(x, y, elem, n, spd, size, life, g) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(spd * 0.3, spd);
      this.add({ type: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: size * rand(0.6, 1.3), life: life * rand(0.6, 1.2), col: ec(elem, randi(0, 2)), g: g || 0, glow: true });
    }
  },
  streaks(x, y, elem, n, spd, dir) {
    for (let i = 0; i < n; i++) {
      const a = dir != null ? (dir > 0 ? 0 : Math.PI) + rand(-0.9, 0.9) : rand(0, TAU), v = rand(spd * 0.5, spd);
      this.add({ type: 'streak', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: rand(2, 5), life: rand(8, 16), col: ec(elem, randi(0, 1)), drag: 0.88 });
    }
  },
  ring(x, y, col, r0, r1, life, w) { this.add({ type: 'ring', x, y, r0, r1, life, col, w: w || 6, drag: 1 }); },
  star(x, y, col, r, life, spikes) { this.add({ type: 'star', x, y, r, life, col, spikes: spikes || 10, rot: rand(0, TAU), drag: 1 }); },
  smoke(x, y, n, col) {
    for (let i = 0; i < n; i++) this.add({ type: 'smoke', x: x + rand(-20, 20), y: y + rand(-10, 10), vx: rand(-1.5, 1.5), vy: rand(-2, -0.3), r: rand(10, 22), life: rand(25, 45), col: col || 'rgba(200,190,170,0.5)', drag: 0.96 });
  },
  dust(x, y, n) { this.smoke(x, y, n || 6, 'rgba(210,190,160,0.55)'); },
  shards(x, y, elem, n, spd) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(3, spd || 12); this.add({ type: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, r: rand(5, 12), life: rand(20, 35), col: ec(elem, randi(0, 2)), g: 0.4, rot: rand(0, TAU), spin: rand(-0.3, 0.3) }); }
  },
  bolt(x1, y1, x2, y2, col, life, w) { this.add({ type: 'bolt', x: x1, y: y1, x2, y2, col, life: life || 8, w: w || 4, drag: 1 }); },
  hearts(x, y, n, col) {
    for (let i = 0; i < n; i++) this.add({ type: 'heart', x, y, vx: rand(-5, 5), vy: rand(-7, -1), r: rand(6, 12), life: rand(25, 40), col: col || choice(['#ff4081', '#f8bbd0', '#ff80ab']), drag: 0.95 });
  },
  petals(x, y, n, col) {
    for (let i = 0; i < n; i++) this.add({ type: 'petal', x, y, vx: rand(-6, 6), vy: rand(-6, 2), r: rand(5, 9), life: rand(30, 50), col: col || choice(['#f8bbd0', '#ffffff', '#ce93d8']), g: 0.12, rot: rand(0, TAU), spin: rand(-0.2, 0.2) });
  },
  arc(x, y, r, facing, col) { this.add({ type: 'arc', x, y, r, facing, col, life: 9, drag: 1 }); },
  slashLine(x, y, len, ang, col, life) { this.add({ type: 'slashline', x, y, len, ang, col, life: life || 10, drag: 1 }); },

  hitSpark(x, y, elem, str, dir) {
    str = str || 1;
    this.star(x, y, '#ffffff', 26 + str * 14, 6 + str * 2, 8 + str * 2);
    this.ring(x, y, ec(elem, 1), 8, 40 + str * 26, 12 + str * 2, 4 + str * 2);
    this.streaks(x, y, elem, 5 + str * 4, 9 + str * 3, dir);
    this.burst(x, y, elem, 4 + str * 3, 6 + str, 4 + str, 18);
    switch (elem) {
      case 'fire': case 'magma': this.burst(x, y, elem, 8 + str * 3, 4, 7, 30, -0.15); this.smoke(x, y, 2 + str, 'rgba(80,60,50,0.5)'); break;
      case 'ice': case 'soul': this.shards(x, y, elem, 5 + str * 3); break;
      case 'lightning': for (let i = 0; i < 2 + str; i++) { const a = rand(0, TAU); this.bolt(x, y, x + Math.cos(a) * (60 + str * 30), y + Math.sin(a) * (60 + str * 30), choice(['#fff', '#fff176', '#40c4ff']), 7, 3); } break;
      case 'haki': for (let i = 0; i < 2 + str; i++) { const a = rand(0, TAU); this.bolt(x, y, x + Math.cos(a) * (70 + str * 30), y + Math.sin(a) * (70 + str * 30), choice(['#111', '#d50000']), 9, 5); } break;
      case 'slash': this.slashLine(x, y, 90 + str * 40, rand(-0.9, -0.4) * (dir || 1), '#ffffff', 10); break;
      case 'love': this.hearts(x, y, 4 + str * 2); break;
      case 'flower': this.petals(x, y, 6 + str * 3); break;
      case 'water': this.burst(x, y, 'water', 10 + str * 3, 7, 5, 28, 0.35); break;
      case 'sand': this.smoke(x, y, 4 + str * 2, 'rgba(224,194,122,0.6)'); break;
      case 'dark': this.burst(x, y, 'dark', 10 + str * 3, 3, 9, 30, 0); break;
      case 'quake': this.ring(x, y, '#ffffff', 20, 90 + str * 40, 16, 3); break;
      case 'string': for (let i = 0; i < 4; i++) { const a = rand(0, TAU); this.bolt(x - Math.cos(a) * 80, y - Math.sin(a) * 80, x + Math.cos(a) * 80, y + Math.sin(a) * 80, '#ffffff', 6, 1.5); } break;
    }
    if (str >= 3) this.comic(x + rand(-30, 30), y - 60, choice(COMIC), str);
  },
  comic(x, y, word, str) {
    this.texts.push({ x, y, word, life: 45, max: 45, size: 40 + (str || 3) * 10, rot: rand(-0.25, 0.25), col: choice(['#ffeb3b', '#ff5252', '#40c4ff', '#69f0ae', '#ffffff']) });
  },
  label(x, y, word, col, size) {
    this.texts.push({ x, y, word, life: 50, max: 50, size: size || 30, rot: 0, col: col || '#fff', label: true });
  },

  update() {
    const P = this.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      if (p.spin) p.rot += p.spin;
      if (--p.life <= 0) P.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y -= t.label ? 0.8 : 0.4;
      if (--t.life <= 0) this.texts.splice(i, 1);
    }
  },
  draw(ctx) {
    for (const p of this.parts) {
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      switch (p.type) {
        case 'dot':
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r * k), 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'streak':
          ctx.strokeStyle = p.col; ctx.lineWidth = p.w * k + 0.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); ctx.stroke();
          break;
        case 'ring':
          ctx.strokeStyle = p.col; ctx.lineWidth = p.w * k + 0.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, lerp(p.r1, p.r0, k), 0, TAU); ctx.stroke();
          break;
        case 'star': {
          const r = p.r * (0.6 + (1 - k) * 0.6);
          ctx.fillStyle = p.col; ctx.beginPath();
          for (let i = 0; i < p.spikes * 2; i++) { const a = p.rot + i * Math.PI / p.spikes, rr = i % 2 ? r * 0.3 : r * (i % 4 ? 0.8 : 1); ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill();
          break;
        }
        case 'smoke':
          ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.6 - k * 0.6), 0, TAU); ctx.fill();
          break;
        case 'shard':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r * 0.4, p.r * 0.6); ctx.lineTo(-p.r * 0.4, p.r * 0.6); ctx.closePath(); ctx.fill();
          ctx.restore(); break;
        case 'bolt': drawBolt(ctx, p.x, p.y, p.x2, p.y2, p.col, p.w * k + 1); break;
        case 'heart': drawHeart(ctx, p.x, p.y, p.r, p.col); break;
        case 'petal':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
        case 'art': drawArt(ctx, p.id, p.x, p.y, p.h * (1.3 - k * 0.3), { alpha: Math.min(1, k * 1.5) }); break;
        case 'arc': {
          // weapon swoosh: a crescent that sweeps and thins out
          const k2 = 1 - k, a0 = -1.3 + k2 * 0.5, a1 = 1.1;
          ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.facing, 1);
          ctx.globalCompositeOperation = 'lighter';
          for (const [wd, al] of [[18, 0.25], [9, 0.6], [3, 1]]) {
            ctx.strokeStyle = p.col; ctx.globalAlpha = al * k; ctx.lineWidth = wd * (0.4 + k); ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(0, 0, p.r, a0, a1); ctx.stroke();
          }
          ctx.restore(); break;
        }
        case 'slashline': {
          const t = 1 - k, dx = Math.cos(p.ang), dy = Math.sin(p.ang);
          ctx.strokeStyle = p.col; ctx.lineWidth = 10 * k + 1; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x - dx * p.len * (0.5 - t * 0.3), p.y - dy * p.len * (0.5 - t * 0.3)); ctx.lineTo(p.x + dx * p.len * 0.5, p.y + dy * p.len * 0.5); ctx.stroke();
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const age = t.max - t.life;
      const sc = t.label ? 1 : age < 8 ? easeOutBack(age / 8) : 1;
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.scale(sc, sc);
      ctx.globalAlpha = Math.min(1, t.life / 12);
      drawText(ctx, t.word, 0, 0, t.size, t.col, '#1a1a1a', 'center', t.size / 5);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
};

function drawBolt(ctx, x1, y1, x2, y2, col, w) {
  const n = 7, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < n; i++) { const t = i / n, o = rand(-1, 1) * len * 0.12; ctx.lineTo(x1 + dx * t + nx * o, y1 + dy * t + ny * o); }
  ctx.lineTo(x2, y2); ctx.stroke();
}
function drawHeart(ctx, x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  ctx.fill();
}
