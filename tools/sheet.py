"""Contact sheet for reviewing sprites: python tools/sheet.py <id> [id...]  -> tools/out/sheet.jpg"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSES = ['idle', 'attack', 'kick', 'upper', 'special', 'super', 'hurt', 'block', 'jump', 'win', 'ko']
rows = []
for cid in sys.argv[1:]:
    ims = [Image.open(os.path.join(ROOT, 'sprites', cid, p + '.png')).convert('RGBA') for p in POSES if os.path.exists(os.path.join(ROOT, 'sprites', cid, p + '.png'))]
    ims = [i.resize((int(i.width * 220 / max(i.height, 1)), 220)) if i.height > 220 else i for i in ims]
    rows.append(ims)
Wd = max(sum(i.width + 8 for i in r) for r in rows)
sheet = Image.new('RGBA', (Wd, 228 * len(rows)), (120, 170, 200, 255))
for y, r in enumerate(rows):
    x = 0
    for i in r:
        sheet.alpha_composite(i, (x, y * 228 + 224 - i.height)); x += i.width + 8
sheet.convert('RGB').save(os.path.join(ROOT, 'tools', 'out', 'sheet.jpg'), quality=85)
