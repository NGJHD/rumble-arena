'use strict';
const PRAISE = [[5, 'NICE!'], [8, 'GREAT!'], [12, 'AWESOME!'], [16, 'AMAZING!'], [20, 'INCREDIBLE!'], [30, 'LEGENDARY!'], [40, 'KING OF THE PIRATES!']];

class FightScene {
  // opts: { p1, p2 (characters), stage, mode: 'cpu'|'vs'|'training', level }
  constructor(opts) {
    this.opts = opts;
    this.mode = opts.mode;
    this.stage = opts.stage;
    const in1 = this.mode === 'vs' ? P1In : AnyIn;
    const in2 = this.mode === 'vs' ? P2In : new CpuInput(this.mode === 'training' ? -1 : opts.level, opts.boss);
    this.f1 = new Fighter(opts.p1, 0, in1);
    this.f2 = new Fighter(opts.p2, 1, in2);
    this.f1.opp = this.f2; this.f2.opp = this.f1;
    if (this.mode === 'cpu') this.f2.dmgMult = (opts.boss ? BOSS_AI : AI_LEVELS)[opts.level].dmg;
    if (opts.boss) this.f2.armor = 0.85;   // Imu takes a little less damage
    if (this.mode === 'training') this.f2.isCpuDummy = true;
    this.round = 1; this.frame = 0;
    this.paused = false; this.pauseSel = 0; this.showMoves = false;
    Game.fight = this;
    this.startRound();
    Sound.playMusic(this.stage.music);
  }
  startRound() {
    FX.clear();
    this.ents = [];
    this.f1.reset(STAGE_W / 2 - 230, 1);
    this.f2.reset(STAGE_W / 2 + 230, -1);
    if (this.mode === 'training') this.f1.meter = MAX_METER;
    this.camX = STAGE_W / 2 - W / 2;
    this.timer = Settings.data.time; this.timerF = 0;
    this.phase = this.mode === 'training' ? 'fight' : this.opts.boss && this.round === 1 ? 'bossIntro' : 'intro'; this.phaseT = 0;
    this.hitstop = 0; this.slowmo = 0; this.superFreeze = null;
    this.shakeAmt = 0; this.zoom = 1; this.flashT = 0; this.speedT = 0;
    this.praise = [null, null]; this.darkT = 0; this.winner = null; this.banner = null; this.refill = 0; this.roundOver = false;
  }
  get controlsLive() { return this.phase === 'fight'; }
  addEnt(e) { this.ents.push(e); }
  shake(n) { this.shakeAmt = Math.max(this.shakeAmt, n); }
  zoomPunch(z) { this.zoom = Math.max(this.zoom, z); }
  threatens(att, def) {
    if (att.state === 'attack' || att.cine) {
      const d = att.atk && att.atk.data;
      if (att.cine || (d && (d.isSpecial || d.isSuper))) return true;
      if (Math.abs(att.x - def.x) < 300 * att.hs) return true;
    }
    for (const e of this.ents) {
      if (e.owner !== att || e.dead) continue;
      const r = e.rect(this);
      if (!r) { if (e instanceof Pillar || e instanceof Rain) return true; continue; }
      if (Math.abs(r.x + r.w / 2 - def.x) < r.w / 2 + 350) return true;
    }
    return false;
  }
  superFlash(f, name, lvl) {
    this.superFreeze = { f, name, lvl, t: 55, max: 55 };
    Sound.play('super');
    this.zoomPunch(1.12); this.flashT = 6;
    FX.ring(f.x, f.y - f.height / 2, ec(f.ch.elem, 1), 10, 260, 25, 10);
    FX.burst(f.x, f.y - f.height / 2, f.ch.elem, 40, 12, 9, 35);
  }

  // ------------------------------------------------------------ combat resolution
  applyHit(att, def, h, ent) {
    if (def.state === 'ko' || (def.invuln > 0 && !h.cine)) return 'miss';
    const dir = h.dir || att.facing;
    const fromX = ent && ent.x != null ? ent.x - dir * 10 : att.x;
    const sx = h.sx != null ? h.sx : def.x - dir * def.width * 0.3, sy = h.sy != null ? h.sy : def.y - def.height * 0.6;
    if (!h.cine && def.canBlock(fromX)) {
      const chip = Math.round(h.dmg * (h.chip || 0) * att.dmgMult);
      def.hp = Math.max(this.mode === 'training' ? 1 : 0, def.hp - chip); def.redDelay = 30;
      def.atk = null; def.setState('block'); def.blockstun = h.blockstun || 12;
      def.vx = dir * (h.strength >= 3 ? 7 : 4);
      att.meter = Math.min(MAX_METER, att.meter + h.dmg * 0.25);
      def.meter = Math.min(MAX_METER, def.meter + h.dmg * 0.35);
      FX.ring(sx, sy, '#80d8ff', 10, 55, 10, 5); FX.streaks(sx, sy, 'ice', 6, 8, -dir);
      Sound.play('block');
      this.hitstop = Math.max(this.hitstop, 4);
      if (def.hp <= 0) this.onKO(att, def);
      return 'block';
    }
    const scale = h.noScale ? 1 : Math.max(h.isSuper ? 0.5 : 0.3, 1 - def.comboTaken * 0.07);
    const dmg = Math.max(1, Math.round(h.dmg * scale * att.dmgMult * (att.form ? 1.25 : 1) * (def.armor || 1)));
    def.hp -= dmg; def.redDelay = 45;
    if (this.mode === 'training' && def === this.f2) def.hp = Math.max(1, def.hp);
    def.comboTaken++;
    att.comboDmg = (def.comboTaken === 1 ? 0 : att.comboDmg) + dmg;
    att.combo = def.comboTaken; att.comboShow = 100; att.comboPop = 8;
    att.meter = Math.min(MAX_METER, att.meter + dmg * 1.0);
    def.meter = Math.min(MAX_METER, def.meter + dmg * 0.5);
    def.flash = 3;
    if (!h.cine) {
      if (def.atk && def.atk.data.superRush) def.cine = null;
      def.atk = null; def.hidden = false; def.cine = null;
      def.state = 'hit'; def.t = 0;
      let hs = h.hitstun || 18;
      if (def.airborne || h.launch) hs -= def.juggle * 1.6;
      def.hitstun = Math.max(8, hs);
      def.facing = -dir;
      const kb = h.kb || [3, 0];
      if (h.launch) { def.vy = h.launch; def.vx = dir * Math.abs(kb[0]) * 0.4; def.juggle++; }
      else if (h.slam) { def.vy = kb[1]; def.vx = dir * kb[0]; }
      else if (h.follow) { def.vy = att.vy - 1; def.vx = att.vx; def.juggle++; }
      else if (def.airborne || h.keepAir) {
        def.vy = Math.min(def.vy, -5.5); def.vx = dir * 2.5; def.juggle++;
        if (att.airborne && att.state === 'attack') { att.vy = Math.min(att.vy, -4.5); att.vx = dir * 2.2; }
      } else { def.vx = dir * kb[0]; if (kb[1] < 0) def.vy = kb[1]; }
      if (h.knockdown || h.launch || h.slam || def.airborne) def.knockOnLand = true;
      if (h.groundbounce) def.groundBounce = true;
      if (h.wallbounce) def.wallBounce = true;
    }
    if (def.hp <= 0) { def.hp = 0; this.onKO(att, def); }
    // ---- flash and impact
    const str = h.strength || 1;
    FX.hitSpark(sx, sy, h.elem || 'punch', str, dir);
    this.hitstop = Math.max(this.hitstop, [0, 5, 7, 10, 13][str] + (h.finisher ? 12 : 0), h.hitstop || 0);
    this.shake([0, 2, 4, 9, 15][str]);
    Sound.play(str >= 3 ? 'hitH' : str === 2 ? 'hitM' : 'hitL');
    if (str >= 3) { Sound.elem(h.elem); this.zoomPunch(1.06 + str * 0.015); this.speedT = Math.max(this.speedT, 10); }
    if (h.finisher || (def.comboTaken >= 10 && (h.knockdown || h.slam))) { this.slowmo = Math.max(this.slowmo, 30); this.flashT = 4; this.zoomPunch(1.2); }
    const side = att === this.f1 ? 0 : 1;
    for (const [n, word] of PRAISE) if (def.comboTaken === n) { this.praise[side] = { word, t: 70 }; Sound.play('pop'); }
    return 'hit';
  }
  onKO(att, def) {
    if (this.phase !== 'fight') return;
    if (this.mode === 'training') { def.hp = 1; return; }
    this.phase = 'ko'; this.phaseT = 0; this.winner = att;
    this.slowmo = 100; this.zoomPunch(1.3); this.flashT = 10; this.shake(20);
    def.knockOnLand = true; def.state = 'hit'; def.hitstun = 999;
    if (!def.airborne) def.vy = -13;
    def.vx = (def.x > att.x ? 1 : -1) * 9;
    Sound.play('ko'); Announcer.play('ko');
    FX.hitSpark(def.x, def.y - def.height * 0.6, att.ch.elem, 4, att.facing);
  }

  collide() {
    for (const [a, d] of [[this.f1, this.f2], [this.f2, this.f1]]) {
      const boxes = a.hitRects();
      if (!boxes.length) continue;
      if (d.invuln > 0 || d.state === 'ko' || d.state === 'locked' || d.hidden) continue;
      let box = null, hb = null;
      for (const bx of boxes) { for (const h of d.hurtRects()) if (bx.circle ? circleHitsRect(bx.circle, h) : overlap(bx, h)) { box = bx; hb = h; break; } if (box) break; }
      if (!box) continue;
      const at = a.atk, dd = at.data;
      const sx = (Math.max(box.x, hb.x) + Math.min(box.x + box.w, hb.x + hb.w)) / 2;
      const sy = (Math.max(box.y, hb.y) + Math.min(box.y + box.h, hb.y + hb.h)) / 2;
      at.hitsDone++; at.hitCD = dd.hitEvery || 99; at.connected = true;
      if (dd.superRush) {
        at.stopped = true;
        if (d.canBlock(a.x)) this.applyHit(a, d, Object.assign({}, dd.hit, { dir: a.facing, sx, sy }), null);
        else { this.flashT = 4; this.applyHit(a, d, Object.assign({}, dd.hit, { dir: a.facing, sx, sy, cine: true, dmg: 20 }), null); a.startCine(d, dd.lvl, dd.elem); }
        continue;
      }
      const multi = (dd.hits || 1) > 1 && at.hitsDone < dd.hits;
      const m = dd.multi || {};
      const h = multi
        ? Object.assign({}, dd.hit, { kb: m.kb || [2, 0], hitstun: m.hitstun || 20, launch: 0, knockdown: false, slam: false, wallbounce: false, groundbounce: false, strength: 2, follow: m.follow })
        : Object.assign({}, dd.hit);
      h.dir = a.facing; h.sx = sx; h.sy = sy;
      const res = this.applyHit(a, d, h, null);
      if (dd.onHit) dd.onHit(a, d, res, this);
      if (res === 'hit' && dd.autoJump && !multi) a.pendingJump = true;
      if (dd.stopOnHit) {
        at.stopped = true;
        if (res === 'block') a.vx = -a.facing * 4;
        else at.activeEnd = Math.max(at.activeEnd, at.f + (dd.hits - at.hitsDone) * dd.hitEvery + 1);
      }
    }
    // entities
    for (const e of this.ents) {
      if (e.dead || e.hits <= 0 || e.hitCD > 0) continue;
      const r = e.rect(this);
      if (!r) continue;
      const d = e.owner.opp;
      if (d.invuln > 0 || d.state === 'ko' || d.state === 'locked' || d.hidden) continue;
      const hb = d.hurtRects().find(h => overlap(r, h));
      if (!hb) continue;
      const h = e.info(e.hits > 1);
      h.sx = (Math.max(r.x, hb.x) + Math.min(r.x + r.w, hb.x + hb.w)) / 2;
      h.sy = (Math.max(r.y, hb.y) + Math.min(r.y + r.h, hb.y + hb.h)) / 2;
      if (e instanceof Rain || e.ground) h.dir = d.x >= e.owner.x ? 1 : -1;
      const res = this.applyHit(e.owner, d, h, e);
      e.hits--; e.hitCD = e.hitEvery;
      if (res === 'hit' && e.hits <= 0 && e.finalFx) d.applyStatus(e.finalFx, e.owner, e.m);
      if (res === 'hit' && e.onHitFn) e.onHitFn(d, this);
      if (res === 'hit' && e.pull) { d.vx = -e.dir * 15; d.vy = -3; FX.label(d.x, d.y - d.height - 30, 'GOTCHA!', '#ff80ab', 26); }
      if ((e.hits <= 0 || (res === 'block' && !e.isSuper)) && (e instanceof Proj || e instanceof Wave)) { e.dead = true; e.explode(this); }
    }
    // projectile clashes
    for (let i = 0; i < this.ents.length; i++) {
      const a = this.ents[i]; if (!a.clash || a.dead) continue;
      for (let j = i + 1; j < this.ents.length; j++) {
        const b = this.ents[j]; if (!b.clash || b.dead || b.owner === a.owner) continue;
        const ra = a.rect(this), rb = b.rect(this);
        if (!ra || !rb || !overlap(ra, rb)) continue;
        if (a.isSuper && !b.isSuper) b.dead = true;
        else if (b.isSuper && !a.isSuper) a.dead = true;
        else { a.dead = true; b.dead = true; }
        const x = (ra.x + ra.w / 2 + rb.x + rb.w / 2) / 2, y = (ra.y + ra.h / 2 + rb.y + rb.h / 2) / 2;
        FX.hitSpark(x, y, a.elem, 3); FX.hitSpark(x, y, b.elem, 2); this.shake(8); Sound.play('explode');
      }
    }
  }
  pushApart() {
    const a = this.f1, b = this.f2;
    const skip = f => ['locked', 'down', 'ko'].includes(f.state) || f.cine || (f.state === 'attack' && f.atk.data.passThrough && f.atk.f > f.atk.data.startup);
    if (skip(a) || skip(b)) return;
    const ha = a.hurtbox(), hb = b.hurtbox();
    if (ha.y > hb.y + hb.h || hb.y > ha.y + ha.h) return;
    const minD = (a.width + b.width) * 0.42, dx = b.x - a.x;
    if (Math.abs(dx) < minD) {
      const push = (minD - Math.abs(dx)) / 2, s = dx === 0 ? (a.side === 0 ? 1 : -1) : Math.sign(dx);
      a.x -= push * s; b.x += push * s;
    }
  }
  updateCamera() {
    const mid = (this.f1.x + this.f2.x) / 2;
    const target = clamp(mid - W / 2, 0, STAGE_W - W);
    this.camX += (target - this.camX) * 0.2;
    for (const f of [this.f1, this.f2]) {
      const lo = Math.max(40, this.camX + 40), hi = Math.min(STAGE_W - 40, this.camX + W - 40);
      if (f.x < lo || f.x > hi) {
        if (f.wallBounce && f.state === 'hit') {
          f.wallBounce = false; f.vx = -f.vx * 0.5; f.vy = -12; f.hitstun = Math.max(f.hitstun, 30);
          FX.ring(f.x, f.y - f.height / 2, '#ffffff', 10, 140, 14, 8); FX.dust(f.x, f.y - f.height / 2, 8); this.shake(12); Sound.play('hitH');
          FX.comic(f.x, f.y - f.height - 30, 'CRASH!', 3);
        }
        f.x = clamp(f.x, lo, hi);
      }
    }
  }

  // ------------------------------------------------------------ main update
  update() {
    if (this.paused) { this.updatePause(); return; }
    if (Input.sys('Escape') || P1In.pressed.start || P2In.pressed.start) { this.paused = true; this.pauseSel = 0; this.showMoves = false; this.showOpts = false; Sound.play('select'); return; }
    this.frame++;
    if (this.f2.input instanceof CpuInput) this.f2.input.think(this.f2, this.f1, this);
    this.shakeAmt *= 0.86;
    this.zoom = lerp(this.zoom, 1, 0.08);
    if (this.flashT > 0) this.flashT--;
    if (this.darkT > 0) this.darkT--;
    if (this.quakeT > 0) this.quakeT--;
    if (this.tiltT > 0) { this.tiltT--; this.tilt = Math.sin(this.tiltT * 0.12) * 0.07 * Math.min(1, this.tiltT / 20); } else this.tilt = 0;
    if (this.speedT > 0) this.speedT--;
    for (const p of this.praise) if (p && --p.t <= 0) this.praise[this.praise.indexOf(p)] = null;
    if (this.banner) { this.banner.age = (this.banner.age || 0) + 1; if (--this.banner.t <= 0) this.banner = null; }   // animate in update, so pausing freezes it

    if (this.superFreeze) {
      const sf = this.superFreeze;
      sf.f.animT++; this.speedT = 2;
      FX.update();
      if (--sf.t <= 0) this.superFreeze = null;
      return;
    }
    if (this.slowmo > 0) { this.slowmo--; if (this.frame % 3 !== 0) { FX.update(); return; } }
    if (this.hitstop > 0) { this.hitstop--; return; }

    this.updatePhase();
    this.f1.update(this); this.f2.update(this);
    for (const e of this.ents) e.update(this);
    this.collide();
    this.ents = this.ents.filter(e => !e.dead);
    this.pushApart();
    this.updateCamera();
    FX.update();
    if (this.mode === 'training') {
      this.f1.meter = MAX_METER;
      if (this.f2.state !== 'hit' && this.f2.state !== 'locked' && this.f2.hp < MAX_HP && ++this.refill > 50) { this.f2.hp = MAX_HP; this.f2.hpRed = MAX_HP; }
      if (this.f2.state === 'hit') this.refill = 0;
    }
  }
  updatePhase() {
    this.phaseT++;
    const t = this.phaseT;
    switch (this.phase) {
      case 'bossIntro':
        // Imu speaks before the final battle
        if (t === 1) { this.darkT = 170; Sound.play('super'); this.shake(10); }
        if (t % 12 === 0) FX.bolt(this.f2.x + rand(-140, 140), this.f2.y - rand(150, 330), this.f2.x + rand(-60, 60), this.f2.y - rand(40, 160), choice(['#111111', '#d50000']), 8, 4);
        if (t >= 170 || (t > 40 && Menu.ok())) { this.phase = 'intro'; this.phaseT = 0; this.darkT = 0; }
        break;
      case 'intro':
        if (t === 1) { this.banner = { text: 'ROUND ' + this.round, t: 70, col: '#ffffff' }; Announcer.play('ready'); }
        if (t === 75) { this.banner = { text: 'FIGHT!', t: 40, col: '#ffeb3b' }; Announcer.play('fight'); this.zoomPunch(1.1); this.shake(8); }
        if (t >= 90) { this.phase = 'fight'; this.phaseT = 0; }
        break;
      case 'fight':
        if (this.mode !== 'training' && Settings.data.time > 0 && ++this.timerF >= 60) {
          this.timerF = 0;
          if (--this.timer <= 0) {
            this.timer = 0; this.phase = 'timeup'; this.phaseT = 0;
            this.winner = this.f1.hp > this.f2.hp ? this.f1 : this.f2.hp > this.f1.hp ? this.f2 : null;
            this.banner = { text: 'TIME!', t: 80, col: '#ff9800' }; Announcer.play('time');
          }
        }
        break;
      case 'ko': case 'timeup': {
        const loser = this.winner ? this.winner.opp : null;
        const settled = this.phase === 'timeup' || (loser && (loser.state === 'ko' || (loser.state === 'down' && loser.hp <= 0)));
        if (settled && t > 90 && !this.roundOver) {
          this.roundOver = true; this.phaseT = 0; this.phase = 'roundEnd';
          if (this.winner) {
            this.winner.wins++; this.winner.setState('win'); this.winner.atk = null;
            this.banner = { text: (this.winner === this.f1 ? (this.mode === 'cpu' ? 'YOU' : 'P1') : (this.mode === 'cpu' ? 'CPU' : 'P2')) + ' WIN' + (this.winner === this.f1 && this.mode === 'cpu' ? '!' : 'S!'), t: 140, col: '#ffeb3b' };
            const flawless = this.winner.hp >= MAX_HP;
            if (this.mode === 'vs') { Announcer.play(this.winner === this.f1 ? 'player_1_wins' : 'player_2_wins'); if (flawless) Announcer.play('perfect', 1.6); }
            else if (this.winner === this.f1) Announcer.play(flawless ? 'perfect' : 'you_win');
            else Announcer.play('you_lose');
          } else { this.banner = { text: 'DRAW!', t: 140, col: '#ffffff' }; Announcer.play('tie'); }
        }
        break;
      }
      case 'roundEnd':
        if (t >= 150) {
          this.roundOver = false;
          const need = Settings.data.roundsToWin;
          const champ = [this.f1, this.f2].find(f => f.wins >= need);
          if (champ) { Game.goto(this.opts.arcade ? Arcade.after(this, champ) : new ResultsScene(this, champ)); return; }
          this.round++; this.startRound();
        }
        break;
    }
  }
  updatePause() {
    const items = this.pauseItems();
    if (this.showMoves) { if (Menu.ok() || Menu.back()) { this.showMoves = false; Sound.play('back'); } return; }
    if (this.showOpts) { this.updatePauseOptions(); return; }
    if (Menu.up()) { this.pauseSel = (this.pauseSel + items.length - 1) % items.length; Sound.play('select'); }
    if (Menu.down()) { this.pauseSel = (this.pauseSel + 1) % items.length; Sound.play('select'); }
    if (Menu.back() && !Input.sys('Escape')) { this.paused = false; return; }
    if (Input.sys('Escape')) { this.paused = false; return; }
    if (Menu.ok()) {
      Sound.play('confirm');
      const it = items[this.pauseSel];
      if (it === 'RESUME') this.paused = false;
      if (it === 'MOVE LIST') this.showMoves = true;
      if (it === 'OPTIONS') { this.showOpts = true; this.optSel = 0; }
      if (it === 'CHARACTER SELECT') Game.goto(new SelectScene(this.mode, this.opts.level));
      if (it === 'MAIN MENU') Game.goto(new TitleScene());
    }
  }
  pauseItems() { return this.opts.arcade ? ['RESUME', 'MOVE LIST', 'OPTIONS', 'MAIN MENU'] : ['RESUME', 'MOVE LIST', 'OPTIONS', 'CHARACTER SELECT', 'MAIN MENU']; }
  // in-fight options: the settings that make sense mid-match (volumes, announcer), changed live
  pauseOptRows() {
    const d = Settings.data, bars = v => '▮'.repeat(Math.round(v * 10)) || 'OFF';
    return [['MUSIC VOLUME', bars(d.music)], ['SOUND VOLUME', bars(d.sfx)], ['ANNOUNCER VOICE', d.announcer ? 'ON' : 'OFF'], ['BACK', '']];
  }
  updatePauseOptions() {
    const n = this.pauseOptRows().length, d = Settings.data;
    if (Menu.up()) { this.optSel = (this.optSel + n - 1) % n; Sound.play('select'); }
    if (Menu.down()) { this.optSel = (this.optSel + 1) % n; Sound.play('select'); }
    if (Menu.back() || Input.sys('Escape') || (Menu.ok() && this.optSel === n - 1)) { this.showOpts = false; Sound.play('back'); return; }
    const dir = Menu.left() ? -1 : Menu.right() || Menu.ok() ? 1 : 0;
    if (!dir) return;
    if (this.optSel === 0) d.music = clamp(Math.round((d.music + dir * 0.1) * 10) / 10, 0, 1);
    if (this.optSel === 1) d.sfx = clamp(Math.round((d.sfx + dir * 0.1) * 10) / 10, 0, 1);
    if (this.optSel === 2) d.announcer = !d.announcer;
    Settings.save(); Sound.setVolumes(); Sound.play('select');
  }

  // ------------------------------------------------------------ drawing
  draw(ctx) {
    const qk = this.quakeT > 0 ? Math.min(1, this.quakeT / 8) : 0;
    const quake = qk ? Math.sin(this.frame * 2.3) * 46 * qk : 0, quakeY = qk ? Math.sin(this.frame * 3.7) * 14 * qk : 0;
    const sx = rand(-1, 1) * this.shakeAmt + quake, sy = rand(-1, 1) * this.shakeAmt + quakeY;
    ctx.save();
    ctx.translate(sx, sy);
    // zoom around the action
    const fx = (this.f1.x + this.f2.x) / 2 - this.camX, fy = Math.min(this.f1.y, this.f2.y) - 120;
    ctx.translate(fx, fy); ctx.scale(this.zoom, this.zoom); if (this.tilt) ctx.rotate(this.tilt); ctx.translate(-fx, -fy);
    this.stage.draw(ctx, this.camX, this.frame);
    if (this.darkT > 0) { ctx.fillStyle = 'rgba(0,0,10,' + 0.6 * Math.min(1, this.darkT / 10) + ')'; ctx.fillRect(-50, -50, W + 100, H + 100); }
    if (this.superFreeze) { ctx.fillStyle = 'rgba(0,0,20,' + 0.65 * Math.min(1, (this.superFreeze.max - this.superFreeze.t) / 6) + ')'; ctx.fillRect(-50, -50, W + 100, H + 100); }
    ctx.save();
    ctx.translate(-this.camX, 0);
    for (const f of [this.f1, this.f2]) {
      const k = clamp(1 - (GROUND_Y - f.y) / 400, 0.3, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(f.x, GROUND_Y + 2, f.width * 0.8 * k, 9 * k, 0, 0, TAU); ctx.fill();
    }
    for (const e of this.ents) if (e instanceof Pillar || e instanceof Screen) e.draw(ctx);
    const order = this.f1.state === 'attack' || this.f1.cine ? [this.f2, this.f1] : [this.f1, this.f2];
    for (const f of order) f.draw(ctx);
    for (const e of this.ents) if (!(e instanceof Pillar || e instanceof Screen)) e.draw(ctx);
    FX.draw(ctx);
    ctx.restore();
    ctx.restore();
    if (this.speedT > 0) this.drawSpeedLines(ctx, fx, fy);
    if (this.flashT > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.flashT * 0.08 + ')'; ctx.fillRect(0, 0, W, H); }
    if (this.superFreeze) this.drawCutIn(ctx);
    this.drawHUD(ctx);
    if (this.paused) this.drawPause(ctx);
  }
  drawSpeedLines(ctx, cx, cy) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU), r0 = rand(260, 420), r1 = r0 + rand(200, 500);
      ctx.lineWidth = rand(2, 6);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
  }
  drawCutIn(ctx) {
    const sf = this.superFreeze, f = sf.f, age = sf.max - sf.t;
    const k = Math.min(1, age / 8), out = Math.min(1, sf.t / 8);
    const left = f === this.f1;
    const bandY = 250, bandH = 200;
    ctx.save();
    ctx.globalAlpha = out;
    ctx.beginPath();
    ctx.moveTo(0, bandY + 30); ctx.lineTo(W, bandY - 30); ctx.lineTo(W, bandY + bandH - 30); ctx.lineTo(0, bandY + bandH + 30); ctx.closePath();
    const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    g.addColorStop(0, ec(f.ch.elem, 2)); g.addColorStop(0.5, ec(f.ch.elem, 1)); g.addColorStop(1, ec(f.ch.elem, 2));
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    // streaks
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 18; i++) { const y = bandY - 40 + ((i * 47 + age * 3) % (bandH + 80)); ctx.lineWidth = 2 + (i % 3) * 2; const x = ((i * 173 + age * 60 * (left ? 1 : -1)) % (W + 400)) - 200; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 300, y - 15); ctx.stroke(); }
    // character close-up
    const px = left ? lerp(-200, 280, k) : lerp(W + 200, W - 280, k);
    const sTot = 2.3;
    drawCharArt(ctx, f.ch, px, bandY + bandH / 2 + 118 * sTot, left ? 1 : -1, 'super', sTot / (f.look.scale || 1), f.animT);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = out;
    const tx = left ? lerp(W + 300, 820, k) : lerp(-300, 460, k);
    if (sf.lvl === 3) drawText(ctx, 'LEVEL 3 MAX!!', tx, bandY + 40, 38, '#ff5252', '#fff', 'center', 7);
    drawText(ctx, sf.name.toUpperCase() + '!', tx, bandY + bandH / 2 + 10, sf.name.length > 18 ? 46 : 60, '#ffffff', '#1a1a1a', 'center', 10);
    ctx.restore();
  }

  drawHUD(ctx) {
    const t = this.frame;
    for (const side of [0, 1]) {
      const f = side ? this.f2 : this.f1, L = side === 0;
      const len = 460, y = 26, h = 30;
      const x0 = L ? 120 : W - 120 - len;
      // bar frame
      ctx.save();
      ctx.transform(1, 0, L ? -0.25 : 0.25, 1, 0, 0);
      const skx = (L ? 0.25 : -0.25) * y;
      ctx.translate(skx, 0);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x0 - 4, y - 4, len + 8, h + 8);
      ctx.fillStyle = '#4a0d0d'; ctx.fillRect(x0, y, len, h);
      const red = len * f.hpRed / MAX_HP, hp = len * f.hp / MAX_HP;
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(L ? x0 : x0 + len - red, y, red, h);
      const low = f.hp < MAX_HP * 0.3;
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, low && t % 20 < 10 ? '#ffab40' : '#fff59d'); g.addColorStop(0.5, low ? '#ff9100' : '#ffd600'); g.addColorStop(1, low ? '#e65100' : '#f9a825');
      ctx.fillStyle = g;
      ctx.fillRect(L ? x0 : x0 + len - hp, y, hp, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(L ? x0 : x0 + len - hp, y + 3, hp, 5);
      ctx.restore();
      // portrait
      const px = L ? 62 : W - 62;
      ctx.fillStyle = GROUPS[f.ch.group].color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(px, 50, 46, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(px, 50, 44, 0, TAU); ctx.clip();
      ctx.save(); ctx.translate(px, 58); ctx.scale(L ? 1 : -1, 1); drawPortrait(ctx, f.ch, 0, 0, 30, f.state === 'hit' ? 'hurt' : 'normal', f.animT); ctx.restore();
      ctx.restore();
      drawText(ctx, f.ch.name, L ? 130 : W - 130, 78, 24, '#ffffff', '#1a1a1a', L ? 'left' : 'right', 5);
      if (this.mode !== 'training') {
        for (let i = 0; i < Settings.data.roundsToWin; i++) {
          const cx = L ? 560 - i * 26 : W - 560 + i * 26;
          ctx.fillStyle = i < f.wins ? '#ffd600' : 'rgba(0,0,0,0.5)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, 80, 9, 0, TAU); ctx.fill(); ctx.stroke();
        }
      }
      // super meter
      const lvl = Math.floor(f.meter / BAR), part = (f.meter % BAR) / BAR;
      const mx = L ? 100 : W - 100 - 300, my = H - 42;
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(mx - 3, my - 3, 306, 24);
      ctx.fillStyle = '#0d1b3e'; ctx.fillRect(mx, my, 300, 18);
      const full = lvl >= 3;
      ctx.fillStyle = full ? (t % 10 < 5 ? '#ffffff' : '#ffeb3b') : ['#40c4ff', '#69f0ae', '#ffeb3b'][lvl] || '#ffeb3b';
      const fw = full ? 300 : 300 * part;
      ctx.fillRect(L ? mx : mx + 300 - fw, my, fw, 18);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(L ? 62 : W - 62, my + 8, 30, 0, TAU); ctx.fill();
      ctx.fillStyle = lvl > 0 ? ['#40c4ff', '#69f0ae', '#ff5252', '#ff5252'][lvl] : '#455a64'; ctx.beginPath(); ctx.arc(L ? 62 : W - 62, my + 8, 26, 0, TAU); ctx.fill();
      drawText(ctx, String(lvl), L ? 62 : W - 62, my + 10, 38, '#fff', '#1a1a1a', 'center', 5);
      if (lvl >= 1) drawText(ctx, full ? 'MAX! PRESS SUPER!' : 'SUPER READY!', L ? mx + 4 : mx + 296, my - 16, 20, full && t % 20 < 10 ? '#ff5252' : '#ffeb3b', '#1a1a1a', L ? 'left' : 'right', 4);
      // special cooldown icons (G/H for P1, Num1/Num2 for P2)
      ['s1', 's2'].forEach((k, j) => {
        const cx = L ? 440 + j * 46 : W - 440 - j * 46, cy = H - 33, max = f.moves[k].cd || 40, left = f.cd[k];
        const ready = left <= 0, inForm = k === 's2' && f.formT > 0;
        ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, TAU); ctx.fill();
        ctx.fillStyle = inForm ? '#ffffff' : ready ? ec(f.moves[k].elem, 1) : '#37474f';
        ctx.beginPath(); ctx.arc(cx, cy, 16, 0, TAU); ctx.fill();
        if (!ready && !inForm) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 16, -Math.PI / 2, -Math.PI / 2 + TAU * left / max); ctx.closePath(); ctx.fill(); }
        if (inForm) { ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 17, -Math.PI / 2, -Math.PI / 2 + TAU * f.formT / (f.ch.s2.dur || 1)); ctx.stroke(); }
        const key = this.mode === 'vs' && !L ? ['1', '2'][j] : ['G', 'H'][j];
        drawText(ctx, key, cx, cy + 1, 18, ready || inForm ? '#1a1a1a' : '#90a4ae', null);
      });
      // combo counter
      if (f.comboShow > 0 && f.combo >= 2) {
        const pop = f.comboPop > 0 ? 1 + (f.comboPop--) * 0.06 : 1;
        const cx = L ? 40 : W - 40;
        ctx.save(); ctx.globalAlpha = Math.min(1, f.comboShow / 15);
        ctx.translate(cx, 230); ctx.scale(pop, pop);
        drawText(ctx, String(f.combo), 0, 0, 84, '#ffeb3b', '#d50000', L ? 'left' : 'right', 10);
        drawText(ctx, 'HITS!', L ? 0 : 0, 58, 36, '#ffffff', '#1a1a1a', L ? 'left' : 'right', 6);
        drawText(ctx, f.comboDmg + ' DMG', 0, 92, 22, '#ff8a80', '#1a1a1a', L ? 'left' : 'right', 4);
        ctx.restore();
      }
      const pr = this.praise[side];
      if (pr) {
        const age = 70 - pr.t, sc = age < 8 ? easeOutBack(age / 8) : 1;
        ctx.save(); ctx.translate(L ? 200 : W - 200, 360); ctx.rotate(L ? -0.12 : 0.12); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, pr.t / 10);
        drawText(ctx, pr.word, 0, 0, pr.word.length > 12 ? 40 : 56, choice(['#ffeb3b', '#ff4081', '#40c4ff', '#69f0ae']), '#1a1a1a', 'center', 9);
        ctx.restore();
      }
    }
    // timer
    if (this.mode !== 'training') {
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(W / 2, 46, 38, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd600'; ctx.lineWidth = 4; ctx.stroke();
      drawText(ctx, Settings.data.time > 0 ? String(this.timer) : '∞', W / 2, 48, 44, this.timer <= 10 && Settings.data.time > 0 ? '#ff5252' : '#ffffff', null);
    } else {
      drawText(ctx, 'TRAINING', W / 2, 40, 34, '#69f0ae', '#1a1a1a', 'center', 6);
      drawText(ctx, 'Mash T for auto-combo · G / H specials · J super · Esc = menu', W / 2, 130, 20, '#ffffff', '#1a1a1a', 'center', 4);
    }
    // banner
    if (this.banner) {
      const b = this.banner, age = b.age || 0;
      const sc = age < 10 ? easeOutBack(age / 10) : Math.min(1.25, 1 + (age - 10) * 0.002);   // slow grow, capped
      ctx.save(); ctx.translate(W / 2, H / 2 - 40); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, b.t / 10);
      drawText(ctx, b.text, 0, 0, b.text.length > 10 ? 96 : 130, b.col, '#1a1a1a', 'center', 16);
      ctx.restore();
    }
    if (this.phase === 'bossIntro') {
      const k = Math.min(1, Math.max(0, this.phaseT - 14) / 10), hx = this.f2.x - this.camX - 40, hy = this.f2.y - this.f2.spriteH - 30;
      if (k > 0) speechBubble(ctx, clamp(hx, 260, W - 260), Math.max(130, hy), 'Ants can never stop me!', easeOutBack(k));
      drawText(ctx, 'FINAL BATTLE', W / 2, 120, 64, '#ff5252', '#1a1a1a', 'center', 10);
    }
    if (this.phase === 'ko' && this.phaseT < 80) {
      const sc = Math.min(1, this.phaseT / 6) * 1.1;
      ctx.save(); ctx.translate(W / 2, H / 2 - 40); ctx.scale(sc, sc); ctx.rotate(-0.08);
      drawText(ctx, 'K.O.!', 0, 0, 200, '#ff1744', '#ffffff', 'center', 18);
      ctx.restore();
    }
  }
  drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    if (this.showMoves) { drawMoveList(ctx, this.f1.ch, this.f2.ch); return; }
    if (this.showOpts) {
      drawText(ctx, 'OPTIONS', W / 2, 160, 80, '#ffeb3b', '#1a1a1a', 'center', 12);
      this.pauseOptRows().forEach(([k, v], i) => {
        const sel = i === this.optSel, y = 290 + i * 80;
        drawText(ctx, k, v ? 330 : W / 2, y, 42, sel ? '#ffffff' : '#78909c', '#1a1a1a', v ? 'left' : 'center', 7);
        if (v) drawText(ctx, '◀ ' + v + ' ▶', 900, y, 38, sel ? '#ffeb3b' : '#cfd8dc', '#1a1a1a', 'center', 6);
      });
      drawText(ctx, '◀ ▶ change · Back / Esc = return', W / 2, H - 50, 22, '#90a4ae', '#1a1a1a', 'center', 4);
      return;
    }
    drawText(ctx, 'PAUSED', W / 2, 180, 90, '#ffeb3b', '#1a1a1a', 'center', 12);
    this.pauseItems().forEach((it, i) => {
      const sel = i === this.pauseSel;
      drawText(ctx, it, W / 2, 300 + i * 70, 46, sel ? '#ffffff' : '#78909c', '#1a1a1a', 'center', 7);
    });
  }
}

function drawMoveList(ctx, c1, c2) {
  drawText(ctx, 'MOVE LIST', W / 2, 70, 64, '#ffeb3b', '#1a1a1a', 'center', 10);
  const lines = c => [
    ['MASH LIGHT', 'Auto combo + launcher + air combo!'],
    ['MEDIUM / HEAVY', 'Bigger hits (HEAVY bounces off walls)'],
    ['SPECIAL 1', c.s1.name], ['SPECIAL 2', c.s2.name],
    ['SUPER (1 bar)', c.su.name], ['SUPER (3 bars)', 'LEVEL 3 MAX ' + (c.su.maxName || c.su.name)],
    ['HOLD BACK', 'Block'], ['TAP FWD TWICE', 'Dash'], ['UP IN AIR', 'Double jump'],
  ];
  [c1, c2].forEach((c, s) => {
    const x = s === 0 ? 70 : W / 2 + 30;
    drawText(ctx, c.full.toUpperCase(), x, 150, 36, GROUPS[c.group].color === '#d32f2f' ? '#ff8a80' : '#82b1ff', '#1a1a1a', 'left', 6);
    lines(c).forEach(([k, v], i) => {
      drawText(ctx, k, x, 205 + i * 50, 22, '#ffeb3b', '#1a1a1a', 'left', 4);
      drawText(ctx, v, x + 190, 205 + i * 50, 22, '#ffffff', '#1a1a1a', 'left', 4);
    });
  });
  drawText(ctx, 'Press any attack button to go back', W / 2, H - 30, 22, '#90a4ae', '#1a1a1a', 'center', 4);
}
