'use strict';
// Signature supers. buildSuper() (moves.js) uses SUPER_TYPES[spec.type] when one exists.
// Each builder gets X = { base, fin, m (damage mult), big (size mult), e (element), lvl }.
ELEM.bluefire = ['#e1f5fe', '#40c4ff', '#1565c0'];
ELEM.twister = ['#e1f5fe', '#7e57c2', '#283593'];

const SUPER_TYPES = {
  // Luffy: a storm of stretching fists
  gatling(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 10, active: X.lvl === 3 ? 90 : 70, recovery: 20, pose: 'cast', spritePose: 'bazooka', tilt: 0.3, jitter: true,
      onFrame(f, fr, g, a) {
        if (fr > 10 && fr <= a.activeEnd) FX.streaks(f.x + f.facing * 160, f.y - f.height * 0.55, 'rubber', 2, 14, f.facing);
        const kong = X.lvl === 3, every = kong ? 5 : 2, per = kong ? 1 : 2;
        if (fr > 10 && fr <= a.activeEnd && fr % every === 0) for (let q = 0; q < per; q++) {
          const sp = spawnPt(f), last = fr + every > a.activeEnd && q === per - 1, lane = kong ? ((fr / every) % 3 - 1) * 46 : rand(-55, 40);
          g.addEnt(new Proj({
            owner: f, x: sp.x, y: sp.y + lane, vx: f.facing * (kong ? 34 : rand(30, 38)), r: kong ? 40 : 34, kong, sprite: 'rubberfist', elem: 'rubber', hits: 1, life: 15, isSuper: true,
            hit: X.fin({ dmg: Math.round((X.lvl === 3 ? 19 : 10) * X.m), hitstun: last ? 40 : 22, kb: last ? [12, -12] : [1, 0], launch: last ? -12 : 0, knockdown: last, strength: last ? 4 : 2, keepAir: !last }),
          }));
          if (fr % 6 === 0) Sound.play('whoosh');
        }
      },
    });
  },
  // Luffy in Gear 5: one gigantic rubber fist
  bajrang(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 34, active: 2, recovery: 34, pose: 'charge', spritePose: 'attack', spawnAt: 34, chargeSprite: true,
      onFrame(f, fr) {
        if (fr < 34) { f.chargeFist = Object.assign(f.chargeFist || {}, { k: fr / 34, endH: 120 * X.big * 2.3 }); if (fr % 3 === 0) FX.smoke(f.x - f.facing * 40, f.y - f.height * 0.5, 2, 'rgba(255,255,255,0.85)'); }
        if (fr === 34) f.chargeFist = null;
      },
      spawn(f, g) {
        const cf = f.chargeFist || {}, sp = spawnPt(f);
        f.chargeFist = null;
        g.addEnt(new Proj({ owner: f, x: cf.x != null ? cf.x : sp.x + f.facing * 60, y: cf.y != null ? cf.y : sp.y, vx: f.facing * 13, r: 120 * X.big, sprite: 'giantfist', art: 'bajrangfist', artK: 2.3, arm: true, elem: 'rubber', hits: X.lvl === 3 ? 14 : 10, hitEvery: 4, life: 200, isSuper: true, clash: true, hit: X.fin({ dmg: Math.round(24 * X.m), hitstun: 44, kb: [16, -16], launch: -16 }) }));
        Sound.play('explode'); g.shake(16); g.zoomPunch(1.2);
      },
    });
  },
  // Zoro: Asura. Ghost clones, then he cuts through and nine slashes explode
  asura(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 36, active: 8, recovery: 30, pose: 'charge', spritePose: 'attack', invuln: [0, 50],
      onFrame(f, fr, g, a) {
        if (fr === 1) { g.darkT = 90; Sound.play('dark'); }
        if (fr <= 36) f.clones = 2;
        if (fr === 37) {
          const o = f.opp, side = o.x >= f.x ? 1 : -1;
          f.trail = 14; f.clones = 0;
          f.x = clamp(o.x + side * 170 * f.hs, g.camX + 40, g.camX + W - 40);
          f.facing = o.x > f.x ? 1 : -1;
          g.addEnt(new SlashStorm({ owner: f, x: o.x, y: o.y - o.height * 0.5, delay: 0, beat: 5, life: 9 * 5 + 22, hits: 9, hitEvery: 5, elem: 'slash', isSuper: true, dir: side, hit: X.fin({ dmg: Math.round(26 * X.m), hitstun: 44, kb: [12, -15], launch: -15 }) }));
          Sound.play('slash'); g.shake(12); g.flashT = 6;
        }
      },
    });
  },
  // Chopper: Monster Point. He grows huge and pounds the ground
  monster(spec, ch, X) {
    const hits = X.lvl === 3 ? 10 : 8;
    return Object.assign(X.base, {
      startup: 30, active: hits * 8 + 2, recovery: 30, pose: 'charge', hits, hitEvery: 8, gravity: true,
      spritePose: (f, fr) => (Math.floor(fr / 8) % 2 ? 'attack' : 'kick'),
      box: { x: 0, y: -320, w: 300, h: 320 },
      hit: X.fin({ dmg: Math.round(30 * X.m), hitstun: 44, kb: [14, -16], launch: -16 }),
      multi: { hitstun: 26, kb: [3, -3] },
      onFrame(f, fr, g, a) {
        const end = a.activeEnd + 30;
        f.giantK = fr <= 30 ? 1 + 1.6 * (fr / 30) : fr >= a.activeEnd ? 2.6 - 1.6 * Math.min(1, (fr - a.activeEnd) / 30) : 2.6;
        if (fr === 1) { Sound.play('super'); FX.smoke(f.x, f.y - 60, 10, 'rgba(120,80,50,0.6)'); f.form = 'chopper_mp'; f.formT = 0; }
        if (fr > 30 && fr <= a.activeEnd) { f.vx = f.facing * 2; if (fr % 8 === 0) { g.shake(12); FX.dust(f.x + f.facing * 150, GROUND_Y, 8); Sound.play('hitH'); } }
        if (fr >= end - 1) { f.giantK = 1; f.form = null; FX.smoke(f.x, f.y - 60, 10, 'rgba(120,80,50,0.6)'); }
      },
    });
  },
  // Sanji: Ifrit Jambe. Leap in blue fire, then a meteor dive kick
  ifrit(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 14, active: 60, recovery: 24, pose: 'charge', gravity: true,
      spritePose: (f, fr) => (fr < 32 ? 'jump' : 'kick'),
      box: { x: -20, y: -150, w: 120, h: 150 }, hit: X.fin({ dmg: Math.round(40 * X.m), hitstun: 34, kb: [1, 0], knockdown: false }),
      onFrame(f, fr, g, a) {
        if (fr % 2 === 0) FX.burst(f.x, f.y - f.height * 0.4, 'bluefire', 3, 3, 10, 22, -0.2);
        if (fr === 15) { f.vy = -24; f.vx = f.facing * 6; Sound.play('fire'); }
        if (fr === 32) { f.vx = clamp((f.opp.x - f.x) / 12, -18, 18); f.vy = 26; f.trail = 20; }
        if (fr > 32 && !f.airborne && !a.boom) {
          a.boom = true; a.activeEnd = fr;
          g.addEnt(new Pillar({ owner: f, x: f.x + f.facing * 40, w: 320 * X.big, h: 320 * X.big, delay: 0, dur: 30, hits: X.lvl === 3 ? 9 : 6, hitEvery: 4, elem: 'bluefire', isSuper: true, hit: X.fin({ dmg: Math.round(30 * X.m), hitstun: 42, kb: [10, -16], launch: -16 }) }));
          g.shake(18); g.flashT = 6; Sound.play('explode'); FX.comic(f.x, f.y - 200, 'WHOOSH!', 4);
        }
      },
    });
  },
  // Garp: Galaxy Impact. A leaping punch that explodes into a giant dome
  // Imu: Honebami Toshiro. One cleave and two Omen serpents with demonic heads lunge across the screen
  honebami(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 12, active: 40, recovery: 26, pose: 'charge', gravity: true,
      spritePose: (f, fr) => (fr < 14 ? 'windup' : 'attack'),
      onFrame(f, fr, g) {
        if (fr === 2) { g.darkT = 70; FX.label(f.x, f.y - f.height - 40, 'HONEBAMI TOSHIRO', '#ff1744', 28); }
        if (fr === 14 || fr === 22) {
          const hp = handPt(f, 'attack') || spawnPt(f), hi = fr === 14;
          g.addEnt(new Proj({ owner: f, x: hp.x, y: f.y - (hi ? 125 : 55) * f.hs, vx: f.facing * 8, vy: 0, r: 58, sprite: 'fireball', art: 'omensnake', artK: 2.3, elem: 'dark',
            hits: X.lvl === 3 ? 6 : 5, hitEvery: 3, life: 170, isSuper: true, hit: X.fin({ dmg: Math.round(24 * X.m), hitstun: 40, kb: [12, -12], launch: -12 }) }));
          Sound.play('dark'); g.shake(10);
        }
        if (X.lvl === 3 && fr === 34) {
          // the Mother Flame weapon fires from the sky onto the target
          g.addEnt(new Pillar({ owner: f, x: f.opp.x, w: 300, h: 720, delay: 10, dur: 44, hits: 8, hitEvery: 5, elem: 'fire', isSuper: true, hit: X.fin({ dmg: Math.round(14 * X.m), hitstun: 44, launch: -18, kb: [4, -18] }) }));
          g.flashT = 12; FX.comic(f.opp.x, 160, 'MOTHER FLAME!', 5);
        }
      },
    });
  },
  galaxy(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 8, active: 34, recovery: 30, pose: 'charge', gravity: true,
      spritePose: (f, fr) => (fr < 28 ? 'jump' : 'attack'),
      onFrame(f, fr, g) {
        if (fr === 9) { f.vy = -15; f.vx = clamp((f.opp.x - f.x) / 22, -11, 11); Sound.play('jump'); }
        if (fr === 28) {
          f.vx = 0;
          g.addEnt(new Dome({ owner: f, x: f.x + f.facing * 90, y: f.y - 70, rMax: 430 * X.big, life: 46, hits: X.lvl === 3 ? 12 : 8, hitEvery: 3, elem: 'haki', isSuper: true, hit: X.fin({ dmg: Math.round(30 * X.m), hitstun: 44, kb: [16, -16], launch: -16 }) }));
          g.shake(26); g.flashT = 10; g.zoomPunch(1.25); Sound.play('ko'); FX.comic(f.x, f.y - 220, 'KABOOM!', 4);
        }
      },
    });
  },
  // Kizaru: Light-speed barrage. He becomes light and zips through again and again
  lightspeed(spec, ch, X) {
    const n = X.lvl === 3 ? 18 : 12;
    return Object.assign(X.base, {
      startup: 10, active: n * 4 + 10, recovery: 20, pose: 'charge', spritePose: 'kick', invuln: [0, n * 4 + 20],
      onFrame(f, fr, g, a) {
        f.hidden = fr > 10 && fr < a.activeEnd;
        if (fr === 11) { Sound.play('light'); g.addEnt(new LightBarrage({ owner: f, x: f.opp.x, y: f.opp.y - f.opp.height * 0.5, life: n * 4 + 6, hits: n, hitEvery: 4, elem: 'light', isSuper: true, hit: X.fin({ dmg: Math.round(22 * X.m), hitstun: 44, kb: [14, -14], launch: -14 }) })); }
        if (fr === a.activeEnd) {
          const o = f.opp, side = Math.random() < 0.5 ? 1 : -1;
          f.x = clamp(o.x + side * 90 * f.hs, g.camX + 40, g.camX + W - 40); f.facing = o.x > f.x ? 1 : -1;
          FX.burst(f.x, f.y - 80, 'light', 30, 10, 8, 25);
        }
      },
    });
  },
  // Kizaru: Yasakani no Magatama. He floats up and showers the area with light bullets from his hands
  yasakani(spec, ch, X) {
    const n = X.lvl === 3 ? 40 : 28;
    return Object.assign(X.base, {
      startup: 12, active: n * 2 + 8, recovery: 26, pose: 'charge', spritePose: 'special', jitter: true,
      onFrame(f, fr, g, a) {
        if (fr === 1) Sound.play('light');
        if (fr > 1 && fr < 12) f.y -= 11;
        f.vy = 0;
        if (fr % 3 === 0) FX.burst(f.x, f.y - f.height * 0.5, 'light', 2, 3, 10, 16);
        if (fr > 12 && fr <= 12 + n * 2 && fr % 2 === 0) {
          const hp = handPt(f) || spawnPt(f), o = f.opp;
          const ang = Math.atan2(o.y - o.height * 0.5 - hp.y, o.x - hp.x) + rand(-0.28, 0.28);
          const last = fr >= 12 + n * 2 - 1;
          g.addEnt(new Proj({ owner: f, x: hp.x, y: hp.y, vx: Math.cos(ang) * 24, vy: Math.sin(ang) * 24, r: 20, sprite: 'lightbullet', elem: 'light', hits: 1, life: 70, ground: true, isSuper: true,
            hit: X.fin({ dmg: Math.round(12 * X.m), hitstun: last ? 40 : 20, kb: last ? [10, -12] : [1, 0], launch: last ? -12 : 0, knockdown: last, strength: last ? 4 : 2, keepAir: !last }) }));
          if (fr % 6 === 0) Sound.play('light');
        }
      },
    });
  },
  // Kaido: transforms into his huge blue dragon and charges across the stage
  dragonform(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 16, active: 60, recovery: 20, pose: 'charge', spritePose: 'super', invuln: [0, 80],
      onFrame(f, fr, g, a) {
        if (fr === 1) { FX.smoke(f.x, f.y - f.height * 0.5, 16, 'rgba(100,140,255,0.7)'); Sound.play('super'); }
        if (fr === 17) {
          f.hidden = true; a.dragon = true;
          g.addEnt(new Proj({ owner: f, x: f.x - f.facing * 120, y: f.y - f.height * 0.55, vx: f.facing * 15, r: 150 * X.big, sprite: 'orb', art: 'bluedragon', artK: 1.9, elem: 'fire',
            hits: X.lvl === 3 ? 14 : 10, hitEvery: 4, life: 60, isSuper: true, dragonOf: f, hit: X.fin({ dmg: Math.round(26 * X.m), hitstun: 44, kb: [16, -14], launch: -14 }) }));
          g.shake(16); Sound.play('ko'); FX.comic(f.x, f.y - 260, 'ROAAAR!', 4);
        }
        if (a.dragon && fr > 17 && fr <= a.activeEnd) {
          const dr = g.ents.find(e => e.dragonOf === f && !e.dead);
          if (dr) { f.x = clamp(dr.x, g.camX + 40, g.camX + W - 40); FX.burst(dr.x + f.facing * dr.r, dr.y, 'fire', 4, 5, 10, 20); }
          f.hidden = true;
        }
        if (fr === a.activeEnd) { f.hidden = false; FX.smoke(f.x, f.y - f.height * 0.5, 16, 'rgba(100,140,255,0.7)'); }
      },
    });
  },
  // Brook: Kasuri Uta: Fubuki Giri. A blizzard, a slash too fast to see, then everything freezes and shatters
  fubuki(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 26, active: 6, recovery: 46, pose: 'charge', spritePose: 'attack', invuln: [0, 40],
      onFrame(f, fr, g) {
        if (fr === 1) { g.darkT = 90; Sound.play('ice'); }
        if (fr < 70) for (let i = 0; i < 3; i++) FX.add({ type: 'dot', x: g.camX + rand(0, W), y: rand(0, H), vx: rand(-6, -2), vy: rand(2, 5), r: rand(2, 4), life: 30, col: '#ffffff', drag: 1 });
        if (fr === 27) {
          const o = f.opp, side = o.x >= f.x ? 1 : -1;
          f.trail = 14; f.x = clamp(o.x + side * 170 * f.hs, g.camX + 40, g.camX + W - 40); f.facing = o.x > f.x ? 1 : -1;
          g.addEnt(new SlashStorm({ owner: f, x: o.x, y: o.y - o.height * 0.5, delay: 26, life: 56, hits: X.lvl === 3 ? 9 : 6, hitEvery: 3, single: true, iceLine: true, color: '#e1f5fe', elem: 'ice', isSuper: true, dir: side,
            finalFx: 'freeze', m: X.m, hit: X.fin({ dmg: Math.round(30 * X.m), hitstun: 44, kb: [10, -12], launch: -12 }) }));
          Sound.play('slash');
        }
        if (fr === 53) FX.label(f.x, f.y - f.height - 40, 'YOHOHOHO...', '#e1f5fe', 26);
      },
    });
  },
  // Hancock: Mero Mero Mellow. Heart-shaped hands pour out a stream of hearts; enough hits turn the
  // opponent to stone, and the statue cracks and crumbles
  mellow(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 16, active: 44, recovery: 30, pose: 'charge', spritePose: 'special',
      onFrame(f, fr, g, a) {
        if (fr === 2) FX.label(f.x, f.y - f.height - 40, 'MERO MERO...', '#ff80ab', 28);
        if (fr > 16 && fr <= a.activeEnd && !a.petrified && fr % 2 === 0) {
          const hp = handPt(f) || spawnPt(f), k = (fr % 6) - 2;
          FX.hearts(hp.x, hp.y, 1);
          g.addEnt(new Proj({ owner: f, x: hp.x, y: hp.y + k * 8, vx: f.facing * 14, vy: Math.sin(fr * 0.7) * 1.4, r: 24, sprite: 'heart', elem: 'love', hits: 1, life: 70, isSuper: true,
            onHitFn: (def, gg) => {
              a.heartHits = (a.heartHits || 0) + 1;
              if (a.heartHits >= (X.lvl === 3 ? 6 : 8) && !a.petrified) {
                a.petrified = true;
                def.applyStatus('stone', f, X.m);
                FX.comic(def.x, def.y - def.height - 30, 'MELLOW!', 4); gg.flashT = 6; Sound.play('quake');
              }
            },
            hit: X.fin({ dmg: Math.round(9 * X.m), hitstun: 26, kb: [1, 0], launch: 0, knockdown: false, strength: 2, keepAir: true }) }));
          if (fr % 6 === 0) Sound.play('pop');
        }
      },
    });
  },
  // Big Mom: Prometheus becomes a giant sun while Zeus calls down lightning
  mamaflame(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 22, active: 2, recovery: 40, pose: 'charge', spritePose: 'super', spawnAt: 22,
      spawn(f, g) {
        const cp = compPt(f, 'prometheus') || spawnPt(f);
        if (f.comp && f.comp.prometheus) f.comp.prometheus.awayT = 160;
        g.addEnt(new Proj({ owner: f, x: cp.x, y: cp.y, vx: f.facing * 7, r: 105 * X.big, sprite: 'compimg', comp: 'prometheus', elem: 'fire', hits: X.lvl === 3 ? 14 : 10, hitEvery: 5, life: 220, isSuper: true, clash: true, hit: X.fin({ dmg: Math.round(18 * X.m), hitstun: 40, kb: [12, -12], launch: -12 }) }));
        [-160, 0, 160].forEach((dx, i) => g.addEnt(new Pillar({ owner: f, art: 'lightning', x: f.opp.x + dx, w: 110, h: 720, delay: 16 + i * 14, dur: 18, hits: 2, hitEvery: 6, elem: 'lightning', isSuper: true, hit: X.fin({ dmg: Math.round(20 * X.m), hitstun: 40, kb: [4, -14], launch: -14 }) })));
        Sound.play('fire'); g.shake(10);
      },
    });
  },
  // Nami: Zeus Breeze Tempo. A thundercloud forms above the opponent, then one huge bolt
  zeusbreeze(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 16, active: 2, recovery: 40, pose: 'charge', spritePose: 'special', spawnAt: 16,
      spawn(f, g) {
        g.addEnt(new StormCloud({ owner: f, art: 'lightning', x: pillarX(f), w: 210 * X.big, h: 720, delay: 26, dur: 34, hits: X.lvl === 3 ? 14 : 10, hitEvery: 3, elem: 'lightning', isSuper: true, hit: X.fin({ dmg: Math.round(26 * X.m), hitstun: 44, kb: [6, -16], launch: -16 }) }));
        Sound.play('lightning');
      },
    });
  },
  // Robin: Gigantesco Mano. Two giant hands rise up and clap the opponent
  mano(spec, ch, X) {
    return Object.assign(X.base, {
      startup: 14, active: 2, recovery: 44, pose: 'charge', spritePose: 'special', spawnAt: 14,
      spawn(f, g) {
        g.addEnt(new GiantHands({ owner: f, x: pillarX(f), life: 60, hits: X.lvl === 3 ? 12 : 8, hitEvery: 4, elem: 'flower', isSuper: true, big: X.big, hit: X.fin({ dmg: Math.round(30 * X.m), hitstun: 44, kb: [6, -16], launch: -16 }) }));
        Sound.play('whoosh');
      },
    });
  },
};

// ---------------------------------------------------------------- scripted entities
class DemonFleur extends Ent {
  rect() { const o = this.owner; return this.t > 12 && this.t < 34 ? (o.facing > 0 ? { x: o.x + 30, y: GROUND_Y - 320, w: 330, h: 320 } : { x: o.x - 360, y: GROUND_Y - 320, w: 330, h: 320 }) : null; }
  update(g) { super.update(g); this.dir = this.owner.facing; if (this.t === 13) { g.shake(14); Sound.play('hitH'); FX.petals(this.owner.x + this.owner.facing * 200, GROUND_Y - 160, 30); } }
  draw(ctx) {
    const o = this.owner, rise = Math.min(1, this.t / 12), fade = Math.min(1, this.life / 10), lunge = this.t > 12 && this.t < 34 ? Math.sin((this.t - 12) / 22 * Math.PI) * 120 : 0;
    if (!drawArt(ctx, 'robindemon', this.x + o.facing * lunge, GROUND_Y + 20, 460 * rise, { ay: 1, alpha: 0.85 * fade, flip: o.facing < 0 })) {
      ctx.globalAlpha = 0.6 * fade; ctx.fillStyle = '#4a148c'; ctx.beginPath(); ctx.ellipse(this.x, GROUND_Y - 200 * rise, 120, 200 * rise, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
}

class SlashStorm extends Ent {
  rect() { return this.t > this.delay || this.beat ? { x: this.x - 130, y: this.y - 150, w: 260, h: 300 } : null; }
  get dirToTarget() { return 1; }
  update(g) {
    super.update(g);
    if (this.beat) {   // one slash per beat: flash + sound as each cut lands
      if (this.t % this.beat === 1 && this.t < 9 * this.beat) { Sound.play('slash'); g.shake(7); FX.star(this.x, this.y, '#ffffff', 60, 6, 8); }
      if (this.t === 9 * this.beat + 1) { g.flashT = 6; g.shake(16); FX.comic(this.x, this.y - 170, 'ASURA!', 4); }
    } else if (this.t === this.delay + 1) { Sound.play('slash'); g.shake(14); g.flashT = 5; FX.comic(this.x, this.y - 170, 'SLASH!', 4); }
    // ice grows out of the cut line
    if (this.iceLine && this.t > this.delay && this.t % 2 === 0) {
      const k = rand(-0.5, 0.5), a = -0.6;
      FX.shards(this.x + Math.cos(a) * 260 * k, this.y + Math.sin(a) * 260 * k, 'ice', 3, 6);
      if (this.t === this.delay + 2) Sound.play('ice');
    }
  }
  draw(ctx) {
    const n = this.single ? 1 : this.small ? 3 : 9, lit = this.t > this.delay, col = this.color || '#ff1744';
    const step = this.beat || Math.max(1, Math.floor(this.delay / n));
    for (let i = 0; i < n; i++) {
      const born = i * step; if (this.t < born) break;
      const fresh = this.beat && this.t - born < this.beat;   // the newest cut glows brighter
      const grow = Math.min(1, (this.t - born) / 3);
      const a = this.single ? -0.6 : -1.2 + i * 0.3 + (i % 2) * 1.4, len = (this.single ? 520 : 300) * grow;
      const dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
      ctx.lineCap = 'round';
      const on = this.beat ? true : lit;
      ctx.strokeStyle = col; ctx.globalAlpha = on ? 1 : 0.5; ctx.lineWidth = fresh ? 22 : on ? 14 : 5;
      ctx.beginPath(); ctx.moveTo(this.x - dx, this.y - dy); ctx.lineTo(this.x + dx, this.y + dy); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = fresh ? 10 : on ? 6 : 2;
      ctx.beginPath(); ctx.moveTo(this.x - dx, this.y - dy); ctx.lineTo(this.x + dx, this.y + dy); ctx.stroke();
    }
  }
}

class Dome extends Ent {
  r() { return this.rMax * Math.min(1, this.t / 18); }
  rect() { const r = this.r(); return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 }; }
  update(g) { super.update(g); if (this.t % 5 === 0) g.shake(8); }
  draw(ctx) {
    const r = this.r(), k = Math.min(1, this.life / 12);
    const grd = ctx.createRadialGradient(this.x, this.y, r * 0.2, this.x, this.y, r);
    grd.addColorStop(0, 'rgba(255,255,255,' + 0.9 * k + ')'); grd.addColorStop(0.7, 'rgba(255,205,210,' + 0.5 * k + ')'); grd.addColorStop(1, 'rgba(213,0,0,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,' + 0.8 * k + ')'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, TAU); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a = rand(0, TAU); drawBolt(ctx, this.x, this.y, this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, choice(['#111', '#d50000']), 6); }
  }
}

class LightBarrage extends Ent {
  rect() { return { x: this.x - 60, y: this.y - 90, w: 120, h: 180 }; }
  update(g) {
    super.update(g);
    if (this.t % 4 === 1) {
      const a = rand(0, TAU);
      this.streak = { a, t: 4 };
      FX.star(this.x, this.y, '#fff59d', 70, 6, 8); Sound.play('light');
    }
  }
  draw(ctx) {
    if (!this.streak) return;
    const { a } = this.streak, L = 520, dx = Math.cos(a) * L, dy = Math.sin(a) * L;
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [w, c] of [[30, 'rgba(255,214,0,0.5)'], [14, '#fff59d'], [5, '#ffffff']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(this.x - dx, this.y - dy); ctx.lineTo(this.x + dx, this.y + dy); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

class StormCloud extends Pillar {
  draw(ctx) {
    const k = Math.min(1, this.t / 14), cy = 175, x = this.x;
    const zeus = Sprites.exact('bigmom', 'zeus');
    if (zeus) {
      if (this.active()) super.draw(ctx);
      const h = 230 * (this.w / 210), w = h * zeus.width / zeus.height;
      ctx.globalAlpha = k; ctx.drawImage(zeus, x - w / 2, cy - h * 0.55 + Math.sin(this.t * 0.2) * 6, w, h); ctx.globalAlpha = 1;
      if (!this.active() && this.t % 6 < 3) drawBolt(ctx, x + rand(-60, 60), cy + 60, x + rand(-80, 80), cy + 150, '#fff176', 3);
      return;
    }
    ctx.globalAlpha = k;
    for (const [dx, dy, r] of [[-110, 10, 60], [-50, -20, 75], [20, -30, 85], [95, -5, 65], [140, 20, 45], [-160, 25, 40], [0, 30, 70]]) {
      ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(x + dx * this.w / 210, cy + dy, r * this.w / 210, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.arc(x - 20, cy - 35, 50, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    if (this.active()) super.draw(ctx);
    else if (this.t % 6 < 3) drawBolt(ctx, x + rand(-80, 80), cy + 40, x + rand(-80, 80), cy + 140, '#fff176', 3);
  }
}

class GiantHands extends Ent {
  phase() { return this.t < 18 ? this.t / 18 : 1; }
  squeeze() { return this.t < 18 ? 0 : Math.min(1, (this.t - 18) / 10); }
  rect() { return this.t >= 22 ? { x: this.x - 90, y: GROUND_Y - 300, w: 180, h: 300 } : null; }
  update(g) { super.update(g); if (this.t === 28) { g.shake(16); Sound.play('hitH'); FX.petals(this.x, GROUND_Y - 150, 30); FX.comic(this.x, GROUND_Y - 330, 'CLAP!', 4); } }
  draw(ctx) {
    const rise = this.phase(), sq = this.squeeze(), big = this.big || 1, skin = ROSTER.find(c => c.id === 'robin').look.skin;
    if (FXImg.get('manohand')) {
      for (const side of [-1, 1]) {
        const hx = this.x + side * (230 - 150 * sq) * big, h = 420 * big;
        drawArt(ctx, 'manohand', hx, GROUND_Y + 20 + (1 - rise) * h, h, { ay: 1, flip: side > 0, rot: side * (0.15 - 0.5 * sq) });
      }
      return;
    }
    for (const side of [-1, 1]) {
      const hx = this.x + side * (240 - 150 * sq) * big, hy = GROUND_Y - 20 - 260 * rise * big;
      ctx.save(); ctx.translate(hx, hy); ctx.scale(-side * big, big);
      ctx.fillStyle = '#7e57c2'; ctx.fillRect(-55, 120, 110, 200);           // sleeve
      ctx.fillStyle = skin; ctx.strokeStyle = OUT; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, 40, 75, 95, 0, 0, TAU); ctx.fill(); ctx.stroke();   // palm
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-48 + i * 32, -60 - (i === 1 || i === 2 ? 15 : 0), 15, 52, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(70, 20, 18, 45, -0.7, 0, TAU); ctx.fill(); ctx.stroke(); // thumb
      ctx.restore();
    }
  }
}

// extra projectile sprites (drawProjSprite falls back to these)
const EXTRA_SPRITES = {
  string(ctx, p) {
    const o = p.owner, hp = handPt(o) || spawnPt(o);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(hp.x, hp.y + i * 3); ctx.lineTo(p.x, p.y + i * 5); ctx.stroke(); }
    ctx.strokeStyle = '#ff80ab'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hp.x, hp.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  },
  // Jet / Kong Gatling: a stretched rubber arm from Luffy's hand ending in painted fist art
  rubberfist(ctx, p) {
    const o = p.owner, d = Math.sign(p.vx) || 1;
    const fp = o.fistPoint({ pose: 'bazooka', sx: 1, sy: 1, dx: 0, dy: 0 });
    const sx = fp ? fp.x : o.x + d * 30 * o.hs, sy = fp ? fp.y + (p.y - fp.y) * 0.15 : o.y - o.height * 0.6;
    const art = p.kong ? 'kongfist' : 'jetfist', im = FXImg.get(art);
    const fh = p.kong ? p.r * 2.8 : p.r * 2.2;                 // fist height on screen
    const fw = im ? fh * im.width / im.height : fh;
    const wrist = p.x - d * fw * 0.42;                          // where the arm meets the fist
    // arm: Gear 4 forearms are black with haki and inflated; normal arms are skin
    const armW = p.kong ? fh * 0.45 : Math.max(9, fh * 0.32);
    limb(ctx, sx, sy, wrist, p.y, armW, p.kong ? '#1c1c1c' : o.ch.look.skin);
    if (p.kong) { ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(wrist, p.y); ctx.stroke(); }
    if (!drawArt(ctx, art, p.x, p.y, fh, { flip: d < 0 })) circ(ctx, p.x, p.y, p.r, p.kong ? '#141414' : o.ch.look.skin);
    // speed lines behind each fist
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) { const yy = p.y + i * fh * 0.28; ctx.beginPath(); ctx.moveTo(wrist - d * 10, yy); ctx.lineTo(wrist - d * (60 + Math.abs(i) * 20), yy); ctx.stroke(); }
  },
  giantfist(ctx, p) {
    const o = p.owner, d = Math.sign(p.vx) || 1;
    limb(ctx, o.x + d * 30 * o.hs, o.y - o.height * 0.6, p.x - d * p.r * 0.6, p.y, p.r * 0.7, '#fafafa');
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.05, p.r * 0.85, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4;
    for (let i = -1; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(p.x + d * p.r * 0.35, p.y - p.r * 0.5 + i * p.r * 0.32); ctx.lineTo(p.x + d * p.r * 0.95, p.y - p.r * 0.5 + i * p.r * 0.32); ctx.stroke(); }
    if (p.t % 3 === 0) FX.smoke(p.x - d * p.r, p.y + rand(-p.r, p.r) * 0.5, 1, 'rgba(255,255,255,0.8)');
  },
  compimg(ctx, p) {
    const img = Sprites.exact(p.owner.ch.id, p.comp);
    if (!img) { ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); return; }
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p.x, p.y, p.r * 0.3, p.x, p.y, p.r * 1.6);
    g.addColorStop(0, 'rgba(255,152,0,0.7)'); g.addColorStop(1, 'rgba(255,61,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.6, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const h = p.r * 2.2, w = h * img.width / img.height;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.t * 0.15) * 0.15); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
  },
};

// Imu's Stigma: a toll of the Omen bell marks the target, then the black spear falls on it (follows the target until it drops)
class StigmaStrike extends Ent {
  constructor(o) { super(Object.assign({ life: 44, hits: 1, hitEvery: 99, drop: 22 }, o)); }
  rect() { return this.t > this.drop && this.t < this.drop + 10 ? { x: this.x - 55, y: GROUND_Y - 380, w: 110, h: 380 } : null; }
  update(g) {
    super.update(g);
    if (this.t === 1) { Sound.play('drum'); FX.comic(this.x, GROUND_Y - 330, 'STIGMA!', 3); }
    if (this.t < this.drop - 6) this.x += (this.owner.opp.x - this.x) * 0.25;   // homes in on the marked target
    if (this.t === this.drop) { Sound.play('explode'); g.shake(14); FX.burst(this.x, GROUND_Y - 10, 'dark', 26, 10, 9, 28); }
  }
  draw(ctx) {
    const t = this.t, x = this.x;
    if (t < this.drop) {   // the mark: a pulsing red eye on the target
      const k = 0.6 + Math.sin(t * 0.9) * 0.4;
      ctx.globalAlpha = k; ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(x, GROUND_Y - 6, 70, 14, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, GROUND_Y - 200, 26, 12, 0, 0, TAU); ctx.stroke(); circ(ctx, x, GROUND_Y - 200, 7, '#ff1744', false);
      ctx.globalAlpha = 1;
    }
    const fall = Math.min(1, Math.max(0, (t - this.drop + 8) / 8));
    if (fall > 0) {
      const tipY = lerp(-100, GROUND_Y + 30, fall), fade = Math.min(1, this.life / 10);
      if (!drawArt(ctx, 'stigma', x, tipY, 420, { ay: 1, alpha: fade })) {
        ctx.fillStyle = '#111'; ctx.fillRect(x - 10, tipY - 420, 20, 420);
      }
    }
  }
}
