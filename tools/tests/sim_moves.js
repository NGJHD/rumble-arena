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
  let errors=0, done=0;
  for (const ch of ROSTER) for (const key of ['s1','s2','su1','su3','g5']) {
    const fs = new FightScene({ p1: ch, p2: ROSTER[(ROSTER.indexOf(ch)+5)%ROSTER.length], stage: STAGES[0], mode: 'training', level: 0 });
    Game.scene = fs; for (let i=0;i<3;i++) fs.update();
    fs.f2.x = fs.f1.x + 220;
    try {
      if (key==='g5') { if (!fs.f1.moves.suG1) continue; fs.f1.form='luffy_g5'; fs.f1.formT=600; fs.f1.meter=3000; fs.f1.startAttack(fs.f1.moveFor('su'), fs); }
      else { fs.f1.meter = 3000; fs.f1.startAttack(fs.f1.moves[key], fs); }
      for (let i=0;i<400;i++){ fs.update(); fs.draw(ctx); for (const f of [fs.f1,fs.f2]) if(!isFinite(f.x)||!isFinite(f.y)) throw new Error('nan '+f.state); }
      done++;
    } catch(e){ errors++; if(errors<8) console.log(ch.id,key,String(e.stack).slice(0,300)); }
  }
  console.log('moves tested', done, 'errors', errors);
})();`;
vm.runInContext(code, sandbox, { filename: "game.js" });
