// Range audit, part 1 (node): run every move of every fighter against small/medium/large defenders over a sweep of
// distances, record whether it hits and exactly what each fighter DRAWS each frame (image + full transform).
// Part 2 (tools/audit_range.py) rasterises the real sprite pixels and compares "art touches the opponent" with "hit".
// usage: node tools/tests/audit_range_dump.js [charId ...]  -> tools/out/audit/<id>.json
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = 'C:/GitHub/Rumble Arena';
const OUT = root + '/tools/out/audit';
fs.mkdirSync(OUT, { recursive: true });

// ---- a 2D context that tracks the transform and records draws
const REC = { on: false, owner: null, list: null };
function mul(m, n) { return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]; }
class Ctx {
  constructor() { this.m = [1, 0, 0, 1, 0, 0]; this.st = []; this.globalAlpha = 1; this.path = []; this.lineWidth = 1; this.fillStyle = '#000'; this.strokeStyle = '#000'; this.globalCompositeOperation = 'source-over'; }
  save() { this.st.push([this.m, this.globalAlpha, this.lineWidth, this.fillStyle, this.strokeStyle, this.globalCompositeOperation]); }
  restore() { const s = this.st.pop(); if (s) [this.m, this.globalAlpha, this.lineWidth, this.fillStyle, this.strokeStyle, this.globalCompositeOperation] = s; }
  translate(x, y) { this.m = mul(this.m, [1, 0, 0, 1, x, y]); }
  scale(x, y) { this.m = mul(this.m, [x, 0, 0, y, 0, 0]); }
  rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [c, s, -s, c, 0, 0]); }
  transform(a, b, c, d, e, f) { this.m = mul(this.m, [a, b, c, d, e, f]); }
  setTransform(a, b, c, d, e, f) { this.m = typeof a === 'object' ? [1, 0, 0, 1, 0, 0] : [a, b, c, d, e, f]; }
  resetTransform() { this.m = [1, 0, 0, 1, 0, 0]; }
  getTransform() { return { a: this.m[0], b: this.m[1], c: this.m[2], d: this.m[3], e: this.m[4], f: this.m[5] }; }
  pt(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  beginPath() { this.path = []; }
  moveTo(x, y) { this.path.push(this.pt(x, y)); }
  lineTo(x, y) { this.path.push(this.pt(x, y)); }
  quadraticCurveTo(a, b, x, y) { this.path.push(this.pt(a, b), this.pt(x, y)); }
  bezierCurveTo(a, b, c, d, x, y) { this.path.push(this.pt(a, b), this.pt(c, d), this.pt(x, y)); }
  arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) {   // real outline points, so strokes/fills rasterise as the curve
    if (a0 === undefined) { a0 = 0; a1 = Math.PI * 2; }
    let span = a1 - a0; if (ccw) span = -((a0 - a1) % (Math.PI * 2) || Math.PI * 2); if (Math.abs(span) > Math.PI * 2) span = Math.PI * 2 * Math.sign(span);
    const n = 20, c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i <= n; i++) { const a = a0 + span * i / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; this.path.push(this.pt(x + ex * c - ey * s, y + ex * s + ey * c)); }
  }
  rect(x, y, w, h) { this.path.push(this.pt(x, y), this.pt(x + w, y + h), this.pt(x, y + h), this.pt(x + w, y)); }
  closePath() {}
  recPath(kind) {
    if (!REC.on || !REC.owner || !this.path.length) return;
    const style = kind === 'fill' ? this.fillStyle : this.strokeStyle;
    const ent = /E$/.test(REC.owner);   // projectile / effect entity bodies are often gradient-filled: they count
    if ((typeof style !== 'string' && !ent) || this.globalAlpha < (ent ? 0.35 : 0.6)) return;   // fighter gradients = glows/auras, faint = afterimages
    if (typeof style === 'string' && !ent && /rgba\([^)]*,\s*0?\.[0-4]\d*\)/.test(style)) return;
    const xs = this.path.map(p => p[0]), ys = this.path.map(p => p[1]);
    const lw = kind === 'stroke' ? this.lineWidth * Math.hypot(this.m[0], this.m[1]) / 2 : 0;
    REC.list.push({ o: REC.owner, k: 'path', pts: this.path.map(p => [Math.round(p[0]), Math.round(p[1])]), lw: Math.round(lw), kind, bb: [Math.min(...xs) - lw, Math.min(...ys) - lw, Math.max(...xs) + lw, Math.max(...ys) + lw] });
  }
  fill() { this.recPath('fill'); }
  stroke() { this.recPath('stroke'); }
  fillRect() {} strokeRect() {} clearRect() {} clip() {} fillText() {} strokeText() {} measureText() { return { width: 10 }; }
  setLineDash() {} putImageData() {} getImageData() { return { data: [] }; }
  createLinearGradient() { return { addColorStop() {} }; } createRadialGradient() { return { addColorStop() {} }; } createPattern() { return {}; }
  drawImage(img, ...a) {
    if (!REC.on || !REC.owner || !img || !img._src || this.globalAlpha < 0.5) return;
    let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
    if (a.length === 2) { [dx, dy] = a; dw = img.width; dh = img.height; }
    else if (a.length === 4) [dx, dy, dw, dh] = a;
    else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
    const m = this.m;
    const c = [this.pt(dx, dy), this.pt(dx + dw, dy), this.pt(dx, dy + dh), this.pt(dx + dw, dy + dh)];
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
    REC.list.push({ o: REC.owner, k: 'img', src: img._src, add: this.globalCompositeOperation === 'lighter', m: m.map(v => +v.toFixed(4)), s: [sx, sy, sw, sh], d: [dx, dy, dw, dh].map(v => +v.toFixed(2)), bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(Math.round) });
  }
}
const ctx = new Ctx();
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Set, Map, setInterval: () => 0, clearInterval() {},
  performance: { now: () => 0 }, requestAnimationFrame() {},
  localStorage: { getItem: () => null, setItem() {} },
  Image: class { set src(v) {
    this._src = v; let w = 100, h = 100;
    try {
      let m = /sprites\/fx\/([^/.]+)\.png/.exec(v);
      if (m && sandbox.FX_MANIFEST && sandbox.FX_MANIFEST[m[1]]) { w = sandbox.FX_MANIFEST[m[1]].w; h = sandbox.FX_MANIFEST[m[1]].h; }
      else if ((m = /sprites\/([^/]+)\/([^/.]+)\.png/.exec(v)) && sandbox.SPRITE_MANIFEST[m[1]] && sandbox.SPRITE_MANIFEST[m[1]][m[2]]) { w = sandbox.SPRITE_MANIFEST[m[1]][m[2]].w; h = sandbox.SPRITE_MANIFEST[m[1]][m[2]].h; }
    } catch (e) {}
    this.width = w; this.height = h; if (this.onload) this.onload();
  } get src() { return this._src; } },
  navigator: { getGamepads: () => [] },
  window: { addEventListener() {}, innerWidth: 1280, innerHeight: 720 },
  document: { getElementById: () => ({ getContext: () => ctx, style: {} }), createElement: () => ({ getContext: () => new Ctx(), width: 0, height: 0 }), documentElement: {} },
  __REC: REC, __ctx: ctx, __OUT: OUT, __fs: fs, __ARGS: process.argv.slice(2),
};
sandbox.window.speechSynthesis = null;
vm.createContext(sandbox);
const html = fs.readFileSync(root + '/index.html', 'utf8');
const files = [...html.matchAll(/src="((?:js|sprites)\/[^"]+)"/g)].map(m => m[1]);
// manifests are `const` declarations: expose them on the sandbox for the Image stub
let code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n')
  .replace('const SPRITE_MANIFEST =', 'var SPRITE_MANIFEST =').replace('const FX_MANIFEST =', 'var FX_MANIFEST =');
code += `
;(function(){
  if (typeof Sprites !== 'undefined' && Sprites.init) Sprites.init();
  if (typeof FXImg !== 'undefined' && FXImg.init) FXImg.init();
  const DEFS = ['chopper', 'zoro', 'whitebeard'];
  const GROUND_KEYS = ['L1','L2','L3','L4','M1','M2','H1','s1','s2','su1','su3'];
  const AIR_KEYS = ['A1','A2','A3','AM','A4'];
  const ids = __ARGS.length ? __ARGS : ROSTER.map(c => c.id);
  // wrap draws so every recorded draw knows whose it is
  const fdraw = Fighter.prototype.draw;
  Fighter.prototype.draw = function (c) {
    const prev = __REC.owner; __REC.owner = this.__tag || null; fdraw.call(this, c);
    // reference: the attacker's standing body at the same spot, so the audit can tell reaching art (weapon/fist) from hats and hair
    if (this.__tag === 'A' && __REC.on) { const si = Sprites.get(this.spriteId, 'idle'); if (si) { __REC.owner = 'AI'; drawSprite(c, si, this.x, this.y, this.facing, {}, this.spriteH); } }
    __REC.owner = prev;
  };
  // shared effects (remote soul-steal, sprouting arms, quake waves...) drawn before the hit can only be the attacker's
  const fxd = FX.draw.bind(FX);
  // only the shapes that read as the attack itself count: swooshes, slash lines, painted art, bolts (not sparks/dust/rings)
  const STRIKE_FX = new Set(['arc', 'slashline', 'art', 'bolt']);
  FX.draw = function (c) {
    const all = FX.parts, prev = __REC.owner;
    FX.parts = all.filter(p => STRIKE_FX.has(p.type)); __REC.owner = __REC.fxOwner || null; fxd(c);
    FX.parts = all.filter(p => !STRIKE_FX.has(p.type)); __REC.owner = null; fxd(c);
    FX.parts = all; __REC.owner = prev;
  };
  function tagEnts(fs) { for (const e of fs.ents) if (!e.__wrapped && e.draw) { const d = e.draw.bind(e); e.__wrapped = true; e.draw = c => { const prev = __REC.owner; __REC.owner = e.owner && e.owner.__tag ? e.owner.__tag + 'E' : null; d(c); __REC.owner = prev; }; } }

  function runCase(cid, key, defId, dist, air, record) {
    const fsn = new FightScene({ p1: charById(cid), p2: charById(defId === cid ? 'luffy' : defId), stage: STAGES[0], mode: 'training', level: 0 });
    Game.scene = fsn; fsn.phase = 'fight';
    for (let i = 0; i < 3; i++) fsn.update();
    const f = fsn.f1, o = fsn.f2; f.__tag = 'A'; o.__tag = 'D';
    f.meter = MAX_METER; f.cd = {};
    const d = f.moves[key]; if (!d || d.tpl === 'transform') return null;
    f.x = 900; o.x = f.x + dist; f.facing = 1; o.facing = -1; f.vx = o.vx = 0;
    if (air) { f.y = GROUND_Y - air; f.vy = -2; f.state = 'jump'; f.t = 10; }
    fsn.camX = clamp((f.x + o.x) / 2 - W / 2, 0, STAGE_W - W);
    const hp0 = o.hp; let hitF = -1; const frames = [];
    f.startAttack(d, fsn);
    const total = d.isNormal ? (d.startup || 0) + (d.active || 0) + (d.recovery || 0) + 4 : 320;
    for (let i = 1; i <= total; i++) {
      fsn.update();
      if (air && f.state === 'attack') { /* keep the attacker airborne at the test height for the strike */ }
      tagEnts(fsn);
      const hitNow = o.hp < hp0 || o.state === 'hit' || o.state === 'locked' || o.state === 'block';
      if (hitNow && hitF < 0) hitF = i;
      __REC.fxOwner = hitF < 0 ? 'AE' : null;
      if (record) {
        __REC.on = true; __REC.list = []; fsn.draw(__ctx); __REC.on = false;
        const atkF = f.atk ? f.atk.f : -1, ae = f.atk ? f.atk.activeEnd : -1;
        frames.push({ i, af: atkF, act: f.atk ? (atkF > f.atk.data.startup && atkF <= ae + 1) : false, hit: hitNow, fx: Math.round(f.x), ox: Math.round(o.x), draws: __REC.list });
      }
      if (!f.atk && f.state !== 'attack' && i > 5 && !fsn.ents.some(e => e.owner === f)) break;
      if (hitF > 0 && !record) break;
    }
    return { hitF, frames, startup: d.startup, active: d.active, name: d.name || key, tpl: d.tpl || null };
  }

  for (const cid of ids) {
    const out = [];
    for (const defId of DEFS) {
      const keys = GROUND_KEYS.map(k => [k, 0]).concat(...AIR_KEYS.map(k => [[k, 70], [k, 160], [k, 250]]));
      for (const [key, air] of keys) {
        const probe = new FightScene({ p1: charById(cid), p2: charById('luffy'), stage: STAGES[0], mode: 'training', level: 0 });
        if (!probe.f1.moves[key] || probe.f1.moves[key].tpl === 'transform') continue;
        // distance sweep without drawing: where does it stop hitting?
        const hits = [];
        for (let dist = 40; dist <= 1200; dist += 10) { const r = runCase(cid, key, defId, dist, air, false); hits.push(r && r.hitF > 0 ? 1 : 0); }
        let last = -1; hits.forEach((h, i) => { if (h) last = i; });
        const dHit = last < 0 ? 0 : 40 + last * 10;
        // record drawn frames around the edge (and a bit further to find where the art stops touching)
        const recs = [];
        const lo = Math.max(40, dHit - 20), hi = Math.min(1250, Math.max(dHit, 40) + 150);
        for (let dist = lo; dist <= hi; dist += 10) {
          const r = runCase(cid, key, defId, dist, air, true);
          if (r) recs.push({ dist, hitF: r.hitF, frames: r.frames.filter(fr => fr.af > r.startup || fr.af === -1) });
        }
        out.push({ cid, key, def: defId, air, dHit, hits: hits.join(''), recs });
      }
    }
    __fs.writeFileSync(__OUT + '/' + cid + '.json', JSON.stringify(out));
    console.log('dumped', cid, out.length);
  }
})();`;
vm.runInContext(code, sandbox, { filename: 'audit.js' });
