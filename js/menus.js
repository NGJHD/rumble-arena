'use strict';
// Title, difficulty, character select, stage select, results, controls and options screens.

function menuBg(ctx, t, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1 || '#0d1b3e'); g.addColorStop(1, c2 || '#3a0d4e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.002);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.0)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1000, i * TAU / 16, (i + 1) * TAU / 16); ctx.fill();
  }
  ctx.restore();
}
function drawMenuList(ctx, items, sel, x, y, gap, size) {
  items.forEach((it, i) => {
    const s = i === sel;
    drawText(ctx, it, x, y + i * gap, size, s ? '#ffffff' : '#90a4ae', s ? '#d50000' : '#1a1a1a', 'center', 8);
  });
}
function navList(sel, n) {
  if (Menu.up()) { Sound.play('select'); return (sel + n - 1) % n; }
  if (Menu.down()) { Sound.play('select'); return (sel + 1) % n; }
  return sel;
}

// ---------------------------------------------------------------- title
// remembered cursor positions, so backing out of a sub menu lands where you came from
const MenuMem = { title: 0, options: 0 };
const TITLE_BG = new Image(); TITLE_BG.src = 'sprites/ui/title_bg.jpg';

class TitleScene {
  constructor() {
    this.t = 0; this.sel = MenuMem.title; this.started = !!Game.titleSeen; Game.titleSeen = true;
    this.items = ['ARCADE', 'VERSUS', 'TRAINING', 'OPTIONS'];
    Sound.playMusic('menu');
  }
  update() {
    this.t++;
    if (!this.started) { if (Input.anyPressedFlag) { this.started = true; Sound.play('confirm'); } return; }
    this.sel = navList(this.sel, this.items.length);
    if (Menu.ok()) {
      Sound.play('confirm');
      MenuMem.title = this.sel;
      const it = this.items[this.sel];
      if (it === 'ARCADE') { Announcer.play('arcade_mode'); Game.goto(new DifficultyScene()); }
      if (it === 'VERSUS') { Announcer.play('battle_mode'); Game.goto(new SelectScene('vs')); }
      if (it === 'TRAINING') Game.goto(new SelectScene('training'));
      if (it === 'OPTIONS') Game.goto(new OptionsScene());
    }
  }
  draw(ctx) {
    if (TITLE_BG.complete && TITLE_BG.naturalWidth) ctx.drawImage(TITLE_BG, 0, 0, W, H);
    else menuBg(ctx, this.t, '#0b3d91', '#d32f2f');
    // title and menu sit in the open gap between the two crews
    ctx.save(); ctx.translate(W / 2, 128); ctx.rotate(-0.04);
    drawText(ctx, 'RUMBLE', 0, -42, 112, '#ffeb3b', '#1a1a1a', 'center', 16);
    drawText(ctx, 'ARENA', 0, 52, 100, '#ff5252', '#ffffff', 'center', 14);
    ctx.restore();
    drawText(ctx, 'GRAND LINE ALL-STARS', W / 2, 232, 26, '#ffffff', '#1a1a1a', 'center', 6);
    if (!this.started) {
      if (this.t % 60 < 40) drawText(ctx, 'PRESS ANY BUTTON!', W / 2, 440, 46, '#ffffff', '#1a1a1a', 'center', 9);
    } else drawMenuList(ctx, this.items, this.sel, W / 2, 330, 78, 50);
    drawText(ctx, 'F = Fullscreen', W - 20, H - 20, 18, '#ffffff', '#1a1a1a', 'right', 4);
  }
}

class DifficultyScene {
  constructor() { this.t = 0; this.sel = Settings.data.difficulty; }
  update() {
    this.t++;
    this.sel = navList(this.sel, 3);
    if (Menu.back()) { Sound.play('back'); Game.goto(new TitleScene()); return; }
    if (Menu.ok()) { Sound.play('confirm'); Settings.data.difficulty = this.sel; Settings.save(); Game.goto(new SelectScene('arcade', this.sel)); }
  }
  draw(ctx) {
    menuBg(ctx, this.t);
    drawText(ctx, 'ARCADE: HOW TOUGH?', W / 2, 140, 60, '#ffeb3b', '#1a1a1a', 'center', 10);
    drawMenuList(ctx, ['EASY  ★', 'NORMAL  ★★', 'HARD  ★★★'], this.sel, W / 2, 320, 100, 64);
    drawText(ctx, ['Great for learning!', 'A fair fight.', 'For pirate kings only!'][this.sel], W / 2, 640, 30, '#ffffff', '#1a1a1a', 'center', 5);
  }
}

// ---------------------------------------------------------------- character select
const SEL_COLS = 9, SLOT_W = 118, SLOT_H = 92, SLOT_GAP = 6;
const SEL_X0 = (W - (SEL_COLS * (SLOT_W + SLOT_GAP) - SLOT_GAP)) / 2, SEL_Y0 = 420;
class SelectScene {
  constructor(mode, level) {
    this.mode = mode; this.level = level || 0; this.t = 0;
    this.n = ROSTER.length + 1; // last = random
    this.cur = [0, 1]; this.locked = [false, false]; this.pick = [null, null];
    this.solo = mode !== 'vs';
    Announcer.play('choose', mode === 'vs' ? 1.1 : 0.2);
    this.arcade = mode === 'arcade';   // arcade: only you pick; opponents and stages come from the ladder
    Sound.playMusic('menu');
  }
  slotPos(i) { return { x: SEL_X0 + (i % SEL_COLS) * (SLOT_W + SLOT_GAP), y: SEL_Y0 + Math.floor(i / SEL_COLS) * (SLOT_H + SLOT_GAP) }; }
  // slot index locked by the other player (null if none) - those slots are skipped
  takenSlot(p) { const q = 1 - p; return this.locked[q] && this.pick[q] ? ROSTER.indexOf(this.pick[q]) : null; }
  step(c, dir) {
    const rows = Math.ceil(this.n / SEL_COLS), col = c % SEL_COLS, row = Math.floor(c / SEL_COLS);
    if (dir === 'left') c = row * SEL_COLS + (col + SEL_COLS - 1) % SEL_COLS;
    if (dir === 'right') c = row * SEL_COLS + (col + 1) % SEL_COLS;
    if (dir === 'up') c -= SEL_COLS;
    if (dir === 'down') c += SEL_COLS;
    if (c < 0) c += rows * SEL_COLS;
    if (c >= rows * SEL_COLS) c -= rows * SEL_COLS;
    if (c >= this.n) c = dir === 'right' ? row * SEL_COLS : this.n - 1;
    return c;
  }
  move(p, inp) {
    const dir = ['left', 'right', 'up', 'down'].find(k => inp.pressed[k]);
    if (!dir) return;
    const taken = this.takenSlot(p);
    let c = this.step(this.cur[p], dir);
    if (c === taken) c = this.step(c, dir);                         // jump over the taken fighter
    if (c === taken) c = this.step(c, dir === 'up' || dir === 'down' ? 'right' : dir);
    if (c !== this.cur[p]) { this.cur[p] = c; Sound.play('select'); }
  }
  // after someone locks a fighter, move the other cursor off it
  freeCursor(p) {
    const taken = this.takenSlot(p);
    if (this.solo && p === 1) this.cur[1] = this.step(taken, 'right');   // opponent cursor starts beside your pick
    else if (this.cur[p] === taken) this.cur[p] = this.step(taken, 'right');
  }
  charAt(i) { return i >= ROSTER.length ? null : ROSTER[i]; }
  update() {
    this.t++;
    if (this.arcade && this.locked[0]) { Game.goto(new ArcadeLadderScene(Arcade.start(this.pick[0], this.level))); return; }
    const active = this.solo ? [this.locked[0] ? 1 : 0] : [0, 1];
    for (const p of active) {
      const inp = this.solo ? AnyIn : (p === 0 ? P1In : P2In);
      const esc = Input.sys('Escape') || Input.sys('Backspace');
      const back = Menu.back(inp) || ((p === 0 || this.solo) && esc);
      if (!this.locked[p]) {
        this.move(p, inp);
        if (Menu.ok(inp)) {
          // a fighter locked by the other player can't be picked again
          const other = this.locked[1 - p] ? this.pick[1 - p] : null;
          const want = this.charAt(this.cur[p]) || choice(ROSTER.filter(c => c !== other));
          if (want === other) { Sound.play('back'); this.taken = { p, t: 40 }; }
          else {
            this.locked[p] = true;
            this.pick[p] = want;
            this.freeCursor(1 - p);
            Sound.play('confirm');
            Announcer.play('ready');
          }
        } else if (back) {
          if (this.solo && p === 1) { this.locked[0] = false; Sound.play('back'); }
          else if (p === 0) { Sound.play('back'); Game.goto(this.mode === 'cpu' || this.arcade ? new DifficultyScene() : new TitleScene()); return; }
        }
      } else if (back) { this.locked[p] = false; Sound.play('back'); }
    }
    if (this.locked[0] && this.locked[1]) {
      Game.goto(new StageScene({ p1: this.pick[0], p2: this.pick[1], mode: this.mode, level: this.level }));
    }
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#1a0d3e', '#0d3e3a');
    drawText(ctx, 'CHOOSE YOUR FIGHTER!', W / 2, 40, 50, '#ffeb3b', '#1a1a1a', 'center', 9);
    // previews
    for (const p of this.arcade ? [0] : [0, 1]) {
      const ch = this.locked[p] ? this.pick[p] : this.charAt(this.cur[p]);
      const x = p === 0 ? 240 : W - 240;
      const label = p === 0 ? (this.solo ? 'YOU' : 'P1') : (this.mode === 'cpu' ? 'CPU' : this.mode === 'training' ? 'DUMMY' : 'P2');
      const col = p === 0 ? '#ff5252' : '#40c4ff';
      ctx.fillStyle = col + '33'; ctx.beginPath(); ctx.ellipse(x, 333, 150, 24, 0, 0, TAU); ctx.fill();
      if (ch) {
        // preview height grows a little for giants but always fits under the title
        const sc = ch.look.scale || 1, wantH = Math.min(280, 215 + (sc - 1) * 90);
        drawCharArt(ctx, ch, x, 335, p === 0 ? 1 : -1, this.locked[p] ? 'win' : 'idle', wantH / (154 * sc * 1.3), this.t);
        drawText(ctx, ch.full.toUpperCase(), x, 370, 30, '#ffffff', '#1a1a1a', 'center', 6);
      } else drawText(ctx, '?', x, 260, 160, '#ffffff', '#1a1a1a', 'center', 12);
      drawText(ctx, label + (this.locked[p] ? ' READY!' : ''), p === 0 ? x - 135 : x + 135, 120, 30, col, '#1a1a1a', 'center', 6);
    }
    if (this.arcade) {
      drawText(ctx, 'ARCADE', W / 2 + 180, 190, 90, '#ffeb3b', '#1a1a1a', 'center', 12);
      drawText(ctx, '8 battles. The last one waits at the top of the world...', W / 2 + 180, 280, 26, '#ffffff', '#1a1a1a', 'center', 5);
    } else drawText(ctx, 'VS', W / 2, 240, 110, '#ffffff', '#d50000', 'center', 12);
    if (this.solo && !this.arcade) drawText(ctx, this.locked[0] ? 'Now pick your opponent!' : 'Pick your fighter!', W / 2, 340, 28, '#ffffff', '#1a1a1a', 'center', 5);
    // grid
    for (let i = 0; i < this.n; i++) {
      const { x, y } = this.slotPos(i), ch = this.charAt(i);
      const col = ch ? GROUPS[ch.group].color : '#424242';
      const g = ctx.createLinearGradient(0, y, 0, y + SLOT_H);
      g.addColorStop(0, shade(col, 0.25)); g.addColorStop(1, shade(col, -0.4));
      ctx.fillStyle = g; ctx.fillRect(x, y, SLOT_W, SLOT_H);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, SLOT_W, SLOT_H); ctx.clip();
      if (ch) drawPortrait(ctx, ch, x + SLOT_W / 2, y + SLOT_H / 2 + 6, 30, 'normal', this.t);
      else drawText(ctx, '?', x + SLOT_W / 2, y + SLOT_H / 2, 64, '#ffeb3b', '#1a1a1a', 'center', 8);
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y + SLOT_H - 20, SLOT_W, 20);
      drawText(ctx, ch ? ch.name : 'RANDOM', x + SLOT_W / 2, y + SLOT_H - 10, 16, '#ffffff', null);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3; ctx.strokeRect(x, y, SLOT_W, SLOT_H);
      const takenBy = [0, 1].find(q => this.locked[q] && this.pick[q] === ch && ch);
      if (takenBy != null) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, SLOT_W, SLOT_H - 20);
        drawText(ctx, (takenBy === 0 ? '1P' : this.mode === 'vs' ? '2P' : 'CPU'), x + SLOT_W / 2, y + SLOT_H / 2 - 8, 26, takenBy === 0 ? '#ff5252' : '#40c4ff', '#1a1a1a', 'center', 5);
      }
    }
    for (const p of [0, 1]) {
      if (this.solo && p === 1 && !this.locked[0]) continue;
      const { x, y } = this.slotPos(this.cur[p]);
      const col = p === 0 ? '#ff1744' : '#2979ff';
      const pulse = this.locked[p] ? 0 : Math.sin(this.t * 0.25) * 3;
      ctx.strokeStyle = col; ctx.lineWidth = 6;
      ctx.strokeRect(x - 3 - pulse + p * 4, y - 3 - pulse + p * 4, SLOT_W + 6 + pulse * 2 - p * 8, SLOT_H + 6 + pulse * 2 - p * 8);
      drawText(ctx, p === 0 ? '1P' : (this.mode === 'vs' ? '2P' : 'CPU'), x + (p === 0 ? 18 : SLOT_W - 22), y + 12, 20, '#ffffff', col, 'center', 5);
    }
    // group legend
    GROUPS.forEach((g, i) => { ctx.fillStyle = g.color; ctx.fillRect(40 + i * 170, 395, 18, 18); drawText(ctx, g.name, 64 + i * 170, 405, 18, '#fff', '#1a1a1a', 'left', 3); });
    drawText(ctx, 'Attack button = pick · Esc / Super = back', W - 30, 405, 18, '#cfd8dc', '#1a1a1a', 'right', 3);
    if (this.taken && this.taken.t-- > 0) drawText(ctx, 'ALREADY TAKEN!', this.taken.p === 0 ? 240 : W - 240, 220, 46, '#ff5252', '#ffffff', 'center', 8);
  }
}

// ---------------------------------------------------------------- stage select
class StageScene {
  constructor(opts) { this.opts = opts; this.t = 0; this.sel = STAGES.length; }
  update() {
    this.t++;
    const n = STAGES.length + 1;
    if (Menu.left() || Menu.up()) { this.sel = (this.sel + n - 1) % n; Sound.play('select'); }
    if (Menu.right() || Menu.down()) { this.sel = (this.sel + 1) % n; Sound.play('select'); }
    if (Menu.back()) { Sound.play('back'); Game.goto(new SelectScene(this.opts.mode, this.opts.level)); return; }
    if (Menu.ok()) {
      Sound.play('confirm');
      const stage = this.sel >= STAGES.length ? choice(STAGES) : STAGES[this.sel];
      Game.goto(new FightScene(Object.assign({ stage }, this.opts)));
    }
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#3e2a0d', '#0d2a3e');
    drawText(ctx, 'CHOOSE THE BATTLEFIELD!', W / 2, 60, 54, '#ffeb3b', '#1a1a1a', 'center', 9);
    const st = STAGES[this.sel] || STAGES[Math.floor(this.t / 40) % STAGES.length];
    ctx.save(); ctx.translate(W / 2 - 400, 120); ctx.scale(800 / W, 450 / H);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    st.draw(ctx, (STAGE_W - W) / 2 + Math.sin(this.t * 0.01) * 300, this.t);
    ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.strokeRect(W / 2 - 400, 120, 800, 450);
    const name = this.sel >= STAGES.length ? 'RANDOM STAGE' : st.name;
    drawText(ctx, '◀  ' + name + '  ▶', W / 2, 620, 50, '#ffffff', '#1a1a1a', 'center', 8);
    drawText(ctx, this.opts.p1.name + '  VS  ' + this.opts.p2.name, W / 2, 680, 30, '#ffeb3b', '#1a1a1a', 'center', 5);
  }
}

// ---------------------------------------------------------------- results
class ResultsScene {
  constructor(fight, champ) {
    this.fight = fight; this.champ = champ; this.loser = champ.opp; this.t = 0; this.sel = 0;
    this.items = ['REMATCH', 'CHARACTER SELECT', 'MAIN MENU'];
    Sound.playMusic('results');
    const who = champ === fight.f1 ? (fight.mode === 'cpu' ? 'You win!' : 'Player 1 wins!') : (fight.mode === 'cpu' ? 'The computer wins!' : 'Player 2 wins!');
  }
  update() {
    this.t++;
    if (this.t < 40) return;
    this.sel = navList(this.sel, this.items.length);
    if (Menu.ok()) {
      Sound.play('confirm');
      const o = this.fight.opts, it = this.items[this.sel];
      if (it === 'REMATCH') Game.goto(new FightScene(o));
      if (it === 'CHARACTER SELECT') Game.goto(new SelectScene(o.mode, o.level));
      if (it === 'MAIN MENU') Game.goto(new TitleScene());
    }
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#5d4037', '#ffb300');
    const c = this.champ.ch, l = this.loser.ch;
    ctx.save(); ctx.globalAlpha = 0.35;
    drawCharArt(ctx, l, W - 220, 640, -1, 'ko', 1.2 / Math.max(1, l.look.scale || 1), this.t);
    ctx.restore();
    const k = Math.min(1, this.t / 20);
    drawCharArt(ctx, c, lerp(-200, 330, easeOutBack(k)), 640, 1, 'win', 2.2 / Math.max(1, (c.look.scale || 1) * 0.8), this.t, '#fff59d');
    if (this.t % 6 === 0) FX.burst(rand(0, W), -10, choice(['fire', 'light', 'love', 'ice']), 2, 2, 6, 80, 0.1);
    FX.update(); FX.draw(ctx);
    const who = this.champ === this.fight.f1 ? (this.fight.mode === 'cpu' ? 'YOU WIN!' : 'PLAYER 1 WINS!') : (this.fight.mode === 'cpu' ? 'CPU WINS!' : 'PLAYER 2 WINS!');
    ctx.save(); ctx.translate(840, 110); ctx.rotate(-0.05); ctx.scale(k, k);
    drawText(ctx, who, 0, 0, 80, '#ffeb3b', '#1a1a1a', 'center', 12);
    ctx.restore();
    drawText(ctx, c.full.toUpperCase(), 840, 200, 44, '#ffffff', '#1a1a1a', 'center', 7);
    // speech bubble
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(560, 240, 600, 90, 20) : ctx.rect(560, 240, 600, 90); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(580, 300); ctx.lineTo(500, 340); ctx.lineTo(610, 320); ctx.fill();
    drawText(ctx, '"' + c.quote + '"', 860, 285, c.quote.length > 36 ? 22 : 28, '#1a1a1a', null);
    if (this.t >= 40) drawMenuList(ctx, this.items, this.sel, 860, 440, 70, 40);
  }
}

// ---------------------------------------------------------------- controls
class ControlsScene {
  constructor() { this.t = 0; this.sel = 0; this.remap = null; }
  items() {
    const padName = i => i < 0 ? 'NONE' : 'CONTROLLER ' + (i + 1) + (Input.pad(i) ? ' ✔' : ' (not plugged in)');
    return ['P1 USES: ' + padName(Settings.data.padP1), 'P2 USES: ' + padName(Settings.data.padP2), 'SET UP P1 CONTROLLER BUTTONS', 'SET UP P2 CONTROLLER BUTTONS', 'BACK'];
  }
  update() {
    this.t++;
    if (this.remap) { this.updateRemap(); return; }
    const items = this.items();
    this.sel = navList(this.sel, items.length);
    const cycle = (key, d) => { let v = Settings.data[key] + d; if (v < -1) v = 3; if (v > 3) v = -1; Settings.data[key] = v; Settings.save(); Sound.play('select'); };
    if (this.sel <= 1 && (Menu.left() || Menu.right())) cycle(this.sel ? 'padP2' : 'padP1', Menu.left() ? -1 : 1);
    if (Menu.back()) { Sound.play('back'); Game.goto(new OptionsScene()); return; }
    if (Input.sys('Enter') || Input.sys('Space') || (Menu.ok() && this.sel >= 2)) {
      if (this.sel === 4) { Sound.play('back'); Game.goto(new OptionsScene()); return; }
      if (this.sel <= 1) { cycle(this.sel ? 'padP2' : 'padP1', 1); return; }
      const padIdx = this.sel === 2 ? Settings.data.padP1 : Settings.data.padP2;
      const pad = Input.pad(padIdx);
      if (!pad) { this.msg = { text: 'Plug in the controller and press a button on it first!', t: 150 }; Sound.play('back'); return; }
      this.remap = { padIdx, step: 0, map: {}, prev: pad.buttons.map(b => b.pressed), wait: 15 };
      Sound.play('confirm');
    }
  }
  updateRemap() {
    const r = this.remap;
    if (Input.sys('Escape')) { this.remap = null; Sound.play('back'); return; }
    const pad = Input.pad(r.padIdx);
    if (!pad) { this.remap = null; return; }
    const now = pad.buttons.map(b => b.pressed || b.value > 0.5);
    if (r.wait > 0) { r.wait--; r.prev = now; return; }
    for (let i = 0; i < now.length; i++) {
      if (now[i] && !r.prev[i] && !(i >= 12 && i <= 15 && pad.mapping === 'standard')) {
        r.map[BUTTON_ACTIONS[r.step]] = i; r.step++; Sound.play('select');
        if (r.step >= BUTTON_ACTIONS.length) {
          Settings.data.padMaps[pad.id] = r.map; Settings.save();
          this.remap = null; this.msg = { text: 'Controller saved!', t: 120 }; Sound.play('confirm');
          return;
        }
        break;
      }
    }
    r.prev = now;
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#0d2a3e', '#123');
    drawText(ctx, 'CONTROLS', W / 2, 50, 60, '#ffeb3b', '#1a1a1a', 'center', 10);
    for (const p of [0, 1]) {
      const L = KEY_LABELS[p], x = p === 0 ? 330 : 950, col = p === 0 ? '#ff5252' : '#40c4ff';
      drawText(ctx, p === 0 ? 'PLAYER 1 KEYBOARD' : 'PLAYER 2 KEYBOARD', x, 115, 30, col, '#1a1a1a', 'center', 5);
      drawText(ctx, 'MOVE: ' + L.move + '  (up = jump, back = block)', x, 150, 20, '#ffffff', '#1a1a1a', 'center', 4);
      const keys = [['l', 'LIGHT'], ['m', 'MEDIUM'], ['h', 'HEAVY'], ['s1', 'SPECIAL 1'], ['s2', 'SPECIAL 2'], ['su', 'SUPER']];
      keys.forEach(([k, name], i) => {
        const kx = x - 150 + (i % 3) * 150, ky = 195 + Math.floor(i / 3) * 80;
        ctx.fillStyle = i < 3 ? '#37474f' : '#4a148c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(kx - 50, ky - 22, 100, 44, 10) : ctx.rect(kx - 50, ky - 22, 100, 44); ctx.fill(); ctx.stroke();
        drawText(ctx, L[k], kx, ky, 24, '#ffeb3b', null);
        drawText(ctx, name, kx, ky + 34, 16, '#ffffff', '#1a1a1a', 'center', 3);
      });
    }
    if (this.remap) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H);
      const a = BUTTON_ACTIONS[this.remap.step];
      drawText(ctx, 'CONTROLLER ' + (this.remap.padIdx + 1) + ' SETUP', W / 2, 220, 50, '#40c4ff', '#1a1a1a', 'center', 8);
      drawText(ctx, 'PRESS THE BUTTON FOR', W / 2, 330, 40, '#ffffff', '#1a1a1a', 'center', 6);
      drawText(ctx, ACTION_LABEL[a], W / 2, 410, 80, '#ffeb3b', '#1a1a1a', 'center', 12);
      drawText(ctx, (this.remap.step + 1) + ' / ' + BUTTON_ACTIONS.length + '   (Esc = cancel)', W / 2, 500, 26, '#cfd8dc', '#1a1a1a', 'center', 4);
      return;
    }
    drawMenuList(ctx, this.items(), this.sel, W / 2, 420, 52, 30);
    drawText(ctx, '◀ ▶ to change controller · Enter to choose · Esc to go back', W / 2, 690, 20, '#cfd8dc', '#1a1a1a', 'center', 4);
    drawText(ctx, Input.pads.length + ' controller(s) found', W / 2, 375, 20, '#69f0ae', '#1a1a1a', 'center', 4);
    if (this.msg && this.msg.t-- > 0) drawText(ctx, this.msg.text, W / 2, 650, 24, '#ffeb3b', '#1a1a1a', 'center', 4);
  }
}

// ---------------------------------------------------------------- options
class OptionsScene {
  constructor() { this.t = 0; this.sel = MenuMem.options; }
  rows() {
    const d = Settings.data;
    return [
      ['ROUNDS TO WIN', String(d.roundsToWin)],
      ['ROUND TIME', d.time > 0 ? d.time + ' SEC' : 'NO LIMIT'],
      ['MUSIC VOLUME', '▮'.repeat(Math.round(d.music * 10)) || 'OFF'],
      ['SOUND VOLUME', '▮'.repeat(Math.round(d.sfx * 10)) || 'OFF'],
      ['ANNOUNCER VOICE', d.announcer ? 'ON' : 'OFF'],
      ['AUTO FULLSCREEN', d.autoFull ? 'ON' : 'OFF'],
      ['CONTROLS', ''],
      ['BACK', ''],
    ];
  }
  change(dir) {
    const d = Settings.data;
    switch (this.sel) {
      case 0: d.roundsToWin = clamp(d.roundsToWin + dir, 1, 3); break;
      case 1: { const opts = [60, 99, 0]; d.time = opts[(opts.indexOf(d.time) + dir + 3) % 3]; break; }
      case 2: d.music = clamp(Math.round((d.music + dir * 0.1) * 10) / 10, 0, 1); break;
      case 3: d.sfx = clamp(Math.round((d.sfx + dir * 0.1) * 10) / 10, 0, 1); break;
      case 4: d.announcer = !d.announcer; break;
      case 5: d.autoFull = !d.autoFull; break;
    }
    Settings.save(); Sound.setVolumes(); Sound.play('select');
  }
  update() {
    this.t++;
    const rows = this.rows();
    this.sel = navList(this.sel, rows.length);
    MenuMem.options = this.sel;
    const isControls = rows[this.sel][0] === 'CONTROLS';
    if (Menu.left() && !isControls) this.change(-1);
    if (Menu.right() && !isControls) this.change(1);
    if (Menu.back() || (Menu.ok() && this.sel === rows.length - 1)) { Sound.play('back'); MenuMem.options = 0; Game.goto(new TitleScene()); return; }
    if (Menu.ok() && isControls) { Sound.play('confirm'); Game.goto(new ControlsScene()); return; }
    if (Menu.ok()) this.change(1);
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#263238', '#4a148c');
    drawText(ctx, 'OPTIONS', W / 2, 70, 70, '#ffeb3b', '#1a1a1a', 'center', 10);
    this.rows().forEach(([k, v], i) => {
      const s = i === this.sel, y = 160 + i * 68;
      drawText(ctx, k, 300, y, 36, s ? '#ffffff' : '#90a4ae', s ? '#d50000' : '#1a1a1a', 'left', 6);
      if (v) drawText(ctx, '◀ ' + v + ' ▶', 900, y, 34, '#ffffff', '#1a1a1a', 'center', 6);
    });
  }
}
