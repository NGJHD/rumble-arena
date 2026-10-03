'use strict';
// Shared constants, helpers and settings.
const W = 1280, H = 720, GROUND_Y = 640, STAGE_W = 2400;
const FONT = 'Impact, Haettenschweiler, "Arial Black", sans-serif';
const TAU = Math.PI * 2;

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circleHitsRect = (c, r) => { const nx = clamp(c.x, r.x, r.x + r.w), ny = clamp(c.y, r.y, r.y + r.h); return (c.x - nx) ** 2 + (c.y - ny) ** 2 <= c.r * c.r; };
function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

// Element colour sets: [bright core, mid, dark/edge]
const ELEM = {
  punch: ['#ffffff', '#ffe082', '#ffb300'],
  rubber: ['#ffffff', '#ffcc80', '#ff5252'],
  fire: ['#fff59d', '#ff9800', '#ff3d00'],
  magma: ['#ffd54f', '#ff3d00', '#7f1d00'],
  light: ['#ffffff', '#fff59d', '#ffd600'],
  ice: ['#ffffff', '#b3e5fc', '#29b6f6'],
  slash: ['#ffffff', '#e0f7fa', '#80cbc4'],
  lightning: ['#ffffff', '#fff176', '#40c4ff'],
  sand: ['#fff3c4', '#e0c27a', '#a1887f'],
  dark: ['#b388ff', '#6a1b9a', '#1a0033'],
  quake: ['#ffffff', '#e1f5fe', '#81d4fa'],
  water: ['#e1f5fe', '#4fc3f7', '#0277bd'],
  string: ['#ffffff', '#f8bbd0', '#ff4081'],
  love: ['#ffffff', '#f8bbd0', '#ff4081'],
  haki: ['#ff8a80', '#d50000', '#1a1a1a'],
  plant: ['#c5e1a5', '#66bb6a', '#2e7d32'],
  flower: ['#ffffff', '#f48fb1', '#ab47bc'],
  soul: ['#ffffff', '#80d8ff', '#b388ff'],
  laser: ['#ffffff', '#80d8ff', '#00b0ff'],
  room: ['#e0f7fa', '#80deea', '#00acc1'],
  metal: ['#ffffff', '#cfd8dc', '#ffd54f'],
};
const ec = (e, i) => (ELEM[e] || ELEM.punch)[i];

const Settings = {
  data: {
    roundsToWin: 2, time: 99, difficulty: 1,
    sfx: 0.8, music: 0.45, announcer: true, autoFull: false, ver: 2,
    padP1: 0, padP2: 1, padMaps: {},
  },
  // Saved to settings.json in the game folder when the game runs through Play.bat (tools/devserver.py);
  // opened straight from index.html the browser can't write files, so it falls back to browser storage.
  served: typeof location !== 'undefined' && location.protocol.startsWith('http'),
  apply(s) { if (s) { if (!s.ver) { s.autoFull = false; s.ver = 2; } Object.assign(this.data, s); } },   // v1 saved auto fullscreen ON
  load() {
    try { this.apply(JSON.parse(localStorage.getItem('rumble_arena_settings'))); } catch (e) { /* storage blocked */ }
    if (!this.served) return;
    try {
      const x = new XMLHttpRequest(); x.open('GET', 'settings', false); x.send();   // tiny file, read before the first frame
      if (x.status === 200) this.apply(JSON.parse(x.responseText));
      else this.save();   // first run: write the file (keeps anything already set in this browser)
    } catch (e) { /* server not reachable */ }
  },
  save() {
    try { localStorage.setItem('rumble_arena_settings', JSON.stringify(this.data)); } catch (e) { /* storage blocked */ }
    if (this.served) try { fetch('settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.data) }); } catch (e) { /* offline */ }
  },
};
Settings.load();

// Pose sprites from sprites/<id>/<pose>.png, listed in sprites/manifest.js (SPRITE_MANIFEST).
// Fighters without sprites fall back to the procedural chibi renderer.
const Sprites = {
  imgs: {},
  init() {
    if (typeof SPRITE_MANIFEST === 'undefined') return;
    for (const id in SPRITE_MANIFEST) {
      for (const pose in SPRITE_MANIFEST[id]) {
        const img = new Image();
        img.onload = () => { this.imgs[id + '/' + pose] = img; };
        img.src = 'sprites/' + id + '/' + pose + '.png';
      }
    }
  },
  has(id) { return !!this.imgs[id + '/idle']; },
  exact(id, name) { return this.imgs[id + '/' + name] || null; },
  get(id, pose) {
    const strike = ['bazooka', 'slashfinish', 'special', 'super', 'kick', 'upper'];
    const p = this.imgs[id + '/' + pose] ? pose : (strike.includes(pose) && this.imgs[id + '/attack'] ? 'attack' : 'idle');
    const img = this.imgs[id + '/' + p];
    if (!img) return null;
    return { img, m: SPRITE_MANIFEST[id][p], idle: SPRITE_MANIFEST[id].idle };
  },
};

// Text helper: outlined comic text
function drawText(ctx, txt, x, y, size, fill, stroke, align, lw) {
  ctx.font = size + 'px ' + FONT;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = lw || Math.max(3, size / 7); ctx.strokeStyle = stroke; ctx.strokeText(txt, x, y); }
  ctx.fillStyle = fill;
  ctx.fillText(txt, x, y);
}
