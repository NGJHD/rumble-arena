const fs = require('fs'), vm = require('vm'), path = require('path');
const root = 'C:/GitHub/Rumble Arena';
const handler = { get(t, k) { if (k in t) return t[k]; return (...a) => ({ addColorStop() {} }); }, set(t, k, v) { t[k] = v; return true; } };
const fakeCtx = new Proxy({}, handler);
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Set, Map, setInterval: () => 0, clearInterval() {},
  performance: { now: () => 0 }, requestAnimationFrame() {},
  localStorage: { getItem: () => null, setItem() {} },
  Image: class { set src(v) {
    this._src = v; const m = /sprites\/([^/]+)\/([^/.]+)\.png/.exec(v);
    try { const M = sandbox.SPRITE_MANIFEST; if (m && M && M[m[1]] && M[m[1]][m[2]]) { this.width = M[m[1]][m[2]].w; this.height = M[m[1]][m[2]].h; } else { this.width = 100; this.height = 100; } } catch (e) { this.width = 100; this.height = 100; }
    if (this.onload) this.onload();
  } },
  navigator: { getGamepads: () => [] },
  window: { addEventListener() {}, innerWidth: 1280, innerHeight: 720 },
  document: { getElementById: () => ({ getContext: () => fakeCtx, style: {} }), createElement: () => ({ getContext: () => fakeCtx, width: 0, height: 0 }), documentElement: {} },
};
sandbox.window.speechSynthesis = null;
vm.createContext(sandbox);
const html = fs.readFileSync(root + '/index.html', 'utf8');
const files = [...html.matchAll(/src="((?:js|sprites)\/[^"]+)"/g)].map(m => m[1]);
let code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
code += `
;(function(){
  // place the defender so the sprites visibly overlap the strike, then check the hit lands
  const rows=[]; let miss=0, tot=0;
  for (const ch of ROSTER) for (const key of ['L1','L2','L3','M1','M2','H1']) {
    const fs = new FightScene({ p1: ch, p2: charById(ch.id==='zoro'?'luffy':'zoro'), stage: STAGES[0], mode: 'training', level: 0 });
    Game.scene = fs; for (let i=0;i<3;i++) fs.update();
    const f = fs.f1, d = f.moves[key];
    if (d.proj || d.remote) continue;
    // visual reach of the strike pose: fist/foot point of the sprite
    const pose = d.spritePose || ({L1:'attack',L2:'attack',L3:'kick',M1:'attack',M2:'kick',H1:'attack'})[key];
    const fp = f.fistPoint({ pose, sx: 1, sy: 1, dx: 0, dy: 0 });
    const reach = fp ? (fp.x - f.x) * f.facing + fp.r : 80;
    // opponent's visual body edge = its idle sprite half-width
    const o = fs.f2, oi = Sprites.get(o.ch.id, 'idle');
    const oHalf = oi ? (o.spriteH / oi.idle.srcH * oi.m.srcH * oi.img.width / oi.img.height) * 0.3 : o.width / 2;
    o.x = f.x + reach + oHalf - 10;   // fist just inside the opponent's body
    f.startAttack(d, fs);
    const hp0 = o.hp; for (let i=0;i<40;i++) fs.update();
    tot++; if (o.hp === hp0 && o.state !== 'block') { miss++; rows.push(ch.id+'.'+key+'(reach '+Math.round(reach)+')'); }
  }
  console.log('visual-range misses', miss, '/', tot); console.log(rows.join(' '));
})();`;
vm.runInContext(code, sandbox, { filename: "game.js" });
