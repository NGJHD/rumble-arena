// Arcade mode: ladder of 8 (7 distinct foes + Imu), boss intro, Imu's moves, win -> next / ending, loss -> rematch menu.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = 'C:/GitHub/Rumble Arena';
const handler = { get(t, k) { if (k in t) return t[k]; return (...a) => ({ addColorStop() {}, width: 10 }); }, set(t, k, v) { t[k] = v; return true; } };
const fakeCtx = new Proxy({}, handler);
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Set, Map, setInterval: () => 0, clearInterval() {},
  performance: { now: () => 0 }, requestAnimationFrame() {},
  localStorage: { getItem: () => null, setItem() {} },
  Image: class { set src(v) {} },
  navigator: { getGamepads: () => [] },
  window: { addEventListener() {}, innerWidth: 1280, innerHeight: 720 },
  document: { getElementById: () => ({ getContext: () => fakeCtx, style: {} }), createElement: () => ({ getContext: () => fakeCtx }), documentElement: {} },
};
sandbox.window.speechSynthesis = null; sandbox.fakeCtx = fakeCtx;
vm.createContext(sandbox);
const html = fs.readFileSync(root + '/index.html', 'utf8');
const files = [...html.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]).filter(f => !f.endsWith('main.js'));
let code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
code += `
;(function(){
  const Game = { scene: null, fight: null, goto(s) { this.scene = s; } };
  globalThis.Game = Game;
  const out = [];
  // 1. ladder
  const run = Arcade.start(charById('zoro'), 1);
  const ids = run.ladder.map(l => l.ch.id);
  out.push('ladder ' + ids.join(','));
  if (ids.length !== 8 || ids[7] !== 'imu' || new Set(ids).size !== 8 || ids.includes('zoro')) throw new Error('bad ladder');
  out.push('levels ' + run.ladder.map((l, i) => Arcade.level(run, i)).join(''));
  // 2. win every battle -> ladder scene each time, ending after Imu
  for (let i = 0; i < 8; i++) {
    const f = new FightScene(Arcade.fightOpts(run));
    if (i === 7) {
      if (f.phase !== 'bossIntro') throw new Error('no boss intro, phase ' + f.phase);
      for (let t = 0; t < 400; t++) { f.update(); f.draw(fakeCtx); }
      out.push('boss intro -> ' + f.phase + ', imu armor ' + f.f2.armor);
    }
    const next = Arcade.after(f, f.f1);
    out.push((i + 1) + ':' + next.constructor.name);
  }
  // 3. losing -> rematch / main menu
  const run2 = Arcade.start(charById('nami'), 0);
  const f2 = new FightScene(Arcade.fightOpts(run2));
  const lose = Arcade.after(f2, f2.f2);
  out.push('lose -> ' + lose.constructor.name + ' [' + lose.items.join('/') + ']');
  // 4. every Imu move runs without errors
  let errs = 0;
  for (const key of ['L1','L2','L3','M1','M2','H1','s1','s2','su1','su3']) {
    const g = new FightScene({ p1: charById('imu'), p2: charById('luffy'), stage: BOSS_STAGE, mode: 'training', level: 0 });
    Game.scene = g; for (let i=0;i<3;i++) g.update();
    g.f2.x = g.f1.x + 220; g.f1.meter = 3000;
    try { g.f1.startAttack(g.f1.moves[key], g); const hp = g.f2.hp; for (let i=0;i<300;i++){ g.update(); g.draw(fakeCtx); } }
    catch (e) { errs++; out.push('ERR ' + key + ' ' + e.message); }
  }
  out.push('imu moves errors ' + errs);
  console.log(out.join('\\n'));
})();`;
vm.runInContext(code, sandbox, { filename: 'arcade.js' });
