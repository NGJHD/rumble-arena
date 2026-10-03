"""One big sheet per fighter: rows = flagged poses, columns = candidates c1..c4 (current sprite first)."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
T = os.path.dirname(os.path.abspath(__file__))
items = [l.strip() for l in open(os.path.join(T, 'out', 'cand.txt')) if l.strip()]
font = ImageFont.truetype('arialbd.ttf', 20)
cw, ch = 330, 440
by = {}
for it in items:
    c, p = it.split(':'); by.setdefault(c, []).append(p)
os.makedirs(os.path.join(T, 'out', 'cg'), exist_ok=True)
for cid, poses in by.items():
    s = Image.new('RGB', (5 * cw, len(poses) * (ch + 28)), (40, 40, 40)); d = ImageDraw.Draw(s)
    for r, p in enumerate(poses):
        y = r * (ch + 28)
        cur = os.path.join(T, 'out', 'poses', cid, p + '.png')
        srcs = [('current', cur)] + [(f'option {k}', os.path.join(T, 'out', f'c{k}', cid, p + '.png')) for k in range(1, 5)]
        for i, (lab, f) in enumerate(srcs):
            if os.path.exists(f):
                im = Image.open(f).convert('RGB'); im.thumbnail((cw - 6, ch)); s.paste(im, (i * cw + 3, y + 28))
            d.text((i * cw + 6, y + 4), f'{p}: {lab}', fill=(255, 255, 0), font=font)
    s.save(os.path.join(T, 'out', 'cg', cid + '.jpg'), quality=86)
print('ok', list(by))
