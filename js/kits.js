'use strict';
// Per-character normal-attack kits: every fighter's light/medium/heavy/air attacks get their own
// names, reach, hit counts, projectiles and effects (merged over the base table in moves.js).
//
// Kit fields per move key (L1 L2 L3 M1 M2 H1 L4 A1 A2 A3 AM A4):
//   pose   sprite pose to show         call   name shouted on use (heavies / launchers)
//   fx     strike effects: 'arc:#hex' (weapon swoosh) and/or an element burst (fire, ice, quake ...)
//   stretch  rubber reach (px)         remote  hit lands near the opponent up to this range (Robin, quake punches)
//   proj   {sprite|art, elem, speed, r, dmg, hits, count, spread}  ranged normal instead of melee
//   step   teleport forward (px) at the strike (Kizaru, Law)
//   hits / hitEvery / reach (box width x) / dmg (x) / startup (+-) / elem
// Kit-level: speed (startup delta for every normal), power (damage x for every normal)

const ARC = { blue: 'arc:#b3e5fc', white: 'arc:#ffffff', green: 'arc:#69f0ae', red: 'arc:#ff5252', ice: 'arc:#80d8ff', gold: 'arc:#ffd54f', purple: 'arc:#b388ff', pink: 'arc:#ff80ab', room: 'arc:#80deea' };

const KITS = {
  luffy: {
    L1: { stretch: 160, fx: ['rubber'] }, L2: { stretch: 180, fx: ['rubber'] },
    L3: { pose: 'kick', stretch: 210, fx: ['rubber'], call: 'Gum-Gum Whip' },
    M1: { pose: 'bazooka', tilt: 0.3, stretch: 230, hits: 6, hitEvery: 2, arms: 'gatling', fx: ['rubber'], call: 'Gum-Gum Gatling' },
    M2: { pose: 'kick', stretch: 250, fx: ['rubber'] },
    H1: { pose: 'bazooka', tilt: 0.3, stretch: 290, arms: 'double', fx: ['rubber'], call: 'Gum-Gum Bazooka' },
    L4: { call: 'Gum-Gum Rocket', fx: ['rubber'] },
    A4: { pose: 'kick', call: 'Gum-Gum Stamp', fx: ['rubber'] },
  },
  luffy_g5: {},
  zoro: {
    speed: 0, L1: { fx: [ARC.blue] }, L2: { fx: [ARC.blue] },
    L3: { hits: 3, hitEvery: 3, fx: [ARC.blue, 'slash'], call: 'Onigiri' },
    M1: { reach: 1.25, fx: [ARC.blue], call: 'Tiger Hunt' },
    M2: { hits: 3, hitEvery: 4, fx: [ARC.blue, 'slash'], call: 'Tornado' },
    H1: { pose: 'special', reach: 1.3, fx: [ARC.white, 'slash'], call: "Lion's Song" },
    L4: { fx: [ARC.blue], call: 'Purgatory Onigiri' }, A4: { fx: [ARC.blue, 'slash'], call: 'One Sword Style: Great Execution' },
    A1: { fx: [ARC.blue] }, A2: { fx: [ARC.blue] }, A3: { fx: [ARC.blue] }, AM: { fx: [ARC.blue] },
  },
  nami: {
    L1: { fx: [ARC.blue] }, L2: { fx: [ARC.blue] }, L3: { pose: 'kick' },
    M1: { pose: 'special', proj: { sprite: 'orb', elem: 'fire', speed: 9, r: 18, dmg: 45 }, call: 'Heat Ball' },
    M2: { pose: 'special', proj: { sprite: 'orb', elem: 'ice', speed: 9, r: 18, dmg: 45 }, call: 'Cool Ball' },
    H1: { pose: 'attack', reach: 1.6, fx: ['lightning'], elem: 'lightning', call: 'Thunder Lance Tempo' },
    L4: { fx: ['lightning'], call: 'Swing Arm' }, A4: { fx: ['lightning'], call: 'Thunder Charge' },
  },
  usopp: {
    L1: { pose: 'special', proj: { sprite: 'bullet', elem: 'punch', speed: 18, r: 10, dmg: 24 } },
    L2: { pose: 'special', proj: { sprite: 'bullet', elem: 'punch', speed: 18, r: 10, dmg: 26 } },
    L3: { pose: 'kick' },
    M1: { pose: 'special', proj: { sprite: 'orb', elem: 'fire', speed: 13, r: 20, dmg: 50 }, call: 'Tabasco Star' },
    M2: { pose: 'special', proj: { sprite: 'orb', elem: 'fire', speed: 12, r: 24, dmg: 55, hits: 2 }, call: 'Exploding Star' },
    H1: { pose: 'attack', fx: ['quake'], call: 'Impact Dial' },
    L4: { fx: ['punch'], call: 'Usopp Hammer' },
    A1: { pose: 'special', proj: { sprite: 'bullet', elem: 'punch', speed: 17, r: 10, dmg: 22, vy: 4 } },
    AM: { pose: 'special', proj: { sprite: 'orb', elem: 'fire', speed: 12, r: 18, dmg: 40, vy: 5 } },
  },
  sanji: {
    speed: -1, power: 0.95,
    L1: { pose: 'kick', fx: ['fire'], call: 'Neck Shot' }, L2: { pose: 'kick', fx: ['fire'], call: 'Shoulder Shot' },
    L3: { pose: 'kick', fx: ['fire'], call: 'Mutton Shot' },
    M1: { pose: 'kick', fx: ['fire'], call: 'Flank Shot' },
    M2: { pose: 'kick', hits: 4, hitEvery: 3, fx: ['fire'], call: 'Party Table Kick Course' },
    H1: { pose: 'kick', reach: 1.3, fx: ['fire', 'fire'], elem: 'fire', call: 'Devil Leg: Chest' },
    L4: { pose: 'upper', fx: ['fire'], call: 'Anti-Manner Kick Course' },
    A4: { pose: 'kick', fx: ['fire'], call: 'Crushing Heel' },
  },
  chopper: {
    speed: -1, power: 0.95,
    L3: { pose: 'kick', call: 'Jumping Point' },
    M1: { step: 50, call: 'Horn Point' }, M2: { pose: 'kick' },
    H1: { pose: 'special', fx: ['flower'], elem: 'flower', call: 'Cloven Rose' },
    L4: { call: 'Arm Point' }, A4: {},
  },
  robin: {
    L1: { remote: 260, fx: ['flower'], call: null }, L2: { remote: 280, fx: ['flower'] },
    L3: { pose: 'kick' },
    M1: { pose: 'special', remote: 340, hits: 2, hitEvery: 5, fx: ['flower'], call: 'Six Flowers' },
    M2: { pose: 'special', remote: 360, hits: 3, hitEvery: 4, fx: ['flower'], call: 'Eight Flowers' },
    H1: { pose: 'special', remote: 420, fx: ['flower', 'flower'], call: 'Clutch' },
    L4: { pose: 'special', remote: 300, fx: ['flower'], call: 'Forty Flowers' },
  },
  franky: {
    power: 1.05,
    M1: { pose: 'special', proj: { sprite: 'bullet', elem: 'metal', speed: 20, r: 10, dmg: 18, count: 3, spread: 18 }, call: 'Weapons Left' },
    M2: { pose: 'kick' },
    H1: { pose: 'attack', reach: 1.25, fx: ['metal', 'quake'], call: 'Strong Hammer' },
    L4: { fx: ['laser'], call: 'Gust Blast' }, A4: { fx: ['fire'], call: 'Fresh Fire' },
  },
  brook: {
    speed: -1,
    L1: { fx: [ARC.ice] }, L2: { fx: [ARC.ice] },
    L3: { reach: 1.4, fx: [ARC.ice], call: 'Gavotte Forward Leap' },
    M1: { reach: 1.3, fx: [ARC.ice, 'ice'] }, M2: { hits: 3, hitEvery: 3, fx: [ARC.ice], call: 'Humming Prelude' },
    H1: { pose: 'special', fx: [ARC.ice, 'ice'], elem: 'ice', call: 'Soul Solid' },
    L4: { fx: [ARC.ice], call: 'Arrow Night' }, A4: { fx: [ARC.ice, 'ice'] },
    A1: { fx: [ARC.ice] }, A2: { fx: [ARC.ice] }, A3: { fx: [ARC.ice] }, AM: { fx: [ARC.ice] },
  },
  jinbe: {
    speed: 1, power: 1.1,
    L1: { fx: ['water'] }, L2: { fx: ['water'] },
    M1: { remote: 220, fx: ['water'], call: 'Hundred Brick Punch' }, M2: { pose: 'kick', fx: ['water'] },
    H1: { pose: 'attack', remote: 300, fx: ['water', 'water'], call: 'Thousand Brick Fist' },
    L4: { fx: ['water'], call: 'Shark Tile Fist' }, A4: { fx: ['water'], call: 'Ocean Current Throw' },
  },
  akainu: {
    speed: 1, power: 1.1,
    L1: { fx: ['magma'] }, L2: { fx: ['magma'] }, L3: { pose: 'kick', fx: ['magma'] },
    M1: { fx: ['magma'] }, M2: { pose: 'kick', fx: ['magma'] },
    H1: { pose: 'special', proj: { art: 'magmafist', artK: 2.4, rotate: true, sprite: 'meteor', elem: 'magma', speed: 15, r: 34, dmg: 90, life: 26 }, call: 'Great Eruption' },
    L4: { fx: ['magma'] }, A4: { fx: ['magma'] },
    A1: { fx: ['magma'] }, A2: { fx: ['magma'] }, A3: { fx: ['magma'] }, AM: { fx: ['magma'] },
  },
  kizaru: {
    speed: -2, power: 0.9,
    L1: { pose: 'kick', fx: ['light'] }, L2: { pose: 'kick', fx: ['light'] },
    L3: { pose: 'kick', step: 70, fx: ['light'] },
    M1: { pose: 'kick', step: 110, fx: ['light'] },
    M2: { pose: 'special', proj: { sprite: 'lightbullet', elem: 'light', speed: 26, r: 12, dmg: 16, count: 3, spread: 14 } },
    H1: { pose: 'special', reach: 2.0, fx: ['light', 'light'], elem: 'light', call: 'Sun Goddess Beam' },
    L4: { pose: 'upper', fx: ['light'] }, A4: { pose: 'kick', fx: ['light'] },
  },
  aokiji: {
    L1: { fx: ['ice'] }, L2: { fx: ['ice'] }, L3: { pose: 'kick', fx: ['ice'] },
    M1: { pose: 'attack', reach: 1.5, fx: [ARC.ice, 'ice'], call: 'Ice Saber' }, M2: { pose: 'kick', fx: ['ice'] },
    H1: { pose: 'special', proj: { art: 'icespear', artK: 1.6, sprite: 'ice', elem: 'ice', speed: 15, r: 24, dmg: 32, count: 3, spread: 24 }, call: 'Ice Block: Partisan' },
    L4: { fx: ['ice'] }, A4: { fx: ['ice'] },
  },
  ace: {
    L1: { fx: ['fire'] }, L2: { fx: ['fire'] }, L3: { pose: 'kick', fx: ['fire'] },
    M1: { pose: 'special', proj: { sprite: 'fireball', elem: 'fire', speed: 16, r: 14, dmg: 18, count: 3, spread: 16 }, call: 'Fire Gun' },
    M2: { pose: 'kick', fx: ['fire'] },
    H1: { pose: 'special', proj: { art: 'crossfire', artK: 2, sprite: 'fireball', elem: 'fire', speed: 15, r: 40, dmg: 75, hits: 2 }, call: 'Cross Fire' },
    L4: { fx: ['fire'] }, A4: { fx: ['fire'] },
    A1: { fx: ['fire'] }, A2: { fx: ['fire'] }, A3: { fx: ['fire'] }, AM: { fx: ['fire'] },
  },
  shanks: {
    L1: { fx: [ARC.red] }, L2: { fx: [ARC.red] }, L3: { reach: 1.3, fx: [ARC.red] },
    M1: { reach: 1.3, fx: [ARC.red, 'haki'] }, M2: { hits: 2, hitEvery: 5, fx: [ARC.red] },
    H1: { pose: 'special', reach: 1.4, fx: [ARC.red, 'haki'], elem: 'haki' },
    L4: { fx: [ARC.red] }, A4: { fx: [ARC.red, 'haki'] },
    A1: { fx: [ARC.red] }, A2: { fx: [ARC.red] }, A3: { fx: [ARC.red] }, AM: { fx: [ARC.red] },
  },
  whitebeard: {
    speed: 2, power: 1.2,
    L1: { reach: 1.4, fx: [ARC.white] }, L2: { reach: 1.4, fx: [ARC.white] }, L3: { reach: 1.5, fx: [ARC.white] },
    M1: { remote: 260, fx: ['quake'] }, M2: { reach: 1.6, fx: [ARC.white, 'quake'], call: 'Demon Halberd' },
    H1: { pose: 'special', remote: 360, fx: ['quake', 'quake'], call: 'Helmet Splitter' },
    L4: { fx: ['quake'] }, A4: { fx: ['quake'] },
  },
  blackbeard: {
    speed: 1, power: 1.1,
    L1: { fx: ['dark'] }, L2: { fx: ['dark'] }, L3: { pose: 'kick', fx: ['dark'] },
    M1: { remote: 240, fx: ['quake'], call: 'Quake Punch' }, M2: { pose: 'kick', fx: ['dark'] },
    H1: { pose: 'special', reach: 1.5, fx: ['dark', 'dark'], call: 'Liberation' },
    L4: { fx: ['dark'] }, A4: { fx: ['dark', 'quake'] },
  },
  mihawk: {
    speed: 1, power: 1.1,
    L1: { reach: 1.3, fx: [ARC.green] }, L2: { reach: 1.3, fx: [ARC.green] }, L3: { reach: 1.5, fx: [ARC.green] },
    M1: { reach: 1.6, fx: [ARC.green, 'slash'] }, M2: { reach: 1.6, fx: [ARC.green] },
    H1: { pose: 'special', reach: 1.8, fx: [ARC.green, 'slash'], call: 'Black Blade: Night' },
    L4: { fx: [ARC.green] }, A4: { fx: [ARC.green, 'slash'] },
    A1: { fx: [ARC.green] }, A2: { fx: [ARC.green] }, A3: { fx: [ARC.green] }, AM: { fx: [ARC.green] },
  },
  crocodile: {
    L1: { fx: ['sand'] }, L2: { fx: [ARC.gold, 'sand'], call: null }, L3: { pose: 'kick', fx: ['sand'] },
    M1: { pose: 'special', proj: { sprite: 'slash', elem: 'sand', speed: 14, r: 26, dmg: 45, life: 30 }, call: 'Desert Sunflower' },
    M2: { fx: [ARC.gold, 'sand'] },
    H1: { pose: 'special', remote: 300, fx: ['sand', 'sand'], call: 'Great Desert Sword' },
    L4: { fx: ['sand'] }, A4: { fx: ['sand'] },
  },
  doflamingo: {
    L1: { pose: 'kick', fx: ['string'] }, L2: { pose: 'kick', fx: ['string'] },
    L3: { pose: 'special', proj: { sprite: 'bullet', elem: 'string', speed: 22, r: 10, dmg: 16, count: 3, spread: 16 }, call: 'Bullet String' },
    M1: { pose: 'kick', fx: ['string'] }, M2: { pose: 'kick', hits: 3, hitEvery: 3, fx: ['string'] },
    H1: { pose: 'attack', reach: 1.5, hits: 5, hitEvery: 2, fx: ['string', 'string'], call: 'Five-Color String' },
    L4: { pose: 'upper', fx: ['string'], call: 'Spider Web' }, A4: { pose: 'kick', fx: ['string'] },
  },
  kaido: {
    speed: 3, power: 1.3,
    L1: { reach: 1.5, fx: [ARC.purple] }, L2: { reach: 1.5, fx: [ARC.purple] }, L3: { reach: 1.5, fx: [ARC.purple, 'quake'] },
    M1: { reach: 1.6, fx: [ARC.purple, 'lightning'] }, M2: { reach: 1.7, fx: [ARC.purple, 'quake'] },
    H1: { pose: 'special', reach: 1.8, fx: ['lightning', 'quake'], elem: 'lightning', call: 'Ragnaraku' },
    L4: { fx: ['lightning'], call: 'Destruction Wind' }, A4: { fx: ['lightning', 'quake'] },
  },
  imu: {
    speed: 2, power: 1.15,
    L1: { reach: 1.5, fx: [ARC.red] }, L2: { reach: 1.5, fx: [ARC.red] }, L3: { pose: 'kick', fx: ['dark'] },
    M1: { reach: 1.7, fx: [ARC.red, 'slash'] }, M2: { pose: 'kick', fx: ['dark', 'haki'] },
    H1: { reach: 1.8, fx: [ARC.red, 'fire', 'quake'], elem: 'fire', call: 'Axe of Xingtian' },
    L4: { fx: [ARC.red, 'dark'] }, A4: { fx: ['dark', 'haki'] },
  },
  bigmom: {
    speed: 2, power: 1.2,
    L1: { fx: ['punch'] }, L2: { fx: ['punch'] }, L3: { pose: 'kick', fx: ['quake'] },
    M1: { pose: 'special', remote: 240, fx: ['fire'], comp: 'prometheus' },
    M2: { pose: 'special', remote: 280, fx: ['lightning'], comp: 'zeus' },
    H1: { pose: 'super', remote: 260, hits: 3, hitEvery: 5, fx: ['dark', 'quake'], call: 'Soul Pocus' },
    L4: { fx: ['fire'] }, A4: { fx: ['quake'] },
  },
  law: {
    speed: -1,
    L1: { fx: [ARC.room] }, L2: { fx: [ARC.room] }, L3: { reach: 1.4, fx: [ARC.room] },
    M1: { step: 120, fx: [ARC.room, 'room'], call: 'Shambles' }, M2: { reach: 1.5, hits: 3, hitEvery: 3, fx: [ARC.room] },
    H1: { pose: 'special', reach: 1.3, fx: ['lightning'], elem: 'lightning', call: 'Counter Shock' },
    L4: { fx: [ARC.room], call: 'Takt' }, A4: { fx: [ARC.room, 'room'] },
    A1: { fx: [ARC.room] }, A2: { fx: [ARC.room] }, A3: { fx: [ARC.room] }, AM: { fx: [ARC.room] },
  },
  hancock: {
    L1: { pose: 'kick', fx: ['love'] }, L2: { pose: 'kick', fx: ['love'] }, L3: { pose: 'kick', fx: ['love'] },
    M1: { pose: 'special', proj: { art: 'heartarrow', artK: 2, sprite: 'heart', elem: 'love', speed: 15, r: 16, dmg: 40 }, call: 'Pistol Kiss' },
    M2: { pose: 'kick', hits: 2, hitEvery: 5, fx: ['love'] },
    H1: { pose: 'kick', reach: 1.4, fx: ['love', 'love'], call: 'Perfume Femur' },
    L4: { pose: 'upper', fx: ['love'] }, A4: { pose: 'kick', fx: ['love'] },
  },
  garp: {
    power: 1.1,
    L1: { fx: ['haki'] }, L2: { fx: ['haki'] }, L3: { pose: 'kick', fx: ['haki'] },
    M1: { fx: ['haki'] }, M2: { pose: 'kick', fx: ['haki'] },
    H1: { pose: 'special', reach: 1.3, fx: ['haki', 'quake'] },
    L4: { fx: ['haki'] }, A4: { fx: ['haki', 'quake'] },
  },
  buggy: {
    L1: { fx: [ARC.white] }, L2: { fx: [ARC.white] }, L3: { pose: 'kick' },
    M1: { fx: [ARC.white, 'slash'] }, M2: { pose: 'kick', hits: 2, hitEvery: 5, fx: [ARC.white] },
    H1: { pose: 'kick', proj: { art: 'buggyball', artK: 1.7, sprite: 'cannonball', elem: 'fire', speed: 12, r: 20, dmg: 70 }, call: 'Muggy Ball' },
    L4: { fx: [ARC.white] }, A4: { fx: [ARC.white, 'slash'] },
  },
  smoker: {
    L1: { fx: [ARC.white] }, L2: { fx: [ARC.white] }, L3: { reach: 1.3, fx: [ARC.white] },
    M1: { reach: 1.3, fx: [ARC.white, 'smoke'] }, M2: { hits: 3, hitEvery: 4, fx: ['smoke'] },
    H1: { pose: 'special', remote: 260, fx: ['smoke', 'smoke'], elem: 'smoke', call: 'White Snake' },
    L4: { fx: ['smoke'], call: 'White Vine' }, A4: { fx: ['smoke'] },
  },
  marco: {
    speed: -1,
    L1: { fx: ['bluefire'] }, L2: { fx: ['bluefire'] }, L3: { fx: ['bluefire'] },
    M1: { fx: ['bluefire'] }, M2: { hits: 2, hitEvery: 5, fx: ['bluefire'] },
    H1: { reach: 1.3, fx: ['bluefire', 'bluefire'], elem: 'bluefire' },
    L4: { fx: ['bluefire'] }, A4: { fx: ['bluefire'] },
  },
  sabo: {
    L1: { fx: [ARC.gold] }, L2: { fx: [ARC.gold] }, L3: { reach: 1.3, fx: [ARC.gold] },
    M1: { pose: 'special', fx: ['haki'] }, M2: { hits: 3, hitEvery: 4, fx: [ARC.gold] },
    H1: { pose: 'special', reach: 1.3, fx: ['fire', 'haki'], elem: 'fire' },
    L4: { fx: ['fire'] }, A4: { fx: ['fire', 'quake'] },
  },
  yamato: {
    speed: 1, power: 1.05,
    L1: { reach: 1.3, fx: [ARC.ice] }, L2: { reach: 1.3, fx: [ARC.ice] }, L3: { reach: 1.3, fx: [ARC.ice] },
    M1: { reach: 1.4, fx: [ARC.ice, 'ice'] }, M2: { reach: 1.4, fx: [ARC.ice] },
    H1: { reach: 1.5, fx: ['ice', 'quake'], elem: 'ice', call: 'Mahoroba' },
    L4: { fx: ['ice'] }, A4: { fx: ['ice', 'quake'] },
  },
  arlong: {
    speed: 1, power: 1.1,
    L1: { reach: 1.4, fx: [ARC.white] }, L2: { reach: 1.4, fx: [ARC.white] }, L3: { reach: 1.4, fx: [ARC.white] },
    M1: { reach: 1.5, fx: [ARC.white, 'slash'] }, M2: { reach: 1.5, hits: 2, hitEvery: 5, fx: [ARC.white] },
    H1: { reach: 1.6, fx: ['water', 'slash'], elem: 'water' },
    L4: { fx: ['water'] }, A4: { fx: ['water', 'quake'] },
  },
  kuma: {
    speed: 2, power: 1.2,
    L1: { fx: ['paw'] }, L2: { fx: ['paw'] }, L3: { pose: 'kick', fx: ['paw'] },
    M1: { pose: 'special', proj: { art: 'pawcannon', artK: 2.2, sprite: 'orb', elem: 'paw', speed: 14, r: 18, dmg: 45 } },
    M2: { pose: 'kick', fx: ['paw'] },
    H1: { pose: 'special', reach: 1.3, fx: ['paw', 'quake'], elem: 'paw' },
    L4: { fx: ['paw'] }, A4: { fx: ['paw', 'quake'] },
  },
  enel: {
    L1: { fx: [ARC.gold] }, L2: { fx: [ARC.gold] }, L3: { reach: 1.4, fx: [ARC.gold] },
    M1: { reach: 1.4, fx: [ARC.gold, 'lightning'] }, M2: { hits: 3, hitEvery: 4, fx: ['lightning'] },
    H1: { pose: 'special', remote: 240, fx: ['lightning', 'lightning'], elem: 'lightning', call: 'Kari' },
    L4: { fx: ['lightning'] }, A4: { fx: ['lightning'] },
  },
};

// Merge a kit over the base normal table.
function applyKit(ch, mv) {
  const kit = KITS[ch.id] || {};
  for (const key of ['L1', 'L2', 'L3', 'M1', 'M2', 'H1', 'L4', 'A1', 'A2', 'A3', 'AM', 'A4']) {
    const d = mv[key], k = kit[key] || {};
    d.hit = Object.assign({}, d.hit);
    d.startup = Math.max(3, d.startup + (kit.speed || 0) + (k.startup || 0));
    d.hit.dmg = Math.round(d.hit.dmg * (kit.power || 1) * (k.dmg || 1));
    if (k.pose) d.spritePose = k.pose;
    if (k.call) d.call = k.call;
    if (k.elem) d.hit.elem = k.elem;
    if (k.fx) d.fx = k.fx;
    if (k.hits) { d.hits = k.hits; d.hitEvery = k.hitEvery || 4; d.multi = { hitstun: 18, kb: [1.5, 0] }; d.active = Math.max(d.active, k.hits * d.hitEvery); }
    if (k.reach && d.box) d.box = Object.assign({}, d.box, { w: d.box.w * k.reach });
    if (k.arms) d.arms = k.arms;
    if (k.tilt) d.tilt = k.tilt;
    if (k.stretch) { d.stretchRange = k.stretch; d.box = Object.assign({}, d.box, { x: 10, w: k.stretch }); }
    if (k.remote) d.remote = k.remote;
    if (k.step) d.step = k.step;
    if (k.comp) d.comp = k.comp;
    if (k.proj) { d.proj = k.proj; d.box = null; }
  }
  return mv;
}

// Fired on the first active frame of a normal: effects, projectiles, teleport steps.
function strikeFX(f, g, d) {
  if (d.step) {
    FX.burst(f.x, f.y - f.height * 0.5, d.hit.elem, 12, 6, 6, 18);
    f.x = clamp(f.x + f.facing * d.step, g.camX + 40, g.camX + W - 40); f.trail = 8;
  }
  if (d.proj) {
    const p = d.proj, n = p.count || 1;
    const hp = handPt(f, d.spritePose || 'special') || spawnPt(f);
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      g.addEnt(new Proj({
        owner: f, x: hp.x, y: hp.y + k * (p.spread || 0), vx: f.facing * p.speed, vy: (p.vy || 0) + k * 0.5,
        r: p.r, sprite: p.sprite, art: p.art, artK: p.artK, elem: p.elem, hits: p.hits || 1, hitEvery: 6, life: p.life || 60, clash: true,
        hit: { dmg: Math.round(p.dmg * (KITS[f.ch.id] && KITS[f.ch.id].power || 1)), hitstun: 22, blockstun: 12, kb: [5, 0], strength: 2, elem: p.elem, chip: 0.1 },
      }));
    }
    Sound.play('proj');
  }
  const box = f.attackBox(true);
  if (!box) return;
  let cx = f.facing > 0 ? box.x + box.w * 0.8 : box.x + box.w * 0.2, cy = box.y + box.h / 2;
  // sprite fighters: impact effects sit on the drawn fist / foot / blade tip, never past what can actually hit
  const st = !d.remote && Sprites.has(f.ch.id) && f.drawnStrike ? f.drawnStrike() : null;
  const back = st ? f.facing * 20 : 0;   // centre impact art a little behind the tip so it never splashes far past it
  if (st) { cx = st.x; cy = st.y; }
  for (const fx of d.fx || []) {
    if (fx.startsWith('arc:')) FX.arc(f.x + f.facing * 20 * f.hs, cy, st ? Math.max(40, Math.abs(st.x - f.x) - 20 * f.hs) : Math.max(70, box.w * 0.9), f.facing, fx.slice(4));
    else if (fx === 'rubber') FX.ring(cx, cy, '#ffffff', 6, 40, 8, 4);
    else FX.burst(cx, cy, fx === 'room' ? 'room' : fx, 10, 6, 7, 20, fx === 'fire' || fx === 'magma' ? -0.15 : 0);
    if (fx === 'quake') FX.ring(cx, cy, '#ffffff', 10, 90, 12, 4);
    if (fx === 'lightning') FX.bolt(cx - f.facing * 50, cy - 40, cx + f.facing * (st ? 10 : 30), cy + 30, '#fff176', 6, 4);
    if (fx === 'string') for (let i = 0; i < 3; i++) FX.bolt(f.x, cy - 30 + i * 30, cx + f.facing * 30, cy - 20 + i * 20, '#ffffff', 7, 1.5);
    if (fx === 'flower') { FX.petals(cx, cy, 10); if (d.remote && FXImg.get('manohand')) FX.add({ type: 'art', id: 'manohand', x: cx, y: cy + 10, h: 150, life: 14 }); }
    if (fx === 'quake' && FXImg.get('quake')) FX.add({ type: 'art', id: 'quake', x: cx - back, y: cy, h: st ? 100 : 150, life: 12 });
    if (fx === 'love') FX.hearts(cx, cy, 4);
    if (fx === 'slash') FX.slashLine(cx - back * 1.5, cy, 120, -0.6 * f.facing, '#ffffff', 8);
    if (fx === 'haki') FX.bolt(cx - back * 2, cy, cx + f.facing * (st ? 15 : 60), cy - 40, choice(['#111', '#d50000']), 7, 4);
    if (fx === 'room') FX.slashLine(cx - back * 2, cy, 140, rand(-1, 1), '#80deea', 8);
    if (fx === 'water') FX.ring(cx, cy, '#4fc3f7', 10, 70, 12, 5);
  }
  if (d.comp && f.comp && f.comp[d.comp]) { const c = f.comp[d.comp]; c.x = cx; c.y = cy - 30; }
}
