# redraw a sword handle so it continues the blade in one straight line (the model bent the sword at the hand)
# usage: straighten.py <src> <dst> <erase poly> <guard x,y> <tip x,y> <handle len> <width> <handle rgb> <hand box x0,y0,x1,y1> <hand test: white|skin>
import sys, numpy as np
from PIL import Image, ImageDraw
src, dst, poly, guard, tip, L, wdt, col, hb, test = sys.argv[1:11]
im = Image.open(src).convert('RGB'); a = np.asarray(im).copy()
bg = tuple(int(v) for v in a[5, 5])
P = [tuple(int(v) for v in p.split(',')) for p in poly.split(';')]
gx, gy = [float(v) for v in guard.split(',')]; tx, ty = [float(v) for v in tip.split(',')]
L, wdt = float(L), int(wdt); col = tuple(int(v) for v in col.split(','))
x0, y0, x1, y1 = [int(v) for v in hb.split(',')]
orig = a.copy()
pm = Image.new('L', im.size, 0); ImageDraw.Draw(pm).polygon(P, fill=255); PM = np.asarray(pm) > 0
R, G, B = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
keepcol = ((R > 190) & (G > 160) & (B > 110)) | ((R > 190) & (G > 90) & (B < 90)) | ((R > 200) & (G > 130) & (B > 90) & (R - B > 40))
from scipy import ndimage as _n
keepcol = _n.binary_opening(keepcol, iterations=1)
handle_px = PM & ~_n.binary_dilation(keepcol, iterations=1)
a2 = a.copy(); a2[handle_px] = bg; im = Image.fromarray(a2)
d = ImageDraw.Draw(im)
ux, uy = gx - tx, gy - ty; n = (ux * ux + uy * uy) ** 0.5; ux, uy = ux / n, uy / n
ex, ey = gx + ux * L, gy + uy * L
sx, sy = gx + ux * 16, gy + uy * 16
d.line([(sx, sy), (ex, ey)], fill=(15, 10, 15), width=wdt + 8)
d.line([(sx, sy), (ex, ey)], fill=col, width=wdt)
# wrap diamonds
for k in range(1, int(L // 18)):
    cx, cy = gx + ux * k * 18, gy + uy * k * 18
    d.line([(cx - uy * wdt / 2, cy + ux * wdt / 2), (cx + uy * wdt / 2, cy - ux * wdt / 2)], fill=(15, 10, 15), width=2)
d.ellipse([ex - wdt * 0.7, ey - wdt * 0.7, ex + wdt * 0.7, ey + wdt * 0.7], fill=col, outline=(15, 10, 15), width=4)
b = np.asarray(im).copy()
# the hand stays on top of the handle
r, g, bb = orig[..., 0].astype(int), orig[..., 1].astype(int), orig[..., 2].astype(int)
if test == 'white': hand = (r > 200) & (g > 200) & (bb > 200)
else: hand = (r > 200) & (g > 140) & (bb > 90) & (r - bb > 40)
dark = (r + g + bb) < 120
box = np.zeros(hand.shape, bool); box[y0:y1, x0:x1] = True
from scipy import ndimage
keep = ndimage.binary_dilation(hand & box, iterations=6) & box & (hand | dark)
b[keep] = orig[keep]
Image.fromarray(b).save(dst)
Image.fromarray(b).crop((0, 450, 768, 1000)).save(dst.replace('.png', '_z.png'))
