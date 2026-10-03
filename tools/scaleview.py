import json, sys
from PIL import Image, ImageDraw
t = open('../sprites/manifest.js').read(); M = json.loads(t[t.index('{'):t.rindex('}') + 1])
ids = sys.argv[1].split(','); out = sys.argv[2]; TH = 230
rows = []
for cid in ids:
    m = M[cid]; k = TH / m['idle']['srcH']
    poses = [p for p in ['idle', 'windup', 'attack', 'kick', 'upper', 'special', 'super', 'bazooka', 'slashfinish', 'block', 'win'] if p in m]
    tiles = []
    for p in poses:
        e = m[p]; dh = int(e['srcH'] * k); dw = int(dh * e['w'] / e['h'])
        im = Image.open(f'../sprites/{cid}/{p}.png').convert('RGBA').resize((max(1, dw), max(1, dh)))
        tiles.append((p, im))
    H = max(im.height for _, im in tiles) + 20
    W = sum(im.width + 8 for _, im in tiles)
    r = Image.new('RGB', (W, H), (40, 50, 70)); d = ImageDraw.Draw(r); x = 0
    for p, im in tiles:
        r.paste(im, (x, H - im.height), im); d.text((x + 2, 2), p, fill=(255, 255, 0)); x += im.width + 8
    d.line([(0, H - TH), (W, H - TH)], fill=(255, 0, 0))
    rows.append(r)
s = Image.new('RGB', (max(r.width for r in rows), sum(r.height + 6 for r in rows)))
y = 0
for r in rows: s.paste(r, (0, y)); y += r.height + 6
s.save(out, quality=88)
