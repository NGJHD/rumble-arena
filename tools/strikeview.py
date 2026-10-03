import json, sys
from PIL import Image, ImageDraw
t = open('../sprites/manifest.js').read(); M = json.loads(t[t.index('{'):t.rindex('}') + 1])
ids = sys.argv[1].split(','); out = sys.argv[2]
POSES = ['attack', 'kick', 'upper', 'special', 'super', 'bazooka', 'slashfinish']
tiles = []
for cid in ids:
    for p in POSES:
        e = M.get(cid, {}).get(p)
        if not e: continue
        im = Image.open(f'../sprites/{cid}/{p}.png').convert('RGBA')
        bg = Image.new('RGBA', im.size, (40, 50, 70, 255)); bg.alpha_composite(im); d = ImageDraw.Draw(bg)
        for i, b in enumerate(e.get('prof') or []):
            if b: d.rectangle([b[0] * im.width, im.height * i / 14, b[1] * im.width, im.height * (i + 1) / 14 - 1], outline=(80, 160, 255), width=1)
        for i, b in enumerate(e.get('strike') or []):
            if b: d.rectangle([b[0] * im.width, im.height * i / 28, b[1] * im.width, im.height * (i + 1) / 28 - 1], outline=(255, 40, 40), width=2)
        if 'fist' in e:
            fx, fy, fr = e['fist']; d.ellipse([fx * im.width - 5, fy * im.height - 5, fx * im.width + 5, fy * im.height + 5], fill=(255, 255, 0))
        d.text((4, 4), f'{cid}/{p}', fill=(255, 255, 0))
        tiles.append(bg.convert('RGB'))
rows = []; row = []; w = 0
for t_ in tiles:
    if w + t_.width > 2600 and row: rows.append(row); row = []; w = 0
    row.append(t_); w += t_.width + 6
if row: rows.append(row)
s = Image.new('RGB', (2600, 426 * len(rows)), (0, 0, 0))
for ri, r in enumerate(rows):
    x = 0
    for t_ in r: s.paste(t_, (x, ri * 426 + 420 - t_.height)); x += t_.width + 6
s.save(out, quality=88)
print(len(tiles), 'tiles', len(rows), 'rows')
