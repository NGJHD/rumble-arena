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
  const out=[];
  for (const ch of ROSTER) {
    const fs = new FightScene({ p1: ch, p2: charById('luffy')===ch?charById('zoro'):charById('luffy'), stage: STAGES[0], mode: 'training', level: 0 });
    Game.scene = fs; for (let i=0;i<3;i++) fs.update();
    fs.f2.x = fs.f1.x + 140;
    let maxC=0, air=0;
    const inp = { held:{}, pressed:{} }; for (const a of ACTIONS){inp.held[a]=false;inp.pressed[a]=false;}
    fs.f1.input = inp;
    for (let i=0;i<240;i++){ for(const a of ACTIONS) inp.pressed[a]=false; if(i%5===0){inp.pressed.l=true;} inp.held.l = i%5<2;
      fs.update(); maxC=Math.max(maxC, fs.f1.combo); if (fs.f1.combo>0 && fs.f2.airborne) air++; }
    out.push(ch.id+':'+maxC+(air?'':'(noair)'));
  }
  console.log(out.join(' '));
})();`;
vm.runInContext(code, sandbox, { filename: "game.js" });
