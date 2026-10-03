// Imu boss: does he block, does Stigma's spear land, do the Honebami serpents hit? Also boss win rate vs CPU fighters.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = 'C:/GitHub/Rumble Arena';
const handler = { get(t, k) { if (k in t) return t[k]; return (...a) => ({ addColorStop() {}, width: 10 }); }, set(t, k, v) { t[k] = v; return true; } };
const fakeCtx = new Proxy({}, handler);
const sandbox = { console, Math, Date, JSON, Object, Array, String, Number, Set, Map, setInterval: () => 0, clearInterval() {}, performance: { now: () => 0 }, requestAnimationFrame() {},
  localStorage: { getItem: () => null, setItem() {} }, Image: class { set src(v) {} }, navigator: { getGamepads: () => [] },
  window: { addEventListener() {}, innerWidth: 1280, innerHeight: 720 },
  document: { getElementById: () => ({ getContext: () => fakeCtx, style: {} }), createElement: () => ({ getContext: () => fakeCtx }), documentElement: {} }, fakeCtx };
sandbox.window.speechSynthesis = null;
vm.createContext(sandbox);
const html = fs.readFileSync(root + '/index.html', 'utf8');
let code = [...html.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]).filter(f => !f.endsWith('main.js')).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
code += `
;(function(){
  globalThis.Game = { scene: null, fight: null, goto(s) { this.scene = s; } };
  const out = [];
  // moves land
  for (const key of ['s1','s2','su1','su3','H1']) {
    const g = new FightScene({ p1: charById('imu'), p2: charById('luffy'), stage: BOSS_STAGE, mode: 'training', level: 0 }); Game.scene = g; for (let i=0;i<3;i++) g.update();
    g.f2.x = g.f1.x + (key==='H1'?150:330); g.f1.meter = 3000; let dmg = 0;
    g.f1.startAttack(g.f1.moves[key], g);
    for (let i=0;i<260;i++){ const h=g.f2.hp; g.update(); g.draw(fakeCtx); if (g.f2.hp<h) dmg += h-g.f2.hp; if (g.f2.hp<500) g.f2.hp=1000; }
    out.push(key+' dmg '+dmg);
  }
  // blocking rate: hard CPU luffy attacks Imu boss (normal arcade) many times
  for (const lvl of [0,1,2]) {
    let att=0, blocked=0;
    for (let n=0;n<40;n++){
      const g = new FightScene({ p1: charById('zoro'), p2: charById('imu'), stage: BOSS_STAGE, mode: 'cpu', level: lvl, boss: true }); Game.scene=g; g.phase='fight';
      for (let i=0;i<3;i++) g.update();
      g.f2.x = g.f1.x + 200; for (let i=0;i<20;i++) g.update();
      if (!g.f2.canAct()) continue;
      g.f1.startAttack(g.f1.moves[['M1','H1','s2'][n%3]], g); att++;
      for (let i=0;i<40;i++){ g.update(); if (g.f2.state==='block') { blocked++; break; } }
    }
    out.push('boss lvl '+lvl+' blocked '+blocked+'/'+att);
  }
  console.log(out.join(String.fromCharCode(10)));
})();`;
vm.runInContext(code, sandbox, { filename: 'boss.js' });
