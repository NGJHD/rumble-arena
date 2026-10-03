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
  // jump, then double-jump at the apex: how high does each fighter's head get?
  const out=[];
  for (const ch of ROSTER) {
    const fs = new FightScene({ p1: ch, p2: charById(ch.id==='zoro'?'luffy':'zoro'), stage: STAGES[0], mode: 'training', level: 0 });
    Game.scene = fs; for (let i=0;i<3;i++) fs.update(); fs.f2.x = fs.f1.x + 600;
    const f = fs.f1, inp = { held:{}, pressed:{} }; for (const a of ACTIONS){inp.held[a]=false;inp.pressed[a]=false;} f.input = inp;
    let minHead = 9999, did = false;
    for (let i=0;i<120;i++){
      for (const a of ACTIONS){inp.pressed[a]=false;inp.held[a]=false;}
      if (i===0){ inp.held.up=true; inp.pressed.up=true; }
      if (!did && i>2 && f.vy >= 0 && f.airborne){ inp.pressed.up=true; inp.held.up=true; did=true; }
      fs.update(); minHead = Math.min(minHead, f.y - f.spriteH);
    }
    out.push(ch.id+':'+Math.round(minHead));
  }
  console.log('head top at peak (0 = top of screen):', out.join(' '));
})();`;
vm.runInContext(code, sandbox, { filename: "game.js" });
