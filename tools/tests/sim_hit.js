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
  const miss=[], dmg={};
  for (const ch of ROSTER) for (const key of ['s1','s2','su1']) for (const dist of [160, 330]) {
    const fs = new FightScene({ p1: ch, p2: charById(ch.id==='luffy'?'zoro':'luffy'), stage: STAGES[0], mode: 'training', level: 0 });
    Game.scene = fs; for (let i=0;i<3;i++) fs.update();
    fs.f2.x = fs.f1.x + dist; fs.f1.meter = 1000; fs.f1.cd.s2 = 0;
    const d = fs.f1.moves[key];
    if (d.tpl === 'transform') continue;
    fs.f1.startAttack(d, fs);
    let total=0; const hp0=fs.f2.hp;
    for (let i=0;i<260;i++){ fs.update(); if (fs.f2.hp < 1000) { total += 1000 - fs.f2.hp; fs.f2.hp = 1000; } }
    dmg[ch.id+'.'+key+'@'+dist]=total;
    if (total===0) miss.push(ch.id+'.'+key+'@'+dist);
  }
  console.log('MISSES', miss.join(' '));
  const sup = Object.entries(dmg).filter(([k])=>k.includes('su1@160')).map(([k,v])=>k.split('.')[0]+':'+v);
  console.log('SUPER DMG', sup.join(' '));
})();`;
vm.runInContext(code, sandbox, { filename: "game.js" });
