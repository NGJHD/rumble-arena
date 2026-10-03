'use strict';
const MAX_HP = 1000, BAR = 1000, MAX_METER = 3000;
const WALK = 5.2, JUMP_V = -24.75, DJUMP_V = -21.45, SUPERJUMP_V = -21;   // jumps are 1.3 x 1.3 = 1.69x the original -19 / -16.5 height (height ~ v^2)

const NORMAL_POSE = { L1: 'attack', L2: 'attack', L3: 'kick', L4: 'upper', M1: 'attack', M2: 'kick', H1: 'attack', A1: 'attack', A2: 'kick', A3: 'kick', AM: 'kick', A4: 'attack' };

class Fighter {
  constructor(ch, side, input) {
    this.ch = ch; this.side = side; this.input = input;
    this.moves = buildMoves(ch);
    const look = ch.look, B = BUILDS[look.build || 'normal'], sc = look.scale || 1;
    this.height = (B.th1 + B.sh + B.th + B.R * 1.75) * sc;
    this.width = (B.tw * 2 + 18) * sc;
    this.hs = clamp(this.height / 150, 0.8, 1.6);
    this.meter = 0; this.wins = 0;
    this.dmgMult = 1;
    this.reset(W / 2, 1);
  }
  reset(x, facing) {
    Object.assign(this, {
      x, y: GROUND_Y, vx: 0, vy: 0, facing, hp: MAX_HP, hpRed: MAX_HP, redDelay: 0,
      state: 'idle', t: 0, animT: 0, atk: null, hitstun: 0, blockstun: 0, invuln: 0,
      airJumps: 1, comboTaken: 0, juggle: 0, combo: 0, comboShow: 0, comboDmg: 0,
      buffer: null, cd: { s1: 0, s2: this.ch.s2.type === 'transform' ? 600 : 0 }, lastTap: { dir: 0, t: 0 }, trail: 0, ghosts: [],
      knockOnLand: false, groundBounce: false, wallBounce: false, flash: 0, pendingJump: false,
      maxLook: 0, cine: null, hidden: false, landT: 0,
      form: null, formT: 0, giantK: 1, clones: 0, iced: 0, stoned: 0, statusBy: null,
    });
  }
  get look() {
    if (this.maxLook > 0 && this.ch.maxLook) return Object.assign({}, this.ch.look, this.ch.maxLook);
    return this.ch.look;
  }
  get airborne() { return this.y < GROUND_Y - 0.5; }
  setState(s) { if (this.state !== s) { this.state = s; this.t = 0; } }
  hurtbox() {
    const crouch = this.state === 'crouch' || (this.state === 'guard' && this.input.held.down);
    let h = this.height * (crouch ? 0.68 : 1), w = this.width;
    const si = Sprites.has(this.ch.id) && Sprites.get(this.spriteId, 'idle');
    if (si) {   // sprites are drawn larger than the old procedural body
      const dh = this.spriteH, dw = dh * si.img.width / si.img.height;
      h = dh * 0.92 * (crouch ? 0.7 : 1); w = Math.max(w, Math.min(dw * 0.5, dh * 0.42));   // cap: weapons widen the art, not the body
    }
    if (this.state === 'down' || this.state === 'ko') return { x: this.x - this.height / 2, y: this.y - 40, w: this.height, h: 40 };
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }
  // ---- hit geometry that follows what is DRAWN this frame (pose, stretch, lunge, rotation, centring) ----
  // world position of a point given in 0..1 sprite coords of the current pose, exactly like drawSprite()
  spritePt(s, fr, u, v) {
    const k = this.spriteH / s.idle.srcH, dh = s.m.srcH * k, dw = dh * s.img.width / s.img.height;
    const ax = fr.center ? 0.5 : s.m.ax;
    let lx = (u - ax) * dw * (fr.sx || 1), ly = -(1 - v) * dh * (fr.sy || 1);
    if (fr.rot) { ly += dh / 2; const c = Math.cos(fr.rot), sn = Math.sin(fr.rot); [lx, ly] = [lx * c - ly * sn, lx * sn + ly * c]; ly -= dh / 2; }
    return { x: this.x + ((fr.dx || 0) + lx) * this.facing, y: this.y + (fr.dy || 0) + ly, dw, dh };
  }
  drawnFrame() { return this._fr && this._frT === this.animT ? this._fr : (this._frT = this.animT, this._fr = this.spriteFrame()); }
  // hurt area = the body silhouette of the pose being drawn, in horizontal bands (thin weapons excluded)
  hurtRects() {
    const base = this.hurtbox();
    if (!Sprites.has(this.ch.id) || this.state === 'down' || this.state === 'ko') return [base];
    const fr = this.drawnFrame(), s = Sprites.get(this.spriteId, fr.pose);
    if (!s || !s.m.prof) return [base];
    const n = s.m.prof.length, out = [];
    s.m.prof.forEach((b, i) => {
      if (!b) return;
      const p = [this.spritePt(s, fr, b[0], i / n), this.spritePt(s, fr, b[1], i / n), this.spritePt(s, fr, b[0], (i + 1) / n), this.spritePt(s, fr, b[1], (i + 1) / n)];
      const xs = p.map(q => q.x), ys = p.map(q => q.y);
      out.push({ x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
    });
    return out.length ? out : [base];
  }
  // where the strike point (fist / foot / blade tip) of the pose is drawn this frame
  drawnStrike() {
    const fr = this.drawnFrame(); let s = Sprites.get(this.spriteId, fr.pose);
    if (!s || !s.m.fist) return null;
    const [u, v, r] = s.m.fist, p = this.spritePt(s, fr, u, v);
    return { x: p.x, y: p.y, r: r * p.dw * (fr.sx || 1) };
  }
  // hit area of the current attack: the move's core box, stretched out to the drawn strike point, plus the strike point itself
  hitRects() {
    const box = this.attackBox();
    if (!box) return [];
    const a = this.atk;
    if (!a.data.isNormal && !a.data.stretchRange && !a.data.remote && Sprites.has(this.ch.id)) {
      // specials / supers: the move's box, but never reaching further forward than what is drawn (strike tip + splash)
      const st = this.drawnStrike(), sp = Sprites.get(this.spriteId, this.drawnFrame().pose);
      if (!st || !sp) return [box];
      let far = st.x + this.facing * (st.r * 1.1 + 28);
      const fr = this.drawnFrame();
      for (const b of sp.m.prof || []) if (b) { const q = this.spritePt(sp, fr, this.facing > 0 ? b[1] : b[0], 0.5); far = this.facing > 0 ? Math.max(far, q.x + 28) : Math.min(far, q.x - 28); }
      const x0 = box.x, x1 = box.x + box.w;
      const c = this.facing > 0 ? { x: x0, y: box.y, w: Math.max(0, Math.min(x1, far) - x0), h: box.h } : { x: Math.max(x0, far), y: box.y, w: Math.max(0, x1 - Math.max(x0, far)), h: box.h };
      return c.w > 0 ? [c] : [];
    }
    if (!(a.data.isNormal && !a.data.stretchRange && !a.data.remote && Sprites.has(this.ch.id))) return [box];
    const st = this.drawnStrike();
    if (!st) return [box];
    // strike point + the impact splash drawn there (sparks / swoosh / burst reach ~25px past the tip)
    const R = st.r * 1.1 + 6 + ((a.data.fx || []).length ? 22 : 0);
    const out = [{ x: st.x - R, y: st.y - R, w: R * 2, h: R * 2, circle: { x: st.x, y: st.y, r: R } }];
    // the whole drawn blade / limb (manifest 'strike' bands), placed through this frame's transform
    const fr = this.drawnFrame(), sp = Sprites.get(this.spriteId, fr.pose);
    if (sp && sp.m.strike) {
      const n = sp.m.strike.length;
      sp.m.strike.forEach((bd, i) => {
        if (!bd) return;
        const p = [this.spritePt(sp, fr, bd[0], i / n), this.spritePt(sp, fr, bd[1], i / n), this.spritePt(sp, fr, bd[0], (i + 1) / n), this.spritePt(sp, fr, bd[1], (i + 1) / n)];
        const xs = p.map(q => q.x), ys = p.map(q => q.y);
        out.push({ x: Math.min(...xs) - 3, y: Math.min(...ys) - 3, w: Math.max(...xs) - Math.min(...xs) + 6, h: Math.max(...ys) - Math.min(...ys) + 6 });
      });
    }
    return out;
  }
  fwdHeld() { return this.facing > 0 ? this.input.held.right : this.input.held.left; }
  backHeld() { return this.facing > 0 ? this.input.held.left : this.input.held.right; }
  holdingAwayFrom(x) { return x > this.x ? this.input.held.left : this.input.held.right; }
  faceOpp() { if (Math.abs(this.opp.x - this.x) > 4) this.facing = this.opp.x > this.x ? 1 : -1; }
  canAct() { return ['idle', 'walk', 'crouch', 'guard', 'jump', 'land', 'dash'].includes(this.state); }
  canBlock(fromX) {
    if (!['idle', 'walk', 'crouch', 'guard', 'block', 'jump', 'land'].includes(this.state)) return false;
    return this.holdingAwayFrom(fromX);
  }

  // ------------------------------------------------------------ per-frame logic
  update(g) {
    this.t++; this.animT++;
    if (this.invuln > 0) this.invuln--;
    if (this.flash > 0) this.flash--;
    if (this.maxLook > 0) this.maxLook--;
    if (this.cd.s1 > 0) this.cd.s1--;
    if (this.cd.s2 > 0) this.cd.s2--;
    if (this.comboShow > 0) this.comboShow--;
    if (this.redDelay > 0) this.redDelay--; else if (this.hpRed > this.hp) this.hpRed = Math.max(this.hp, this.hpRed - 6);
    // ghosts / afterimages
    if (this.trail > 0) {
      this.trail--;
      if (this.animT % 2 === 0) this.ghosts.push({ x: this.x, y: this.y, f: this.facing, pose: this.getPose(), fr: this.spriteFrame(), life: 12 });
    }
    for (const gh of this.ghosts) gh.life--;
    this.ghosts = this.ghosts.filter(gh => gh.life > 0);

    this.updateCompanions();
    this.clones = 0;
    if (this.formT > 0) {
      if (this.formT % 36 === 0) Sound.play('drum');
      if (--this.formT === 0) { this.form = null; FX.smoke(this.x, this.y - this.height / 2, 14, 'rgba(255,255,255,0.8)'); Sound.play('back'); }
    }
    if (this.iced > 0 || this.stoned > 0) { this.updateStatus(g); return; }
    if (this.cine) { this.updateCine(g); return; }
    if (this.state === 'locked') return;
    if (this.comboTaken > 0 && !['hit', 'down', 'getup', 'ko'].includes(this.state)) this.endCombo();

    // input buffer + dash detection
    const inp = this.input;
    if (this.buffer && --this.buffer.t <= 0) this.buffer = null;
    if (g.controlsLive && !this.isCpuDummy) {
      for (const b of ['l', 'm', 'h', 's1', 's2', 'su']) if (inp.pressed[b]) this.buffer = { b, t: 10 };
      for (const [k, d] of [['left', -1], ['right', 1]]) {
        if (inp.pressed[k]) {
          if (this.lastTap.dir === d && this.animT - this.lastTap.t < 14) this.dashReq = d;
          this.lastTap = { dir: d, t: this.animT };
        }
      }
    }
    if (this.pendingJump) {
      this.pendingJump = false; this.atk = null;
      this.setState('jump'); this.vy = SUPERJUMP_V; this.vx = this.facing * 2.5; this.airJumps = 0;
      this.trail = 14; Sound.play('jump');
      FX.ring(this.x, GROUND_Y, '#ffffff', 10, 80, 12, 4); FX.dust(this.x, GROUND_Y, 6);
    }

    switch (this.state) {
      case 'idle': case 'walk': case 'crouch': case 'guard': this.neutral(g); break;
      case 'land': if (this.t >= this.landT) { this.setState('idle'); this.neutral(g); } else if (this.buffer) this.tryStart(this.buffer.b, g); break;
      case 'dash':
        this.vx = this.dashDir * (this.t < 10 ? 13 : 13 * (1 - (this.t - 10) / 6));
        if (this.t % 2 === 0) FX.dust(this.x - this.dashDir * 20, GROUND_Y, 1);
        if (this.buffer && this.tryStart(this.buffer.b, g)) break;
        if (this.t >= 16) { this.vx = 0; this.setState('idle'); }
        break;
      case 'jump': this.airborneNeutral(g); break;
      case 'attack': this.updateAttack(g); break;
      case 'hit':
        if (--this.hitstun <= 0 && this.hp > 0) {
          if (this.airborne) { this.setState('airRecover'); this.invuln = 60; this.vy = Math.min(this.vy, -7); this.vx = -this.facing * 3; }
          else { this.setState('idle'); this.endCombo(); }
        }
        break;
      case 'block':
        if (--this.blockstun <= 0) this.setState(this.airborne ? 'jump' : 'idle');
        break;
      case 'airRecover': this.invuln = Math.max(this.invuln, 2); break;
      case 'down':
        if (this.hp <= 0) { this.setState('ko'); break; }
        this.invuln = 2;
        if (this.t >= 36) { this.setState('getup'); this.invuln = 20; }
        break;
      case 'getup': if (this.t >= 16) { this.setState('idle'); this.endCombo(); } break;
    }
    this.physics(g);
  }

  endCombo() {
    if (this.form === 'chopper_mp' && this.state !== 'attack') { this.form = null; this.giantK = 1; } this.comboTaken = 0; this.juggle = 0; this.knockOnLand = false; this.groundBounce = false; this.wallBounce = false; }

  neutral(g) {
    const inp = this.input;
    this.faceOpp();
    if (this.buffer && this.tryStart(this.buffer.b, g)) return;
    if (!g.controlsLive) { this.vx = 0; this.setState('idle'); return; }
    if (inp.held.up) { this.jump(this.fwdHeld() ? 1 : this.backHeld() ? -1 : 0); return; }
    if (this.dashReq) {
      this.dashDir = this.dashReq; this.dashReq = 0; this.setState('dash');
      this.trail = 16; Sound.play('dash'); FX.dust(this.x, GROUND_Y, 4); return;
    }
    if (this.backHeld() && g.threatens(this.opp, this)) { this.setState('guard'); this.vx = 0; return; }
    if (inp.held.down) { this.setState('crouch'); this.vx = 0; return; }
    if (this.fwdHeld()) { this.setState('walk'); this.vx = this.facing * WALK; }
    else if (this.backHeld()) { this.setState('walk'); this.vx = -this.facing * WALK * 0.85; }
    else { this.setState('idle'); this.vx = 0; }
  }
  jump(dir) {
    this.setState('jump'); this.vy = JUMP_V; this.vx = dir * this.facing * 5.5; this.airJumps = 1;
    Sound.play('jump'); FX.dust(this.x, GROUND_Y, 3);
  }
  airborneNeutral(g) {
    const inp = this.input;
    if (this.fwdHeld()) this.vx = clamp(this.vx + this.facing * 0.4, -6.5, 6.5);
    if (this.backHeld()) this.vx = clamp(this.vx - this.facing * 0.4, -6.5, 6.5);
    if (inp.pressed.up && this.airJumps > 0 && g.controlsLive) {
      this.airJumps--; this.vy = DJUMP_V;
      this.vx = this.fwdHeld() ? this.facing * 5 : this.backHeld() ? -this.facing * 5 : this.vx * 0.5;
      FX.ring(this.x, this.y, '#ffffff', 5, 50, 10, 3); Sound.play('jump');
    }
    if (this.buffer) this.tryStart(this.buffer.b, g);
  }

  // Pick the move a button press should start (or chain into).
  moveFor(b, chaining) {
    const mv = this.moves;
    if (b === 'su') {
      if (this.meter < BAR) return null;
      const g5 = this.form && mv.suG1;
      return this.meter >= MAX_METER ? (g5 ? mv.suG3 : mv.su3) : (g5 ? mv.suG1 : mv.su1);
    }
    if (b === 's1' || b === 's2') return this.cd[b] > 0 ? null : mv[b];
    const air = this.airborne;
    const cur = chaining && this.atk ? this.atk.data : null;
    if (cur && !cur.isNormal) return null;
    const r = cur ? cur.rank : -1;
    const first = (keys) => { for (const k of keys) if (mv[k].rank > r) return mv[k]; return null; };
    if (air) {
      if (b === 'l') return first(['A1', 'A2', 'A3', 'A4']);
      if (b === 'm') return first(['AM', 'A4']);
      return first(['A4']);
    }
    if (b === 'l') return first(['L1', 'L2', 'L3', 'L4']);
    if (b === 'm') return first(['M1', 'M2', 'L4']);
    return first(['H1', 'L4']);
  }
  tryStart(b, g) {
    const d = this.moveFor(b, false);
    if (!d) return false;
    this.buffer = null;
    this.startAttack(d, g);
    return true;
  }
  startAttack(d, g) {
    if (d.isSuper) {
      const lvl = d.lvl;
      this.meter -= lvl === 3 ? MAX_METER : BAR;
      if (lvl === 3 && this.ch.maxLook) this.maxLook = 200;
      g.superFlash(this, d.name, lvl);
    }
    if (d.isSpecial) {
      FX.ring(this.x, this.y - this.height * 0.55, ec(d.elem, 1), 10, 120, 14, 5);
      this.cd[d === this.moves.s1 ? 's1' : 's2'] = d.cd || 35;
      FX.label(this.x, this.y - this.height - 40, d.name.toUpperCase() + '!', ec(d.elem, 1), 30);
      this.meter = Math.min(MAX_METER, this.meter + 40);
    }
    if (!this.airborne) this.faceOpp();
    const wasAir = this.airborne, wasDash = this.state === 'dash';
    this.atk = { data: d, f: 0, hitsDone: 0, hitCD: 0, connected: false, activeEnd: d.startup + d.active, stopped: false, air: wasAir };
    this.state = 'attack'; this.t = 0;
    if (!wasAir && !d.isSuper) this.vx = wasDash ? this.vx * 0.5 : 0;
    if (d.gravity === false) { this.vy = 0; if (wasAir) this.vx *= 0.3; else this.vx = 0; }
    if (d.isNormal) Sound.play('whoosh');
    if (d.call) FX.label(this.x, this.y - this.height * 1.35 - 20, d.call.toUpperCase() + '!', '#ffffff', 24);
  }
  canCancel() {
    const a = this.atk, d = a.data;
    if (d.isSuper) return false;
    if (d.isSpecial) return a.connected && a.f > d.startup && this.buffer.b === 'su';
    return (a.connected && a.f > d.startup) || a.f > a.activeEnd;
  }
  updateAttack(g) {
    const a = this.atk, d = a.data;
    a.f++;
    if (a.hitCD > 0) a.hitCD--;
    if (d.invuln && a.f >= d.invuln[0] && a.f <= d.invuln[1]) this.invuln = Math.max(this.invuln, 1);
    this.hidden = !!(d.hidden && a.f >= d.hidden[0] && a.f <= d.hidden[1]);
    if (d.lunge && a.f > d.startup - 3 && a.f <= a.activeEnd && !this.airborne) this.vx = this.facing * d.lunge;
    else if (!this.airborne && !d.onFrame) this.vx *= 0.7;
    // combo magnet: normals glide toward an opponent who is already reeling, so mashing always connects
    const o = this.opp;
    if (d.isNormal && a.f <= a.activeEnd && (o.state === 'hit' || o.state === 'locked')) {
      const want = o.x - this.facing * (o.width / 2 + 45 * this.hs);
      const gap = (want - this.x) * this.facing;
      if (!this.airborne) { if (gap > 0) this.vx = this.facing * Math.min(9, gap * 0.35 + 2); }
      else {
        this.vx = clamp((want - this.x) * 0.3, -9, 9);
        const dy = (o.y - o.height * 0.1) - this.y;
        if (Math.abs(dy) > 20) this.vy = clamp(dy * 0.15, -8, 8);
      }
    }
    if (d.onFrame) d.onFrame(this, a.f, g, a);
    if (d.spawnAt === a.f && d.spawn) d.spawn(this, g, a);
    if (d.isNormal && a.f === d.startup + 1) strikeFX(this, g, d);
    if (d.isSuper && a.f > d.startup && a.f <= a.activeEnd) this.trail = Math.max(this.trail, 2);
    // chain / cancel
    if (this.buffer && this.canCancel()) {
      const nd = this.moveFor(this.buffer.b, true);
      if (nd && !(nd.isSpecial && d.isSpecial)) { this.buffer = null; this.startAttack(nd, g); return; }
    }
    if (a.f >= a.activeEnd + d.recovery) {
      this.atk = null; this.hidden = false;
      if (this.airborne) { this.setState('jump'); this.airJumps = 0; }
      else this.setState('idle');
    }
  }
  attackBox(visualOnly) {
    const a = this.atk;
    if (!a || !a.data.box || this.state !== 'attack') return null;
    if (a.f <= a.data.startup || (!visualOnly && a.f > a.activeEnd)) return null;
    if (!visualOnly && (a.hitsDone >= (a.data.hits || 1) || a.hitCD > 0)) return null;
    const b = a.data.box, s = this.hs;
    if (a.data.remote) {
      const dist = clamp((this.opp.x - this.x) * this.facing, 70, a.data.remote), cx = this.x + this.facing * dist, w = 120 * s;
      return { x: cx - w / 2, y: this.y + b.y * s - 20, w, h: b.h * s + 40 };
    }
    let w = b.w * (a.data.stretchRange ? 1 : s), top = this.y + b.y * s, bot = top + b.h * s;
    if (a.data.stretchRange) w *= Math.min(1, (a.f - a.data.startup) / 3);
    // sprite mode: the strike must reach where the art's fist/foot/blade is drawn
    if (a.data.isNormal && !a.data.stretchRange && Sprites.has(this.ch.id)) {
      const pose = a.data.spritePose || NORMAL_POSE[a.data.key];
      const fp = this.fistPoint({ pose, sx: 1, sy: 1, dx: 0, dy: 0 });
      if (fp) {
        const reach = (fp.x - this.x) * this.facing + fp.r * 1.3 + 14;
        w = reach - b.x * s;   // the art defines the reach (lunges/steps move the fighter instead)
        top = Math.min(top, fp.y - fp.r * 2.2); bot = Math.max(bot, fp.y + fp.r * 2.2);
      }
    }
    const x0 = this.x + this.facing * b.x * s;
    return { x: this.facing > 0 ? x0 : x0 - w, y: top, w, h: bot - top };
  }

  // ------------------------------------------------------------ physics
  physics(g) {
    if (this.state === 'locked') return;
    const hover = this.state === 'attack' && this.atk.data.gravity === false && this.atk.f < this.atk.activeEnd + this.atk.data.recovery * 0.5;
    if (this.airborne || this.vy < 0) {
      if (hover) this.vy = 0;
      else this.vy += this.state === 'hit' ? 0.85 : GRAV;
    }
    this.x += this.vx; this.y += this.vy;
    if (this.y >= GROUND_Y) {
      const fell = this.vy > 0;
      this.y = GROUND_Y;
      if (fell) this.land(g);
      if (this.vy > 0) this.vy = 0;
    }
    if (!this.airborne && ['hit', 'block', 'down', 'guard', 'ko', 'getup'].includes(this.state)) this.vx *= 0.84;
    if (!this.airborne && ['idle', 'crouch', 'land'].includes(this.state)) this.vx *= 0.6;
  }
  land(g) {
    switch (this.state) {
      case 'jump': case 'airRecover':
        this.setState('land'); this.landT = 4; this.vx = 0; Sound.play('land'); FX.dust(this.x, GROUND_Y, 3);
        break;
      case 'attack':
        if (this.atk && this.atk.data.isSuper && this.atk.f <= this.atk.activeEnd) break;
        this.atk = null; this.hidden = false; this.setState('land'); this.landT = 6; this.vx = 0; FX.dust(this.x, GROUND_Y, 3);
        break;
      case 'hit':
        if (this.groundBounce) {
          this.groundBounce = false; this.vy = -12; this.y = GROUND_Y - 1; this.hitstun = Math.max(this.hitstun, 30);
          FX.dust(this.x, GROUND_Y, 10); FX.ring(this.x, GROUND_Y, '#ffffff', 10, 120, 14, 6); g.shake(10); Sound.play('hitH');
          return;
        }
        if (this.knockOnLand || this.hp <= 0) {
          this.setState('down'); this.vx *= 0.4; this.invuln = 40;
          FX.dust(this.x, GROUND_Y, 8); g.shake(5); Sound.play('land');
          this.endCombo();
        }
        break;
    }
  }

  // ------------------------------------------------------------ rush-super cinematic
  startCine(target, lvl, elem) {
    this.cine = { t: 0, target, lvl, elem, n: lvl === 3 ? 14 : 9, i: 0, baseY: target.y };
    this.setState('cine'); this.atk = null;
    target.setState('locked'); target.vx = 0; target.vy = 0;
  }
  updateCine(g) {
    const c = this.cine, tg = c.target;
    c.t++;
    const lift = Math.min(1, c.t / 20) * 110;
    tg.y = Math.min(GROUND_Y, c.baseY) - lift * (c.baseY >= GROUND_Y - 1 ? 1 : 0.3);
    const m = c.lvl === 3 ? 1.75 : 1;
    if (c.i < c.n && c.t % 6 === 0) {
      c.i++;
      const a = c.i * 2.4;
      this.x = tg.x + Math.cos(a) * 95; this.y = Math.min(GROUND_Y, tg.y + Math.sin(a) * 60 + 40);
      this.facing = tg.x > this.x ? 1 : -1;
      this.ciSprite = choice(['attack', 'kick', 'upper', 'special']);
      this.ciPose = choice(['jab', 'kick', 'heavy', 'kickHigh', 'slash', 'jab2']);
      if (this.ch.style === 'sword') this.ciPose = choice(['slash', 'slash2', 'thrust', 'bigslash']);
      this.trail = 6;
      g.applyHit(this, tg, { dmg: Math.round(22 * m), hitstun: 999, kb: [0, 0], strength: 2, elem: c.elem, dir: this.facing, keepAir: true, isSuper: true, cine: true }, null);
    }
    if (c.t === c.n * 6 + 16) {
      this.x = tg.x - 80 * this.facing; this.y = Math.min(GROUND_Y, tg.y + 40);
      this.ciPose = this.ch.style === 'sword' ? 'bigslash' : 'heavy2'; this.ciSprite = 'super';
      tg.setState('hit');
      g.applyHit(this, tg, { dmg: Math.round(80 * m), hitstun: 50, kb: [18, -15], launch: -15, knockdown: true, strength: 4, elem: c.elem, dir: this.facing, isSuper: true, finisher: true }, null);
      g.slowmo = 40; g.zoomPunch(1.25);
    }
    if (c.t >= c.n * 6 + 40) {
      this.cine = null; this.ciPose = null;
      this.setState(this.airborne ? 'jump' : 'idle'); this.airJumps = 0;
      if (tg.state === 'locked') tg.setState('hit');
    }
    if (this.y < GROUND_Y) this.vy = 0;
  }

  // ------------------------------------------------------------ drawing
  stance() {
    const p = makePose({});
    if (this.ch.style === 'sword') Object.assign(p, { armF: 0.7, elbowF: 0.9, wpn: 0.7 });
    p.yOff = Math.sin(this.animT * 0.12) * 1.5;
    p.armF += Math.sin(this.animT * 0.12) * 0.05;
    return p;
  }
  getPose() {
    const st = this.stance(), t = this.t;
    if (this.cine && this.ciPose) { const P = POSES[this.ciPose]; return Object.assign(st, P.w, P.s, { spinT: 0 }); }
    switch (this.state) {
      case 'walk': {
        const ph = this.animT * 0.28 * Math.sign(this.vx * this.facing || 1);
        return Object.assign(st, { legF: 0.1 + Math.sin(ph) * 0.55, kneeF: -0.3 - Math.max(0, Math.cos(ph)) * 0.6, legB: 0.1 - Math.sin(ph) * 0.55, kneeB: -0.3 - Math.max(0, -Math.cos(ph)) * 0.6, lean: 0.12 });
      }
      case 'crouch': return Object.assign(st, STATIC_POSES.crouch);
      case 'guard': case 'block': return Object.assign(st, STATIC_POSES.block, this.input.held.down ? STATIC_POSES.crouch : {});
      case 'dash': return Object.assign(st, STATIC_POSES.dash, this.dashDir !== this.facing ? { lean: -0.4 } : {});
      case 'jump': return Object.assign(st, this.vy < 2 ? STATIC_POSES.jumpUp : STATIC_POSES.fall, this.airJumps === 0 && this.vy < 0 ? { spin: (this.t * 0.4) % TAU } : {});
      case 'land': return Object.assign(st, STATIC_POSES.crouch, { lean: 0.05 });
      case 'hit': case 'locked': {
        const p = Object.assign(st, STATIC_POSES.hurt);
        if (this.airborne && (this.knockOnLand || this.state === 'locked')) { p.plant = false; p.lean = -0.9; p.legF = 0.8; p.legB = 0.3; }
        if (this.t < 4) p.xOff = -this.facing * 4;
        return p;
      }
      case 'airRecover': return Object.assign(st, STATIC_POSES.jumpUp, { spin: -this.t * 0.5 });
      case 'down': case 'ko': return Object.assign(st, STATIC_POSES.lying);
      case 'getup': return lerpPose(Object.assign({}, st, STATIC_POSES.crouch), st, Math.min(1, t / 16));
      case 'win': return Object.assign(st, STATIC_POSES.win, { yOff: -Math.abs(Math.sin(this.animT * 0.15)) * 20 });
      case 'attack': return this.attackPose(st);
    }
    return st;
  }
  attackPose(st) {
    const a = this.atk, d = a.data, P = POSES[d.pose] || POSES.jab;
    const wind = Object.assign({}, st, P.w);
    const strike = Object.assign({}, st, P.w, P.s);
    let p;
    if (a.f <= d.startup) p = lerpPose(st, wind, a.f / Math.max(1, d.startup));
    else if (a.f <= a.activeEnd) {
      p = Object.assign({}, strike);
      if (P.s.spinT) p.spin = ((a.f - d.startup) / Math.max(1, a.activeEnd - d.startup)) * TAU;
    } else p = lerpPose(strike, st, Math.min(1, (a.f - a.activeEnd) / Math.max(1, d.recovery * 0.8)));
    if (d.stretchRange && a.f > d.startup) {
      const B = BUILDS[this.look.build || 'normal'];
      const full = d.stretchRange / ((B.ua + B.fa) * (this.look.scale || 1));
      const k = a.f <= a.activeEnd ? Math.min(1, (a.f - d.startup) / 3) : Math.max(0, 1 - (a.f - a.activeEnd) / 6);
      p.armFExt = 1 + (full - 1) * k;
    }
    if (d.isSuper && a.f <= d.startup) Object.assign(p, POSES.charge.s);
    if (this.airborne && d.isNormal) p.plant = false;
    return p;
  }
  draw(ctx) {
    this.drawCompanions(ctx);
    if (this.hidden) return;
    const aura = (this.state === 'attack' && this.atk.data.isSuper) || this.cine ? ec(this.ch.elem, 1) : this.maxLook > 0 ? '#ffffff' : null;
    if (Sprites.has(this.ch.id)) { this.drawSpriteMode(ctx, aura); return; }
    const pose = this.getPose();
    const look = this.look;
    for (const gh of this.ghosts) {
      ctx.globalAlpha = gh.life / 12 * 0.45;
      MONO = ec(this.ch.elem, 1);
      drawChar(ctx, look, gh.x, gh.y, gh.f, gh.pose, { t: this.animT });
    }
    MONO = null; ctx.globalAlpha = 1;
    if (this.flash > 0) MONO = '#ffffff';
    drawChar(ctx, look, this.x, this.y, this.facing, pose, { t: this.animT, vx: this.vx * this.facing, aura });
    MONO = null;
  }

  // ------------------------------------------------------------ sprite mode
  get spriteH() { return this.height * 1.3 * this.giantK; }
  get spriteId() { return this.form && Sprites.has(this.form) ? this.form : this.ch.id; }
  // Which sprite pose to show, plus procedural motion (squash, lean, spin, bob) to keep it lively.
  spriteFrame() {
    const t = this.t, at = this.animT;
    const fr = { pose: 'idle', rot: 0, sx: 1, sy: 1, dx: 0, dy: 0, center: false };
    const br = Math.sin(at * 0.12);
    if (this.cine) { fr.pose = this.ciSprite || 'attack'; fr.sx = 1.1; fr.sy = 0.94; return fr; }
    switch (this.state) {
      case 'idle': case 'land': case 'getup':
        fr.sy = 1 + br * 0.025; fr.sx = 1 - br * 0.015;
        if (this.state === 'land') { fr.sy = 0.88; fr.sx = 1.1; }
        break;
      case 'crouch': fr.pose = 'block'; fr.sy = 0.78; fr.sx = 1.1; break;
      case 'walk':
        fr.dy = -Math.abs(Math.sin(at * 0.25)) * 8;
        fr.rot = Math.sin(at * 0.25) * 0.05 + 0.05 * Math.sign(this.vx * this.facing);
        break;
      case 'dash': fr.rot = this.dashDir === this.facing ? 0.2 : -0.15; fr.sx = 1.08; break;
      case 'guard': case 'block':
        fr.pose = 'block';
        if (this.input.held.down) { fr.sy = 0.8; fr.sx = 1.08; }
        if (this.state === 'block' && this.t < 6) fr.dx = -rand(0, 5);
        break;
      case 'jump':
        fr.pose = 'jump'; fr.center = true;
        fr.rot = this.airJumps === 0 && this.vy < 0 ? (t * 0.35) % TAU : clamp(this.vy * 0.012, -0.2, 0.2);
        if (this.t < 5) { fr.sy = 1.15; fr.sx = 0.9; }
        break;
      case 'airRecover': fr.pose = 'jump'; fr.center = true; fr.rot = -t * 0.5; break;
      case 'hit': case 'locked':
        fr.pose = 'hurt'; fr.rot = -0.15;
        if (this.t < 8) { fr.dx = rand(-5, 5); fr.sx = 0.92; fr.sy = 1.06; }
        if (this.airborne && (this.knockOnLand || this.state === 'locked')) { fr.center = true; fr.rot = -0.4 - clamp(-this.vy, -10, 20) * 0.03; }
        break;
      case 'down': case 'ko': fr.pose = 'ko'; fr.center = true; if (this.t < 6) fr.dy = -Math.sin(this.t / 6 * Math.PI) * 10; break;
      case 'win': fr.pose = 'win'; fr.dy = -Math.abs(Math.sin(at * 0.15)) * 22; break;
      case 'attack': this.attackFrame(fr); break;
    }
    return fr;
  }
  attackFrame(fr) {
    const a = this.atk, d = a.data, f = a.f;
    let pose = 'attack', spin = false, slam = false;
    if (d.isNormal) {
      pose = { L1: 'attack', L2: 'attack', L3: 'kick', L4: 'upper', M1: 'attack', M2: 'kick', H1: 'attack', A1: 'attack', A2: 'kick', A3: 'kick', AM: 'kick', A4: 'attack' }[d.key];
      spin = d.key === 'A3' || d.key === 'M2';
      slam = d.key === 'A4';
    } else if (d.isSuper) {
      pose = f <= d.startup ? 'super' : { beam: 'special', bigproj: 'special', rush: this.ch.style === 'kick' ? 'kick' : 'attack' }[d.tpl] || 'super';
    } else {
      pose = { rush: this.ch.style === 'kick' ? 'kick' : 'attack', upper: 'upper', teleport: 'kick', stretch: 'attack' }[d.tpl] || 'special';
    }
    if (d.spritePose && (f > d.startup || !d.isSuper)) pose = typeof d.spritePose === 'function' ? d.spritePose(this, f) : d.spritePose;
    if (f <= d.startup && !d.isSuper && (d.isNormal || !d.spritePose)) {
      // anticipation: coil back before the strike
      const k = f / Math.max(1, d.startup);
      fr.pose = d.isNormal || ['proj', 'beam', 'wave', 'pillar', 'stretch'].includes(d.tpl) ? 'idle' : pose; fr.sx = 1 - 0.08 * k; fr.sy = 1 + 0.06 * k; fr.rot = -0.1 * k; fr.dx = -8 * k;
      // sword raised overhead during the wind-up, so the strike visibly swings down
      if (Sprites.exact(this.spriteId, 'windup') && (d.isNormal ? ['attack', 'special'].includes(pose) : ['special', 'attack'].includes(pose))) { fr.pose = 'windup'; fr.rot = -0.05 * k; }
      return;
    }
    fr.pose = pose;
    const k = f - d.startup;
    if (k >= 0 && k < 4) { fr.sx = 1.18 - k * 0.04; fr.sy = 0.88 + k * 0.03; fr.dx = 12 - k * 2; }
    if (spin && f <= a.activeEnd) fr.rot = ((f - d.startup) / Math.max(1, a.activeEnd - d.startup)) * TAU;
    if (slam) fr.rot = 0.5;
    if (d.jitter && f > d.startup && f <= a.activeEnd) { fr.dx = rand(-6, 6); fr.dy = rand(-3, 3); }
    if (d.spinSprite && f > d.startup && f <= a.activeEnd) { fr.rot = (f * d.spinSprite) % TAU; fr.center = true; }
    if (d.tilt && f > d.startup && f <= a.activeEnd) fr.rot = d.tilt;
    fr.center = this.airborne;
    if (d.isNormal && f > a.activeEnd + d.recovery * 0.6) fr.pose = 'idle';
    if (d.isSuper && f <= d.startup) fr.sx = 1 + Math.sin(f) * 0.03;
  }
  drawSpriteFrame(ctx, x, y, facing, fr, filter) {
    const s = Sprites.get(this.spriteId, fr.pose);
    if (s) drawSprite(ctx, s, x, y, facing, fr, this.spriteH, filter);
  }
  // where the fist of the current attack sprite is, in world space (for Luffy's stretching arm)
  fistPoint(fr) {
    let s = Sprites.get(this.spriteId, fr.pose);
    if (s && !s.m.fist) s = Sprites.get(this.spriteId, 'attack');
    if (!s || !s.m.fist) return null;
    const k = this.spriteH / s.idle.srcH, dh = s.m.srcH * k, dw = dh * s.img.width / s.img.height;
    const [fx, fy, fr2] = s.m.fist;
    return {
      x: this.x + ((fr.dx || 0) + (fx - s.m.ax) * dw * (fr.sx || 1)) * this.facing,
      y: this.y + (fr.dy || 0) - (1 - fy) * dh * (fr.sy || 1),
      r: fr2 * dw, s, dw,
    };
  }
  drawSpriteMode(ctx, aura) {
    for (const gh of this.ghosts) {
      ctx.globalAlpha = gh.life / 12 * 0.4;
      this.drawSpriteFrame(ctx, gh.x, gh.y, gh.f, gh.fr, 'brightness(1.6) saturate(2)');
    }
    ctx.globalAlpha = 1;
    if (aura || this.form) {
      const col = this.form ? 'rgba(255,255,255,0.9)' : aura;
      const cy = this.y - this.spriteH * 0.45, r = this.spriteH * 0.75;
      const g = ctx.createRadialGradient(this.x, cy, 10, this.x, cy, r);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = (this.form && !aura ? 0.35 : 0.55) + Math.sin(this.animT * 0.3) * 0.15;
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, cy, r, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const fr = this.drawnFrame();
    // Zoro's Asura ghosts
    if (this.clones > 0 && FXImg.get('asura')) {
      const pulse = 1 + Math.sin(this.animT * 0.25) * 0.03;
      drawArt(ctx, 'asura', this.x, this.y + 10, this.spriteH * 2.3 * pulse, { ay: 1, alpha: 0.8, flip: this.facing < 0 });
    } else if (this.clones > 0) {
      ctx.globalAlpha = 0.55;
      for (const dx of [-80, 80]) this.drawSpriteFrame(ctx, this.x + dx * this.hs, this.y - 6, this.facing, fr, 'brightness(0.35) sepia(1) hue-rotate(-50deg) saturate(5)');
      ctx.globalAlpha = 1;
    }
    let filter = this.flash > 0 ? 'brightness(2.5)' : null;
    if (this.stoned > 0) filter = 'grayscale(1) brightness(0.85) contrast(1.3)';
    if (this.giantK > 1.05 && !Sprites.has(this.form)) filter = (filter ? filter + ' ' : '') + 'brightness(0.85) saturate(1.3)';
    this.drawSpriteFrame(ctx, this.x, this.y, this.facing, fr, filter);
    if (this.iced > 0) this.drawIce(ctx);
    // Bajrang Gun charge: the punching fist itself swells into the giant white fist
    if (this.chargeFist) {
      const fp = this.fistPoint(fr), cf = this.chargeFist;
      if (fp) {
        const h = lerp(fp.r * 2.4, cf.endH, cf.k * cf.k), x = fp.x + this.facing * h * 0.32;
        limb(ctx, fp.x - this.facing * fp.r, fp.y, x, fp.y, fp.r * (1 + cf.k * 2.2), '#fafafa');
        drawArt(ctx, 'bajrangfist', x, fp.y, h, { flip: this.facing < 0, rot: Math.sin(this.animT * 0.9) * 0.04 * cf.k });
        cf.x = x; cf.y = fp.y;
      }
    }
    // Luffy-style stretching arm: grows out of the sprite's own fist
    const a = this.atk;
    if (this.state === 'attack' && a.data.stretchRange && a.f > a.data.startup) {
      const box = this.attackBox(true);
      const fp = this.fistPoint(fr);
      if (box && fp) {
        const k = a.f <= a.activeEnd ? 1 : Math.max(0, 1 - (a.f - a.activeEnd) / 6);
        const far = this.facing > 0 ? box.x + box.w : box.x;
        const reach = Math.max(0, (far - fp.x) * this.facing - fp.r) * k;
        if (reach > 4) {
          const skin = this.ch.look.skin;
          // Gatling: a blur of arms at different heights/lengths; Bazooka: two arms side by side
          const spread = this.height * 0.2, arms = a.data.arms === 'gatling' ? [0, 1, 2, 3, 4, 5].map(i => ({ dy: (i / 5 - 0.5) * 2 * spread + Math.sin(this.animT * 1.9 + i * 2.1) * spread * 0.25, len: reach * (0.5 + 0.5 * ((Math.sin(this.animT * 2.6 + i * 1.7) + 1) / 2)), big: 1.5 }))
            : a.data.arms === 'double' ? [{ dy: -fp.r * 0.9, len: reach }, { dy: fp.r * 0.9, len: reach }] : [{ dy: 0, len: reach }];
          for (const arm of arms) {
          const x1 = fp.x + this.facing * arm.len, ay = fp.y + arm.dy;
          if (a.data.arms === 'gatling') ctx.globalAlpha = 0.85;
          limb(ctx, fp.x, fp.y + arm.dy * 0.3, x1, ay, fp.r * 1.1, skin);
          // copy of the sprite's own fist at the end of the arm
          const { img, m } = fp.s, iw = img.width, ih = img.height, side = m.fist[2] * iw * 2.6, sd = side * fp.dw / iw * (arm.big || 1);
          ctx.save(); ctx.translate(x1, ay); ctx.scale(this.facing, 1);
          ctx.drawImage(img, m.fist[0] * iw - side / 2, m.fist[1] * ih - side / 2, side, side, -sd / 2, -sd / 2, sd, sd);
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
          for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x1 - this.facing * (sd * 0.6 + 10), ay + i * sd * 0.3); ctx.lineTo(x1 - this.facing * (sd * 0.6 + 60), ay + i * sd * 0.3); ctx.stroke(); }
          ctx.globalAlpha = 1;
          }
        }
      }
    }
  }
  drawIce(ctx) {
    const h = this.spriteH * 1.05, w = this.width * 1.9 * this.giantK;
    ctx.fillStyle = 'rgba(179,229,252,0.55)'; ctx.strokeStyle = '#e1f5fe'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.rect(this.x - w / 2, this.y - h, w, h); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(this.x - w * 0.3, this.y - h * 0.9); ctx.lineTo(this.x - w * 0.1, this.y - h * 0.6); ctx.stroke();
  }
  // Frozen in ice (Aokiji) or turned to stone (Hancock): stuck, then shatter for extra damage
  applyStatus(kind, by, m) {
    this.statusBy = by; this.statusM = m || 1;
    if (kind === 'freeze') this.iced = 50; else this.stoned = 55;
    this.vx = 0; this.state = 'hit'; this.hitstun = 999;
  }
  updateStatus(g) {
    this.vx = 0; this.vy = 0;
    const left = this.iced > 0 ? --this.iced : --this.stoned;
    if (left > 0) return;
    const kind = this.statusBy ? (this.statusBy.ch.su.finalFx) : 'freeze';
    FX.shards(this.x, this.y - this.height / 2, kind === 'stone' ? 'sand' : 'ice', 30, 14);
    Sound.play(kind === 'stone' ? 'quake' : 'ice'); g.shake(14);
    this.hitstun = 1;
    if (this.statusBy) g.applyHit(this.statusBy, this, { dmg: Math.round(90 * this.statusM), noScale: true, hitstun: 44, kb: [10, -14], launch: -14, knockdown: true, strength: 4, elem: kind === 'stone' ? 'sand' : 'ice', isSuper: true, dir: this.statusBy.facing }, null);
  }

  // ------------------------------------------------------------ companions (Big Mom's Prometheus & Zeus)
  updateCompanions() {
    const list = this.ch.companions;
    if (!list) return;
    this.comp = this.comp || {};
    const a = this.state === 'attack' ? this.atk : null, d = a && a.data, hs = this.hs, H = this.height;
    for (const name of list) {
      const c = this.comp[name] || (this.comp[name] = { x: this.x, y: this.y - H, t: Math.random() * 10 });
      c.t += 0.08;
      if (c.awayT > 0) c.awayT--;
      let tx, ty;
      if (name === 'prometheus') { tx = this.x - this.facing * 95 * hs; ty = this.y - H * 0.8; }
      else { tx = this.x - this.facing * 25 * hs; ty = this.y - H * 1.45; }
      if (d && d.from === name || (d && d.isSuper && name === 'prometheus')) {
        if (name === 'zeus' && d.tpl === 'pillar') { tx = this.opp.x; ty = Math.min(this.y, this.opp.y) - H * 1.5; }
        else { tx = this.x + this.facing * 90 * hs; ty = this.y - H * 0.75; }
      }
      c.x += (tx - c.x) * 0.16; c.y += (ty + Math.sin(c.t) * 8 - c.y) * 0.16;
    }
  }
  drawCompanions(ctx) {
    if (!this.comp) return;
    const sz = 62 * this.hs;
    for (const name in this.comp) {
      const c = this.comp[name], s = Sprites.exact(this.ch.id, name);
      if (c.awayT > 0) continue;
      if (s) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.scale(this.facing, 1);
        const h = sz * 2, w = h * s.width / s.height;
        ctx.drawImage(s, -w / 2, -h / 2, w, h); ctx.restore();
      } else if (name === 'prometheus') {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, sz * 1.3);
        g.addColorStop(0, '#fff59d'); g.addColorStop(0.5, '#ff9800'); g.addColorStop(1, 'rgba(255,61,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, sz * 1.3, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        circ(ctx, c.x - 12, c.y - 6, 5, '#1a1a1a', false); circ(ctx, c.x + 12, c.y - 6, 5, '#1a1a1a', false);
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x, c.y + 4, 14, 0.2, Math.PI - 0.2); ctx.stroke();
      } else {
        for (const [dx, dy, r] of [[-26, 6, 26], [0, -10, 32], [28, 4, 26], [0, 14, 24]]) circ(ctx, c.x + dx, c.y + dy, r * this.hs * 0.8, '#607d8b', false);
        circ(ctx, c.x - 10, c.y, 4, '#fff', false); circ(ctx, c.x + 10, c.y, 4, '#fff', false);
        if (Math.random() < 0.3) drawBolt(ctx, c.x, c.y + 20, c.x + rand(-30, 30), c.y + 60, '#fff176', 2);
      }
    }
  }
}
