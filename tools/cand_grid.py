"""Rows = poses in out/cand.txt, columns = candidates 1-4 (raw renders)."""
import os
from PIL import Image, ImageDraw, ImageFont
T = os.path.dirname(os.path.abspath(__file__))
items = [l.strip() for l in open(os.path.join(T, 'out', 'cand.txt')) if l.strip()]
font = ImageFont.truetype('arialbd.ttf', 18)
cw, ch = 210, 280
s = Image.new('RGB', (4 * cw + 200, len(items) * ch), (40, 40, 40)); d = ImageDraw.Draw(s)
for r, it in enumerate(items):
    cid, pose = it.split(':')
    d.text((6, r * ch + ch // 2), f'{r+1}. {cid}\n{pose}', fill=(255, 255, 0), font=font)
    for k in range(1, 5):
        f = os.path.join(T, 'out', f'cand{k}', cid, pose + '.png')
        if os.path.exists(f):
            im = Image.open(f).convert('RGB'); im.thumbnail((cw - 6, ch - 6))
            s.paste(im, (200 + (k - 1) * cw, r * ch + 3))
        d.text((200 + (k - 1) * cw + 4, r * ch + 4), str(k), fill=(255, 255, 255), font=font)
s.save(os.path.join(T, 'out', 'cand_grid.jpg'), quality=85)
