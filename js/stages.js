'use strict';
// Procedural parallax backgrounds. draw(ctx, camX, t) paints the full screen.
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}
function cloud(ctx, x, y, s, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, 30 * s, 0, TAU); ctx.arc(x + 35 * s, y - 15 * s, 38 * s, 0, TAU);
  ctx.arc(x + 75 * s, y, 30 * s, 0, TAU); ctx.arc(x + 38 * s, y + 10 * s, 30 * s, 0, TAU);
  ctx.fill();
}
const wrap = (v, m) => ((v % m) + m) % m;

const OLD_STAGES = [
  {
    id: 'sunny', name: 'THOUSAND SUNNY', music: 'sunny', thumb: ['#5ec8ff', '#6abf4b'],
    draw(ctx, camX, t) {
      ctx.fillStyle = vgrad(ctx, 0, 460, ['#2f8fe0', '#7fd3ff', '#d4f3ff']); ctx.fillRect(0, 0, W, 460);
      ctx.fillStyle = 'rgba(255,255,220,0.8)'; ctx.beginPath(); ctx.arc(1050 - camX * 0.05, 110, 60, 0, TAU); ctx.fill();
      for (let i = 0; i < 7; i++) cloud(ctx, wrap(i * 330 - camX * 0.1 + t * 0.15, W + 400) - 200, 80 + (i % 3) * 60, 0.8 + (i % 2) * 0.4, 'rgba(255,255,255,0.9)');
      // islands
      ctx.fillStyle = '#4f8f6a';
      for (let i = 0; i < 4; i++) { const x = wrap(i * 520 - camX * 0.2, W + 600) - 300; ctx.beginPath(); ctx.ellipse(x, 430, 160, 40, 0, Math.PI, TAU); ctx.fill(); }
      // sea
      ctx.fillStyle = vgrad(ctx, 420, 600, ['#1e88e5', '#0d47a1']); ctx.fillRect(0, 420, W, 200);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (let r = 0; r < 5; r++) {
        ctx.beginPath();
        for (let x = -40; x < W + 40; x += 40) { const xx = x - wrap(camX * (0.3 + r * 0.1) + t * (0.5 + r * 0.2), 40); ctx.moveTo(xx, 440 + r * 30); ctx.quadraticCurveTo(xx + 10, 434 + r * 30, xx + 20, 440 + r * 30); }
        ctx.stroke();
      }
      ctx.save(); ctx.translate(-camX, 0);
      // mast & sail
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(1180, 0, 40, 600);
      ctx.fillStyle = '#fafafa'; ctx.strokeStyle = '#ccc'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(1000, 60); ctx.quadraticCurveTo(1200, 30, 1400, 60); ctx.lineTo(1420, 330); ctx.quadraticCurveTo(1200, 360, 980, 330); ctx.closePath(); ctx.fill(); ctx.stroke();
      // jolly roger with straw hat
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(1200, 200, 62, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(1200, 195, 40, 0, TAU); ctx.fill(); ctx.fillRect(1180, 220, 40, 25);
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(1185, 195, 9, 0, TAU); ctx.arc(1215, 195, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f2cf63'; ctx.beginPath(); ctx.ellipse(1200, 165, 62, 12, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(1200, 158, 34, 26, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#d32f2f'; ctx.fillRect(1166, 148, 68, 9);
      // railing
      ctx.fillStyle = '#a8713a'; ctx.fillRect(0, 520, STAGE_W, 14);
      for (let x = 0; x < STAGE_W; x += 60) ctx.fillRect(x, 520, 10, 70);
      ctx.fillStyle = '#7a4f24'; ctx.fillRect(0, 580, STAGE_W, 20);
      // lawn deck
      ctx.fillStyle = '#6abf4b'; ctx.fillRect(0, 600, STAGE_W, 120);
      ctx.fillStyle = '#5aa83d'; for (let x = 0; x < STAGE_W; x += 120) ctx.fillRect(x, 600, 60, 120);
      ctx.restore();
    },
  },
  {
    id: 'marineford', name: 'MARINEFORD', music: 'marineford', thumb: ['#ffab91', '#9e9e9e'],
    draw(ctx, camX, t) {
      ctx.fillStyle = vgrad(ctx, 0, 450, ['#5d4a6b', '#d8846a', '#ffd3a8']); ctx.fillRect(0, 0, W, 450);
      for (let i = 0; i < 5; i++) cloud(ctx, wrap(i * 380 - camX * 0.08 + t * 0.1, W + 400) - 200, 70 + (i % 2) * 50, 1, 'rgba(120,90,110,0.5)');
      // HQ fortress
      ctx.save(); ctx.translate(-camX * 0.25 + 250, 0);
      ctx.fillStyle = '#eceff1'; ctx.fillRect(200, 150, 520, 290);
      ctx.fillRect(380, 60, 160, 120);
      ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.moveTo(370, 60); ctx.lineTo(460, 10); ctx.lineTo(550, 60); ctx.fill();
      ctx.fillRect(200, 140, 520, 16);
      ctx.fillStyle = '#90a4ae'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) ctx.fillRect(225 + i * 82, 190 + j * 75, 36, 46);
      drawText(ctx, 'MARINE', 460, 120, 44, '#1e3a8a', null);
      ctx.restore();
      // frozen bay
      ctx.fillStyle = vgrad(ctx, 430, 600, ['#b3e5fc', '#e1f5fe']); ctx.fillRect(0, 430, W, 180);
      ctx.save(); ctx.translate(-camX * 0.5, 0);
      for (let i = 0; i < 6; i++) {
        const x = i * 400 + 80;
        ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.moveTo(x, 480); ctx.lineTo(x + 180, 480); ctx.lineTo(x + 150, 520); ctx.lineTo(x + 30, 520); ctx.fill();
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(x + 85, 400, 8, 80);
        ctx.fillStyle = '#fafafa'; ctx.fillRect(x + 60, 410, 60, 45);
        ctx.fillStyle = '#1e63c4'; ctx.fillRect(x + 80, 425, 20, 15);
      }
      ctx.restore();
      ctx.save(); ctx.translate(-camX, 0);
      ctx.fillStyle = '#8d8d8d'; ctx.fillRect(0, 590, STAGE_W, 130);
      ctx.strokeStyle = '#6b6b6b'; ctx.lineWidth = 3;
      for (let x = 0; x < STAGE_W; x += 140) { ctx.beginPath(); ctx.moveTo(x, 590); ctx.lineTo(x - 40, 720); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, 650); ctx.lineTo(STAGE_W, 650); ctx.stroke();
      ctx.fillStyle = '#bdbdbd'; ctx.fillRect(0, 585, STAGE_W, 10);
      ctx.restore();
      // embers
      ctx.fillStyle = 'rgba(255,170,90,0.8)';
      for (let i = 0; i < 30; i++) { const x = wrap(i * 97 + t * (0.6 + (i % 3) * 0.3) - camX * 0.6, W), y = wrap(i * 53 - t * (1 + (i % 4) * 0.4), 600); ctx.fillRect(x, y, 3, 3); }
    },
  },
  {
    id: 'wano', name: 'WANO COUNTRY', music: 'wano', thumb: ['#ff8a65', '#8d3a2a'],
    draw(ctx, camX, t) {
      ctx.fillStyle = vgrad(ctx, 0, 480, ['#6a1b4d', '#e64a19', '#ffcc80']); ctx.fillRect(0, 0, W, 480);
      ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc(900 - camX * 0.05, 250, 110, 0, TAU); ctx.fill();
      // mountain
      ctx.save(); ctx.translate(-camX * 0.1, 0);
      ctx.fillStyle = '#5d3a5a'; ctx.beginPath(); ctx.moveTo(150, 480); ctx.lineTo(560, 160); ctx.lineTo(980, 480); ctx.fill();
      ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.moveTo(480, 222); ctx.lineTo(560, 160); ctx.lineTo(640, 222); ctx.lineTo(600, 210); ctx.lineTo(560, 230); ctx.lineTo(520, 212); ctx.fill();
      ctx.restore();
      // castle
      ctx.save(); ctx.translate(-camX * 0.35 + 900, 0);
      ctx.fillStyle = '#3e1a1a';
      for (let i = 0; i < 4; i++) {
        const w = 260 - i * 50, y = 480 - i * 70;
        ctx.fillRect(-w / 2 + 10, y - 50, w - 20, 50);
        ctx.beginPath(); ctx.moveTo(-w / 2 - 20, y - 50); ctx.lineTo(w / 2 + 20, y - 50); ctx.lineTo(w / 2 - 20, y - 75); ctx.lineTo(-w / 2 + 20, y - 75); ctx.fill();
      }
      ctx.restore();
      // sakura
      ctx.save(); ctx.translate(-camX * 0.6, 0);
      for (let i = 0; i < 9; i++) {
        const x = i * 330 + 60;
        ctx.fillStyle = '#4e342e'; ctx.fillRect(x - 8, 430, 16, 150);
        ctx.fillStyle = '#f48fb1'; for (const [a, b, r] of [[0, 400, 60], [-50, 430, 45], [50, 425, 48], [0, 360, 40]]) { ctx.beginPath(); ctx.arc(x + a, b, r, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#f8bbd0'; ctx.beginPath(); ctx.arc(x - 15, 385, 25, 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.save(); ctx.translate(-camX, 0);
      ctx.fillStyle = '#8d3a2a'; ctx.fillRect(0, 560, STAGE_W, 20);
      for (let x = 0; x < STAGE_W; x += 90) ctx.fillRect(x, 520, 12, 60);
      ctx.fillStyle = '#a0522d'; ctx.fillRect(0, 515, STAGE_W, 10);
      ctx.fillStyle = '#6d3b1f'; ctx.fillRect(0, 580, STAGE_W, 140);
      ctx.strokeStyle = '#4e2a14'; ctx.lineWidth = 3;
      for (let x = 0; x < STAGE_W; x += 70) { ctx.beginPath(); ctx.moveTo(x, 580); ctx.lineTo(x, 720); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#f8bbd0';
      for (let i = 0; i < 40; i++) { const x = wrap(i * 71 + t * 1.2 - camX * 0.8 + Math.sin(t * 0.03 + i) * 30, W), y = wrap(i * 37 + t * (1 + (i % 3) * 0.5), H); ctx.beginPath(); ctx.ellipse(x, y, 5, 3, t * 0.05 + i, 0, TAU); ctx.fill(); }
    },
  },
  {
    id: 'alabasta', name: 'ALABASTA DESERT', music: 'alabasta', thumb: ['#ffe082', '#e0c27a'],
    draw(ctx, camX, t) {
      ctx.fillStyle = vgrad(ctx, 0, 460, ['#ffb74d', '#ffe0b2', '#fff8e1']); ctx.fillRect(0, 0, W, 460);
      ctx.fillStyle = 'rgba(255,255,240,0.95)'; ctx.beginPath(); ctx.arc(300 - camX * 0.05, 130, 80, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8c37a'; ctx.beginPath(); ctx.moveTo(0, 460);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 400 + Math.sin((x + camX * 0.15) * 0.008) * 40); ctx.lineTo(W, 600); ctx.lineTo(0, 600); ctx.fill();
      // palace
      ctx.save(); ctx.translate(-camX * 0.3 + 700, 0);
      ctx.fillStyle = '#f5e6c8'; ctx.fillRect(0, 290, 380, 150);
      ctx.fillRect(150, 210, 80, 90);
      ctx.beginPath(); ctx.arc(190, 210, 50, Math.PI, TAU); ctx.fill();
      for (const x of [20, 340]) { ctx.fillRect(x, 230, 26, 80); ctx.beginPath(); ctx.arc(x + 13, 230, 18, Math.PI, TAU); ctx.fill(); }
      ctx.fillStyle = '#c8a46a'; for (let i = 0; i < 8; i++) ctx.fillRect(20 + i * 46, 330, 18, 40);
      ctx.restore();
      ctx.fillStyle = '#dcae62'; ctx.beginPath(); ctx.moveTo(0, 600);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 500 + Math.sin((x + camX * 0.4) * 0.006 + 1) * 35); ctx.lineTo(W, 600); ctx.fill();
      ctx.save(); ctx.translate(-camX, 0);
      ctx.fillStyle = '#e0c27a'; ctx.fillRect(0, 590, STAGE_W, 130);
      ctx.strokeStyle = 'rgba(160,120,60,0.4)'; ctx.lineWidth = 3;
      for (let r = 0; r < 4; r++) { ctx.beginPath(); for (let x = 0; x < STAGE_W; x += 30) ctx.lineTo(x, 620 + r * 26 + Math.sin(x * 0.03 + r) * 5); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(220,180,110,0.6)'; // blowing sand
      for (let i = 0; i < 50; i++) { const x = wrap(i * 53 - t * (4 + (i % 4)) - camX * 0.8, W), y = 300 + wrap(i * 41, 400); ctx.fillRect(x, y, 8, 2); }
    },
  },
];

// ---------------------------------------------------------------- painted stages
// Background = painted image in stages/<id>.jpg (parallax), foreground = platform drawn here in world space.
const PLATFORM_Y = 596;
function platformBase(ctx, top, mid, bottom, edge) {
  const g = ctx.createLinearGradient(0, PLATFORM_Y, 0, H);
  g.addColorStop(0, top); g.addColorStop(0.35, mid); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, PLATFORM_Y, STAGE_W, H - PLATFORM_Y);
  ctx.fillStyle = edge; ctx.fillRect(0, PLATFORM_Y - 4, STAGE_W, 8);
}
const PLATFORMS = {
  sunny(ctx) {   // lawn deck with a wooden rim
    platformBase(ctx, '#7ccf4f', '#5fb33b', '#3f8a26', '#9be06a');
    ctx.fillStyle = 'rgba(40,110,20,0.35)';
    for (let x = 0; x < STAGE_W; x += 7) { const h = 6 + (x * 37 % 11); ctx.fillRect(x, PLATFORM_Y + 4 + (x * 13 % 30), 2, h); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(0, 688, STAGE_W, 32);
    ctx.fillStyle = '#6d4420'; for (let x = 0; x < STAGE_W; x += 120) ctx.fillRect(x, 688, 4, 32);
  },
  marineford(ctx) {   // grey stone plaza, cracked
    platformBase(ctx, '#b0bec5', '#90a4ae', '#607d8b', '#eceff1');
    ctx.strokeStyle = 'rgba(55,71,79,0.5)'; ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(0, PLATFORM_Y + 30 + r * 28); ctx.lineTo(STAGE_W, PLATFORM_Y + 30 + r * 28); ctx.stroke(); }
    for (let x = 0; x < STAGE_W; x += 90) for (let r = 0; r < 4; r++) { const ox = (r % 2) * 45; ctx.beginPath(); ctx.moveTo(x + ox, PLATFORM_Y + 2 + r * 28); ctx.lineTo(x + ox, PLATFORM_Y + 30 + r * 28); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(38,50,56,0.6)';
    for (let i = 0; i < 12; i++) { const x = i * 211 + 50; ctx.beginPath(); ctx.moveTo(x, PLATFORM_Y + 10); ctx.lineTo(x + 20, PLATFORM_Y + 40); ctx.lineTo(x + 5, PLATFORM_Y + 70); ctx.stroke(); }
  },
  wano(ctx) {   // red wooden bridge
    platformBase(ctx, '#a1552b', '#7f3d1c', '#4e2410', '#d1824f');
    ctx.fillStyle = 'rgba(40,15,5,0.45)'; for (let x = 0; x < STAGE_W; x += 64) ctx.fillRect(x, PLATFORM_Y + 4, 4, H - PLATFORM_Y);
    ctx.fillStyle = '#c62828'; ctx.fillRect(0, 680, STAGE_W, 14);
    for (let x = 30; x < STAGE_W; x += 200) { ctx.fillRect(x, 662, 16, 58); ctx.fillStyle = '#ffd54f'; ctx.fillRect(x - 2, 660, 20, 6); ctx.fillStyle = '#c62828'; }
  },
  alabasta(ctx) {   // sandstone tiles
    platformBase(ctx, '#f0d49a', '#d9b46a', '#a87d3e', '#fff3d1');
    ctx.strokeStyle = 'rgba(120,85,40,0.45)'; ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(0, PLATFORM_Y + 32 + r * 30); ctx.lineTo(STAGE_W, PLATFORM_Y + 32 + r * 30); ctx.stroke(); }
    for (let x = 0; x < STAGE_W; x += 110) for (let r = 0; r < 4; r++) { const ox = (r % 2) * 55; ctx.beginPath(); ctx.moveTo(x + ox, PLATFORM_Y + 2 + r * 30); ctx.lineTo(x + ox, PLATFORM_Y + 32 + r * 30); ctx.stroke(); }
  },
  enies(ctx) {   // white marble with blue trim
    platformBase(ctx, '#fafafa', '#e3e8ef', '#b0bccb', '#ffffff');
    ctx.fillStyle = 'rgba(30,99,196,0.18)';
    for (let x = 0; x < STAGE_W; x += 80) for (let r = 0; r < 4; r++) if ((x / 80 + r) % 2) ctx.fillRect(x, PLATFORM_Y + 4 + r * 30, 80, 30);
    ctx.fillStyle = '#1e63c4'; ctx.fillRect(0, PLATFORM_Y + 4, STAGE_W, 5);
  },
  skyisland(ctx) {   // golden ruin bricks on a cloud
    platformBase(ctx, '#ffe082', '#d4a52a', '#9c6f12', '#fff8e1');
    ctx.strokeStyle = 'rgba(110,70,0,0.5)'; ctx.lineWidth = 2;
    for (let x = 0; x < STAGE_W; x += 70) { ctx.beginPath(); ctx.moveTo(x, PLATFORM_Y + 4); ctx.lineTo(x, 660); ctx.stroke(); }
    ctx.fillStyle = '#ffffff';
    for (let x = -40; x < STAGE_W + 60; x += 70) { ctx.beginPath(); ctx.arc(x, 700, 46 + (x * 7 % 13), 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(102,187,106,0.8)';
    for (let x = 20; x < STAGE_W; x += 260) { ctx.beginPath(); ctx.ellipse(x, PLATFORM_Y + 6, 40, 10, 0, 0, TAU); ctx.fill(); }
  },
  thriller(ctx, t) {   // dark graveyard ground with mist
    platformBase(ctx, '#4a3b5c', '#33274a', '#1a1226', '#6e5a8a');
    ctx.fillStyle = '#2a213a';
    for (let x = 60; x < STAGE_W; x += 330) { ctx.beginPath(); ctx.arc(x + 17, PLATFORM_Y - 16, 17, Math.PI, TAU); ctx.rect(x, PLATFORM_Y - 16, 34, 26); ctx.fill(); }
    ctx.fillStyle = 'rgba(200,180,255,0.12)';
    for (let i = 0; i < 14; i++) { const x = wrap(i * 190 + t * 0.6, STAGE_W + 200) - 100; ctx.beginPath(); ctx.ellipse(x, 640 + (i % 3) * 18, 140, 22, 0, 0, TAU); ctx.fill(); }
  },
  elbaph(ctx) {   // giant wooden planks under snow
    platformBase(ctx, '#f5f9ff', '#8d6e63', '#4e342e', '#ffffff');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, PLATFORM_Y - 2, STAGE_W, 16);
    for (let x = 0; x < STAGE_W; x += 40) { ctx.beginPath(); ctx.arc(x, PLATFORM_Y + 12, 12 + (x * 3 % 7), 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(40,20,10,0.45)'; for (let x = 0; x < STAGE_W; x += 140) ctx.fillRect(x, PLATFORM_Y + 20, 5, H - PLATFORM_Y);
  },
};
const STAGE_FX = {   // screen-space ambience
  wano(ctx, t) { ctx.fillStyle = '#f8bbd0'; for (let i = 0; i < 30; i++) { const x = wrap(i * 71 + t * 1.2 + Math.sin(t * 0.03 + i) * 30, W), y = wrap(i * 37 + t * (1 + (i % 3) * 0.5), H); ctx.beginPath(); ctx.ellipse(x, y, 5, 3, t * 0.05 + i, 0, TAU); ctx.fill(); } },
  elbaph(ctx, t) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 60; i++) { const x = wrap(i * 53 + Math.sin(t * 0.02 + i) * 20, W), y = wrap(i * 29 + t * (0.8 + (i % 4) * 0.3), H); ctx.fillRect(x, y, 3, 3); } },
  thriller(ctx) { ctx.fillStyle = 'rgba(180,160,255,0.06)'; ctx.fillRect(0, 0, W, H); },
  skyisland(ctx, t) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 20; i++) { const x = wrap(i * 97 + t * 0.4, W), y = wrap(i * 61, 560); ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 0.1 + i); ctx.fillRect(x, y, 3, 3); } ctx.globalAlpha = 1; },
  alabasta(ctx, t) { ctx.fillStyle = 'rgba(220,180,110,0.5)'; for (let i = 0; i < 40; i++) { const x = wrap(i * 53 - t * (4 + (i % 4)), W), y = 300 + wrap(i * 41, 400); ctx.fillRect(x, y, 8, 2); } },
};
const STAGE_IMG = {};
// Where the painted ground starts in each background (fraction of image height)
const GROUND_FRAC = { imu: 0.82, sunny: 0.8, marineford: 0.82, wano: 0.83, alabasta: 0.85, enies: 0.84, skyisland: 0.86, thriller: 0.83, elbaph: 0.82 };
const GROUND_TOP = 600;   // screen y where the painted ground begins (fighters stand at GROUND_Y)

// Build a seamless floor strip from the painting's own ground: the band plus its mirror image.
function makeGroundTile(im, frac) {
  const sy = Math.floor(im.height * frac), sh = im.height - sy;
  const th = H - GROUND_TOP + 30, tw = Math.round(im.width * th / sh);
  const c = document.createElement('canvas');
  c.width = tw * 2; c.height = th;
  const g = c.getContext('2d');
  g.drawImage(im, 0, sy, im.width, sh, 0, 0, tw, th);
  g.save(); g.translate(tw * 2, 0); g.scale(-1, 1); g.drawImage(im, 0, sy, im.width, sh, 0, 0, tw, th); g.restore();
  // fade the top edge so it melts into the scenery behind
  g.globalCompositeOperation = 'destination-in';
  const fade = g.createLinearGradient(0, 0, 0, 30);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fade; g.fillRect(0, 0, c.width, c.height);
  return c;
}

function paintedStage(id, name, music, fallback) {
  const img = new Image();
  img.onload = () => { STAGE_IMG[id] = img; STAGE_IMG[id + '_ground'] = makeGroundTile(img, GROUND_FRAC[id] || 0.82); };
  img.src = 'stages/' + id + '.jpg';
  const fb = OLD_STAGES.find(s => s.id === fallback) || OLD_STAGES[0];
  return {
    id, name, music, thumb: fb.thumb,
    draw(ctx, camX, t) {
      const im = STAGE_IMG[id], tile = STAGE_IMG[id + '_ground'];
      if (!im) { fb.draw(ctx, camX, t); return; }
      // scenery: scaled so its painted ground lines up with GROUND_TOP, scrolled with parallax
      const frac = GROUND_FRAC[id] || 0.82;
      const h = GROUND_TOP / frac, w = Math.max(W + 200, im.width * h / im.height);
      const k = (w - W) / (STAGE_W - W);
      ctx.drawImage(im, -camX * k, 0, w, h);
      // floor: the same painted ground, moving 1:1 with the fighters
      if (tile) {
        const y = GROUND_TOP - 30;
        let x0 = -(camX % tile.width);
        for (let x = x0; x < W; x += tile.width) ctx.drawImage(tile, x, y);
      }
      if (STAGE_FX[id]) STAGE_FX[id](ctx, t);
    },
  };
}
const BOSS_STAGE = paintedStage('imu', 'THE EMPTY THRONE', 'boss', 'marineford');
const STAGES = [
  paintedStage('sunny', 'THOUSAND SUNNY', 'sunny', 'sunny'),
  paintedStage('marineford', 'MARINEFORD', 'marineford', 'marineford'),
  paintedStage('wano', 'WANO COUNTRY', 'wano', 'wano'),
  paintedStage('alabasta', 'ALABASTA', 'alabasta', 'alabasta'),
  paintedStage('enies', 'ENIES LOBBY', 'enies', 'marineford'),
  paintedStage('skyisland', 'SKY ISLAND', 'skyisland', 'sunny'),
  paintedStage('thriller', 'THRILLER BARK', 'thriller', 'marineford'),
  paintedStage('elbaph', 'ELBAPH', 'elbaph', 'marineford'),
];
