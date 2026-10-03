'use strict';
// Computer opponent. Produces held/pressed like a real controller.
const AI_LEVELS = [
  { name: 'EASY', react: 30, block: 0.1, combo: 0.45, special: 0.2, superP: 0.12, idle: 0.35, dmg: 0.7 },
  { name: 'NORMAL', react: 16, block: 0.4, combo: 0.8, special: 0.3, superP: 0.35, idle: 0.12, dmg: 1 },
  { name: 'HARD', react: 7, block: 0.75, combo: 1, special: 0.4, superP: 0.8, idle: 0, dmg: 1.1 },
];
const RANGED = ['proj', 'wave', 'beam', 'pillar', 'stretch'];

class CpuInput {
  constructor(level) {
    this.level = level; // -1 = training dummy
    this.held = {}; this.pressed = {};
    for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; }
    this.timer = 20; this.plan = { type: 'idle', t: 30 }; this.blockDecision = null; this.mash = 0;
  }
  poll() {}
  clear() { for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; } }
  think(me, opp, g) {
    this.clear();
    if (this.level < 0 || !g.controlsLive) return;
    const L = AI_LEVELS[this.level];
    const dx = opp.x - me.x, dist = Math.abs(dx);
    const toward = dx > 0 ? 'right' : 'left', away = dx > 0 ? 'left' : 'right';
    const press = b => { this.pressed[b] = true; this.held[b] = true; };

    // keep a combo going
    const comboing = (me.state === 'attack' && me.atk.connected) || (opp.state === 'hit' && dist < 230 && me.canAct());
    if (comboing) {
      if (this.comboRoll == null) this.comboRoll = Math.random() < L.combo;
      if (this.comboRoll && ++this.mash % 4 === 0) {
        const d = me.atk && me.atk.data;
        if (d && d.isNormal && d.rank >= 5 && Math.random() < L.special) press(choice(['s1', 's2']));
        else if (d && (d.isSpecial || d.key === 'A4') && me.meter >= BAR && Math.random() < L.superP) press('su');
        else press(this.level >= 1 && Math.random() < 0.3 ? 'm' : 'l');
      }
      if (me.airborne) this.held[toward] = true;
      return;
    }
    this.comboRoll = null;

    // defend
    if (g.threatens(opp, me) && me.canAct()) {
      if (this.blockDecision == null) this.blockDecision = Math.random() < L.block;
      if (this.blockDecision) { this.held[away] = true; if (Math.random() < 0.3) this.held.down = true; return; }
    } else this.blockDecision = null;

    // decide a new plan every so often
    if (--this.timer <= 0 && me.canAct()) {
      this.timer = L.react + randi(0, L.react);
      const ranged = ['s1', 's2'].filter(k => RANGED.includes(me.ch[k].type) && me.cd[k] <= 0);
      const close = ['s1', 's2'].filter(k => !RANGED.includes(me.ch[k].type) && me.cd[k] <= 0);
      const r = Math.random();
      if (Math.random() < L.idle) this.plan = { type: 'idle', t: 20 };
      else if (me.meter >= BAR && dist < 650 && Math.random() < L.superP * 0.35) press('su');
      else if (dist > 420) {
        if (ranged.length && r < 0.4) press(choice(ranged));
        else if (r < 0.6) me.dashReq = Math.sign(dx);
        else if (r < 0.75) this.plan = { type: 'jumpin', t: 50 };
        else this.plan = { type: 'walk', dir: toward, t: 30 };
      } else if (dist > 170) {
        if (close.length && r < 0.25) press(choice(close));
        else if (ranged.length && r < 0.4) press(choice(ranged));
        else if (r < 0.6) this.plan = { type: 'jumpin', t: 45 };
        else this.plan = { type: 'walk', dir: toward, t: 25 };
      } else {
        if (r < 0.55) press(choice(['l', 'l', 'm', 'h']));
        else if (close.length && r < 0.7) press(choice(close));
        else if (r < 0.8) this.plan = { type: 'walk', dir: away, t: 15 };
        else this.plan = { type: 'jumpin', t: 40 };
      }
    }
    const p = this.plan;
    if (p.t-- > 0) {
      if (p.type === 'walk') this.held[p.dir] = true;
      if (p.type === 'jumpin') {
        if (!me.airborne && p.t > 35) { this.held.up = true; this.held[toward] = true; }
        else { this.held[toward] = true; if (me.airborne && dist < 150 && me.state === 'jump') press('l'); }
      }
    }
  }
}
