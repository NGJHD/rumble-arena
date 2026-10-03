'use strict';
// Signature mechanics for rush / upper specials. buildSpecial() applies SPECIAL_STYLES[spec.style](d, spec, ch).
// Hooks: d.onFrame(f, fr, g, a) per frame, d.onHit(att, def, res, g) after a melee hit lands.

const SPECIAL_STYLES = {
  // Zoro Oni Giri / Brook Hanauta Sancho: dash straight through, the cut lands a beat later
  through(d, spec) {
    Object.assign(d, { startup: 8, active: 12, recovery: 18, hits: 1, stopOnHit: false, passThrough: true, box: { x: -20, y: -140, w: 90, h: 130 } });
    d.hit = Object.assign({}, d.hit, { dmg: Math.round((spec.dmg || 90) * 0.4), hitstun: 40, kb: [2, 0], launch: 0, knockdown: false, strength: 2 });
    d.onFrame = (f, fr, g) => {
      if (fr === 8) { Sound.play('dash'); Sound.elem(spec.elem); }
      if (fr > 8 && fr <= 20) { f.vx = f.facing * 24; f.trail = 6; }
      if (fr > 20) f.vx *= 0.5;
    };
    d.onHit = (att, def, res, g) => {
      if (res !== 'hit') return;
      g.addEnt(new SlashStorm({ owner: att, x: def.x, y: def.y - def.height * 0.5, delay: 14, life: 34, hits: 2, hitEvery: 4, small: !spec.single, single: !!spec.single, color: spec.single ? '#ffffff' : '#b3e5fc', elem: spec.single ? 'slash' : spec.elem,
        hit: { dmg: Math.round((spec.dmg || 90) * 0.35), hitstun: 40, kb: [8, -12], launch: -12, knockdown: true, strength: 3, elem: spec.elem, blockstun: 16 },
        finalFx: null, m: 0.5 }));
    };
  },
  // Sanji Diable Jambe: a spinning, flaming kick drill
  spin(d, spec) {
    Object.assign(d, { startup: 8, active: 22, recovery: 16, hits: 5, hitEvery: 4, spinSprite: 0.7, spritePose: 'kick' });
    d.onFrame = (f, fr, g, a) => {
      if (fr === 8) Sound.play('fire');
      if (fr > 8 && !a.stopped && fr <= a.activeEnd) { f.vx = f.facing * 13; FX.burst(f.x, f.y - f.height * 0.4, spec.elem, 6, 5, 11, 20, -0.15); if (fr % 3 === 0) FX.arc(f.x, f.y - f.height * 0.45, 80, fr % 6 ? 1 : -1, '#ff9100'); }
      else f.vx *= 0.6;
    };
  },
  // Chopper Horn Point: head-down antler charge that tosses the opponent high
  charge(d, spec) {
    Object.assign(d, { startup: 10, active: 16, recovery: 18, hits: 1, spritePose: 'kick', tilt: -0.35 });
    d.hit = Object.assign({}, d.hit, { dmg: spec.dmg || 85, launch: -21, kb: [6, -21], hitstun: 46 });
    d.onFrame = (f, fr, g, a) => { if (fr > 10 && !a.stopped && fr <= a.activeEnd) { f.vx = f.facing * 17; if (fr % 2) FX.dust(f.x, GROUND_Y, 1); } else f.vx *= 0.6; };
  },
  // Jinbe Vagabond Drill: a spinning water drill, many small hits
  drill(d, spec) {
    Object.assign(d, { startup: 10, active: 24, recovery: 18, hits: 6, hitEvery: 3, spinSprite: 0.9, spritePose: 'attack' });
    d.hit = Object.assign({}, d.hit, { dmg: Math.round((spec.dmg || 90) / 6) + 2 });
    d.onFrame = (f, fr, g, a) => {
      if (fr > 10 && !a.stopped && fr <= a.activeEnd) { f.vx = f.facing * 12; FX.ring(f.x + f.facing * 40, f.y - f.height * 0.5, '#4fc3f7', 10, 50, 8, 3); }
      else f.vx *= 0.6;
    };
  },
  // Akainu Meigo: a short magma punch that erupts under the victim
  erupt(d, spec) {
    Object.assign(d, { startup: 10, active: 10, recovery: 20, hits: 1, spritePose: 'attack' });
    d.hit = Object.assign({}, d.hit, { dmg: Math.round((spec.dmg || 95) * 0.5), hitstun: 30, kb: [3, 0], launch: 0, knockdown: false });
    d.onFrame = (f, fr, g, a) => { if (fr > 10 && !a.stopped && fr <= a.activeEnd) f.vx = f.facing * 11; else f.vx *= 0.5; };
    d.onHit = (att, def, res, g) => {
      if (res !== 'hit') return;
      g.addEnt(new Pillar({ owner: att, x: def.x, w: 130, h: 300, delay: 4, dur: 16, hits: 2, hitEvery: 5, elem: 'magma', art: 'eruption',
        hit: { dmg: Math.round((spec.dmg || 95) * 0.3), hitstun: 42, launch: -18, kb: [2, -18], knockdown: true, strength: 3, elem: 'magma', blockstun: 16 } }));
    };
  },
  // Shanks Gryphon Dash: long, fast and leaves a red haki line
  long(d, spec) {
    Object.assign(d, { startup: 10, active: 14, recovery: 20, hits: 1, passThrough: true, stopOnHit: false, spritePose: 'attack' });
    d.onFrame = (f, fr, g) => {
      if (fr > 10 && fr <= 24) { f.vx = f.facing * 28; f.trail = 6; FX.streaks(f.x, f.y - f.height * 0.5, 'haki', 2, 10, -f.facing); }
      if (fr === 24) FX.slashLine(f.x - f.facing * 200, f.y - f.height * 0.5, 420, 0, '#ff5252', 14);
      if (fr > 24) f.vx *= 0.5;
    };
  },
  // Whitebeard: a huge stationary bisento sweep with a quake crack
  sweep(d, spec) {
    Object.assign(d, { startup: 14, active: 8, recovery: 24, hits: 1, spritePose: 'attack', box: { x: -30, y: -200, w: 330, h: 200 }, gravity: true });
    d.hit = Object.assign({}, d.hit, { dmg: spec.dmg || 95, kb: [16, -10], launch: -10, wallbounce: true });
    d.onFrame = (f, fr, g) => {
      f.vx = 0;
      if (fr === 15) { FX.arc(f.x, f.y - f.height * 0.5, 260, f.facing, '#ffffff'); FX.ring(f.x + f.facing * 200, f.y - 100, '#ffffff', 20, 160, 14, 6); g.shake(10); Sound.play('quake'); }
    };
  },
  // Blackbeard / quake style: punch the air, the impact lands at a distance
  airquake(d, spec) {
    Object.assign(d, { startup: 14, active: 8, recovery: 22, hits: 2, hitEvery: 4, remote: 300, spritePose: 'attack', box: { x: 0, y: -170, w: 120, h: 170 }, gravity: true });
    d.onFrame = (f, fr, g) => {
      f.vx = 0;
      if (fr === 15) {
        const b = f.attackBox(true); if (!b) return;
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        if (!drawArtFX(cx, cy, 'quake')) FX.ring(cx, cy, '#ffffff', 10, 140, 16, 6);
        g.shake(12); Sound.play('quake');
      }
    };
  },
  // Mihawk Hawk Strike: blinks forward and cuts
  blink(d, spec) {
    Object.assign(d, { startup: 12, active: 6, recovery: 20, hits: 1, spritePose: 'attack', box: { x: -40, y: -150, w: 150, h: 150 } });
    d.onFrame = (f, fr, g) => {
      if (fr === 12) {
        FX.burst(f.x, f.y - f.height * 0.5, 'slash', 14, 6, 6, 16);
        const dist = clamp((f.opp.x - f.x) * f.facing - 70, 60, 260);
        f.x = clamp(f.x + f.facing * dist, g.camX + 40, g.camX + W - 40); f.trail = 10;
        FX.slashLine(f.x - f.facing * dist / 2, f.y - f.height * 0.5, dist + 60, 0, '#69f0ae', 10);
        Sound.play('slash');
      }
    };
  },
  // Kaido Thunder Bagua: leap, then smash the club down with lightning
  leap(d, spec) {
    Object.assign(d, { startup: 8, active: 40, recovery: 22, hits: 1, gravity: true, spritePose: (f, fr) => (fr > 9 && f.vy > 0 ? 'attack' : 'upper'), box: { x: -40, y: -200, w: 200, h: 220 } });
    d.hit = Object.assign({}, d.hit, { dmg: spec.dmg || 100, slam: true, kb: [4, 20], groundbounce: true, knockdown: true, strength: 4 });
    d.onFrame = (f, fr, g, a) => {
      if (fr === 9) { f.vy = -17; f.vx = clamp((f.opp.x - f.x) / 26, -10, 10); Sound.play('jump'); }
      if (fr > 14 && !f.airborne && !a.boom) {
        a.boom = true; a.activeEnd = fr;
        FX.ring(f.x + f.facing * 80, GROUND_Y, '#b388ff', 20, 220, 18, 8);
        for (let i = 0; i < 4; i++) FX.bolt(f.x + f.facing * 80, GROUND_Y, f.x + f.facing * 80 + rand(-160, 160), GROUND_Y - rand(80, 260), '#fff176', 10, 4);
        g.shake(16); Sound.play('lightning');
      }
    };
  },
  // Law Injection Shot: an instant piercing line
  pierce(d, spec) {
    Object.assign(d, { startup: 14, active: 4, recovery: 22, hits: 1, spritePose: 'attack', box: { x: 0, y: -110, w: 560, h: 40 }, stretchRange: 0 });
    d.hit = Object.assign({}, d.hit, { dmg: spec.dmg || 90, kb: [10, -8], launch: -8 });
    d.onFrame = (f, fr, g) => {
      if (fr === 15) {
        const y = f.y - 110 * f.hs + 20;
        FX.slashLine(f.x + f.facing * 280, y, 560, 0, '#80deea', 10);
        FX.burst(f.x + f.facing * 300, y, 'room', 16, 8, 6, 20);
        Sound.play('slash');
      }
    };
  },
  // Garp Fist of Love: one enormous punch, bounces off walls and the floor
  bigpunch(d, spec) {
    Object.assign(d, { startup: 14, active: 6, recovery: 26, hits: 1, lunge: 10, spritePose: 'attack', box: { x: 0, y: -150, w: 150, h: 120 } });
    d.hit = Object.assign({}, d.hit, { dmg: spec.dmg || 95, kb: [22, -10], launch: -10, wallbounce: true, groundbounce: true, strength: 4, hitstop: 16 });
    d.onFrame = (f, fr) => { if (fr === 15) FX.comic(f.x + f.facing * 120, f.y - f.height - 20, 'LOVE!', 4); };
  },
  // Doflamingo Parasite: a string that yanks the opponent in
  pull(d, spec, ch) {
    Object.assign(d, { startup: 12, active: 2, recovery: 26, hits: 1, box: null, spawnAt: 12, spritePose: 'special' });
    d.spawn = (f, g) => {
      const hp = handPt(f) || spawnPt(f);
      g.addEnt(new Proj({ owner: f, x: hp.x, y: hp.y, vx: f.facing * 22, r: 16, sprite: 'string', elem: 'string', hits: 1, life: 30, pull: true, string: true,
        hit: { dmg: spec.dmg || 80, hitstun: 50, kb: [0, 0], strength: 3, elem: 'string', blockstun: 14 } }));
      Sound.play('slash');
    };
  },
  // Sanji Sky Walk: three air-steps upward, kicking each time
  skywalk(d, spec) {
    Object.assign(d, { startup: 4, active: 24, recovery: 14, hits: 3, hitEvery: 7, spritePose: 'kick', gravity: true });
    d.onFrame = (f, fr) => { if (fr === 5 || fr === 12 || fr === 19) { f.vy = -11; f.vx = f.facing * 3; FX.ring(f.x, f.y, '#ffffff', 6, 50, 10, 3); Sound.play('jump'); } };
  },
  // Franky Coup de Boo: blasts himself sky-high on a jet of fire
  rocket(d, spec) {
    Object.assign(d, { startup: 6, active: 16, recovery: 16, hits: 2, hitEvery: 6, spritePose: 'upper', gravity: true });
    d.onFrame = (f, fr) => {
      if (fr === 6) { f.vy = -24; f.vx = f.facing * 6; FX.burst(f.x, f.y, 'fire', 30, 8, 10, 30); FX.smoke(f.x, f.y, 8); Sound.play('explode'); }
      if (fr > 6 && fr < 22) { FX.burst(f.x - f.facing * 10, f.y + 10, 'fire', 8, 4, 14, 22, 0.3); FX.smoke(f.x, f.y + 20, 1); }
    };
  },
  // Robin Demonio Fleur: her giant demon form rises behind her and crushes everything in front
  demonio(d, spec) {
    Object.assign(d, { startup: 12, active: 2, recovery: 30, hits: 1, box: null, spawnAt: 12, spritePose: 'super', gravity: true });
    d.spawn = (f, g) => {
      g.addEnt(new DemonFleur({ owner: f, x: f.x - f.facing * 30, life: 46, hits: 3, hitEvery: 6, elem: 'flower',
        hit: { dmg: Math.round((spec.dmg || 90) / 3), hitstun: 40, launch: -15, kb: [6, -15], knockdown: true, strength: 3, elem: 'flower', blockstun: 16, chip: 0.15 } }));
      g.darkT = 30; Sound.play('dark');
    };
  },
  // Blackbeard Kurouzu: darkness pulls the opponent into his grip, then he crushes them
  vortexpull(d, spec) {
    Object.assign(d, { startup: 10, active: 26, recovery: 18, hits: 0, box: null, spritePose: 'special', gravity: true });
    d.onFrame = (f, fr, g, a) => {
      const hp = handPt(f) || spawnPt(f), o = f.opp;
      if (fr > 10 && fr <= 36) {
        if (fr % 2 === 0) FX.add({ type: 'art', id: 'blackhole', x: hp.x, y: hp.y, h: 150 + Math.sin(fr) * 20, life: 6 });
        for (let i = 0; i < 2; i++) { const a2 = rand(0, TAU), r = rand(120, 260); FX.add({ type: 'dot', x: hp.x + Math.cos(a2) * r, y: hp.y + Math.sin(a2) * r, vx: -Math.cos(a2) * r / 12, vy: -Math.sin(a2) * r / 12, r: 6, life: 12, col: ec('dark', randi(0, 2)), drag: 1 }); }
        const dist = Math.abs(o.x - f.x);
        if (!a.caught && dist < 560 && o.invuln <= 0 && !['block', 'ko', 'down'].includes(o.state) && !o.canBlock(f.x)) a.caught = true;
        if (a.caught) {
          o.state = 'hit'; o.hitstun = 20; o.atk = null; o.vx = 0;
          o.x += (f.x + f.facing * 70 * f.hs - o.x) * 0.18; o.y += (Math.min(GROUND_Y, hp.y + o.height * 0.4) - o.y) * 0.18;
        }
      }
      if (fr === 36 && a.caught) {
        g.applyHit(f, o, { dmg: spec.dmg || 85, hitstun: 44, launch: -12, kb: [8, -12], knockdown: true, strength: 4, elem: 'dark', dir: f.facing, sx: hp.x + f.facing * 30, sy: hp.y }, null);
        FX.comic(o.x, o.y - o.height - 20, 'CRUSH!', 4);
      }
    };
  },
  // Whitebeard Shima Yurashi: he grabs the air and the whole island tilts; quakes roll out both ways
  shima(d, spec) {
    Object.assign(d, { startup: 16, active: 2, recovery: 30, hits: 0, box: null, spawnAt: 16, spritePose: 'special', gravity: true });
    d.spawn = (f, g) => {
      g.tiltT = 70; g.shake(18); Sound.play('quake'); FX.comic(f.x, f.y - f.height - 40, 'GURARARA!', 4);
      for (const dir of [-1, 1]) g.addEnt(new Wave({ owner: f, x: f.x + dir * 70, vx: dir * 13, w: 90, h: 170, elem: 'quake', art: 'quake', hits: 1, clash: true, dir,
        hit: { dmg: spec.dmg || 95, hitstun: 40, kb: [10, -13], launch: -13, knockdown: true, strength: 4, elem: 'quake', blockstun: 18, chip: 0.15 } }));
    };
  },
  // Shanks: a burst of Conqueror's Haki; anyone close is knocked dizzy
  hakiburst(d, spec) {
    Object.assign(d, { startup: 14, active: 2, recovery: 24, hits: 0, box: null, spawnAt: 14, spritePose: 'super', invuln: [0, 16] });
    d.spawn = (f, g) => {
      g.darkT = 24; g.flashT = 6; g.shake(12); Sound.play('dark');
      g.addEnt(new Dome({ owner: f, x: f.x, y: f.y - f.height * 0.5, rMax: 300, life: 24, hits: 1, hitEvery: 99, elem: 'haki',
        hit: { dmg: spec.dmg || 70, hitstun: 70, kb: [6, -6], launch: -6, knockdown: false, strength: 4, elem: 'haki', blockstun: 20, chip: 0.2 } }));
      FX.comic(f.x, f.y - f.height - 40, 'HAKI!', 4);
    };
  },
  // Ace Fire Pillar: a column of fire erupts around him
  firepillar(d, spec) {
    d.onFrame = ((orig) => (f, fr, g, a) => {
      orig(f, fr, g, a);
      if (fr === 5) g.addEnt(new Pillar({ owner: f, x: f.x, w: 150, h: 340, delay: 0, dur: 20, hits: 0, elem: 'fire', art: 'eruption' }));
    })(d.onFrame);
  },
};

// Quake impact art at a point (Blackbeard / Whitebeard), returns false if the art isn't loaded
function drawArtFX(x, y, id) {
  if (!FXImg.get(id)) return false;
  FX.add({ type: 'art', id, x, y, h: 220, life: 16 });
  return true;
}
