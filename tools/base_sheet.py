"""Review sheet of reference candidates: python tools/base_sheet.py id... -> tools/out/base_sheet.jpg"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids = sys.argv[1:]
cw, ch = 192, 256
sheet = Image.new('RGB', (cw * 2 * 4 + 30, (ch + 20) * ((len(ids) + 3) // 4)), (60, 60, 60))
d = ImageDraw.Draw(sheet)
for i, cid in enumerate(ids):
    x0, y0 = (i % 4) * (cw * 2 + 10), (i // 4) * (ch + 20)
    for n in range(2):
        p = os.path.join(ROOT, 'tools', 'out', 'base', f'{cid}_{n}.png')
        if os.path.exists(p):
            sheet.paste(Image.open(p).convert('RGB').resize((cw, ch)), (x0 + n * cw, y0 + 20))
    d.text((x0 + 4, y0 + 4), f'{cid}   0 | 1', fill=(255, 255, 0))
sheet.save(os.path.join(ROOT, 'tools', 'out', 'base_sheet.jpg'), quality=88)
