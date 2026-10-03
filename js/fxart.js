'use strict';
// Painted effect art (sprites/fx/<id>.png, listed in sprites/fx_manifest.js).
// 'add' images are fire/light/energy painted on black: drawn with additive blending so black vanishes.
const FXImg = {
  imgs: {},
  init() {
    if (typeof FX_MANIFEST === 'undefined') return;
    for (const id in FX_MANIFEST) {
      const im = new Image();
      im.onload = () => { this.imgs[id] = im; };
      im.src = 'sprites/fx/' + id + '.png';
    }
  },
  get(id) { return this.imgs[id] || null; },
  additive(id) { return typeof FX_MANIFEST !== 'undefined' && FX_MANIFEST[id] && FX_MANIFEST[id].add; },
  glows(id) { return typeof FX_MANIFEST !== 'undefined' && FX_MANIFEST[id] && FX_MANIFEST[id].glow; },
};

// Draw effect art centred on (x, y) with height h. o: { w, flip, rot, alpha, ax, ay }. Returns false if not loaded.
function drawArt(ctx, id, x, y, h, o) {
  const im = FXImg.get(id);
  if (!im) return false;
  o = o || {};
  const w = o.w || h * im.width / im.height;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(o.flip ? -1 : 1, 1);
  if (FXImg.additive(id)) ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  const x0 = -w * (o.ax == null ? 0.5 : o.ax), y0 = -h * (o.ay == null ? 0.5 : o.ay);
  ctx.drawImage(im, x0, y0, w, h);
  if (FXImg.glows(id)) {   // energy art: an extra additive pass so it glows on any background
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.35;
    ctx.drawImage(im, x0, y0, w, h);
  }
  ctx.restore();
  return true;
}

// Projectile drawn with art: oriented to its travel direction, with a gentle flicker/pulse.
function drawProjArt(ctx, p) {
  const d = Math.sign(p.vx) || p.dir || 1;
  const pulse = 1 + Math.sin(p.t * 0.6) * 0.04;
  const h = p.r * (p.artK || 2.4) * pulse;
  const meta = (typeof FX_MANIFEST !== 'undefined' && FX_MANIFEST[p.art]) || {};
  // travel angle (images face right); upright art (tornadoes, suns) never tilts
  let rot = meta.upright ? 0 : Math.atan2(p.vy || 0, Math.abs(p.vx) || 0.001) * d;
  if (meta.rot) rot += meta.rot * d;
  const spin = p.artSpin ? p.t * p.artSpin : 0;
  return drawArt(ctx, p.art, p.x, p.y, h, { flip: d < 0, rot: rot + spin });
}
