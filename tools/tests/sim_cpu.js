const fs = require('fs'), vm = require('vm'), path = require('path');
const root = 'C:/GitHub/Rumble Arena';
const handler = { get(t, k) { if (k in t) return t[k]; return (...a) => ({ addColorStop() {} }); }, set(t, k, v) { t[k] = v; return true; } };
const fakeCtx = new Proxy({}, handler);
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Set, Map, setInterval: () => 0, clearInterval() {},
  performance: { now: () => 0 }, requestAnimationFrame() {},
  localStorage: { getItem: () => null, setItem() {} },
  Image: class { set src(v) {} },
  navigator: { getGamepads: () => [] },
  window: { addEventListener() {}, innerWidth: 1280, innerHeight: 720 },
  document: { getElementById: () => ({ getContext: () => fakeCtx, style: {} }), documentElement: {} },
};
sandbox.window.speechSynthesis = null;
vm.createContext(sandbox);
const html = fs.readFileSync(root + '/index.html', 'utf8');
const files = [...html.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]);
let code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
code += `
;(function(){
  let errors = 0, stats = {hits:0, supers:0, kos:0, rounds:0};
  const origApply = FightScene.prototype.applyHit;
  FightScene.prototype.applyHit = function(...a){ const r = origApply.apply(this, a); if (r==='hit') stats.hits++; return r; };
  const origSF = FightScene.prototype.superFlash;
  FightScene.prototype.superFlash = function(...a){ stats.supers++; return origSF.apply(this,a); };
  for (let m = 0; m < ROSTER.length; m++) {
    const p1 = ROSTER[m], p2 = ROSTER[(m * 7 + 3) % ROSTER.length];
    const fs = new FightScene({ p1, p2, stage: STAGES[m % 4], mode: 'cpu', level: 2 });
    // make P1 a CPU too
    fs.f1.input = new CpuInput(2);
    Game.scene = fs;
    for (let i = 0; i < 60 * 200; i++) {
      try {
        fs.f1.input.think(fs.f1, fs.f2, fs);
        fs.update(); fs.draw(ctx);
        for (const f of [fs.f1, fs.f2]) if (!isFinite(f.x) || !isFinite(f.y) || f.y > GROUND_Y + 1) throw new Error('bad pos ' + f.ch.id + ' ' + f.x + ',' + f.y + ' state ' + f.state);
      } catch (e) { errors++; if (errors < 6) console.log(p1.id, 'vs', p2.id, 'frame', i, String(e.stack).slice(0,400)); break; }
      if (Game.scene !== fs) { stats.rounds++; break; }
    }
    Game.scene.draw && Game.scene.draw(ctx);
  }
  console.log('errors', errors, JSON.stringify(stats));
  // also draw menus
  for (const S of [TitleScene, DifficultyScene, ControlsScene, OptionsScene]) { const s = new S(); s.update(); s.draw(ctx); }
  const ss = new SelectScene('vs'); ss.update(); ss.draw(ctx);
  const st = new StageScene({p1:ROSTER[0],p2:ROSTER[1],mode:'vs',level:0}); st.update(); st.draw(ctx);
  console.log('menus ok');
})();`;
vm.runInContext(code, sandbox, { filename: 'game.js' });
