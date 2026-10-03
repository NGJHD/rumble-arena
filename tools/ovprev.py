# preview overlays: ovprev.py <id> <pose>[,pose] <out.jpg>  -> full pose + 2x zoom around first asset anchor, with a grid
import sys, json, numpy as np
sys.path.insert(0, '.')
from PIL import Image, ImageDraw
import gen_sprites as G
cid, poses, out = sys.argv[1], sys.argv[2].split(','), sys.argv[3]
tiles = []
for pose in poses:
    raw = Image.open(f'out/poses/{cid}/{pose}.png').convert('RGB')
    im = np.asarray(raw).astype(np.int16); a = np.full(im.shape[:2], 255.0)
    o, al = G.apply_overlays(cid, pose, im, a)
    full = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8))   # padded by 400
    op = [q for q in json.load(open('overlays.json'))[f'{cid}/{pose}'] if 'asset' in q][0]
    cx, cy = op['x'] + 400, op['y'] + 400
    z = full.crop((cx - 160, cy - 140, cx + 160, cy + 140)).resize((640, 560), Image.NEAREST)
    d = ImageDraw.Draw(z)
    for v in range(-160, 161, 20):
        col = (255, 0, 0) if v % 100 == 0 else (110, 0, 0); X = (v + 160) * 2; d.line([(X, 0), (X, 560)], fill=col)
    for v in range(-140, 141, 20):
        Y = (v + 140) * 2; d.line([(0, Y), (640, Y)], fill=(110, 0, 0))
    d.text((6, 6), f'{pose} anchor {op["x"]},{op["y"]} (grid 20px, origin {op["x"]-160},{op["y"]-140})', fill=(255, 255, 0))
    sm = full.crop((300, 300, full.width - 300, full.height - 300)).resize((420, 560))
    t = Image.new('RGB', (1060, 560)); t.paste(sm, (0, 0)); t.paste(z, (420, 0)); tiles.append(t)
s = Image.new('RGB', (1060, 560 * len(tiles)))
for i, t in enumerate(tiles): s.paste(t, (0, 560 * i))
s.save(out, quality=90)
