'use strict';
// Procedural chibi renderer. Local space faces right (+x); angles are measured from
// "straight down", positive = rotate forward. Torso frame origin = hip, up = -y.
let MONO = null; // when set, everything is drawn in this colour (afterimages)
const C = c => MONO || c;
const OUT = '#1a1a1a';
const _shade = {};
function shade(hex, amt) {
  const k = hex + amt; if (_shade[k]) return _shade[k];
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const rgb = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
  const out = '#' + rgb.map(v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255).toString(16).padStart(2, '0')).join('');
  return (_shade[k] = out);
}
const BUILDS = {
  normal: { tw: 19, th: 44, limb: 12, ua: 21, fa: 19, th1: 25, sh: 24, R: 34 },
  kid: { tw: 18, th: 32, limb: 12, ua: 16, fa: 15, th1: 16, sh: 15, R: 37 },
  slim: { tw: 16, th: 50, limb: 10, ua: 24, fa: 22, th1: 30, sh: 29, R: 32 },
  big: { tw: 25, th: 50, limb: 15, ua: 23, fa: 22, th1: 26, sh: 25, R: 33 },
  fat: { tw: 33, th: 52, limb: 16, ua: 22, fa: 21, th1: 23, sh: 22, R: 33 },
};
const BASE_POSE = {
  lean: 0, headTilt: 0, yOff: 0, xOff: 0, spin: 0, lying: 0, squash: 0,
  armF: 0.45, elbowF: 1.9, armB: 0.25, elbowB: 1.7, armFExt: 1, armBExt: 1,
  legF: 0.3, kneeF: -0.25, legB: -0.25, kneeB: -0.2, wpn: 0.5, expr: 'normal', plant: true,
};
const makePose = over => Object.assign({}, BASE_POSE, over);
function lerpPose(a, b, t) {
  const o = Object.assign({}, a);
  for (const k in b) {
    if (typeof b[k] === 'number' && typeof a[k] === 'number') o[k] = a[k] + (b[k] - a[k]) * t;
    else if (t >= 0.5) o[k] = b[k];
  }
  return o;
}
const pt = (x, y, a, len) => [x + Math.sin(a) * len, y + Math.cos(a) * len];

function limb(ctx, x1, y1, x2, y2, w, col) {
  ctx.lineCap = 'round';
  if (!MONO) { ctx.strokeStyle = OUT; ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function circ(ctx, x, y, r, col, outline) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = C(col); ctx.fill();
  if (outline !== false && !MONO) { ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
}
function ell(ctx, x, y, rx, ry, rot, col, outline) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); ctx.fillStyle = C(col); ctx.fill();
  if (outline !== false && !MONO) { ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
}
function fillPath(ctx, col, outline) {
  ctx.fillStyle = C(col); ctx.fill();
  if (outline !== false && !MONO) { ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function poly(ctx, pts, col, outline) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); fillPath(ctx, col, outline);
}
const has = (look, x) => look.extras && look.extras.includes(x);

// ---------------------------------------------------------------- body
function drawChar(ctx, look, x, y, facing, pose, o) {
  o = o || {};
  const s = (look.scale || 1) * (o.scale || 1);
  const B = BUILDS[look.build || 'normal'];
  const t = o.t || 0;
  ctx.save();
  ctx.translate(x + pose.xOff * facing, y + pose.yOff);
  ctx.scale(facing * s, s);
  if (pose.squash) ctx.scale(1 + pose.squash, 1 - pose.squash);

  const tF = pose.legF, sF = pose.legF + pose.kneeF, tB = pose.legB, sB = pose.legB + pose.kneeB;
  const footF = [Math.sin(tF) * B.th1 + Math.sin(sF) * B.sh, Math.cos(tF) * B.th1 + Math.cos(sF) * B.sh];
  const footB = [Math.sin(tB) * B.th1 + Math.sin(sB) * B.sh, Math.cos(tB) * B.th1 + Math.cos(sB) * B.sh];
  let hipY = pose.plant && !pose.lying ? -Math.max(footF[1], footB[1]) - 5 : -(B.th1 + B.sh);
  if (pose.lying) { ctx.translate(-10, -B.tw - 4); ctx.rotate(-Math.PI / 2 * pose.lying); }
  if (pose.spin) { const cy = hipY - B.th / 2; ctx.translate(0, cy); ctx.rotate(pose.spin); ctx.translate(0, -cy); }

  if (o.aura) {
    const g = ctx.createRadialGradient(0, hipY - B.th / 2, 10, 0, hipY - B.th / 2, 130);
    g.addColorStop(0, o.aura); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha *= 0.55 + Math.sin(t * 0.3) * 0.15;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, hipY - B.th / 2, 130, 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.55 + Math.sin(t * 0.3) * 0.15;
  }

  const torso = () => { ctx.save(); ctx.translate(0, hipY); ctx.rotate(pose.lean); };
  const shF = [B.tw * 0.72, -B.th + 9], shB = [-B.tw * 0.6, -B.th + 9];

  // cape / coat (behind)
  if (look.coat) { torso(); drawCoatBack(ctx, look, B, pose, t, o.vx || 0); ctx.restore(); }
  // back arm
  if (!look.oneArm) {
    torso();
    drawArm(ctx, look, B, shB[0], shB[1], pose.armB, pose.elbowB, pose.armBExt, false, pose);
    ctx.restore();
  }
  // legs
  ctx.save(); ctx.translate(0, hipY);
  drawLeg(ctx, look, B, -B.tw * 0.35, -2, tB, sB, false);
  drawLeg(ctx, look, B, B.tw * 0.4, -2, tF, sF, true);
  ctx.restore();
  // torso + head
  torso();
  drawTorso(ctx, look, B, t);
  ctx.save();
  ctx.translate(B.tw * 0.08, -B.th - B.R * 0.78);
  ctx.rotate(pose.headTilt);
  drawHead(ctx, look, B.R, pose.expr, t, true);
  ctx.restore();
  if (look.coat) drawCoatFront(ctx, look, B);
  drawArm(ctx, look, B, shF[0], shF[1], pose.armF, pose.elbowF, pose.armFExt, true, pose);
  ctx.restore();
  ctx.restore();
}

function drawLeg(ctx, look, B, hx, hy, thA, shA, front) {
  const bt = look.bottom || { style: 'pants', color: '#333' };
  const skin = look.skin;
  const k = pt(hx, hy, thA, B.th1), f = pt(k[0], k[1], shA, B.sh);
  let w = B.limb * 1.15;
  let thighC = bt.color, shinC = bt.color;
  if (bt.style === 'shorts' || bt.style === 'shorts3') shinC = skin;
  if (bt.style === 'speedo' || bt.style === 'skirt') { thighC = skin; shinC = skin; }
  if (bt.style === 'hakama') w *= 1.6;
  if (look.build === 'slim') w *= 0.9;
  const dk = front ? 0 : -0.18;
  const tc = dk ? shade(thighC, dk) : thighC, sc = dk ? shade(shinC, dk) : shinC;
  limb(ctx, k[0], k[1], f[0], f[1], bt.style === 'hakama' ? w * 0.9 : w * 0.95, sc);
  limb(ctx, hx, hy, k[0], k[1], w, tc);
  if (bt.style === 'shorts' || bt.style === 'shorts3') {
    const m = pt(k[0], k[1], shA, bt.style === 'shorts3' ? 8 : 2);
    limb(ctx, k[0], k[1], m[0], m[1], w * 1.15, tc);
  }
  // foot
  const shoe = look.shoes || '#333';
  ell(ctx, f[0] + 6, f[1] + 1, w * 0.8, w * 0.42, 0, dk ? shade(shoe, dk) : shoe);
}

function drawArm(ctx, look, B, sx, sy, ang, elbow, ext, front, pose) {
  const skin = look.handColor || look.skin;
  const top = look.top || {};
  const slv = look.sleeveColor || (top.style === 'shirtless' ? look.skin : top.color || look.skin);
  const ua = B.ua * Math.min(ext, 1.6), fa = B.fa * ext + (ext > 1.6 ? B.ua * (ext - 1.6) : 0);
  const e = pt(sx, sy, ang, ua);
  const ha = ang + elbow;
  const h = pt(e[0], e[1], ha, fa);
  const dk = front ? 0 : -0.2;
  const col = c => (dk ? shade(c, dk) : c);
  let upC = look.sleeves === 'none' ? look.skin : slv;
  let foC = look.sleeves === 'long' ? slv : look.skin;
  let w = B.limb;
  if (!front && look.weapon === 'katana3') drawWeapon(ctx, 'katana', h[0], h[1], ha + (pose.wpn || 0) * 0.8, 'dark');
  if (look.bigArms) {
    limb(ctx, sx, sy, e[0], e[1], w, col(upC));
    limb(ctx, e[0], e[1], h[0], h[1], w * 2.3, col(look.skin));
    if (!MONO) { const m = pt(e[0], e[1], ha, fa * 0.5); star(ctx, m[0], m[1], 7, '#1e63c4'); }
  } else {
    limb(ctx, e[0], e[1], h[0], h[1], w * 0.95, col(foC));
    limb(ctx, sx, sy, e[0], e[1], w, col(upC));
  }
  if (!front && look.hook) {
    ctx.strokeStyle = C('#d4af37'); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(h[0] + Math.sin(ha) * 8, h[1] + Math.cos(ha) * 8, 8, ha + 0.5, ha + 0.5 + Math.PI * 1.3); ctx.stroke();
  } else {
    circ(ctx, h[0], h[1], (look.bigArms ? w * 1.25 : w * 0.78), col(skin));
  }
  if (front && look.weapon && look.weapon !== 'katana3') drawWeapon(ctx, look.weapon, h[0], h[1], ha + (pose.wpn || 0));
  if (front && look.weapon === 'katana3') drawWeapon(ctx, 'katana', h[0], h[1], ha + (pose.wpn || 0), 'white');
  return h;
}

function star(ctx, x, y, r, col) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = C(col); ctx.fill();
}

function drawWeapon(ctx, type, hx, hy, ang, variant) {
  const dx = Math.sin(ang), dy = Math.cos(ang);
  const P = d => [hx + dx * d, hy + dy * d];
  const nx = -dy, ny = dx; // perpendicular
  const blade = (len, w, col, start) => {
    const a = P(start || 8), b = P(len);
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w / 2, a[1] + ny * w / 2);
    ctx.lineTo(b[0] + nx * w * 0.1, b[1] + ny * w * 0.1);
    ctx.lineTo(b[0] - nx * w * 0.6, b[1] - ny * w * 0.6);
    ctx.lineTo(a[0] - nx * w / 2, a[1] - ny * w / 2);
    ctx.closePath(); fillPath(ctx, col);
  };
  const handle = (a, b, col, w) => { const p = P(a), q = P(b); limb(ctx, p[0], p[1], q[0], q[1], w || 6, col); };
  switch (type) {
    case 'katana': {
      handle(-12, 8, variant === 'white' ? '#f5f5f5' : variant === 'dark' ? '#4a148c' : '#212121', 6);
      blade(78, 6, '#e8eef2');
      const g = P(8); ell(ctx, g[0], g[1], 5, 5, 0, '#d4af37');
      break;
    }
    case 'nodachi': handle(-16, 10, '#212121', 6); blade(112, 6, '#e8eef2'); { const g = P(10); ell(ctx, g[0], g[1], 6, 6, 0, '#d4af37'); } break;
    case 'cane': handle(-12, 6, '#5d4037', 6); blade(72, 4, '#cfd8dc'); break;
    case 'yoru': {
      handle(-18, 10, '#111', 8); blade(130, 12, '#1b1b1b');
      const g = P(10);
      limb(ctx, g[0] + nx * 16, g[1] + ny * 16, g[0] - nx * 16, g[1] - ny * 16, 6, '#d4af37');
      break;
    }
    case 'bisento': {
      handle(-40, 120, '#6d4c41', 7);
      const a = P(112), b = P(160);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(b[0] + nx * 28, b[1] + ny * 28, b[0], b[1]);
      ctx.quadraticCurveTo(a[0] - nx * 4 + dx * 20, a[1] - ny * 4 + dy * 20, a[0], a[1]);
      fillPath(ctx, '#e0e0e0');
      break;
    }
    case 'club': {
      handle(-14, 30, '#3e2723', 9);
      const a = P(28), b = P(125);
      ctx.beginPath();
      ctx.moveTo(a[0] + nx * 7, a[1] + ny * 7); ctx.lineTo(b[0] + nx * 14, b[1] + ny * 14);
      ctx.lineTo(b[0] - nx * 14, b[1] - ny * 14); ctx.lineTo(a[0] - nx * 7, a[1] - ny * 7); ctx.closePath();
      fillPath(ctx, '#37474f');
      for (let i = 0; i < 5; i++) { const q = P(50 + i * 16); circ(ctx, q[0] + nx * (10 + i), q[1] + ny * (10 + i), 3, '#b0bec5', false); circ(ctx, q[0] - nx * (10 + i), q[1] - ny * (10 + i), 3, '#b0bec5', false); }
      break;
    }
    case 'staff': handle(-34, 44, '#29b6f6', 6); { const p = P(44), q = P(-34); circ(ctx, p[0], p[1], 5, '#e1f5fe'); circ(ctx, q[0], q[1], 5, '#e1f5fe'); } break;
    case 'slingshot': {
      handle(0, 16, '#6d4c41', 6);
      const p = P(16);
      const l = [p[0] + dx * 12 + nx * 9, p[1] + dy * 12 + ny * 9], r = [p[0] + dx * 12 - nx * 9, p[1] + dy * 12 - ny * 9];
      limb(ctx, p[0], p[1], l[0], l[1], 5, '#6d4c41'); limb(ctx, p[0], p[1], r[0], r[1], 5, '#6d4c41');
      break;
    }
    case 'napoleon': {
      handle(-14, 10, '#4e342e', 8); blade(115, 12, '#ffcc80');
      const g = P(10); circ(ctx, g[0], g[1], 9, '#ffd54f');
      if (!MONO) { circ(ctx, g[0] - 3, g[1] - 2, 1.6, '#000', false); circ(ctx, g[0] + 3, g[1] - 2, 1.6, '#000', false); }
      break;
    }
  }
}

function drawTorso(ctx, look, B, t) {
  const top = look.top || { style: 'shirt', color: '#888' };
  const tw = B.tw, th = B.th, skin = look.skin;
  const shapePath = () => {
    ctx.beginPath();
    if (look.build === 'fat') {
      ctx.moveTo(-tw * 0.85, -th); ctx.lineTo(tw * 0.85, -th);
      ctx.quadraticCurveTo(tw * 1.35, -th * 0.35, tw, 0); ctx.lineTo(-tw, 0);
      ctx.quadraticCurveTo(-tw * 1.25, -th * 0.4, -tw * 0.85, -th);
    } else {
      const sw = look.build === 'big' ? tw * 1.15 : tw;
      ctx.moveTo(-sw, -th + 6); ctx.quadraticCurveTo(-sw, -th, -sw + 8, -th);
      ctx.lineTo(sw - 8, -th); ctx.quadraticCurveTo(sw, -th, sw, -th + 6);
      ctx.lineTo(tw * 0.85, 0); ctx.lineTo(-tw * 0.85, 0);
    }
    ctx.closePath();
  };
  const base = ['vest', 'shirtless', 'openshirt', 'overalls'].includes(top.style) ? skin : top.color;
  shapePath(); fillPath(ctx, base);
  ctx.save(); shapePath(); ctx.clip();
  const c2 = top.color2 || shade(top.color || '#888', -0.3);
  switch (top.style) {
    case 'vest': case 'openshirt': {
      const w = top.style === 'vest' ? tw * 0.55 : tw * 0.6;
      ctx.fillStyle = C(top.color);
      ctx.fillRect(-tw * 1.4, -th, w + tw * 0.4, th); ctx.fillRect(tw * 1.4 - w - tw * 0.4, -th, w + tw * 0.4, th);
      if (!MONO) { ctx.strokeStyle = shade(top.color, -0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-tw + w, -th); ctx.lineTo(-tw + w, 0); ctx.moveTo(tw - w, -th); ctx.lineTo(tw - w, 0); ctx.stroke(); }
      if (top.color === '#e53935' && !MONO) for (let i = 0; i < 6; i++) circ(ctx, (i % 2 ? 1 : -1) * tw * 0.8, -th + 8 + i * 7, 3, '#ffeb3b', false);
      break;
    }
    case 'shirtless':
      if (!MONO) {
        ctx.strokeStyle = shade(skin, -0.25); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-tw * 0.35, -th * 0.68, tw * 0.35, 0.2, Math.PI - 0.2); ctx.arc(tw * 0.35, -th * 0.68, tw * 0.35, 0.2, Math.PI - 0.2); ctx.stroke();
        if (look.build === 'big') { ctx.beginPath(); ctx.moveTo(0, -th * 0.5); ctx.lineTo(0, -th * 0.15); ctx.stroke(); }
      }
      break;
    case 'stripes':
      ctx.fillStyle = C(c2);
      for (let y = -th; y < 0; y += 9) ctx.fillRect(-tw * 1.5, y, tw * 3, 3.5);
      if (look.coat) { ctx.fillStyle = C('#ffffff'); poly(ctx, [-6, -th, 6, -th, 0, -th + 14], '#fff', false); }
      break;
    case 'suit':
      poly(ctx, [-9, -th, 9, -th, 0, -th * 0.4], c2, false);
      if (!MONO) {
        poly(ctx, [-2.5, -th + 4, 2.5, -th + 4, 3.5, -th * 0.5, 0, -th * 0.42, -3.5, -th * 0.5], shade(top.color, -0.5), false);
        ctx.fillStyle = '#ffd54f'; ctx.fillRect(-1, -th * 0.35, 2, 3); ctx.fillRect(-1, -th * 0.2, 2, 3);
      }
      break;
    case 'robe':
      poly(ctx, [-11, -th, 11, -th, 0, -th * 0.35], skin, false);
      ctx.strokeStyle = C(c2); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-11, -th); ctx.lineTo(0, -th * 0.35); ctx.lineTo(11, -th); ctx.stroke();
      break;
    case 'overalls':
      ctx.fillStyle = C(c2); ctx.fillRect(-tw * 0.6, -th * 0.55, tw * 1.2, th * 0.55);
      ctx.fillRect(-tw * 0.55, -th, 5, th); ctx.fillRect(tw * 0.55 - 5, -th, 5, th);
      break;
    case 'kimono':
      poly(ctx, [-10, -th, 10, -th, 2, -th * 0.4], skin, false);
      ctx.fillStyle = C(c2); ctx.fillRect(-tw * 1.3, -th, tw * 0.55, th); ctx.fillRect(tw * 0.75, -th, tw * 0.55, th);
      break;
    case 'hoodie':
      if (!MONO) { circ(ctx, 0, -th * 0.5, 7, '#111', false); circ(ctx, 0, -th * 0.5, 4.5, top.color, false); ctx.fillStyle = '#111'; ctx.fillRect(-3, -th * 0.52, 6, 2); }
      ctx.fillStyle = C(c2); ctx.fillRect(-tw * 1.3, -th, tw * 0.5, th); ctx.fillRect(tw * 0.8, -th, tw * 0.5, th);
      break;
    case 'vest3':
      ctx.fillStyle = C(c2); ctx.fillRect(-tw * 0.4, -th, tw * 0.8, th);
      if (!MONO) poly(ctx, [-2, -th + 3, 2, -th + 3, 3, -th * 0.4, -3, -th * 0.4], '#111', false);
      break;
    case 'dress':
      if (!MONO) {
        if (c2 === '#ffffff') for (let i = 0; i < 8; i++) circ(ctx, ((i * 37) % (tw * 2)) - tw, -th + 6 + ((i * 19) % (th - 8)), 3.5, '#ffffff', false);
        else { ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-tw * 0.6, -th); ctx.quadraticCurveTo(0, -th * 0.55, tw * 0.6, -th); ctx.stroke(); }
      }
      break;
  }
  ctx.restore();
  // sash / belt
  if (look.sash) {
    ctx.fillStyle = C(look.sash); ctx.fillRect(-tw * 0.95, -11, tw * 1.9, 9);
    if (!MONO) { ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(-tw * 0.95, -11, tw * 1.9, 9); }
  }
  const bt = look.bottom || {};
  if (bt.style === 'speedo') { ctx.fillStyle = C(bt.color); ctx.fillRect(-tw * 0.9, -6, tw * 1.8, 10); }
  if (bt.style === 'skirt') {
    const len = look.build === 'fat' ? 46 : 40;
    poly(ctx, [-tw * 0.9, -4, tw * 0.9, -4, tw * 1.4, len, -tw * 1.4, len], bt.color);
    if (!MONO && top.color2 === '#ffffff') for (let i = 0; i < 6; i++) circ(ctx, -tw + i * tw * 0.42, 10 + (i % 2) * 16, 3.5, '#ffffff', false);
  }
  // chest extras
  if (!MONO) {
    if (has(look, 'beads')) { ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(0, -th - 4, tw * 0.75, 0.4, Math.PI - 0.4); ctx.stroke(); ctx.setLineDash([]); }
    if (has(look, 'cross')) { ctx.fillStyle = '#d4af37'; ctx.fillRect(-1.5, -th + 6, 3, 14); ctx.fillRect(-5, -th + 10, 10, 3); }
    if (has(look, 'rose')) { circ(ctx, tw * 0.5, -th + 12, 5, '#e91e63'); circ(ctx, tw * 0.5, -th + 12, 2, '#ad1457', false); }
  }
}

function drawCoatBack(ctx, look, B, pose, t, vx) {
  const c = look.coat, tw = B.tw, th = B.th;
  const sway = Math.sin(t * 0.07) * 5 - clamp(vx, -12, 12) * 1.5 - pose.lean * 30;
  const len = B.th1 + B.sh * 0.7;
  const wide = tw * 1.55;
  ctx.beginPath();
  ctx.moveTo(-tw * 1.15, -th + 2);
  ctx.lineTo(tw * 1.15, -th + 2);
  ctx.quadraticCurveTo(wide * 0.9, -th * 0.2, wide * 0.8 + sway * 0.3, len);
  if (c.type === 'feather') {
    for (let i = 0; i <= 8; i++) { const xx = lerp(wide * 0.8, -wide - 6, i / 8) + sway; ctx.quadraticCurveTo(xx + 6, len + 14, xx, len + (i % 2 ? 0 : 6)); }
  } else ctx.lineTo(-wide + sway, len + 6);
  ctx.quadraticCurveTo(-wide * 1.05, -th * 0.2, -tw * 1.15, -th + 2);
  ctx.closePath();
  fillPath(ctx, c.color2 && c.type !== 'cape' ? c.color : c.color2 || c.color);
  if (c.type === 'cape' && c.color2 && c.color2 !== c.color) {
    ctx.beginPath(); ctx.moveTo(-tw * 1.15, -th + 2); ctx.lineTo(-wide * 0.9 + sway * 0.6, len); ctx.lineTo(-wide + sway, len + 6);
    ctx.quadraticCurveTo(-wide * 1.05, -th * 0.2, -tw * 1.15, -th + 2); ctx.closePath(); fillPath(ctx, c.color, false);
  }
}
function drawCoatFront(ctx, look, B) {
  const c = look.coat, tw = B.tw, th = B.th;
  if (c.type === 'fur' || c.type === 'feather') {
    const col = c.type === 'fur' ? c.color2 : c.color;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      circ(ctx, Math.cos(a) * tw * 1.05, -th + 4 + Math.sin(a) * 6 + (i === 0 || i === 6 ? 6 : 0), c.type === 'feather' ? 11 : 9, col);
    }
  } else {
    // lapels on shoulders
    ctx.fillStyle = C(c.type === 'cape' ? c.color : c.color);
    poly(ctx, [-tw * 1.25, -th + 1, -tw * 0.6, -th + 1, -tw * 1.1, -th * 0.35], c.color);
    poly(ctx, [tw * 1.25, -th + 1, tw * 0.6, -th + 1, tw * 1.1, -th * 0.35], c.color);
  }
}

// ---------------------------------------------------------------- head
function drawHead(ctx, look, R, expr, t, withBody) {
  const hair = look.hair || { style: 'none' };
  if (has(look, 'antlers')) drawAntlers(ctx, R);
  hairBack(ctx, hair, R, t);
  // face
  circ(ctx, 0, 0, R, look.skin);
  if (!MONO) drawFace(ctx, look, R, expr || 'normal', t);
  hairFront(ctx, look, hair, R);
  if (has(look, 'horns')) drawHorns(ctx, R);
  if (look.hat) drawHat(ctx, look.hat, R);
  if (has(look, 'goggles') && !MONO) {
    ctx.fillStyle = '#5d4037'; ctx.fillRect(-R * 0.9, -R * 0.78, R * 1.8, 6);
    circ(ctx, R * 0.15, -R * 0.75, 8, '#ffb300'); circ(ctx, R * 0.55, -R * 0.75, 8, '#ffb300');
  }
  if (has(look, 'sleepmask') && !MONO) {
    ctx.save(); ctx.beginPath(); ctx.ellipse(R * 0.2, -R * 0.7, R * 0.75, R * 0.22, 0, 0, TAU); fillPath(ctx, '#1e88e5');
    circ(ctx, R * 0.0, -R * 0.7, 4, '#fff', false); circ(ctx, R * 0.45, -R * 0.7, 4, '#fff', false);
    circ(ctx, R * 0.02, -R * 0.7, 2, '#000', false); circ(ctx, R * 0.47, -R * 0.7, 2, '#000', false); ctx.restore();
  }
  if (look.weapon === 'katana3' && withBody && !MONO) {
    // sword in mouth
    limb(ctx, R * 0.1, R * 0.45, R * 0.6, R * 0.45, 5, '#b71c1c');
    poly(ctx, [R * 0.6, R * 0.42, R * 2.6, R * 0.38, R * 2.7, R * 0.45, R * 0.6, R * 0.5], '#e8eef2');
  }
}

function eye(ctx, x, y, w, h, style, iris) {
  ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + h * 0.08, w * 0.62, h * 0.72, 0, 0, TAU); ctx.fillStyle = iris || '#111'; ctx.fill();
  if (iris) { ctx.beginPath(); ctx.ellipse(x + w * 0.35, y + h * 0.1, w * 0.3, h * 0.38, 0, 0, TAU); ctx.fillStyle = '#111'; ctx.fill(); }
  ctx.beginPath(); ctx.arc(x + w * 0.05, y - h * 0.35, w * 0.28, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
}
function drawFace(ctx, look, R, expr, t) {
  const ex1 = R * 0.08, ex2 = R * 0.55, ey = -R * 0.02;
  let ew = R * 0.16, eh = R * 0.24;
  const style = look.eyes || 'normal';
  ctx.lineCap = 'round';
  if (expr === 'hurt' || expr === 'ko' || expr === 'win') {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    for (const x of [ex1, ex2]) {
      ctx.beginPath();
      if (expr === 'ko') { ctx.moveTo(x - 6, ey - 6); ctx.lineTo(x + 6, ey + 6); ctx.moveTo(x + 6, ey - 6); ctx.lineTo(x - 6, ey + 6); }
      else if (expr === 'win') { ctx.arc(x, ey + 3, 7, Math.PI * 1.1, Math.PI * 1.9); }
      else { ctx.moveTo(x - 6, ey - 6); ctx.lineTo(x + 5, ey); ctx.lineTo(x - 6, ey + 6); }
      ctx.stroke();
    }
  } else if (style === 'skull') {
    circ(ctx, ex1, ey, R * 0.2, '#111', false); circ(ctx, ex2, ey, R * 0.2, '#111', false);
    circ(ctx, R * 0.35, R * 0.22, R * 0.08, '#111', false);
  } else if (style === 'shades') {
    ctx.beginPath(); ctx.ellipse(ex1, ey, R * 0.25, R * 0.17, 0, 0, TAU); ctx.ellipse(ex2, ey, R * 0.25, R * 0.17, 0, 0, TAU);
    ctx.fillStyle = look.shadeColor || '#111'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex1 + R * 0.25, ey); ctx.lineTo(ex2 - R * 0.25, ey); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(ex2 - 4, ey - 5, 6, 3);
  } else {
    let iris = null;
    if (style === 'fem') iris = '#6d4c41';
    if (style === 'hawk') iris = '#fbc02d';
    if (style === 'big') { ew *= 1.25; eh *= 1.2; }
    if (style === 'sharp' || style === 'hawk' || style === 'tired') eh *= 0.7;
    if (style === 'sleepy') eh *= 0.45;
    if (has(look, 'scarEye2')) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex1 - 6, ey); ctx.lineTo(ex1 + 6, ey); ctx.stroke();
      ctx.strokeStyle = '#8d3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex1, ey - 12); ctx.lineTo(ex1, ey + 12); ctx.stroke();
    } else eye(ctx, ex1, ey, ew * 0.85, eh, style, iris);
    if (style === 'swept' || (look.hair && look.hair.style === 'swept')) { /* covered by hair */ }
    eye(ctx, ex2, ey, ew, eh, style, iris);
    // brows
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    const angry = expr === 'attack' || style === 'sharp' || style === 'hawk';
    ctx.beginPath();
    ctx.moveTo(ex1 - 7, ey - eh - 6 + (angry ? -3 : 0)); ctx.lineTo(ex1 + 7, ey - eh - 6 + (angry ? 3 : 0));
    ctx.moveTo(ex2 - 7, ey - eh - 6 + (angry ? 3 : 0)); ctx.lineTo(ex2 + 8, ey - eh - 6 + (angry ? -3 : 0));
    ctx.stroke();
    if (style === 'fem') { ctx.beginPath(); ctx.moveTo(ex2 + ew, ey - eh * 0.6); ctx.lineTo(ex2 + ew + 5, ey - eh); ctx.stroke(); }
    if (style === 'tired') { ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ex1 - 5, ey + eh + 3); ctx.lineTo(ex1 + 5, ey + eh + 3); ctx.moveTo(ex2 - 5, ey + eh + 3); ctx.lineTo(ex2 + 6, ey + eh + 3); ctx.stroke(); }
    if (has(look, 'curlybrow')) { ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex2 + 9, ey - eh - 7, 3.5, 0, Math.PI * 1.6); ctx.stroke(); }
  }
  // mouth
  const mx = R * 0.35, my = R * 0.48;
  let m = look.mouth || 'smile';
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  if (expr === 'attack' || expr === 'hurt' || expr === 'ko') {
    ctx.beginPath(); ctx.ellipse(mx, my, R * 0.17, R * (expr === 'attack' ? 0.17 : 0.12), 0, 0, TAU); ctx.fillStyle = '#5a0f0f'; ctx.fill(); ctx.stroke();
    if (style === 'skull') { ctx.fillStyle = '#fff'; ctx.fillRect(mx - R * 0.14, my - 4, R * 0.28, 4); }
    else { ctx.beginPath(); ctx.ellipse(mx, my + R * 0.08, R * 0.09, R * 0.05, 0, 0, TAU); ctx.fillStyle = '#e57373'; ctx.fill(); }
  } else if (m === 'grin' || m === 'bigrin' || (expr === 'win' && m !== 'teeth')) {
    const w = m === 'bigrin' ? R * 0.42 : R * 0.3;
    ctx.beginPath(); ctx.moveTo(mx - w, my - 4); ctx.quadraticCurveTo(mx, my + R * 0.42, mx + w, my - 4); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx - w + 3, my + 1); ctx.lineTo(mx + w - 3, my + 1); ctx.stroke();
    if (m === 'bigrin') { ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(mx + i * w / 3, my - 3); ctx.lineTo(mx + i * w / 3, my + 6); } ctx.stroke(); }
  } else if (m === 'teeth') {
    ctx.fillStyle = '#fff'; ctx.fillRect(mx - R * 0.25, my - 5, R * 0.5, 10); ctx.strokeRect(mx - R * 0.25, my - 5, R * 0.5, 10);
    ctx.beginPath(); ctx.moveTo(mx - R * 0.25, my); ctx.lineTo(mx + R * 0.25, my); for (let i = -2; i <= 2; i++) { ctx.moveTo(mx + i * R * 0.1, my - 5); ctx.lineTo(mx + i * R * 0.1, my + 5); } ctx.lineWidth = 1.2; ctx.stroke();
  } else if (m === 'lips') {
    ctx.beginPath(); ctx.ellipse(mx, my, R * 0.13, R * 0.07, 0, 0, TAU); ctx.fillStyle = '#d81b60'; ctx.fill();
  } else if (m === 'oo') {
    ctx.beginPath(); ctx.ellipse(mx + 2, my, R * 0.08, R * 0.1, 0, 0, TAU); ctx.fillStyle = '#8d4a3a'; ctx.fill(); ctx.stroke();
  } else if (m === 'smirk') {
    ctx.beginPath(); ctx.moveTo(mx - R * 0.15, my); ctx.quadraticCurveTo(mx + R * 0.05, my + 4, mx + R * 0.2, my - 5); ctx.stroke();
  } else if (m === 'calm') {
    ctx.beginPath(); ctx.moveTo(mx - R * 0.13, my); ctx.lineTo(mx + R * 0.15, my); ctx.stroke();
  } else if (m === 'tusks') {
    ctx.beginPath(); ctx.moveTo(mx - R * 0.2, my); ctx.lineTo(mx + R * 0.22, my); ctx.stroke();
    poly(ctx, [mx - R * 0.15, my, mx - R * 0.1, my, mx - R * 0.13, my - 9], '#fff');
    poly(ctx, [mx + R * 0.1, my, mx + R * 0.16, my, mx + R * 0.13, my - 9], '#fff');
  } else {
    ctx.beginPath(); ctx.arc(mx, my - 5, R * 0.17, 0.3, Math.PI - 0.3); ctx.stroke();
  }
  // extras
  if (has(look, 'scarEye')) { ctx.strokeStyle = '#8d3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex2 - 6, ey + eh + 6); ctx.lineTo(ex2 + 6, ey + eh + 6); ctx.moveTo(ex2 - 3, ey + eh + 3); ctx.lineTo(ex2 - 3, ey + eh + 9); ctx.moveTo(ex2 + 3, ey + eh + 3); ctx.lineTo(ex2 + 3, ey + eh + 9); ctx.stroke(); }
  if (has(look, 'scars3')) { ctx.strokeStyle = '#8d3a2a'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(ex1 - 8 + i * 5, ey - 14); ctx.lineTo(ex1 - 2 + i * 5, ey + 14); } ctx.stroke(); }
  if (has(look, 'freckles')) { ctx.fillStyle = '#a0522d'; for (const [a, b] of [[-3, 0], [2, 3], [5, -2], [0, -4]]) { ctx.fillRect(ex2 + a, R * 0.3 + b, 2, 2); ctx.fillRect(ex1 + a - 4, R * 0.3 + b, 2, 2); } }
  if (has(look, 'scarNose')) { ctx.strokeStyle = '#8d3a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-R * 0.4, R * 0.22); ctx.lineTo(R * 0.95, R * 0.18); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 6; i++) { const x = -R * 0.3 + i * R * 0.22; ctx.moveTo(x, R * 0.12); ctx.lineTo(x, R * 0.28); } ctx.stroke(); }
  if (has(look, 'longnose')) { limb(ctx, R * 0.55, R * 0.15, R * 1.55, R * 0.1, 8, look.skin); }
  if (has(look, 'bluenose')) { circ(ctx, R * 0.62, R * 0.2, R * 0.11, '#1e63c4'); }
  if (has(look, 'stubble')) { ctx.fillStyle = 'rgba(60,30,20,0.45)'; for (let i = 0; i < 9; i++) ctx.fillRect(R * 0.05 + (i % 3) * 6, R * 0.6 + Math.floor(i / 3) * 4, 2, 2); }
  if (has(look, 'goatee')) poly(ctx, [mx - 5, my + 7, mx + 5, my + 7, mx, my + 18], '#1a1a1a');
  if (has(look, 'mustacheThin')) { ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, my - 6); ctx.quadraticCurveTo(mx - 10, my - 6, mx - 14, my + 2); ctx.moveTo(mx, my - 6); ctx.quadraticCurveTo(mx + 10, my - 6, mx + 14, my + 2); ctx.stroke(); }
  if (has(look, 'mustacheWB')) {
    ctx.beginPath(); ctx.moveTo(mx - 4, my - 6);
    ctx.quadraticCurveTo(mx - R * 0.9, my - 2, mx - R * 1.4, -R * 1.3);
    ctx.quadraticCurveTo(mx - R * 0.8, my - 14, mx - 4, my - 12);
    ctx.quadraticCurveTo(mx + R * 0.8, my - 14, mx + R * 1.4, -R * 1.3);
    ctx.quadraticCurveTo(mx + R * 0.9, my - 2, mx + 4, my - 6);
    ctx.closePath(); fillPath(ctx, '#fafafa');
  }
  if (has(look, 'beardBig')) { ctx.beginPath(); ctx.moveTo(-R * 0.75, R * 0.25); ctx.quadraticCurveTo(-R * 0.6, R * 1.25, R * 0.3, R * 1.15); ctx.quadraticCurveTo(R * 1.0, R * 1.0, R * 0.95, R * 0.35); ctx.quadraticCurveTo(R * 0.4, R * 0.8, -R * 0.75, R * 0.25); fillPath(ctx, '#111'); if (look.mouth === 'bigrin') { /* mouth drawn already */ } }
  if (has(look, 'beardKaido')) { ctx.beginPath(); ctx.moveTo(R * 0.0, R * 0.55); ctx.quadraticCurveTo(R * 0.3, R * 1.8, R * 0.5, R * 1.9); ctx.quadraticCurveTo(R * 0.7, R * 1.3, R * 0.8, R * 0.55); ctx.closePath(); fillPath(ctx, '#1a1a1a'); limb(ctx, mx - 4, my - 7, mx - 20, my + 12, 4, '#1a1a1a'); limb(ctx, mx + 4, my - 7, mx + 22, my + 12, 4, '#1a1a1a'); }
  if (has(look, 'beardWhite')) { ctx.beginPath(); ctx.moveTo(-R * 0.6, R * 0.2); ctx.quadraticCurveTo(-R * 0.4, R * 1.05, R * 0.35, R * 1.0); ctx.quadraticCurveTo(R * 0.95, R * 0.9, R * 0.9, R * 0.45); ctx.quadraticCurveTo(R * 0.4, R * 0.75, -R * 0.6, R * 0.2); fillPath(ctx, '#f5f5f5'); }
  if (has(look, 'earrings')) { for (let i = 0; i < 3; i++) circ(ctx, -R * 0.82, R * 0.2 + i * 6, 3, '#ffd54f', false); }
  if (has(look, 'snakeEarrings')) { ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-R * 0.82, R * 0.45, 8, 0, TAU); ctx.stroke(); }
}

function hairBack(ctx, hair, R, t) {
  const c = hair.color;
  switch (hair.style) {
    case 'spiky': case 'messy': case 'wavy': case 'short': case 'buzz':
      poly(ctx, [-R * 0.9, -R * 0.5, -R * 1.25, -R * 0.1, -R * 0.95, R * 0.05, -R * 1.15, R * 0.4, -R * 0.75, R * 0.35, -R * 0.6, R * 0.6, -R * 0.4, 0], c);
      break;
    case 'long':
      ctx.beginPath(); ctx.moveTo(-R * 0.9, -R * 0.6); ctx.quadraticCurveTo(-R * 1.4, R * 1.2, -R * 1.0, R * 2.2);
      ctx.lineTo(R * 0.2, R * 2.0); ctx.quadraticCurveTo(R * 0.6, R * 1.0, R * 0.4, R * 0.2); ctx.lineTo(-R * 0.3, -R); ctx.closePath(); fillPath(ctx, c);
      break;
    case 'curlylong': case 'curly': case 'curlyshort': {
      const n = hair.style === 'curlylong' ? 9 : 7;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 0.55 + i / (n - 1) * Math.PI * 1.25;
        circ(ctx, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95 + (hair.style === 'curlylong' && i < 3 ? R * 0.4 : 0), R * (hair.style === 'curlyshort' ? 0.3 : 0.38), c);
      }
      if (hair.style === 'curlylong') { circ(ctx, -R * 0.9, R * 1.0, R * 0.38, c); circ(ctx, -R * 0.5, R * 1.25, R * 0.35, c); }
      break;
    }
    case 'afro': circ(ctx, -R * 0.15, -R * 0.35, R * 1.38, c); break;
    case 'pinkcurly':
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; circ(ctx, Math.cos(a) * R * 1.15 - R * 0.1, Math.sin(a) * R * 1.05 - R * 0.1, R * 0.48, c); }
      break;
    case 'longwild':
      ctx.beginPath(); ctx.moveTo(-R * 0.6, -R * 0.9);
      ctx.quadraticCurveTo(-R * 2.2, R * 0.5, -R * 2.0 + Math.sin(t * 0.1) * 4, R * 3.0);
      for (let i = 0; i < 5; i++) ctx.lineTo(-R * 1.6 + i * R * 0.38, R * (i % 2 ? 2.6 : 3.1));
      ctx.quadraticCurveTo(R * 0.2, R * 1.0, R * 0.3, -R * 0.3); ctx.closePath(); fillPath(ctx, c);
      break;
    case 'tied':
      ctx.beginPath(); ctx.moveTo(-R * 0.8, -R * 0.2); ctx.quadraticCurveTo(-R * 1.6, R * 0.2, -R * 1.5, R * 1.3); ctx.lineTo(-R * 1.2, R * 1.3); ctx.quadraticCurveTo(-R * 1.2, R * 0.4, -R * 0.6, R * 0.1); ctx.closePath(); fillPath(ctx, c);
      break;
    case 'slick':
      poly(ctx, [-R * 0.8, -R * 0.6, -R * 1.2, -R * 0.1, -R * 0.85, R * 0.4, -R * 0.5, 0], c);
      break;
  }
}

function hairFront(ctx, look, hair, R) {
  const c = hair.color;
  const cap = (a0, a1, rr) => { ctx.beginPath(); ctx.arc(0, 0, R * (rr || 1.04), a0, a1); };
  switch (hair.style) {
    case 'spiky': case 'messy': case 'wavy': {
      cap(Math.PI * 0.95, Math.PI * 2.08);
      const n = 6, x0 = R * 1.0, x1 = -R * 0.6;
      for (let i = 0; i <= n; i++) {
        const x = lerp(x0, x1, i / n);
        const yb = -Math.sqrt(Math.max(0, R * R - x * x)) * 0.35;
        ctx.lineTo(x, yb + (i % 2 ? -R * 0.05 : R * (hair.style === 'wavy' ? 0.12 : 0.25)));
      }
      ctx.closePath(); fillPath(ctx, c);
      break;
    }
    case 'short': case 'buzz': case 'fur': case 'slick': case 'tied': case 'curly': case 'curlyshort': case 'curlylong': {
      cap(Math.PI * 1.0, Math.PI * 2.02);
      ctx.quadraticCurveTo(R * 0.4, -R * 0.45, -R * 0.2, -R * 0.55);
      ctx.quadraticCurveTo(-R * 0.8, -R * 0.4, -R * 1.04, 0);
      ctx.closePath(); fillPath(ctx, c);
      if (hair.style === 'buzz') for (let i = 0; i < 6; i++) poly(ctx, [-R * 0.7 + i * R * 0.3, -R * 0.85 + Math.abs(i - 2.5) * 3, -R * 0.55 + i * R * 0.3, -R * 1.25 + Math.abs(i - 2.5) * 5, -R * 0.4 + i * R * 0.3, -R * 0.85 + Math.abs(i - 2.5) * 3], c);
      if (hair.style === 'curly' || hair.style === 'curlyshort' || hair.style === 'curlylong') for (let i = 0; i < 5; i++) circ(ctx, -R * 0.6 + i * R * 0.35, -R * 0.75 - (i % 2) * 4, R * 0.25, c);
      break;
    }
    case 'long': {
      cap(Math.PI * 0.9, Math.PI * 2.05);
      if (hair.bangs) { ctx.lineTo(R * 0.9, -R * 0.3); ctx.lineTo(-R * 0.4, -R * 0.3); ctx.lineTo(-R * 0.9, R * 0.3); }
      else { ctx.quadraticCurveTo(R * 0.5, -R * 0.6, R * 0.0, -R * 0.35); ctx.quadraticCurveTo(-R * 0.4, -R * 0.4, -R * 0.95, R * 0.5); }
      ctx.closePath(); fillPath(ctx, c);
      break;
    }
    case 'swept':
      cap(Math.PI * 1.0, Math.PI * 2.02);
      ctx.quadraticCurveTo(R * 0.7, -R * 0.2, R * 0.35, R * 0.35);
      ctx.quadraticCurveTo(R * 0.0, R * 0.25, -R * 0.2, -R * 0.4);
      ctx.quadraticCurveTo(-R * 0.7, -R * 0.4, -R * 1.04, 0); ctx.closePath(); fillPath(ctx, c);
      break;
    case 'pompadour':
      cap(Math.PI * 1.0, Math.PI * 1.9, 1.02); ctx.lineTo(-R * 0.3, -R * 0.6); ctx.closePath(); fillPath(ctx, c);
      ctx.beginPath(); ctx.ellipse(R * 0.55, -R * 1.0, R * 0.95, R * 0.42, -0.25, 0, TAU); fillPath(ctx, c);
      break;
    case 'afro': break;
    case 'pinkcurly':
      for (let i = 0; i < 5; i++) circ(ctx, -R * 0.5 + i * R * 0.35, -R * 0.82, R * 0.3, c);
      break;
    case 'longwild':
      cap(Math.PI * 1.0, Math.PI * 2.0); ctx.lineTo(R * 0.6, -R * 0.4); ctx.lineTo(R * 0.2, -R * 0.2); ctx.lineTo(-R * 0.3, -R * 0.5); ctx.lineTo(-R, 0.2 * R); ctx.closePath(); fillPath(ctx, c);
      break;
  }
}

function drawAntlers(ctx, R) {
  ctx.strokeStyle = C('#8d6e63'); ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const bx = sx * R * 0.45;
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bx, -R * 0.8); ctx.lineTo(bx + sx * R * 0.7, -R * 1.6); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bx + sx * R * 0.35, -R * 1.2); ctx.lineTo(bx + sx * R * 0.05, -R * 1.65);
    ctx.moveTo(bx + sx * R * 0.55, -R * 1.45); ctx.lineTo(bx + sx * R * 1.05, -R * 1.5); ctx.stroke();
  }
}
function drawHorns(ctx, R) {
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx * R * 0.5, -R * 0.75); ctx.quadraticCurveTo(sx * R * 1.3, -R * 1.1, sx * R * 1.15, -R * 1.9);
    ctx.quadraticCurveTo(sx * R * 0.95, -R * 1.2, sx * R * 0.25, -R * 0.9); ctx.closePath(); fillPath(ctx, '#eceff1');
  }
}

function drawHat(ctx, hat, R) {
  switch (hat.type) {
    case 'straw':
      ctx.save(); ctx.rotate(-0.08);
      ctx.beginPath(); ctx.ellipse(0, -R * 0.62, R * 1.5, R * 0.3, 0, 0, TAU); fillPath(ctx, '#f2cf63');
      ctx.beginPath(); ctx.ellipse(0, -R * 0.75, R * 0.82, R * 0.62, 0, Math.PI, TAU); ctx.closePath(); fillPath(ctx, '#f2cf63');
      ctx.fillStyle = C('#d32f2f'); ctx.fillRect(-R * 0.8, -R * 0.88, R * 1.6, R * 0.2);
      if (!MONO) { ctx.strokeStyle = '#c9a43a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -R * 0.62, R * 1.2, R * 0.2, 0, 0, Math.PI); ctx.stroke(); }
      ctx.restore(); break;
    case 'marine':
      ctx.beginPath(); ctx.ellipse(0, -R * 0.62, R * 0.98, R * 0.62, 0, Math.PI, TAU); ctx.closePath(); fillPath(ctx, '#fafafa');
      ctx.fillStyle = C('#1e3a8a'); ctx.fillRect(-R * 0.98, -R * 0.75, R * 1.96, R * 0.16);
      ctx.beginPath(); ctx.ellipse(R * 0.7, -R * 0.6, R * 0.55, R * 0.12, 0.15, 0, TAU); fillPath(ctx, '#1e3a8a');
      circ(ctx, R * 0.3, -R * 1.0, R * 0.12, '#1e63c4', false);
      break;
    case 'cowboy':
      ctx.beginPath(); ctx.moveTo(-R * 1.45, -R * 0.75); ctx.quadraticCurveTo(0, -R * 0.35, R * 1.45, -R * 0.75); ctx.quadraticCurveTo(0, -R * 0.55, -R * 1.45, -R * 0.75); fillPath(ctx, hat.color);
      ctx.beginPath(); ctx.moveTo(-R * 0.75, -R * 0.62); ctx.quadraticCurveTo(-R * 0.7, -R * 1.55, 0, -R * 1.35); ctx.quadraticCurveTo(R * 0.7, -R * 1.55, R * 0.75, -R * 0.62); ctx.closePath(); fillPath(ctx, hat.color);
      ctx.fillStyle = C('#3e2723'); ctx.fillRect(-R * 0.72, -R * 0.82, R * 1.44, R * 0.14);
      if (!MONO) { circ(ctx, -R * 0.25, -R * 1.05, 4.5, '#1e88e5'); circ(ctx, R * 0.25, -R * 1.05, 4.5, '#e53935'); }
      break;
    case 'tophat':
      ctx.save(); ctx.rotate(0.12);
      ctx.beginPath(); ctx.ellipse(0, -R * 0.82, R * 0.95, R * 0.2, 0, 0, TAU); fillPath(ctx, hat.color);
      ctx.beginPath(); ctx.rect(-R * 0.6, -R * 1.85, R * 1.2, R * 1.05); fillPath(ctx, hat.color);
      ctx.fillStyle = C(hat.color2 || '#333'); ctx.fillRect(-R * 0.6, -R * 1.07, R * 1.2, R * 0.2);
      if (hat.cross && !MONO) { ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(0, -R * 1.45); ctx.rotate(Math.PI / 4); ctx.fillRect(-R * 0.3, -4, R * 0.6, 8); ctx.fillRect(-4, -R * 0.3, 8, R * 0.6); ctx.restore(); }
      ctx.restore(); break;
    case 'bandana':
      ctx.beginPath(); ctx.arc(0, -R * 0.08, R * 1.05, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(R * 0.95, -R * 0.35); ctx.lineTo(-R * 1.0, -R * 0.35); ctx.closePath(); fillPath(ctx, hat.color);
      poly(ctx, [-R * 0.95, -R * 0.45, -R * 1.5, -R * 0.2, -R * 1.35, R * 0.05], hat.color);
      break;
    case 'plume':
      ctx.beginPath(); ctx.ellipse(0, -R * 0.68, R * 1.6, R * 0.32, -0.05, 0, TAU); fillPath(ctx, hat.color);
      ctx.beginPath(); ctx.ellipse(0, -R * 0.8, R * 0.85, R * 0.5, 0, Math.PI, TAU); ctx.closePath(); fillPath(ctx, hat.color);
      ctx.beginPath(); ctx.moveTo(R * 0.2, -R * 1.1); ctx.quadraticCurveTo(-R * 1.0, -R * 2.0, -R * 1.9, -R * 1.1); ctx.quadraticCurveTo(-R * 0.9, -R * 1.5, R * 0.2, -R * 1.0); fillPath(ctx, hat.color2);
      break;
    case 'furhat':
      ctx.beginPath(); ctx.ellipse(0, -R * 0.7, R * 1.05, R * 0.95, 0, Math.PI, TAU); ctx.closePath(); fillPath(ctx, '#fafafa');
      if (!MONO) { ctx.fillStyle = '#6d4c41'; for (const [a, b] of [[-0.5, -1.2], [0.2, -1.4], [0.6, -1.0], [-0.1, -0.95], [-0.8, -0.85]]) { ctx.beginPath(); ctx.ellipse(a * R, b * R, 5, 4, 0, 0, TAU); ctx.fill(); } }
      ctx.beginPath(); ctx.rect(-R * 1.08, -R * 0.82, R * 2.16, R * 0.24); fillPath(ctx, '#fafafa');
      break;
    case 'pirate':
      ctx.beginPath(); ctx.moveTo(-R * 1.5, -R * 0.75); ctx.quadraticCurveTo(-R * 1.0, -R * 2.0, 0, -R * 1.6); ctx.quadraticCurveTo(R * 1.0, -R * 2.0, R * 1.5, -R * 0.75); ctx.quadraticCurveTo(0, -R * 1.0, -R * 1.5, -R * 0.75); fillPath(ctx, hat.color);
      if (!MONO) { circ(ctx, 0, -R * 1.3, R * 0.17, '#fff', false); circ(ctx, R * 0.9, -R * 1.05, R * 0.15, '#ff80ab'); circ(ctx, -R * 0.9, -R * 1.05, R * 0.15, '#ffeb3b'); }
      break;
    case 'doghat':
      ctx.beginPath(); ctx.ellipse(0, -R * 0.62, R * 1.0, R * 0.85, 0, Math.PI, TAU); ctx.closePath(); fillPath(ctx, '#fafafa');
      ell(ctx, -R * 0.95, -R * 0.4, R * 0.25, R * 0.5, 0.3, '#3e2723');
      ell(ctx, R * 0.95, -R * 0.4, R * 0.25, R * 0.5, -0.3, '#3e2723');
      if (!MONO) { circ(ctx, R * 0.6, -R * 0.95, R * 0.12, '#111', false); circ(ctx, R * 0.1, -R * 1.15, 3, '#111', false); circ(ctx, R * 0.4, -R * 1.2, 3, '#111', false); }
      break;
  }
}

// Draw a pose sprite. Feet anchor at (x, y); targetH = on-screen height of the idle pose.
function drawSprite(ctx, s, x, y, facing, fr, targetH, filter) {
  const k = targetH / s.idle.srcH;
  const dh = s.m.srcH * k, dw = dh * s.img.width / s.img.height;
  ctx.save();
  ctx.translate(x + (fr.dx || 0) * facing, y + (fr.dy || 0));
  ctx.scale(facing, 1);
  if (fr.rot) { ctx.translate(0, -dh / 2); ctx.rotate(fr.rot); ctx.translate(0, dh / 2); }
  if (fr.midScale) { ctx.translate(0, -dh / 2); ctx.scale(fr.sx || 1, fr.sy || 1); ctx.translate(0, dh / 2); }   // flip around the body's middle (drill spin)
  else ctx.scale(fr.sx || 1, fr.sy || 1);
  if (filter) ctx.filter = filter;
  const ax = fr.center ? 0.5 : s.m.ax;
  ctx.drawImage(s.img, -ax * dw, -dh, dw, dh);
  ctx.restore();
}

// Menu / cut-in art: sprite if available, procedural chibi otherwise. kind: idle | win | ko | super | special
function drawCharArt(ctx, ch, x, y, facing, kind, scale, t, aura) {
  const s = Sprites.get(ch.id, kind);
  if (s) {
    const fr = { center: kind === 'ko', dy: kind === 'win' ? -Math.abs(Math.sin(t * 0.1)) * 18 : 0, sy: kind === 'idle' ? 1 + Math.sin(t * 0.12) * 0.02 : 1 };
    if (aura) {
      const h = 154 * (ch.look.scale || 1) * scale;
      const g = ctx.createRadialGradient(x, y - h * 0.5, 10, x, y - h * 0.5, h * 0.8);
      g.addColorStop(0, aura); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - h * 0.5, h * 0.8, 0, TAU); ctx.fill();
    }
    drawSprite(ctx, s, x, y, facing, fr, 154 * (ch.look.scale || 1) * scale * 1.3);
    return;
  }
  const pose = kind === 'win' ? STATIC_POSES.win : kind === 'ko' ? STATIC_POSES.lying : kind === 'super' ? Object.assign({}, POSES.charge.s, { expr: 'attack' }) : { yOff: Math.sin(t * 0.1) * 2 };
  drawChar(ctx, ch.look, x, y, facing, makePose(pose), { scale, t, aura });
}

const PORTRAIT_DY = { franky: 0.2 };

// Portrait helper (character select / HUD): head crop of the idle sprite, or the drawn head
function drawPortrait(ctx, ch, x, y, size, expr, t) {
  const R = size;
  ctx.save();
  ctx.translate(x, y);
  const s = Sprites.get(ch.id, expr === 'hurt' ? 'hurt' : 'idle');
  if (s) {
    const [hx, hy0, hr] = s.m.head || [0.5, 0.3, 0.5];
    const hy = hy0 + (PORTRAIT_DY[ch.id] || 0);   // tall hair/hats: move the crop down onto the face
    const iw = s.img.width, ih = s.img.height, side = hr * iw * 2.1;
    ctx.drawImage(s.img, hx * iw - side / 2, hy * ih - side * 0.47, side, side, -R * 1.45, -R * 1.6, R * 2.9, R * 2.9);
  } else drawHead(ctx, ch.look, R, expr || 'normal', t || 0, false);
  ctx.restore();
}
