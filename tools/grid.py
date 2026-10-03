"""Review grid of specific poses: python tools/grid.py listfile out.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items = [l.strip() for l in open(sys.argv[1]) if l.strip() and not l.startswith('#')]
font = ImageFont.truetype('arialbd.ttf', 18)
cw, ch, cols = 250, 300, 8
rows = (len(items) + cols - 1) // cols
s = Image.new('RGB', (cols * cw, rows * (ch + 24)), (233, 238, 245)); d = ImageDraw.Draw(s)
for i, it in enumerate(items):
    cid, pose = it.split(':')
    x, y = (i % cols) * cw, (i // cols) * (ch + 24)
    d.rectangle([x + 3, y + 24, x + cw - 3, y + ch + 21], fill=(120, 170, 200))
    d.text((x + 6, y + 2), f'{i+1}. {cid} {pose}', fill=(0, 0, 0), font=font)
    f = os.path.join(ROOT, 'sprites', cid, pose + '.png')
    if os.path.exists(f):
        im = Image.open(f).convert('RGBA'); im.thumbnail((cw - 10, ch - 6))
        bg = Image.new('RGBA', im.size, (120, 170, 200, 255)); bg.alpha_composite(im)
        s.paste(bg.convert('RGB'), (x + (cw - im.width) // 2, y + 24 + ch - 3 - im.height))
s.save(sys.argv[2], quality=85)
