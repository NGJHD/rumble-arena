"""Range audit, part 2: rasterise what node recorded (tools/tests/audit_range_dump.js) and compare
"the attacker's art visibly touches the defender's art" with "the game registered a hit".

usage: python tools/audit_range.py [charId ...]   (reads tools/out/audit/<id>.json)
prints one line per problem:
  MISS     art touches the opponent at this distance but no hit registers (the bug kids notice)
  PHANTOM  a hit registers although nothing drawn by the attacker touches the opponent
"""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, 'tools', 'out', 'audit')
SC = 0.5            # rasterise at half resolution (fast; contact sizes below are in these pixels)
GAP_OK = 42          # a hit with a gap up to this many screen px is covered by the impact sparks drawn at the tip
MIN_PX = 10          # overlapping solid half-res pixels (~40 screen px of area) to count as visible contact
_cache = {}


def alpha_of(src):
    if src not in _cache:
        im = Image.open(os.path.join(ROOT, src)).convert('RGBA')
        a = np.asarray(im)
        if 'sprites/fx/' in src:   # black-backed energy art: treat dark pixels as empty
            lum = a[:, :, :3].max(axis=2)
            m = (a[:, :, 3] > 100) & (lum > 60)
        else:
            m = a[:, :, 3] > 100
        _cache[src] = Image.fromarray((m * 255).astype(np.uint8))
    return _cache[src]


def raster(draws, box):
    X0, Y0, X1, Y1 = box
    W, H = max(1, int((X1 - X0) * SC)), max(1, int((Y1 - Y0) * SC))
    canvas = Image.new('L', (W, H), 0)
    for d in draws:
        b = d['bb']
        if b[2] < X0 or b[0] > X1 or b[3] < Y0 or b[1] > Y1:
            continue
        if d['k'] == 'img':
            sx, sy, sw, sh = d['s']; dx, dy, dw, dh = d['d']
            if sw <= 0 or sh <= 0 or dw == 0 or dh == 0:
                continue
            src = alpha_of(d['src']).crop((int(sx), int(sy), int(sx + sw), int(sy + sh)))
            a, bb, c, dd, e, f = d['m']
            # image pixel -> local -> world:  world = M * (S * p)
            S = np.array([[dw / sw, 0, dx], [0, dh / sh, dy], [0, 0, 1.0]])
            M = np.array([[a, c, e], [bb, dd, f], [0, 0, 1.0]])
            T = np.array([[SC, 0, -X0 * SC], [0, SC, -Y0 * SC], [0, 0, 1.0]]) @ M @ S
            try:
                inv = np.linalg.inv(T)
            except np.linalg.LinAlgError:
                continue
            layer = src.transform((W, H), Image.AFFINE, tuple(inv[:2].reshape(-1)), resample=Image.NEAREST)
            canvas = Image.fromarray(np.maximum(np.asarray(canvas), np.asarray(layer)))
        else:
            pts = [((p[0] - X0) * SC, (p[1] - Y0) * SC) for p in d['pts']]
            dr = ImageDraw.Draw(canvas)
            if d['kind'] == 'stroke':
                dr.line(pts, fill=255, width=max(1, int(d['lw'] * 2 * SC)))
            elif len(pts) >= 3:
                dr.polygon(pts, fill=255)
    return np.asarray(canvas) > 0


MAN = None


def manifest():
    global MAN
    if MAN is None:
        t = open(os.path.join(ROOT, 'sprites', 'manifest.js'), encoding='utf8').read()
        MAN = json.loads(t[t.index('{'):t.rindex('}') + 1])
    return MAN


def world_fist(d):
    """strike point of a pose sprite draw, in world space, through the draw's real transform"""
    m = re.match(r'sprites/([^/]+)/([^/.]+)\.png', d['src'])
    if not m or m.group(1) == 'fx':
        return None
    e = manifest().get(m.group(1), {}).get(m.group(2))
    if not e or 'fist' not in e:
        return None
    fx, fy, fr = e['fist']
    sx, sy, sw, sh = d['s']; dx, dy, dw, dh = d['d']
    lx, ly = dx + (fx * e['w'] - sx) * dw / sw, dy + (fy * e['h'] - sy) * dh / sh
    a, b, c, dd, ee, f = d['m']
    wx, wy = a * lx + c * ly + ee, b * lx + dd * ly + f
    scale = (abs(a * dd - b * c)) ** 0.5
    return wx, wy, fr * e['w'] * abs(dw / sw) * scale


def masks(frame, pad=0):
    # (frame is used for facing)
    """strike = what a player reads as the attack: pixels of the pose sprite around its strike point
    (fist / foot / blade tip, placed through the frame's real transform), plus every other piece of art the
    attacker draws (stretched limbs, fist/blade FX art, projectiles).
    body = defender art with thin protrusions (its own blades/staffs) opened away."""
    A = [d for d in frame['draws'] if d['o'] in ('A', 'AE')]
    D = [d for d in frame['draws'] if d['o'] == 'D' and d['k'] == 'img']
    if not A or not D:
        return None
    allb = A + D
    box = [int(min(d['bb'][0] for d in allb)) - pad - 2, int(min(d['bb'][1] for d in allb)) - pad - 2,
           int(max(d['bb'][2] for d in allb)) + pad + 2, int(max(d['bb'][3] for d in allb)) + pad + 2]
    # quick reject: attacker art nowhere near the defender
    ab = [min(d['bb'][0] for d in A), min(d['bb'][1] for d in A), max(d['bb'][2] for d in A), max(d['bb'][3] for d in A)]
    db = [min(d['bb'][0] for d in D), min(d['bb'][1] for d in D), max(d['bb'][2] for d in D), max(d['bb'][3] for d in D)]
    if ab[2] + pad < db[0] or db[2] + pad < ab[0] or ab[3] + pad < db[1] or db[3] + pad < ab[1]:
        return None
    strike = None
    hh, ww = max(1, int((box[3] - box[1]) * SC)), max(1, int((box[2] - box[0]) * SC))
    yy, xx = np.mgrid[0:hh, 0:ww]; yy = box[1] + yy / SC; xx = box[0] + xx / SC
    for d in A:
        px = raster([d], box)
        if strike is None: strike = np.zeros_like(px)
        is_pose = d['k'] == 'img' and d['o'] == 'A' and '/fx/' not in d['src']
        if is_pose:
            wf = world_fist(d)
            core = ndimage.binary_opening(px, structure=np.ones((7, 7)))
            cys, cxs = np.nonzero(core)
            keep = np.zeros_like(px)
            if wf:
                R = max(wf[2] * 2.2, 18)
                keep |= px & ((xx - wf[0]) ** 2 + (yy - wf[1]) ** 2 <= R * R)
            if len(cxs):
                ccx = cxs.mean(); facing = 1 if frame['ox'] >= frame['fx'] else -1
                w = cxs.max() - cxs.min()
                lab, n = ndimage.label(px & ~core)
                for li in range(1, n + 1):
                    comp = lab == li
                    if comp.sum() < 15: continue
                    cx = np.nonzero(comp)[1]
                    reach = (cx.max() - ccx) if facing > 0 else (ccx - cx.min())
                    if reach > w * 0.15 and np.nonzero(comp)[0].mean() < cys.max() - (cys.max() - cys.min()) * 0.12:
                        keep |= comp
            px = keep
        strike |= px
    body = ndimage.binary_opening(raster(D, box), structure=np.ones((5, 5)))
    return strike, body


def contact(frame):
    m = masks(frame)
    if m is None:
        return 0
    return int((m[0] & m[1]).sum())


def gap_px(frame, pad=60):
    """smallest on-screen distance (world px) between the attacker's strike art and the defender's body"""
    m = masks(frame, pad)
    if m is None or not m[0].any() or not m[1].any():
        return 999
    dt = ndimage.distance_transform_edt(~m[1])
    return float(dt[m[0]].min()) / SC


def gap_contact(frame, pad):
    m = masks(frame, pad)
    if m is None:
        return 0
    return int((ndimage.binary_dilation(m[0], iterations=max(1, int(pad * SC))) & m[1]).sum())


def analyse(cid):
    cases = json.load(open(os.path.join(AUD, cid + '.json')))
    problems = []
    for c in cases:
        normal = c['key'][0] in 'LMHA'
        rows = []; quiet = 0
        for r in c['recs']:
            hitF = r['hitF']
            if quiet >= 2 and r['dist'] > c['dHit']:
                break   # well past both the hit range and the art: nothing more to find
            vis = 0; visF = None
            for fr in r['frames']:
                if normal and not fr['act'] and not any(d['o'] == 'AE' for d in fr['draws']):
                    continue
                if hitF > 0 and fr['i'] > hitF:
                    break
                n = contact(fr)
                if n >= MIN_PX:
                    vis = n; visF = fr['i']; break
            rows.append((r['dist'], hitF > 0, vis, visF))
            quiet = quiet + 1 if (not vis and hitF <= 0) else 0
        miss = [d for d, h, v, _ in rows if v and not h]
        phantom = []
        for (dist, h, v, _), r in zip(rows, c['recs'][:len(rows)]):
            if h and not v:
                frs = [fr for fr in r['frames'] if (fr['act'] or not normal or any(d['o'] == 'AE' for d in fr['draws'])) and fr['i'] <= r['hitF']]
                g = min([gap_px(fr) for fr in frs] or [999])
                if g > GAP_OK:
                    phantom.append(f'{dist}(gap {int(g)}px)')
        tag = f"{c['cid']}.{c['key']}" + (f"@air{c['air']}" if c['air'] else '') + f" vs {c['def']}"
        if miss:
            problems.append(f"MISS    {tag}: art touches but no hit at {miss} (hits up to {c['dHit']})")
        if phantom:
            problems.append(f"PHANTOM {tag}: hit with no visible contact at {phantom}")
        # close range holes from the coarse sweep (e.g. projectiles spawning past the opponent)
        hs = c['hits']; first = hs.find('1')
        if first > 0 and normal is False and c['air'] == 0:
            problems.append(f"CLOSE   {tag}: no hit when closer than {40 + first * 10}px")
    return problems


if __name__ == '__main__':
    ids = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(AUD) if f.endswith('.json'))
    allp = []
    from multiprocessing import Pool
    with Pool(min(12, os.cpu_count() or 4)) as pool:
        res = pool.map(analyse, ids)
    for cid, p in zip(ids, res):
        allp += p
        print(f'== {cid}: {len(p)} problems', flush=True)
        for line in p:
            print('  ' + line, flush=True)
    print('TOTAL', len(allp))
