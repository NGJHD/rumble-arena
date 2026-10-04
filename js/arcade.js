'use strict';
// Arcade mode: pick one fighter, then climb an 8-battle ladder (opponents and stages chosen for you).
// Battle 8 is the final boss Imu at the Empty Throne; beating him shows that fighter's ending art.

const ARCADE_LEN = 8;
const ENDING_IMG = {};
function endingImg(id) {
  if (!ENDING_IMG[id]) { const im = new Image(); im.src = 'sprites/ending/' + id + '.jpg'; ENDING_IMG[id] = im; }
  return ENDING_IMG[id];
}

const Arcade = {
  run: null,
  start(p1, difficulty) {
    const pool = ROSTER.filter(c => c !== p1);
    const foes = [];
    while (foes.length < ARCADE_LEN - 1 && pool.length) foes.push(pool.splice(randi(0, pool.length - 1), 1)[0]);
    let stages = [];
    const ladder = foes.map(ch => {
      if (!stages.length) stages = STAGES.slice().sort(() => Math.random() - 0.5);
      return { ch, stage: stages.pop() };
    });
    ladder.push({ ch: charById('imu'), stage: BOSS_STAGE, boss: true });
    this.run = { p1, difficulty, ladder, i: 0 };
    endingImg(p1.id);   // preload the ending
    return this.run;
  },
  // continue after a loss with a different fighter: same ladder, same battle. If the new fighter is still ahead on
  // the ladder (or is the current foe), the old fighter takes that slot, so there is never a mirror match.
  changeFighter(run, ch) {
    if (ch === run.p1) return run;
    for (let i = run.i; i < run.ladder.length; i++) if (run.ladder[i].ch === ch) run.ladder[i].ch = run.p1;
    run.p1 = ch; run.g5 = false;
    endingImg(ch.id);
    return run;
  },
  // computer gets a bit tougher for the second half; the boss fights one level above your choice
  level(run, i) {
    if (run.ladder[i].boss) return run.difficulty;   // index into BOSS_AI
    return clamp(run.difficulty + (i >= 4 ? 1 : 0), 0, 2);
  },
  fightOpts(run) {
    const e = run.ladder[run.i];
    return { p1: run.p1, p2: e.ch, stage: e.stage, mode: 'cpu', level: this.level(run, run.i), arcade: true, boss: !!e.boss };
  },
  // called by FightScene when the match is decided
  after(fight, champ) {
    const run = this.run;
    if (champ !== fight.f1) return new ArcadeLoseScene(run);
    run.g5 = fight.f1.form === 'luffy_g5';   // beat Imu in Gear 5 -> Gear 5 ending art
    run.i++;
    if (run.i >= run.ladder.length) return new EndingScene(run);
    return new ArcadeLadderScene(run);
  },
};

// ---------------------------------------------------------------- ladder ("next battle")
class ArcadeLadderScene {
  constructor(run) { this.run = run; this.t = 0; Sound.playMusic('menu'); }
  update() {
    this.t++;
    if (Menu.back() && this.t > 20) { Sound.play('back'); Game.goto(new TitleScene()); return; }
    if (this.t > 200 || (this.t > 30 && Menu.ok())) { Sound.play('confirm'); Game.goto(new FightScene(Arcade.fightOpts(this.run))); }
  }
  draw(ctx) {
    const run = this.run, e = run.ladder[run.i], boss = e.boss;
    menuBg(ctx, this.t, boss ? '#1a0010' : '#0d1b3e', boss ? '#5a0016' : '#3a0d4e');
    drawText(ctx, boss ? 'FINAL BATTLE' : 'BATTLE ' + (run.i + 1) + ' / ' + ARCADE_LEN, W / 2, 56, 58, boss ? '#ff5252' : '#ffeb3b', '#1a1a1a', 'center', 10);
    // ladder of portraits along the bottom; beaten foes are crossed out
    const n = run.ladder.length, sw = 120, gap = 12, x0 = W / 2 - (n * (sw + gap) - gap) / 2;
    run.ladder.forEach((l, i) => {
      const x = x0 + i * (sw + gap), y = 560, cur = i === run.i;
      ctx.fillStyle = l.boss ? '#3a0010' : i < run.i ? '#263238' : '#37474f'; ctx.fillRect(x, y, sw, 110);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, sw, 110); ctx.clip();
      if (l.boss && i > run.i) {   // the final boss stays a mystery: black silhouette with glowing eyes
        ctx.save(); ctx.filter = 'brightness(0)'; drawPortrait(ctx, l.ch, x + sw / 2, y + 58, 38, 'normal', this.t); ctx.restore();
        drawText(ctx, '?', x + sw / 2, y + 50, 44, '#ff1744', '#1a1a1a', 'center', 6);
      } else if (i <= run.i) drawPortrait(ctx, l.ch, x + sw / 2, y + 58, 38, i < run.i ? 'ko' : 'normal', this.t);
      else drawText(ctx, '?', x + sw / 2, y + 55, 70, '#90a4ae', '#1a1a1a', 'center', 8);
      ctx.restore();
      if (i < run.i) { ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + 14, y + 14); ctx.lineTo(x + sw - 14, y + 96); ctx.moveTo(x + sw - 14, y + 14); ctx.lineTo(x + 14, y + 96); ctx.stroke(); }
      ctx.strokeStyle = cur ? '#ffeb3b' : '#1a1a1a'; ctx.lineWidth = cur ? 6 : 3; ctx.strokeRect(x, y, sw, 110);
      drawText(ctx, l.boss ? 'BOSS' : String(i + 1), x + sw / 2, y + 128, 20, l.boss ? '#ff5252' : '#ffffff', '#1a1a1a', 'center', 4);
    });
    // you vs next foe
    const k = Math.min(1, this.t / 18);
    drawCharArt(ctx, run.p1, lerp(-200, 300, easeOutBack(k)), 470, 1, 'idle', 1.55 / Math.max(1, run.p1.look.scale || 1), this.t);
    drawCharArt(ctx, e.ch, lerp(W + 200, W - 300, easeOutBack(k)), 470, -1, 'idle', (boss ? 1.9 : 1.55) / Math.max(1, e.ch.look.scale || 1), this.t);
    drawText(ctx, 'VS', W / 2, 300, 120, '#ffffff', '#d50000', 'center', 14);
    drawText(ctx, run.p1.full.toUpperCase(), 300, 510, 30, '#ffffff', '#1a1a1a', 'center', 6);
    drawText(ctx, e.ch.full.toUpperCase(), W - 300, 510, 30, boss ? '#ff8a80' : '#ffffff', '#1a1a1a', 'center', 6);
    drawText(ctx, e.stage.name, W / 2, 400, 30, '#b3e5fc', '#1a1a1a', 'center', 5);
    if (this.t > 30) drawText(ctx, 'Press attack to fight!', W / 2, 460, 22, '#cfd8dc', '#1a1a1a', 'center', 4);
  }
}

// ---------------------------------------------------------------- lost a battle
class ArcadeLoseScene {
  constructor(run) { this.run = run; this.t = 0; this.sel = 0; this.items = ['REMATCH', 'CHANGE FIGHTER', 'MAIN MENU']; Sound.playMusic('results'); Announcer.play('game_over', 0.4); }
  update() {
    this.t++;
    if (this.t < 40) return;
    this.sel = navList(this.sel, this.items.length);
    if (Menu.ok()) {
      Sound.play('confirm');
      const it = this.items[this.sel];
      if (it === 'REMATCH') Game.goto(new FightScene(Arcade.fightOpts(this.run)));
      if (it === 'CHANGE FIGHTER') Game.goto(new SelectScene('arcade', this.run.difficulty, this.run));
      if (it === 'MAIN MENU') Game.goto(new TitleScene());
    }
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#1a1a2e', '#4a0d0d');
    const e = this.run.ladder[this.run.i];
    drawCharArt(ctx, e.ch, 900, 600, -1, 'win', 2 / Math.max(1, (e.ch.look.scale || 1) * 0.8), this.t);
    ctx.save(); ctx.globalAlpha = 0.6;
    drawCharArt(ctx, this.run.p1, 330, 640, 1, 'ko', 1.4 / Math.max(1, this.run.p1.look.scale || 1), this.t);
    ctx.restore();
    drawText(ctx, 'YOU LOST...', W / 2, 110, 90, '#ff5252', '#1a1a1a', 'center', 12);
    drawText(ctx, e.boss ? 'Imu still sits on the Empty Throne.' : 'Battle ' + (this.run.i + 1) + ' of ' + ARCADE_LEN, W / 2, 190, 30, '#ffffff', '#1a1a1a', 'center', 5);
    if (this.t >= 40) drawMenuList(ctx, this.items, this.sel, W / 2, 330, 80, 46);
  }
}

// ---------------------------------------------------------------- ending
class EndingScene {
  constructor(run) {
    this.run = run; this.t = 0;
    Sound.playMusic('results');
    Announcer.play('congratulations', 0.6);
  }
  update() {
    this.t++;
    if (this.t > 90 && (Menu.ok() || Menu.back())) { Sound.play('confirm'); Game.goto(new TitleScene()); }
  }
  draw(ctx) {
    const im = endingImg(this.run.g5 ? 'luffy_g5' : this.run.p1.id), k = Math.min(1, this.t / 60);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (im.complete && im.naturalWidth) {
      // slow push-in on the full-screen victory art
      const z = 1.06 - 0.06 * Math.min(1, this.t / 600);
      ctx.globalAlpha = k;
      ctx.drawImage(im, W / 2 - W * z / 2, H / 2 - H * z / 2, W * z, H * z);
      ctx.globalAlpha = 1;
    } else drawCharArt(ctx, this.run.p1, W / 2, 640, 1, 'win', 2.4 / Math.max(1, this.run.p1.look.scale || 1), this.t);
    if (this.t > 70) {
      const a = Math.min(1, (this.t - 70) / 30);
      ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(0, H - 170, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = g; ctx.fillRect(0, H - 170, W, 170);
      drawText(ctx, this.run.p1.full.toUpperCase() + ' DEFEATED IMU!', W / 2, H - 92, 48, '#ffeb3b', '#1a1a1a', 'center', 9);
      drawText(ctx, '"' + this.run.p1.quote + '"', W / 2, H - 40, 26, '#ffffff', '#1a1a1a', 'center', 5);
      ctx.globalAlpha = 1;
    }
  }
}

// speech bubble used for the boss intro
function speechBubble(ctx, x, y, text, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.font = '34px ' + FONT;
  const w = ctx.measureText(text).width + 70, h = 84;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h, w, h, 30) : ctx.rect(-w / 2, -h, w, h); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, -4); ctx.lineTo(70, 40); ctx.lineTo(70, -4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(30, -2); ctx.lineTo(70, 40); ctx.lineTo(70, -2); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(26, -10, 48, 12);
  drawText(ctx, text, 0, -h / 2, 34, '#b71c1c', null);
  ctx.restore();
}
