# remove a hand gripping a straight blade: refill a region with the blade copied from further along its own direction.
# The shift is searched so the copied pixels match the surroundings of the region.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, dst, poly = sys.argv[1], sys.argv[2], [tuple(int(v) for v in p.split(',')) for p in sys.argv[3].split(';')]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(float)
m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(poly, fill=255); M = np.asarray(m) > 0
ring = np.asarray(m.filter(ImageFilter.MaxFilter(9))) > 0
ring &= ~M
ys, xs = np.nonzero(ring)
best = None
import math
dirx, diry = float(sys.argv[4]), float(sys.argv[5]); L = math.hypot(dirx, diry); dirx, diry = dirx / L, diry / L
cands = [(int(round(t * dirx + q * -diry)), int(round(t * diry + q * dirx))) for t in range(70, 160, 2) for q in range(-6, 7)]
for dx, dy in cands:
    if True:
        y2, x2 = ys + dy, xs + dx
        ok = (y2 >= 0) & (x2 < a.shape[1])
        e = ((a[ys[ok], xs[ok]] - a[y2[ok], x2[ok]]) ** 2).mean()
        if best is None or e < best[0]: best = (e, dx, dy)
e, dx, dy = best; print('shift', dx, dy, 'err', round(e, 1))
sh = np.roll(np.roll(a, -dy, 0), -dx, 1)
soft = np.asarray(m.filter(ImageFilter.GaussianBlur(3))).astype(float)[..., None] / 255
soft = np.maximum(soft, M[..., None] * 1.0)
out = a * (1 - soft) + sh * soft
Image.fromarray(out.astype('uint8')).save(dst)
cx, cy = int(xs.mean()), int(ys.mean())
Image.fromarray(out.astype('uint8')).crop((cx - 120, cy - 120, cx + 120, cy + 120)).resize((480, 480), Image.NEAREST).save(dst.replace('.png', '_z.png'))
