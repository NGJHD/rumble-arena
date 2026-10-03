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
  const out=[]; const mk=()=>({pressed:{left:false,right:false,up:false,down:false}});
  // solo: P1 picks zoro (slot 1), then nami (slot 2)
  for (const pick of [1, 2]) {
    const sc = new SelectScene('cpu', 0); sc.cur[0] = pick; sc.locked[0] = true; sc.pick[0] = ROSTER[pick]; sc.freeCursor(1);
    out.push('solo pick '+ROSTER[pick].id+' -> cpu cursor '+ROSTER[sc.cur[1]].id);
    // walk the CPU cursor left/right across the taken slot
    const seen=[]; for (const d of ['left','left','left','right','right','right']) { const inp=mk(); inp.pressed[d]=true; sc.move(1, inp); seen.push(sc.charAt(sc.cur[1]) ? sc.charAt(sc.cur[1]).id : 'random'); }
    out.push('  moves: '+seen.join(' ')+(seen.includes(ROSTER[pick].id)?'  <-- LANDED ON TAKEN':'  (never on '+ROSTER[pick].id+')'));
  }
  // vs: P2 cursor sits on zoro, P1 locks zoro
  const v = new SelectScene('vs', 0); v.cur=[1,1]; v.locked[0]=true; v.pick[0]=ROSTER[1]; v.freeCursor(1);
  out.push('vs: P1 locks zoro while P2 on it -> P2 moved to '+ROSTER[v.cur[1]].id);
  // vertical move onto a taken slot
  const u = new SelectScene('vs', 0); u.locked[0]=true; u.pick[0]=ROSTER[SEL_COLS]; u.cur[1]=0; const inp=mk(); inp.pressed.down=true; u.move(1, inp);
  out.push('vs: moving down onto taken '+ROSTER[SEL_COLS].id+' -> landed on '+(u.charAt(u.cur[1])||{id:'random'}).id);
  console.log(out.join(' | '));
})();`;
vm.runInContext(code, sandbox, { filename: "game.js" });
