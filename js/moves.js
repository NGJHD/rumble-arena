'use strict';
// Attack poses, normal-move tables, special/super templates and projectile entities.
const GRAV = 0.95;

// Pose keyframes: w = windup (end of startup), s = strike (active frames).
const POSES = {
  jab: { w: { armF: 0.3, elbowF: 2.3, lean: -0.05 }, s: { armF: 1.55, elbowF: 0.05, armFExt: 1.15, lean: 0.15, expr: 'attack' } },
  jab2: { w: { armB: 0.2, elbowB: 2.2 }, s: { armB: 1.55, elbowB: 0.05, armBExt: 1.15, armF: 0.2, elbowF: 2.0, lean: 0.25, expr: 'attack' } },
  kick: { w: { legF: 0.9, kneeF: -1.8, lean: -0.1 }, s: { legF: 1.55, kneeF: 0, legB: -0.1, kneeB: 0, lean: -0.3, expr: 'attack' } },
  kickHigh: { w: { legF: 1.0, kneeF: -2.0 }, s: { legF: 2.3, kneeF: 0, legB: 0, kneeB: 0, lean: -0.55, expr: 'attack' } },
  kickUp: { w: { legF: 0.8, kneeF: -1.8, legB: 0.3, kneeB: -1.0 }, s: { legF: 2.9, kneeF: 0, legB: 0, kneeB: 0, lean: -0.6, expr: 'attack' } },
  spinkick: { w: { lean: 0.1, legF: 0.8, kneeF: -1.5 }, s: { legF: 1.57, kneeF: 0, legB: 0, kneeB: 0, lean: -0.2, spinT: 1, expr: 'attack' } },
  upper: { w: { armF: 0.1, elbowF: 2.2, legF: 0.9, kneeF: -1.6, legB: -0.5, kneeB: -0.8 }, s: { armF: 2.9, elbowF: 0.1, armFExt: 1.1, lean: -0.15, legF: 0.2, kneeF: 0, legB: -0.2, kneeB: 0, yOff: -15, expr: 'attack' } },
  heavy: { w: { armF: -0.7, elbowF: 1.0, lean: -0.3 }, s: { armF: 1.57, elbowF: 0, armFExt: 1.35, lean: 0.45, legB: -0.7, kneeB: 0, legF: 0.6, kneeF: -0.6, expr: 'attack' } },
  heavy2: { w: { armF: -0.9, elbowF: 0.6, lean: -0.4, squash: 0.06 }, s: { armF: 1.6, elbowF: 0, armFExt: 1.55, lean: 0.55, legB: -0.8, kneeB: 0, legF: 0.7, kneeF: -0.7, squash: 0, expr: 'attack' } },
  spin: { w: { armF: 1.2, elbowF: 1.0 }, s: { spinT: 1, legF: 1.2, kneeF: -0.5, armF: 1.6, elbowF: 0, armB: 1.6, elbowB: 0, expr: 'attack' } },
  slam: { w: { armF: 3.0, elbowF: 0, armB: 3.0, elbowB: 0, lean: -0.25 }, s: { armF: 1.0, elbowF: 0, armB: 1.0, elbowB: 0, lean: 0.5, expr: 'attack' } },
  axeKick: { w: { legF: 2.6, kneeF: 0, lean: -0.4 }, s: { legF: 1.0, kneeF: 0, lean: 0.3, expr: 'attack' } },
  slash: { w: { armF: 2.9, elbowF: 0.2, wpn: 0.4, lean: -0.15 }, s: { armF: 0.9, elbowF: 0, wpn: 0.7, lean: 0.3, expr: 'attack' } },
  slash2: { w: { armF: 0.3, elbowF: 0.1, wpn: 1.2 }, s: { armF: 2.6, elbowF: 0, wpn: 0.2, lean: 0.1, expr: 'attack' } },
  thrust: { w: { armF: 0.9, elbowF: 1.5, wpn: 0.3, lean: -0.15 }, s: { armF: 1.55, elbowF: 0, wpn: 0, lean: 0.4, armFExt: 1.2, legB: -0.7, kneeB: 0, expr: 'attack' } },
  slashUp: { w: { armF: 0.4, elbowF: 0, wpn: 1.0, legF: 0.9, kneeF: -1.6 }, s: { armF: 3.0, elbowF: 0, wpn: 0.1, yOff: -15, legF: 0.2, kneeF: 0, expr: 'attack' } },
  bigslash: { w: { armF: 3.4, elbowF: 0, wpn: 0.2, lean: -0.35 }, s: { armF: 0.8, elbowF: 0, wpn: 1.0, lean: 0.6, legB: -0.8, kneeB: 0, legF: 0.7, kneeF: -0.7, expr: 'attack' } },
  slamSlash: { w: { armF: 3.2, elbowF: 0, wpn: 0.3, lean: -0.3 }, s: { armF: 0.5, elbowF: 0, wpn: 1.1, lean: 0.7, expr: 'attack' } },
  cast: { w: { armF: 0.5, elbowF: 2.0, lean: -0.1 }, s: { armF: 1.55, elbowF: 0, armB: 1.4, elbowB: 0.2, lean: 0.2, expr: 'attack' } },
  rush: { w: { lean: -0.2, legF: 0.9, kneeF: -1.4 }, s: { lean: 0.75, armF: 1.55, elbowF: 0, armB: -0.5, elbowB: 0.5, legB: -1.1, kneeB: 0, legF: 0.7, kneeF: -0.9, expr: 'attack', plant: false } },
  stretch: { w: { armF: 0.2, elbowF: 2.0, lean: -0.2 }, s: { armF: 1.57, elbowF: 0, lean: 0.15, expr: 'attack' } },
  charge: { w: { armF: -0.6, armB: -0.6, elbowF: 1.2, elbowB: 1.2, lean: 0.1, legF: 0.6, kneeF: -0.8, legB: -0.6 }, s: { armF: 2.6, armB: 2.6, elbowF: 0.3, elbowB: 0.3, lean: -0.2, expr: 'attack' } },
};
const STATIC_POSES = {
  block: { armF: 0.9, elbowF: 2.2, armB: 1.0, elbowB: 2.1, lean: -0.15, headTilt: 0.15 },
  hurt: { lean: -0.45, headTilt: -0.35, armF: -0.5, elbowF: 0.5, armB: -0.8, elbowB: 0.6, expr: 'hurt' },
  jumpUp: { legF: 0.9, kneeF: -1.5, legB: 0.2, kneeB: -1.2, armF: 1.2, elbowF: 1.2, armB: -0.5, plant: false },
  fall: { legF: 0.4, kneeF: -0.5, legB: -0.3, kneeB: -0.3, armF: 2.0, elbowF: 0.5, armB: 1.8, elbowB: 0.5, plant: false },
  crouch: { legF: 1.3, kneeF: -2.4, legB: 0.4, kneeB: -2.1, lean: 0.15 },
  win: { armF: 2.9, elbowF: 0.2, armB: 2.6, elbowB: 0.3, expr: 'win' },
  lying: { lying: 1, expr: 'ko', armF: 2.6, elbowF: 0, armB: 2.4, elbowB: 0, legF: 0.1, kneeF: 0, legB: -0.1, kneeB: 0, plant: false },
  dash: { lean: 0.55, armF: -0.6, elbowF: 0.8, armB: -0.9, elbowB: 0.6, legF: 0.9, kneeF: -1.2, legB: -0.9, kneeB: -0.3 },
};
const POSESETS = {
  punch: { L1: 'jab', L2: 'jab2', L3: 'kick', L4: 'upper', M1: 'heavy', M2: 'spinkick', H1: 'heavy2', A1: 'jab', A2: 'kick', A3: 'spin', AM: 'kickHigh', A4: 'slam' },
  kick: { L1: 'kick', L2: 'kickHigh', L3: 'spinkick', L4: 'kickUp', M1: 'kick', M2: 'spinkick', H1: 'kickHigh', A1: 'kick', A2: 'kickHigh', A3: 'spin', AM: 'kick', A4: 'axeKick' },
  sword: { L1: 'slash', L2: 'slash2', L3: 'thrust', L4: 'slashUp', M1: 'thrust', M2: 'spin', H1: 'bigslash', A1: 'slash', A2: 'slash2', A3: 'spin', AM: 'thrust', A4: 'slamSlash' },
};

// Ground chain ranks: L1 0, L2 1, L3 2, M1 3, M2 4, H1 5, L4 (launcher) 6. Air: A1 0, A2 1, A3 2, AM 3, A4 4.
function normalMoves(ch) {
  const P = POSESETS[ch.style] || POSESETS.punch;
  const el = ch.style === 'sword' ? 'slash' : 'punch', ce = ch.elem;
  const mk = (key, o) => Object.assign({ key, isNormal: true, hits: 1, pose: P[key] }, o);
  const H = (o) => Object.assign({ blockstun: 12, elem: el, strength: 1 }, o);
  return {
    L1: mk('L1', { rank: 0, startup: 4, active: 3, recovery: 9, box: { x: 0, y: -125, w: 80, h: 50 }, hit: H({ dmg: 30, hitstun: 20, kb: [1.5, 0] }) }),
    L2: mk('L2', { rank: 1, startup: 5, active: 3, recovery: 10, box: { x: 0, y: -120, w: 84, h: 50 }, hit: H({ dmg: 34, hitstun: 21, kb: [1.5, 0] }) }),
    L3: mk('L3', { rank: 2, startup: 6, active: 4, recovery: 12, lunge: 4, box: { x: 0, y: -95, w: 82, h: 50 }, hit: H({ dmg: 42, hitstun: 21, kb: [4, 0], strength: 2 }) }),
    L4: mk('L4', { rank: 6, startup: 7, active: 5, recovery: 22, autoJump: true, box: { x: -10, y: -175, w: 78, h: 140 }, hit: H({ dmg: 55, hitstun: 46, launch: -20, kb: [2, -20], knockdown: true, strength: 2, elem: ce }) }),
    M1: mk('M1', { rank: 3, startup: 8, active: 5, recovery: 14, lunge: 8, box: { x: 0, y: -120, w: 90, h: 55 }, hit: H({ dmg: 58, hitstun: 23, kb: [6, 0], strength: 2 }) }),
    M2: mk('M2', { rank: 4, startup: 8, active: 6, recovery: 15, lunge: 4, box: { x: -15, y: -115, w: 100, h: 65 }, hit: H({ dmg: 62, hitstun: 23, kb: [5, 0], strength: 2 }) }),
    H1: mk('H1', { rank: 5, startup: 12, active: 5, recovery: 20, lunge: 6, box: { x: 0, y: -130, w: 105, h: 75 }, hit: H({ dmg: 95, hitstun: 34, kb: [16, -7], wallbounce: true, knockdown: true, strength: 3, elem: ce, blockstun: 18 }) }),
    A1: mk('A1', { rank: 0, air: true, startup: 4, active: 4, recovery: 8, box: { x: 0, y: -115, w: 70, h: 55 }, hit: H({ dmg: 30, hitstun: 24, kb: [2, 0] }) }),
    A2: mk('A2', { rank: 1, air: true, startup: 5, active: 4, recovery: 9, box: { x: 0, y: -110, w: 74, h: 60 }, hit: H({ dmg: 34, hitstun: 24, kb: [2, 0] }) }),
    A3: mk('A3', { rank: 2, air: true, startup: 5, active: 6, recovery: 10, box: { x: -20, y: -130, w: 100, h: 100 }, hit: H({ dmg: 40, hitstun: 26, kb: [2, 0], strength: 2 }) }),
    AM: mk('AM', { rank: 3, air: true, startup: 6, active: 5, recovery: 11, box: { x: 0, y: -120, w: 85, h: 65 }, hit: H({ dmg: 48, hitstun: 26, kb: [2, 0], strength: 2 }) }),
    A4: mk('A4', { rank: 4, air: true, startup: 8, active: 5, recovery: 16, box: { x: -10, y: -110, w: 95, h: 100 }, hit: H({ dmg: 70, hitstun: 34, kb: [3, 24], slam: true, knockdown: true, groundbounce: true, strength: 3, elem: ce, blockstun: 16 }) }),
  };
}

const spawnPt = f => ({ x: f.x + f.facing * 50 * f.hs, y: f.y - 95 * f.hs });
// launch point = a companion (Big Mom's Prometheus) when the move says so
// launch point = the hand/weapon tip in the fighter's current strike sprite, so effects leave the hand in sync
const handPt = (f, pose) => {
  const fp = f.fistPoint && f.fistPoint({ pose: pose || 'special', sx: 1, sy: 1, dx: 0, dy: 0 });
  return fp ? { x: fp.x + f.facing * fp.r * 0.6, y: fp.y } : null;
};
const compPt = (f, name) => (name && f.comp && f.comp[name] ? { x: f.comp[name].x, y: f.comp[name].y } : null);
function pillarX(f) {
  let tx = f.opp.x;
  if (Math.abs(tx - f.x) > 760) tx = f.x + Math.sign(tx - f.x) * 760;
  return tx;
}

function buildSpecial(spec, ch) {
  const d = buildSpecialBase(spec, ch);
  if (d && spec.style && typeof SPECIAL_STYLES !== 'undefined' && SPECIAL_STYLES[spec.style]) SPECIAL_STYLES[spec.style](d, spec, ch);
  if (d && spec.spritePose) d.spritePose = spec.spritePose;   // e.g. Arlong's Shark Darts shows his torpedo sprite
  return d;
}

function buildSpecialBase(spec, ch) {
  const e = spec.elem, D = spec.dmg || 80;
  const style = ch.style;
  const base = { isSpecial: true, tpl: spec.type, from: spec.from, name: spec.name, elem: e, hits: 1, cd: 35 };
  const fin = o => Object.assign({ blockstun: 18, elem: e, chip: 0.15, strength: 3, knockdown: true }, o);
  switch (spec.type) {
    case 'proj': {
      const n = spec.count || 1, hits = spec.hits || 1;
      return Object.assign(base, {
        startup: 13, active: 2, recovery: 20, pose: 'cast', gravity: false, spawnAt: 13, cd: 45,
        spawn(f, g) {
          for (let i = 0; i < n; i++) {
            const sp = compPt(f, spec.from) || handPt(f) || spawnPt(f), k = i - (n - 1) / 2;
            g.addEnt(new Proj({
              owner: f, x: sp.x - Math.abs(k) * 20 * f.facing, y: sp.y + k * 36, vx: f.facing * (spec.speed || 12),
              vy: spec.from ? clamp((f.opp.y - f.opp.height * 0.5 - sp.y) / Math.max(10, Math.abs(f.opp.x - sp.x) / (spec.speed || 12)), -6, 6) : k * 0.4,
              r: spec.r || 30, sprite: spec.sprite || 'orb', art: spec.art, artK: spec.artK, artSpin: spec.artSpin, elem: e, hits, hitEvery: 8, life: 140, clash: true,
              hit: fin(spec.stigma ? { dmg: Math.round(D * 0.35), hitstun: 50, kb: [2, 0], launch: 0, knockdown: false, strength: 2, keepAir: true }
                : { dmg: Math.round(D * (n > 1 ? 1.3 / n : 1) / hits), hitstun: 30, kb: [7, -8], launch: -8, strength: 2 }),
              onHitFn: spec.stigma ? (def, gg) => gg.addEnt(new StigmaStrike({ owner: f, x: def.x, elem: e, hit: fin({ dmg: Math.round(D * 0.65), hitstun: 44, kb: [4, -16], launch: -16 }) })) : null,
            }));
          }
          Sound.play('proj'); Sound.elem(e);
        },
      });
    }
    case 'stretch':
      return Object.assign(base, {
        startup: 10, active: 9, recovery: 20, pose: 'stretch', gravity: false, stretchRange: spec.range,
        box: { x: 10, y: -135, w: spec.range, h: 45 },
        hit: fin({ dmg: D, hitstun: 32, kb: [13, -8], launch: -8, strength: 2 }),
        onFrame(f, fr) { if (fr === 10) Sound.play('whoosh'); },
      });
    case 'rush':
      return Object.assign(base, {
        startup: 9, active: 20, recovery: 16, gravity: false, passThrough: true,
        pose: style === 'sword' ? 'thrust' : style === 'kick' ? 'kickHigh' : 'rush',
        box: { x: -10, y: -140, w: 90, h: 125 }, hits: 3, hitEvery: 6, stopOnHit: true,
        hit: fin({ dmg: Math.round(D / 3), hitstun: 34, kb: [11, -12], launch: -12 }),
        multi: { hitstun: 22, kb: [2, 0] },
        onFrame(f, fr, g, a) {
          if (fr === 9) { Sound.play('dash'); Sound.elem(e); }
          if (fr > 9 && !a.stopped && fr <= a.activeEnd) { f.vx = f.facing * 15; f.trail = 6; if (fr % 2) FX.burst(f.x - f.facing * 20, f.y - 70 * f.hs, e, 3, 3, 7, 18); }
          if (a.stopped || fr > a.activeEnd) f.vx *= 0.6;
        },
      });
    case 'upper':
      return Object.assign(base, {
        startup: 5, active: 16, recovery: 14, invuln: [1, 12],
        pose: style === 'kick' ? 'kickUp' : style === 'sword' ? 'slashUp' : 'upper',
        box: { x: -15, y: -180, w: 115, h: 170 }, hits: 3, hitEvery: 5,
        hit: fin({ dmg: Math.round(D / 3), hitstun: 42, launch: -17, kb: [3, -17] }),
        multi: { hitstun: 22, follow: true },
        onFrame(f, fr) {
          if (fr === 1) f.vx = f.facing * 9;
          if (fr === 5) { f.vy = -17; f.vx = f.facing * 4; Sound.elem(e); }
          if (fr > 5 && fr < 22) FX.burst(f.x, f.y - 60 * f.hs, e, 3, 3, 9, 20);
        },
      });
    case 'pillar':
      return Object.assign(base, {
        startup: 12, active: 2, recovery: 24, pose: 'charge', gravity: false, spawnAt: 12, cd: 55,
        spawn(f, g) {
          if (spec.cloud) { g.addEnt(new StormCloud({ owner: f, art: spec.art, x: pillarX(f), w: 120, h: 470, delay: 16, dur: 20, hits: 3, hitEvery: 6, elem: e, hit: fin({ dmg: Math.round(D / 3), hitstun: 40, launch: -17, kb: [2, -17] }) })); return; }
          g.addEnt(new Pillar({ owner: f, hands: spec.hands, x: pillarX(f), w: spec.dragon ? 170 : 120, h: spec.dragon ? 420 : 300, delay: 14, dur: spec.dragon ? 34 : 22, hits: spec.dragon ? 5 : 3, hitEvery: 7, elem: e, art: spec.art, dragon: spec.dragon, hit: fin({ dmg: Math.round(D / 3), hitstun: 40, launch: -17, kb: [2, -17] }) }));
        },
      });
    case 'beam':
      return Object.assign(base, {
        startup: 13, active: 26, recovery: 16, pose: 'cast', gravity: false, spawnAt: 13, cd: 50,
        spawn(f, g) {
          g.addEnt(new Beam({ owner: f, hand: handPt(f), art: spec.art, bolt: spec.bolt, off: 45, yOff: 95, len: 640 * (spec.big || 1), h: 56 * (spec.big || 1), life: 26, hits: 4, hitEvery: 6, elem: e, hit: fin({ dmg: Math.round(D / 4), hitstun: 30, kb: [9, -7], launch: -7 }) }));
          Sound.play('beam');
        },
      });
    case 'wave':
      return Object.assign(base, {
        startup: 12, active: 2, recovery: 20, pose: style === 'sword' ? 'bigslash' : 'slam', spawnAt: 12, cd: 45,
        spawn(f, g) {
          if (spec.split) f.split = { mode: 'legs', t: 80 };
          g.addEnt(new Wave({ owner: f, x: f.x + f.facing * 60, vx: f.facing * 11, w: 70, h: 140, elem: e, art: spec.art, hits: 1, clash: true, hit: fin({ dmg: D, hitstun: 32, kb: [8, -11], launch: -11 }) }));
          Sound.elem(e); g.shake(6);
        },
      });
    case 'transform':
      return Object.assign(base, {
        startup: 40, active: 1, recovery: 12, pose: 'charge', spritePose: 'super', gravity: false, invuln: [0, 53], cd: spec.dur + 360,
        onFrame(f, fr, g) {
          if (fr === 1) { Sound.play('super'); g.zoomPunch(1.15); g.darkT = 40; }
          if (fr < 40 && fr % 3 === 0) FX.smoke(f.x + rand(-40, 40), f.y - f.height * rand(0.2, 0.9), 3, 'rgba(255,255,255,0.85)');
          if (fr === 40) {
            f.form = spec.form; f.formT = spec.dur;
            g.flashT = 10; g.shake(14); Sound.play('explode');
            FX.ring(f.x, f.y - f.height / 2, '#ffffff', 20, 300, 24, 12);
            FX.burst(f.x, f.y - f.height / 2, 'rubber', 40, 12, 10, 35);
            FX.comic(f.x, f.y - f.height - 60, spec.name.toUpperCase() + '!', 4);
          }
        },
      });
    case 'teleport':
      return Object.assign(base, {
        startup: 14, active: 5, recovery: 18, invuln: [1, 15], hidden: [2, 12],
        pose: style === 'sword' ? 'slash' : 'kickHigh',
        box: { x: -10, y: -155, w: 95, h: 140 },
        hit: fin({ dmg: D, hitstun: 42, launch: -16, kb: [6, -16] }),
        onFrame(f, fr, g) {
          if (fr === 1) { FX.burst(f.x, f.y - 80 * f.hs, e, 24, 9, 8, 25); FX.ring(f.x, f.y - 80 * f.hs, ec(e, 1), 10, 90, 14); Sound.elem(e); }
          if (fr === 12) {
            const o = f.opp, side = o.x >= f.x ? 1 : -1;
            f.x = clamp(o.x + side * 80 * f.hs, g.camX + 40, g.camX + W - 40);
            f.y = Math.min(GROUND_Y, o.y); f.vx = 0; f.vy = 0;
            f.facing = o.x > f.x ? 1 : -1;
            FX.burst(f.x, f.y - 80 * f.hs, e, 24, 9, 8, 25); FX.ring(f.x, f.y - 80 * f.hs, ec(e, 1), 90, 10, 12);
          }
        },
      });
  }
  return null;
}

function buildSuper(spec, ch, lvl) {
  const e = spec.elem, m = (lvl === 3 ? 1.75 : 1) * (spec.power || 1), big = lvl === 3 ? 1.4 : 1;
  const base = { isSuper: true, spritePose: spec.spritePose, tpl: spec.type, name: lvl === 3 && spec.maxName ? spec.maxName : spec.name, elem: e, gravity: false, lvl, invuln: [0, 10], hits: 1 };
  const fin = o => Object.assign({ blockstun: 20, elem: e, chip: 0.2, strength: 4, knockdown: true, isSuper: true }, o);
  if (typeof SUPER_TYPES !== 'undefined' && SUPER_TYPES[spec.type]) return SUPER_TYPES[spec.type](spec, ch, { base, fin, m, big, e, lvl });
  switch (spec.type) {
    case 'beam':
      return Object.assign(base, {
        startup: 8, active: 70, recovery: 22, pose: 'cast', spawnAt: 8,
        spawn(f, g) {
          g.addEnt(new Beam({ owner: f, hand: handPt(f), off: 45, yOff: 95, len: 1500, h: 140 * big, life: 70, hits: lvl === 3 ? 18 : 14, hitEvery: 4, elem: e, isSuper: true, finalFx: spec.finalFx, m, hit: fin({ dmg: Math.round(19 * m), hitstun: 40, kb: [14, -14], launch: -14 }) }));
          Sound.play('beam'); g.shake(10);
        },
      });
    case 'bigproj':
      return Object.assign(base, {
        startup: 12, active: 2, recovery: 28, pose: 'cast', spawnAt: 12,
        spawn(f, g) {
          let cp = compPt(f, spec.from), hp = handPt(f), sp = cp ? { x: cp.x - f.facing * 40, y: cp.y + 20 } : hp ? { x: hp.x + f.facing * 30, y: hp.y + 20 } : spawnPt(f);
          if (spec.fromBehind) sp = { x: f.x - f.facing * ((spec.r || 75) * big + 40), y: sp.y };   // starts behind the fighter so a close enemy still takes every hit
          g.addEnt(new Proj({ owner: f, x: sp.x + f.facing * 40, y: sp.y - 20, vx: f.facing * (spec.speed || 8), r: (spec.r || 75) * big, sprite: spec.sprite || 'orb', art: spec.art, artK: spec.artK, elem: e, hits: lvl === 3 ? 14 : 10, hitEvery: (spec.speed || 8) > 12 ? 2 : 5, life: 220, isSuper: true, clash: true, hit: fin({ dmg: Math.round(26 * m), hitstun: 40, kb: [14, -14], launch: -14 }) }));
          Sound.play('explode'); Sound.elem(e); g.shake(8);
        },
      });
    case 'rush':
      return Object.assign(base, {
        startup: 6, active: 28, recovery: 20, superRush: true, gravity: false,
        pose: ch.style === 'sword' ? 'thrust' : ch.style === 'kick' ? 'kickHigh' : 'rush',
        box: { x: -10, y: -160, w: 110, h: 160 },
        hit: fin({ dmg: Math.round(30 * m), hitstun: 40, kb: [8, -6] }),
        onFrame(f, fr, g, a) {
          if (fr === 6) { Sound.play('dash'); Sound.elem(e); }
          if (fr > 6 && fr <= a.activeEnd && !a.stopped) { f.vx = f.facing * 22; f.trail = 8; FX.burst(f.x - f.facing * 30, f.y - 80 * f.hs, e, 4, 4, 9, 20); }
          else f.vx *= 0.6;
        },
      });
    case 'rain':
      return Object.assign(base, {
        startup: 16, active: 2, recovery: 30, pose: 'charge', spawnAt: 16,
        spawn(f, g) {
          g.addEnt(new Rain({ owner: f, tx: f.opp.x, count: lvl === 3 ? 24 : 15, every: 4, elem: e, art: spec.art, artK: spec.artK, hit: fin({ dmg: Math.round(22 * m), hitstun: 32, kb: [3, -10], launch: -10 }) }));
          Sound.elem(e);
        },
      });
    case 'screen':
      return Object.assign(base, {
        startup: 22, active: 2, recovery: 50, pose: 'charge', spawnAt: 22,
        spawn(f, g) {
          if (spec.split) f.split = { mode: 'head', t: (lvl === 3 ? 84 : 62) + 30 };
          g.addEnt(new Screen({ owner: f, art: spec.art, life: lvl === 3 ? 84 : 62, hits: lvl === 3 ? 13 : 9, hitEvery: 6, elem: e, isSuper: true, finalFx: spec.finalFx, m, hit: fin({ dmg: Math.round(26 * m), hitstun: 40, kb: [12, -14], launch: -14 }) }));
          Sound.elem(e); Sound.play('explode'); g.shake(14);
        },
      });
    case 'pillar':
      return Object.assign(base, {
        startup: 12, active: 2, recovery: 40, pose: 'charge', spawnAt: 12,
        spawn(f, g) {
          g.addEnt(new Pillar({ owner: f, art: spec.art, dragon: spec.dragon, knife: spec.knife, x: pillarX(f), w: 230 * big, h: 720, delay: 10, dur: 50, hits: lvl === 3 ? 16 : 12, hitEvery: 4, elem: e, isSuper: true, hit: fin({ dmg: Math.round(22 * m), hitstun: 42, launch: -18, kb: [4, -18] }) }));
          Sound.elem(e);
        },
      });
  }
  return null;
}

function buildMoves(ch) {
  const mv = applyKit(ch, normalMoves(ch));
  mv.s1 = buildSpecial(ch.s1, ch);
  mv.s2 = buildSpecial(ch.s2, ch);
  mv.su1 = buildSuper(ch.su, ch, 1);
  mv.su3 = buildSuper(ch.su, ch, 3);
  if (ch.su.g5) { mv.suG1 = buildSuper(ch.su.g5, ch, 1); mv.suG3 = buildSuper(ch.su.g5, ch, 3); }
  return mv;
}

// ------------------------------------------------------------------ entities
class Ent {
  constructor(o) {
    Object.assign(this, { vx: 0, vy: 0, life: 120, hits: 1, hitEvery: 8, hitCD: 0, t: 0, dead: false, clash: false, isSuper: false }, o);
    this.dir = this.dir || (this.owner ? this.owner.facing : 1);
  }
  rect() { return null; }
  update() { this.t++; if (this.hitCD > 0) this.hitCD--; if (--this.life <= 0) this.dead = true; }
  info(multiHit) {
    if (!multiHit) return Object.assign({ dir: this.dir }, this.hit);
    return Object.assign({}, this.hit, { dir: this.dir, kb: [1.5, 0], launch: 0, knockdown: false, hitstun: 26, wallbounce: false, slam: false, strength: Math.min(this.hit.strength, 2), keepAir: true });
  }
  draw() {}
}

class Proj extends Ent {
  rect() { const r = this.r * 0.85; return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 }; }
  update(g) {
    super.update(g);
    this.x += this.vx; this.y += this.vy;
    if (this.x < g.camX - 200 || this.x > g.camX + W + 200) this.dead = true;
    if (this.ground && this.y >= GROUND_Y - 10) { this.dead = true; this.explode(g); }
    if (this.t % 2 === 0 && this.sprite !== 'bullet') FX.burst(this.x - Math.sign(this.vx || 1) * this.r * 0.6, this.y, this.elem, 1, 1.5, this.r * 0.25, 20);
  }
  explode(g) {
    FX.burst(this.x, this.y, this.elem, 14, 8, this.r * 0.3, 25);
    FX.ring(this.x, this.y, ec(this.elem, 1), 10, this.r * 2.5, 14);
    if (this.ground) { FX.dust(this.x, GROUND_Y, 3); g.shake(3); }
  }
  draw(ctx) { drawProjSprite(ctx, this); }
}

class Beam extends Ent {
  cur() { return Math.min(this.len, this.t * this.len / 6); }
  rect() {
    const o = this.owner;
    if (this.hand && this.offX == null) { this.offX = (this.hand.x - o.x) * o.facing; this.offY = o.y - this.hand.y; }
    const x0 = o.x + o.facing * (this.offX != null ? this.offX : this.off * o.hs), cy = o.y - (this.offY != null ? this.offY : this.yOff * o.hs), L = this.cur();
    const h = this.h * Math.min(1, this.life / 8);
    return o.facing > 0 ? { x: x0, y: cy - h / 2, w: L, h } : { x: x0 - L, y: cy - h / 2, w: L, h };
  }
  update(g) {
    super.update(g);
    const s = this.owner.state;
    if (s === 'hit' || s === 'locked' || s === 'down') this.dead = true;
    this.dir = this.owner.facing;
    if (this.t % 2 === 0) { const r = this.rect(); FX.burst(r.x + rand(0, r.w), r.y + rand(0, r.h), this.elem, 1, 3, r.h * 0.12, 18); }
  }
  draw(ctx) {
    const r = this.rect(), cy = r.y + r.h / 2, h = r.h;
    if (this.elem === 'string') {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const yy = cy + (i - 2) * h / 5, wob = Math.sin(this.t * 0.8 + i) * 10;
        for (const [wd, col] of [[12, 'rgba(255,61,0,0.35)'], [5, '#ff9100'], [2, '#fff3e0']]) {
          ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(r.x, yy);
          ctx.quadraticCurveTo(r.x + r.w / 2, yy + wob, r.x + r.w, yy - wob * 0.5); ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (this.bolt) {
      ctx.globalCompositeOperation = 'lighter';
      const x1 = this.owner.facing > 0 ? r.x : r.x + r.w, x2 = this.owner.facing > 0 ? r.x + r.w : r.x;
      for (let i = 0; i < 3; i++) drawBolt(ctx, x1, cy + rand(-6, 6), x2, cy + rand(-h * 0.4, h * 0.4), i ? '#fff176' : '#ffffff', h * (i ? 0.08 : 0.16));
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#40c4ff'; ctx.fillRect(r.x, cy - h * 0.3, r.w, h * 0.6); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (this.art && FXImg.get(this.art)) {
      ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = ec(this.elem, 1); ctx.fillRect(r.x, cy - h * 0.25, r.w, h * 0.5); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      drawArt(ctx, this.art, r.x + r.w / 2, cy, h * 2.2, { w: r.w * 1.05, flip: this.owner.facing < 0 });
      return;
    }
    ctx.globalCompositeOperation = 'lighter';
    const layers = [[ec(this.elem, 2), 1.15, 0.45], [ec(this.elem, 1), 0.8, 0.8], [ec(this.elem, 0), 0.4, 1]];
    for (const [col, k, a] of layers) {
      ctx.globalAlpha = a; ctx.fillStyle = col;
      const hh = h * k * (1 + rand(-0.06, 0.06));
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(r.x, cy - hh / 2, r.w, hh, hh / 2) : ctx.rect(r.x, cy - hh / 2, r.w, hh); ctx.fill();
    }
    const o = this.owner, x0 = o.facing > 0 ? r.x : r.x + r.w;
    ctx.globalAlpha = 0.9; ctx.fillStyle = ec(this.elem, 0); ctx.beginPath(); ctx.arc(x0, cy, h * 0.7, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (this.elem === 'love' && this.t % 3 === 0) FX.hearts(r.x + rand(0, r.w), cy + rand(-h / 2, h / 2), 1);
  }
}

class Pillar extends Ent {
  constructor(o) { super(o); this.life = this.delay + this.dur; }
  active() { return this.t > this.delay; }
  curH() { return this.active() ? this.h * Math.min(1, (this.t - this.delay) / 5) * Math.min(1, this.life / 6) : 0; }
  rect() { if (!this.active()) return null; const h = this.curH(); return { x: this.x - this.w / 2, y: GROUND_Y - h, w: this.w, h }; }
  update(g) {
    super.update(g);
    if (this.t === this.delay + 1) { Sound.elem(this.elem); g.shake(this.isSuper ? 12 : 6); FX.burst(this.x, GROUND_Y - 20, this.elem, 20, 10, 8, 30); }
    if (this.active() && this.t % 2 === 0) FX.burst(this.x + rand(-this.w / 2, this.w / 2), GROUND_Y - rand(0, this.curH()), this.elem, 1, 3, 8, 22, -0.1);
  }
  draw(ctx) {
    const x = this.x, w = this.w, t = this.t;
    if (this.hands && this.active() && FXImg.get('manohand')) {
      const k = Math.min(1, (t - this.delay) / 3);
      for (const [dx, a, s2] of [[-70, -0.55, 0.85], [70, 0.55, 0.85], [-32, -0.2, 1.1], [32, 0.2, 1.1], [0, 0, 0.8]]) drawArt(ctx, 'manohand', x + dx, GROUND_Y + 14, 250 * s2 * k, { ay: 1, rot: a, flip: dx > 0 });
      if (t % 4 === 0) FX.petals(x, GROUND_Y - 120, 3);
      return;
    }
    if (this.art && this.active()) {
      const h = Math.min(this.curH(), H), flick = 1 + Math.sin(t * 0.7) * 0.04;
      if (drawArt(ctx, this.art, x, GROUND_Y + 10, h * 1.1, { w: Math.max(w * 1.5, h * 0.45) * flick, ay: 1 })) return;
    }
    if (!this.active()) {
      ctx.globalAlpha = 0.5 + Math.sin(t * 0.8) * 0.3;
      ctx.fillStyle = ec(this.elem, 1); ctx.beginPath(); ctx.ellipse(x, GROUND_Y - 4, w * 0.7, 12, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; return;
    }
    const h = this.curH(), top = GROUND_Y - h;
    const e = this.elem;
    if (e === 'lightning') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#40c4ff'; ctx.fillRect(x - w / 2, top, w, h);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) drawBolt(ctx, x + rand(-w / 4, w / 4), Math.min(top, 0), x + rand(-w / 4, w / 4), GROUND_Y, i ? '#fff176' : '#ffffff', w * (i ? 0.08 : 0.15));
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (this.dragon && FXImg.get('dragontwister')) {
      const turn = Math.cos(t * 0.16), rise = Math.min(1, (t - this.delay) / 18), hh = Math.max(480, h * 1.45);
      const im = FXImg.get('dragontwister'), ww = hh * im.width / im.height;
      drawArt(ctx, 'dragontwister', x, GROUND_Y + 30 - (1 - rise) * 120 - Math.sin(t * 0.1) * 12, hh * (0.6 + 0.4 * rise), { ay: 1, w: ww * Math.max(0.45, Math.abs(turn)) * (0.6 + 0.4 * rise), flip: turn < 0 });
      if (t % 2 === 0) FX.add({ type: 'dot', x: x + rand(-w, w) * 0.4, y: GROUND_Y - rand(hh * 0.3, hh), vx: rand(-1, 1), vy: -rand(2, 5), r: 5, life: 16, col: choice(['#ffffff', '#40c4ff', '#ffd54f']), drag: 0.97 });
      return;   // only the dragon: no tornado behind it
    } else if (this.dragon && FXImg.get('kaidodragon')) {
      const a = t * 0.12, dy = GROUND_Y - h * (0.25 + 0.5 * ((t * 0.01) % 1));
      ctx.save(); ctx.globalAlpha = 0.95;
      drawArt(ctx, 'kaidodragon', x + Math.cos(a) * w * 0.55, GROUND_Y - h * (0.35 + 0.3 * Math.sin(t * 0.07)), Math.max(260, h * 0.8), { flip: Math.sin(a) < 0, rot: Math.cos(a) * 0.3 });
      ctx.restore();
    }
    if (this.knife && FXImg.get('gammaknife')) drawArt(ctx, 'gammaknife', x, GROUND_Y - 130, 120, { w: Math.max(260, w * 2.2), alpha: 0.7 + 0.3 * Math.sin(t * 0.5) });
    if (e === 'sand' || e === 'water' || e === 'twister') {
      if (e === 'twister' && t % 3 === 0) drawBolt(ctx, x + rand(-w / 2, w / 2), top, x + rand(-w / 2, w / 2), GROUND_Y, '#b388ff', 4);
      for (let i = 0; i < 10; i++) {
        const yy = GROUND_Y - (i + 0.5) * h / 10, ww = w * (0.35 + i / 10 * 0.75);
        ctx.fillStyle = ec(e, i % 3); ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 0.4 + i) * 10, yy, ww / 2, h / 20 + 4, 0, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1; return;
    }
    if (e === 'ice') {
      ctx.fillStyle = '#b3e5fc'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        const sx = x + i * w * 0.2, sh = h * (1 - Math.abs(i) * 0.25);
        ctx.beginPath(); ctx.moveTo(sx - w * 0.14, GROUND_Y); ctx.lineTo(sx, GROUND_Y - sh); ctx.lineTo(sx + w * 0.14, GROUND_Y); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      return;
    }
    if (e === 'plant' || e === 'flower') {
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = e === 'plant' ? (i % 2 ? '#2e7d32' : '#66bb6a') : (i % 2 ? '#f48fb1' : ROSTER[6].look.skin);
        ctx.lineWidth = w * 0.12;
        ctx.beginPath(); ctx.moveTo(x + (i - 2.5) * w * 0.12, GROUND_Y);
        for (let y = 0; y <= h; y += 20) ctx.lineTo(x + (i - 2.5) * w * 0.12 + Math.sin(y * 0.05 + t * 0.3 + i) * w * 0.12, GROUND_Y - y);
        ctx.stroke();
        if (e === 'flower') { ctx.fillStyle = ROSTER[6].look.skin; ctx.beginPath(); ctx.arc(x + (i - 2.5) * w * 0.12, top + 10, w * 0.09, 0, TAU); ctx.fill(); }
      }
      return;
    }
    if (e === 'room') {
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#80deea'; ctx.beginPath(); ctx.arc(x, GROUND_Y, Math.max(w, h * 0.6), Math.PI, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#e0f7fa'; ctx.lineWidth = 3; ctx.stroke();
      for (let i = 0; i < 4; i++) FX.slashLine(x + rand(-w / 2, w / 2), GROUND_Y - rand(40, h * 0.6), 140, rand(-1, 1), '#ffffff', 6);
      return;
    }
    // generic glowing column (magma, dark, fire...)
    const g2 = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(0.2, ec(e, 2)); g2.addColorStop(0.5, ec(e, 0)); g2.addColorStop(0.8, ec(e, 2)); g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = e === 'dark' ? 'source-over' : 'lighter';
    ctx.fillStyle = g2; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(x - w / 2, GROUND_Y);
    for (let y = 0; y <= h; y += 24) ctx.lineTo(x - w / 2 + Math.sin(y * 0.06 + t * 0.5) * 8, GROUND_Y - y);
    ctx.lineTo(x + w / 2, top);
    for (let y = h; y >= 0; y -= 24) ctx.lineTo(x + w / 2 + Math.sin(y * 0.06 + t * 0.5 + 2) * 8, GROUND_Y - y);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}

class Wave extends Ent {
  rect() { return { x: this.x - this.w / 2, y: GROUND_Y - this.h, w: this.w, h: this.h }; }
  update(g) {
    super.update(g);
    if (this.x0 == null) this.x0 = this.x;
    this.x += this.vx;
    if (this.x < g.camX - 150 || this.x > g.camX + W + 150) this.dead = true;
    if (this.t % 2 === 0) { FX.dust(this.x, GROUND_Y - 5, 1); FX.burst(this.x, GROUND_Y - rand(0, this.h), this.elem, 2, 3, 6, 18); }
  }
  explode() { FX.burst(this.x, GROUND_Y - this.h / 2, this.elem, 16, 8, 8, 25); }
  draw(ctx) {
    const d = Math.sign(this.vx), x = this.x, h = this.h * (1 + Math.sin(this.t * 0.5) * 0.05);
    if (this.elem === 'sand') {
      this.trailX = this.trailX == null ? x : this.trailX;
      const from = this.x0 == null ? (this.x0 = x) : this.x0;
      for (let px = from; (px - x) * d < 0; px += d * 28) {
        const age = Math.abs(x - px) / 28, hh = Math.max(0, 160 - age * 9) * (0.7 + ((px * 7) % 5) / 10);
        if (hh <= 2) continue;
        ctx.fillStyle = age % 2 < 1 ? '#e0c27a' : '#c8a35a'; ctx.strokeStyle = '#8d6e3c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px - 18, GROUND_Y + 4); ctx.lineTo(px + d * 10, GROUND_Y - hh); ctx.lineTo(px + 18, GROUND_Y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#f0d49a'; ctx.beginPath(); ctx.moveTo(x - 30, GROUND_Y + 4); ctx.lineTo(x + d * 16, GROUND_Y - h * 1.3); ctx.lineTo(x + 30, GROUND_Y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (this.t % 2 === 0) FX.dust(x, GROUND_Y - 10, 2);
      return;
    }
    if (this.art && drawArt(ctx, this.art, x, GROUND_Y + 6, h * 1.25, { flip: d < 0, ay: 1 })) return;
    ctx.globalCompositeOperation = this.elem === 'haki' ? 'source-over' : 'lighter';
    for (const [k, col, a] of [[1.2, ec(this.elem, 2), 0.6], [0.9, ec(this.elem, 1), 0.85], [0.55, ec(this.elem, 0), 1]]) {
      ctx.globalAlpha = a; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x - d * 30 * k, GROUND_Y);
      ctx.quadraticCurveTo(x + d * 40 * k, GROUND_Y - h * 0.5, x - d * 10 * k, GROUND_Y - h * k);
      ctx.quadraticCurveTo(x + d * 10, GROUND_Y - h * 0.5, x - d * 30 * k, GROUND_Y);
      ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (this.elem === 'haki' && this.t % 3 === 0) FX.bolt(x, GROUND_Y - h, x + rand(-60, 60), GROUND_Y - rand(0, h), choice(['#d50000', '#111']), 5, 3);
  }
}

class Rain extends Ent {
  constructor(o) { super(o); this.life = this.count * this.every + 5; this.spawned = 0; }
  update(g) {
    super.update(g);
    if (this.t % this.every === 0 && this.spawned < this.count) {
      const artK = this.artK || 3.2;
      this.spawned++;
      const x = this.owner.opp.x + rand(-120, 120);
      const light = this.elem === 'light';
      g.addEnt(new Proj({ owner: this.owner, x, y: -40, vx: rand(-2, 2), vy: light ? 22 : 15, r: light ? 16 : 38, sprite: light ? 'lightbullet' : 'meteor', art: this.art, artK, elem: this.elem, hits: 1, life: 80, ground: true, dir: Math.sign(x - this.owner.x) || 1, isSuper: true,
        hit: this.spawned === this.count ? this.hit : Object.assign({}, this.hit, { launch: 0, kb: [1, 0], knockdown: false, keepAir: true, hitstun: 26, strength: 2 }) }));
    }
  }
}

class Screen extends Ent {
  rect(g) { return this.t > 6 ? { x: Game.fight.camX - 100, y: -200, w: W + 200, h: H + 200 } : null; }
  update(g) {
    super.update(g);
    this.dir = this.owner.facing;
    if (this.t % 6 === 0) g.shake(6);
    if (this.elem === 'quake') { g.quakeT = Math.max(g.quakeT || 0, 8); if (this.t % 4 === 0) g.shake(16); }   // Gekishin: the world rocks violently
  }
  draw(ctx) {
    const camX = Game.fight.camX, t = this.t, e = this.elem, o = this.owner;
    const fade = Math.min(1, this.life / 10, t / 5);
    ctx.save();
    const tint = { lightning: 'rgba(10,20,60,0.55)', haki: 'rgba(30,0,0,0.55)', quake: 'rgba(255,255,255,0.25)', ice: 'rgba(180,230,255,0.35)', string: 'rgba(80,0,40,0.35)', soul: 'rgba(20,40,90,0.45)', dark: 'rgba(30,0,50,0.65)' }[e] || 'rgba(0,0,0,0.4)';
    ctx.globalAlpha = fade; ctx.fillStyle = tint; ctx.fillRect(camX, 0, W, H);
    if (t % 6 < 2) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(camX, 0, W, H); }
    if (this.art) {
      const tg = o.opp, k = Math.min(1, t / 12);
      drawArt(ctx, this.art, tg.x, tg.y - tg.height * 0.6, 640 * k, { rot: this.art === 'blackhole' ? t * 0.08 : 0, alpha: fade });
    }
    switch (e) {
      case 'lightning': for (let i = 0; i < 4; i++) drawBolt(ctx, camX + rand(0, W), 0, camX + rand(0, W), GROUND_Y, choice(['#fff', '#fff176', '#40c4ff']), rand(4, 10)); break;
      case 'haki':
        for (let i = 0; i < 6; i++) { const a = rand(0, TAU); drawBolt(ctx, o.x, o.y - 90, o.x + Math.cos(a) * 900, o.y - 90 + Math.sin(a) * 600, choice(['#111', '#d50000']), rand(5, 12)); }
        if (t % 8 === 0) FX.ring(o.x, o.y - 90, '#d50000', 20, 700, 20, 10); break;
      case 'quake':
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
        for (let i = 0; i < 5; i++) { const sx = camX + ((i * 263 + t * 7) % W); ctx.beginPath(); ctx.moveTo(sx, 0); for (let y = 0; y < H; y += 60) ctx.lineTo(sx + rand(-40, 40), y); ctx.stroke(); }
        if (t % 10 === 0) FX.ring(o.x, o.y - 90, '#ffffff', 30, 900, 22, 14); break;
      case 'ice':
        if (FXImg.get('iceberg')) { for (let i = 0; i < 9; i++) drawArt(ctx, 'iceberg', camX + 70 + i * 145, GROUND_Y + 20, (120 + ((i * 53) % 90)) * Math.min(1, t / 18), { ay: 1, flip: i % 2 === 1 }); break; }
        ctx.fillStyle = '#e1f5fe'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 3;
        for (let i = 0; i < 14; i++) { const sx = camX + i * 95 + 20, sh = 80 + ((i * 53) % 160) * Math.min(1, t / 20); ctx.beginPath(); ctx.moveTo(sx - 30, GROUND_Y + 10); ctx.lineTo(sx, GROUND_Y - sh); ctx.lineTo(sx + 30, GROUND_Y + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        break;
      case 'string': {
        const cx2 = camX + W / 2, close = Math.min(1, t / 50), rad = (W * 0.75) * (1 - 0.45 * close);
        ctx.lineCap = 'round';
        for (let i = 0; i <= 16; i++) {
          const fx2 = cx2 - rad + (i / 16) * rad * 2;
          for (const [wd, col] of [[8, 'rgba(255,64,129,0.35)'], [3, '#ffffff']]) {
            ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(cx2, -20);
            ctx.quadraticCurveTo(fx2 + (fx2 - cx2) * 0.3, H * 0.35, fx2, GROUND_Y + 10); ctx.stroke();
          }
        }
        for (let r2 = 1; r2 <= 3; r2++) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx2, GROUND_Y - r2 * 140, rad * (1 - r2 * 0.22), 18, 0, 0, TAU); ctx.stroke(); }
        break;
      }
      case 'stringOLD':
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        for (let i = 0; i < 16; i++) { const sx = camX + i * 85; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 200 * Math.sin(t * 0.05 + i), H); ctx.stroke(); }
        ctx.strokeStyle = '#ff80ab';
        for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(camX, i * 90); ctx.lineTo(camX + W, i * 90 + 100 * Math.cos(t * 0.04 + i)); ctx.stroke(); }
        break;
      case 'soul':
        for (let i = 0; i < 10; i++) { const gx = camX + ((i * 137 + t * 6) % (W + 100)) - 50, gy = 150 + ((i * 71) % 400) + Math.sin(t * 0.1 + i) * 20; ctx.fillStyle = 'rgba(200,240,255,0.7)'; ctx.beginPath(); ctx.arc(gx, gy, 22, Math.PI, TAU); ctx.lineTo(gx + 22, gy + 30); ctx.lineTo(gx - 22, gy + 30); ctx.fill(); ctx.fillStyle = '#123'; ctx.fillRect(gx - 9, gy - 6, 5, 7); ctx.fillRect(gx + 4, gy - 6, 5, 7); }
        break;
      case 'dark': {
        const tx = o.opp.x, ty = o.opp.y - 80;
        if (drawArt(ctx, 'blackhole', tx, ty, 520 * Math.min(1, t / 14), { rot: t * 0.09 })) break;
        for (let i = 0; i < 5; i++) { ctx.strokeStyle = i % 2 ? '#7c4dff' : '#120024'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(tx, ty, 40 + i * 50 + (t * 4) % 50, t * 0.1 + i, t * 0.1 + i + 4); ctx.stroke(); }
        break;
      }
    }
    ctx.restore();
  }
}

function drawProjSprite(ctx, p) {
  if (p.arm) { const o = p.owner, d = Math.sign(p.vx) || 1, fp = o.fistPoint && o.fistPoint({ pose: 'attack', sx: 1, sy: 1, dx: 0, dy: 0 }); limb(ctx, fp ? fp.x : o.x + d * 30 * o.hs, fp ? fp.y : o.y - o.height * 0.6, p.x - d * p.r * 0.5, p.y, p.r * 0.75, '#fafafa'); }
  if (p.art && drawProjArt(ctx, p)) return;
  const { x, y, r } = p, d = Math.sign(p.vx) || p.dir || 1, t = p.t, e = p.elem;
  const glow = (rr, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, ec(e, 0)); g.addColorStop(0.45, ec(e, 1)); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  };
  switch (p.sprite) {
    case 'fireball': case 'meteor': case 'orb': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i <= 5; i++) { ctx.globalAlpha = 0.5 - i * 0.08; ctx.fillStyle = ec(e, i % 3); ctx.beginPath(); ctx.arc(x - (p.vx || 0) * i * 1.6 + rand(-3, 3), y - (p.vy || 0) * i * 1.6 + rand(-3, 3), r * (1 - i * 0.12), 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1; glow(r * 1.4, 1);
      ctx.globalCompositeOperation = 'source-over';
      if (p.sprite === 'meteor') { ctx.fillStyle = '#4e1a00'; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.fill(); }
      break;
    }
    case 'sun': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) { const a = t * 0.05 + i * TAU / 12; ctx.strokeStyle = ec(e, 1); ctx.lineWidth = 10; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5); ctx.stroke(); }
      ctx.globalAlpha = 1; glow(r * 1.5, 1); glow(r * 0.8, 1);
      ctx.globalCompositeOperation = 'source-over'; break;
    }
    case 'bird': {
      ctx.globalCompositeOperation = 'lighter';
      glow(r * 1.3, 0.8);
      const flap = Math.sin(t * 0.4) * r * 0.6;
      ctx.fillStyle = ec(e, 1);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d * r * 0.8, y - r * 1.1 - flap); ctx.lineTo(x - d * r * 0.2, y - r * 0.2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d * r * 0.8, y + r * 1.1 + flap); ctx.lineTo(x - d * r * 0.2, y + r * 0.2); ctx.fill();
      ctx.fillStyle = ec(e, 0); ctx.beginPath(); ctx.ellipse(x, y, r * 0.7, r * 0.3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + d * r * 0.6, y - r * 0.15, r * 0.25, 0, TAU); ctx.fill();
      ctx.fillStyle = ec(e, 2); ctx.beginPath(); ctx.moveTo(x - d * r * 0.6, y); ctx.lineTo(x - d * r * 1.6, y - r * 0.3); ctx.lineTo(x - d * r * 1.5, y + r * 0.3); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; break;
    }
    case 'slash': {
      ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
      ctx.fillStyle = ec(e, 1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-r * 0.6, 0, r * 1.3, -1.1, 1.1); ctx.arc(-r * 1.0, 0, r * 1.25, 1.0, -1.0, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore(); break;
    }
    case 'bullet': case 'lightbullet': {
      ctx.strokeStyle = ec(e, 1); ctx.lineWidth = r * 0.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (p.vx || 0) * 3, y - (p.vy || 0) * 3); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; glow(r * 1.5, 1); ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'fist': {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - d * r * (1.2 + i * 0.3), y - r * 0.5 + i * r * 0.5); ctx.lineTo(x - d * r * (2.2 + i * 0.3), y - r * 0.5 + i * r * 0.5); ctx.stroke(); }
      ctx.fillStyle = p.elem === 'metal' ? '#90a4ae' : '#f2c099'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - r, y - r * 0.8, r * 2, r * 1.6, r * 0.5) : ctx.rect(x - r, y - r * 0.8, r * 2, r * 1.6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(x + d * r * 0.6, y - r * 0.8 + i * r * 0.4); ctx.lineTo(x + d * r, y - r * 0.8 + i * r * 0.4); } ctx.stroke();
      break;
    }
    case 'heart': {
      ctx.globalCompositeOperation = 'lighter'; glow(r * 1.8, 0.8); ctx.globalCompositeOperation = 'source-over';
      const pulse = 1 + Math.sin(t * 0.5) * 0.1;
      drawHeart(ctx, x, y + 1, r * 1.12 * pulse, '#ffffff'); drawHeart(ctx, x, y, r * pulse, '#ff4081');
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.18, r * 0.12, -0.6, 0, TAU); ctx.fill();
      break;
    }
    case 'ice': {
      ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
      ctx.fillStyle = '#e1f5fe'; ctx.strokeStyle = '#29b6f6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(r * 1.6, 0); ctx.lineTo(-r * 1.2, -r * 0.45); ctx.lineTo(-r * 0.9, 0); ctx.lineTo(-r * 1.2, r * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore(); break;
    }
    case 'tornado': {
      for (let i = 0; i < 7; i++) {
        const yy = y + r - i * r * 0.4, ww = r * (0.4 + i * 0.16);
        ctx.strokeStyle = ec(e, i % 3); ctx.lineWidth = 6; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 0.5 + i) * 6, yy, ww, ww * 0.25, 0, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1; break;
    }
    case 'petals': for (let i = 0; i < 8; i++) { const a = t * 0.3 + i * TAU / 8; ctx.fillStyle = i % 2 ? '#f48fb1' : '#fff'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, 9, 5, a, 0, TAU); ctx.fill(); } break;
    case 'cannonball': circ(ctx, x, y, r, '#263238'); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, TAU); ctx.fill(); break;
    case 'wave': {
      ctx.fillStyle = '#29b6f6'; ctx.strokeStyle = '#e1f5fe'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - d * r * 1.2, y + r);
      ctx.quadraticCurveTo(x - d * r * 0.8, y - r * 1.2, x + d * r * 0.6, y - r * 0.9);
      ctx.quadraticCurveTo(x + d * r * 1.3, y - r * 0.4, x + d * r * 0.7, y + 0);
      ctx.quadraticCurveTo(x + d * r * 0.2, y - r * 0.4, x + d * r * 0.1, y + r);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    default:
      if (typeof EXTRA_SPRITES !== 'undefined' && EXTRA_SPRITES[p.sprite]) EXTRA_SPRITES[p.sprite](ctx, p);
      else glow(r * 1.4, 1);
  }
}
