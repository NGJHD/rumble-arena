"""Generate fighter sprites with a local ComfyUI (Flux2 Klein 9B).

Run with ComfyUI's python (needs numpy, PIL, scipy):
  python tools/gen_sprites.py base  [ids...]   # 2 reference candidates per fighter -> tools/out/base
  python tools/gen_sprites.py poses [ids...]   # repose the picked reference      -> tools/out/poses/<id>
  python tools/gen_sprites.py cut   [ids...]   # remove white bg, trim            -> sprites/<id>/<pose>.png + sprites/manifest.js
Pick a reference by copying tools/out/base/<id>_<n>.png to tools/out/pick/<id>.png.
"""
import json, os, shutil, sys, time, urllib.request, uuid, zlib
from chars import CHARS, STYLE, poses, USER_REF_DIR, USER_REFS, EXTRAS, STAGES, FX_ASSETS, FX_STYLE, FX_META, POSE_OVERRIDES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'out')
COMFY = 'http://127.0.0.1:8188'
COMFY_DIR = r'C:\ai\ComfyUI'
W_, H_ = 768, 1024


def loaders():
    return {
        '10': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'flux-2-klein-9b-Q8_0.gguf'}},
        '14': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_8b_fp8mixed.safetensors', 'type': 'flux2', 'device': 'default'}},
        '12': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'flux2-vae.safetensors'}},
    }


def graph(prompt, seed, prefix, ref=None):
    g = loaders()
    g['6'] = {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['14', 0], 'text': prompt}}
    g['16'] = {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['6', 0]}}
    g['13'] = {'class_type': 'EmptyFlux2LatentImage', 'inputs': {'width': W_, 'height': H_, 'batch_size': 1}}
    pos = ['6', 0]
    # one or more reference images (files in ComfyUI/input), chained through ReferenceLatent
    for i, r in enumerate([ref] if isinstance(ref, str) else (ref or [])):
        g[f'2{i}'] = {'class_type': 'LoadImage', 'inputs': {'image': r}}
        g[f'3{i}'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': [f'2{i}', 0], 'vae': ['12', 0]}}
        g[f'4{i}'] = {'class_type': 'ReferenceLatent', 'inputs': {'conditioning': pos, 'latent': [f'3{i}', 0]}}
        pos = [f'4{i}', 0]
    g['3'] = {'class_type': 'KSampler', 'inputs': {'model': ['10', 0], 'positive': pos, 'negative': ['16', 0], 'latent_image': ['13', 0],
                                                   'seed': seed, 'steps': 4, 'cfg': 1, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1}}
    g['8'] = {'class_type': 'VAEDecode', 'inputs': {'samples': ['3', 0], 'vae': ['12', 0]}}
    g['9'] = {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': prefix}}
    return g


def run(g, dest):
    body = json.dumps({'prompt': g, 'client_id': str(uuid.uuid4())}).encode()
    pid = json.load(urllib.request.urlopen(urllib.request.Request(COMFY + '/prompt', body, {'Content-Type': 'application/json'})))['prompt_id']
    while True:
        time.sleep(1)
        h = json.load(urllib.request.urlopen(f'{COMFY}/history/{pid}'))
        if pid in h:
            st = h[pid].get('status', {})
            if st.get('status_str') == 'error':
                raise RuntimeError(json.dumps(st)[:800])
            img = h[pid]['outputs']['9']['images'][0]
            src = os.path.join(COMFY_DIR, 'output', img.get('subfolder', ''), img['filename'])
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy(src, dest)
            return dest


def desc(cid):
    name, look, style, fx = CHARS[cid]
    return name, look, style, fx


def do_base(ids):
    for cid in ids:
        name, look, style, fx = desc(cid)
        p = (f'{STYLE}. {name} from One Piece: {look}. Standing in a ready fighting stance, body turned to face the right side '
             f'of the image in a three-quarter side view, ' + ('holding the weapon ready.' if style in ('sword', 'staff') else 'fists raised.'))
        for n in range(int(os.environ.get('N', 2))):
            dest = os.path.join(OUT, 'base', f'{cid}_{n}.png')
            if os.path.exists(dest):
                continue
            t = time.time()
            run(graph(p, 1000 + n * 7919 + zlib.crc32(cid.encode()) % 1000, 'rumble/base_' + cid), dest)
            print(cid, n, f'{time.time() - t:.1f}s', flush=True)


def stage_input(src, name):
    """Flatten onto white, cap at ~1MP and copy into ComfyUI/input."""
    from PIL import Image
    im = Image.open(src).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg.convert('RGB')
    sc = (1024 * 1024 / (im.width * im.height)) ** 0.5
    if sc < 1:
        im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    im.save(os.path.join(COMFY_DIR, 'input', name))
    return name


def do_refbase(ids):
    """Redraw a user reference image in the game's art style (style anchor = Luffy's pick)."""
    style_ref = stage_input(os.path.join(OUT, 'pick', 'luffy.png'), 'rumble_style.png')
    for cid in ids:
        if cid not in USER_REFS:
            print('no user ref for', cid); continue
        name, look, style, fx = desc(cid)
        ref = stage_input(os.path.join(USER_REF_DIR, USER_REFS[cid]), f'rumble_user_{cid}.png')
        nostyle = bool(os.environ.get('NOSTYLE'))  # the style image can leak its own features (Luffy's hat, human size)
        if nostyle:
            p = (f'Redraw the character from the reference image ({name}: {look}) as a brand new full-body illustration. '
                 f'Keep the character design, face, body shape, outfit and colors from the reference. {STYLE}. '
                 f'Standing in a ready fighting stance, body facing toward the right side of the image in a three-quarter side view.')
        else:
            p = (f'Draw the character shown in image 1 ({name}: {look}) as a brand new full-body illustration in the exact art style of image 2. '
                 f'Keep the character design, face, outfit and colors from image 1, but use the clean line work, chibi proportions and flat coloring of image 2. '
                 f'{STYLE}. Standing in a ready fighting stance, body facing toward the right side of the image in a three-quarter side view.')
        refs = [ref] if nostyle else [ref, style_ref]
        tag = os.environ.get('TAG', 'r')
        for n in range(int(os.environ.get('N', 4))):
            dest = os.path.join(OUT, 'base', f'{cid}_{tag}{n}.png')
            if os.path.exists(dest):
                continue
            t = time.time()
            run(graph(p, 777 + n * 104729 + zlib.crc32((cid + tag).encode()) % 1000, 'rumble/ref_' + cid, refs), dest)
            print(cid, tag, n, f'{time.time() - t:.1f}s', flush=True)


def do_extras(ids):
    """Side sprites (e.g. Big Mom's Prometheus and Zeus) -> tools/out/poses/<id>/<name>.png, cut with the poses."""
    style_ref = stage_input(os.path.join(OUT, 'pick', 'luffy.png'), 'rumble_style.png')
    for cid in ids:
        for name, what in EXTRAS.get(cid, {}).items():
            dest = os.path.join(OUT, 'poses', cid, name + '.png')
            if os.path.exists(dest):
                continue
            # no style reference here: it leaks the reference's body/clothes onto the creature
            p = f'{what}. It has NO human body, NO legs and NO clothes, just the floating creature itself. {STYLE}. Single creature, centered.'
            run(graph(p, 31337 + zlib.crc32(name.encode()) % 1000, f'rumble/{cid}_{name}'), dest)
            print(cid, name, flush=True)


def do_edit(args):
    """gen_sprites.py edit <id> <source png in tools/out/base> <instruction>  -> tools/out/base/<id>_e<n>.png"""
    cid, src, instr = args[0], args[1], ' '.join(args[2:])
    ref = stage_input(os.path.join(OUT, 'base', src), f'rumble_edit_{cid}.png')
    p = f'{instr} Keep everything else about the character, pose, colors and art style exactly the same. Plain pure white background.'
    for n in range(int(os.environ.get('N', 4))):
        dest = os.path.join(OUT, 'base', f'{cid}_e{n}.png')
        run(graph(p, 99 + n * 7919, 'rumble/edit_' + cid, [ref]), dest)
        print(cid, 'e', n, flush=True)


BG_TEXT = {'white': 'plain pure white background', 'green': 'plain solid bright green chroma key background (pure #00FF00), no green on the character',
           'magenta': 'plain solid bright magenta chroma key background (pure #FF00FF), no magenta or pink on the character'}
# characters whose items/effects are green render on magenta instead (Usopp's slingshot, Mihawk's green slash)
BG_FOR = {'usopp': 'magenta', 'mihawk': 'magenta'}

# per-fighter anatomy note for pose prompts (default: two arms, two hands)
LIMBS = {
    'crocodile': 'Exactly two arms: a normal RIGHT hand; the LEFT arm ends in a golden hook with NO hand at all (the hook is not held by any hand). No extra limbs.',
    'enel': 'Exactly two arms and two hands, both attached at the shoulders. Exactly four small golden drums on ONE golden ring behind his back (the ring is not held). No extra limbs, no extra drums.',
    'kuma': 'Exactly two arms and two hands, both attached at the shoulders; the small book is held by one of those two hands. No extra arms, no extra hands.',
    'buggy': 'Exactly two arms and two hands, both attached at the shoulders (his body is not split apart). No extra arms, no extra hands.',
}


def do_stages(ids):
    """Wide stage backgrounds redrawn from the user's references -> tools/out/stages/<id>_<n>.png"""
    for sid in ids or list(STAGES):
        fn, scene = STAGES[sid]
        ref = stage_input(os.path.join(USER_REF_DIR, 'background', fn), f'rumble_bg_{sid}.png')
        p = (f'Redraw the scene from the reference image as a wide panoramic background for a 2D anime fighting game: {scene}. '
             'Bright, colorful, clean anime background painting with crisp details, no characters, no people, no text, no logos. '
             'Camera at ground level looking straight ahead; the important scenery is in the upper two thirds and the bottom quarter is plain open ground.')
        for n in range(int(os.environ.get('N', 4))):
            dest = os.path.join(OUT, 'stages', f'{sid}_{n}.png')
            if os.path.exists(dest):
                continue
            g = graph(p, 2024 + n * 31 + zlib.crc32(sid.encode()) % 1000, 'rumble/stage_' + sid, [ref])
            g['13']['inputs'].update({'width': 1856, 'height': 800})
            t = time.time(); run(g, dest)
            print(sid, n, f'{time.time() - t:.1f}s', flush=True)


def do_fx(ids):
    """Effect art candidates -> tools/out/fx/<id>_<n>.png"""
    for fid in ids or list(FX_ASSETS):
        mode, w, h, prompt = FX_ASSETS[fid]
        for n in range(int(os.environ.get('N', 2))):
            dest = os.path.join(OUT, 'fx', f'{fid}_{n}.png')
            if os.path.exists(dest):
                continue
            g = graph(f'{prompt}. {FX_STYLE}.', 555 + n * 7907 + zlib.crc32(fid.encode()) % 1000, 'rumble/fx_' + fid)
            g['13']['inputs'].update({'width': w, 'height': h})
            run(g, dest)
            print('fx', fid, n, flush=True)


def do_fxcut(args):
    """gen_sprites.py fxcut id:n ...  -> sprites/fx/<id>.png + sprites/fx_manifest.js"""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    mpath = os.path.join(ROOT, 'sprites', 'fx_manifest.js')
    man = {}
    if os.path.exists(mpath):
        txt = open(mpath, encoding='utf8').read(); man = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    os.makedirs(os.path.join(ROOT, 'sprites', 'fx'), exist_ok=True)
    for arg in args:
        fid, _, n = arg.partition(':')
        mode = FX_ASSETS[fid][0]
        im = Image.open(os.path.join(OUT, 'fx', f'{fid}_{n or 0}.png')).convert('RGB')
        a = np.asarray(im).astype(np.int16)
        if mode == 'add':
            # black background -> real transparency: alpha from brightness, colour un-premultiplied
            mx = a.max(axis=2).astype(np.float32)
            alpha = np.clip((mx - 12) * 1.6, 0, 255)
            rgb = np.clip(a.astype(np.float32) * 255.0 / np.maximum(alpha[..., None], 1), 0, 255)
            mask = alpha > 10
            out = Image.fromarray(np.dstack([rgb.astype(np.uint8), alpha.astype(np.uint8)]))
        else:
            light = a.min(axis=2)
            lab, _ = ndimage.label(light > 228)
            border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
            bg = np.isin(lab, list(border))
            alpha = np.where(bg, 0, 255).astype(np.uint8)
            mask = alpha > 0
            out = Image.fromarray(np.dstack([a.astype(np.uint8), alpha]))
        # feather the outer 5% so a crop line can never show as a hard edge
        arr = np.asarray(out.convert('RGBA')).astype(np.float32)
        hh, ww = arr.shape[:2]
        fy = np.clip(np.minimum(np.arange(hh), np.arange(hh)[::-1]) / max(1, hh * 0.05), 0, 1)
        fx = np.clip(np.minimum(np.arange(ww), np.arange(ww)[::-1]) / max(1, ww * 0.05), 0, 1)
        arr[:, :, 3] *= np.minimum(fy[:, None], fx[None, :])
        src_a = np.asarray(out.convert('RGBA'))[:, :, 3]
        cropped = [n for n, e in (('top', src_a[0]), ('bottom', src_a[-1]), ('left', src_a[:, 0]), ('right', src_a[:, -1])) if (e > 40).sum() > 8]
        if cropped:
            print('  WARN fx', fid, 'art touches the', '/'.join(cropped), 'edge (may be cropped)', flush=True)
        out = Image.fromarray(arr.astype(np.uint8))
        mask = arr[:, :, 3] > 10
        ys, xs = np.where(mask)
        box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        out = out.crop(box)
        sc = min(1.0, 512 / max(out.size))
        out = out.resize((max(1, round(out.width * sc)), max(1, round(out.height * sc))), Image.LANCZOS)
        meta = FX_META.get(fid, {})
        if meta.get('mirror'):
            out = out.transpose(Image.FLIP_LEFT_RIGHT)
        out.save(os.path.join(ROOT, 'sprites', 'fx', fid + '.png'), optimize=True)
        man[fid] = {'w': out.width, 'h': out.height, 'add': False, 'glow': mode == 'add', 'upright': bool(meta.get('upright')), 'rot': meta.get('rot', 0)}
        print('fxcut', fid, out.size, flush=True)
    with open(mpath, 'w', encoding='utf8') as f:
        f.write('// generated by tools/gen_sprites.py fxcut' + chr(10) + 'const FX_MANIFEST = ' + json.dumps(man) + ';' + chr(10))


def do_editpose(args):
    """gen_sprites.py editpose <id> <pose> <source png path> <instruction>
    Fix one detail of an existing pose render (keeps the background colour) -> out/e<n>/<id>/<pose>.png"""
    cid, pose, src, instr = args[0], args[1], args[2], ' '.join(args[3:])
    bgname = os.environ.get('BG') or BG_FOR.get(cid, 'green')
    ref = stage_input(src, f'rumble_ep_{cid}_{pose}.png')
    p = (f'{instr} Keep the character, pose, outfit, colors and art style exactly the same, change only what was asked. '
         f'{BG_TEXT[bgname]}, no shadow, no text.')
    for n in range(int(os.environ.get('N', 4))):
        dest = os.path.join(OUT, f'e{n + 1}', cid, pose + '.png')
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        g = graph(p, 3001 + n * 7919 + zlib.crc32((cid + pose).encode()) % 1000, f'rumble/ep_{cid}_{pose}', [ref])
        im = __import__('PIL.Image', fromlist=['Image']).open(src)
        g['13']['inputs'].update({'width': im.width // 16 * 16, 'height': im.height // 16 * 16})
        run(g, dest)
        print('editpose', cid, pose, n + 1, flush=True)


def do_poses(ids):
    for cid in ids:
        pick = os.path.join(OUT, 'pick', f'{cid}.png')
        if not os.path.exists(pick):
            print('no pick for', cid); continue
        ref = f'rumble_ref_{cid}.png'
        shutil.copy(pick, os.path.join(COMFY_DIR, 'input', ref))
        name, look, style, fx = desc(cid)
        for pose, what in dict(poses(style, fx), **POSE_OVERRIDES.get(cid, {})).items():
            if os.environ.get('ONLY') and pose not in os.environ['ONLY'].split(','):
                continue
            dest = os.path.join(OUT, os.environ.get('POSEDIR', 'poses'), cid, pose + '.png')
            if os.path.exists(dest):
                continue
            p = (f'The exact same chibi character from the reference image ({name}: {look}), now {what}. '
                 f'A clearly different, dynamic pose from the reference. The character faces toward the right side of the image. Keep the identical character design, outfit, colors and chibi art style. '
                 f'{LIMBS.get(cid, "Exactly two arms and two hands, both attached at the shoulders: no third hand, no extra arms, no hands growing out of the body or head.")} Thick black outlines, flat cel shading, full body visible, {BG_TEXT.get(os.environ.get("BG") or BG_FOR.get(cid, "green"))}, no shadow, no text.')
            t = time.time()
            run(graph(p, 4242 + int(os.environ.get('SEED', 0)) + zlib.crc32(pose.encode()) % 10000, f'rumble/{cid}_{pose}', ref), dest)
            print(cid, pose, f'{time.time() - t:.1f}s', flush=True)


# ---------------------------------------------------------------- hand compositing
# tools/overlays.json: {"<id>/<pose>": [ {"erase": [x, y, r]}, {"asset": "hook", "x": .., "y": .., "len": .., "ang": deg, "ax": .5, "ay": 1, "flip": false} ]}
# Coordinates are in the raw render's pixels. Erases punch transparent circles (remove a wrong hand),
# assets paste painted art from sprites/fx/<asset>.png (rotated around its anchor point).
def apply_overlays(cid, pose, im, alpha):
    import numpy as np
    from PIL import Image
    path = os.path.join(ROOT, 'tools', 'overlays.json')
    if not os.path.exists(path):
        return im, alpha
    ops = json.load(open(path, encoding='utf8')).get(f'{cid}/{pose}')
    if not ops:
        return im, alpha
    # pad the canvas so pasted art (Zoro's mouth sword) can extend past the original render edge
    PAD = 400
    h0, w0 = alpha.shape
    base = Image.fromarray(np.dstack([np.clip(im, 0, 255).astype(np.uint8), np.clip(alpha, 0, 255).astype(np.uint8)]))
    rgba = Image.new('RGBA', (w0 + 2 * PAD, h0 + 2 * PAD)); rgba.paste(base, (PAD, PAD))
    h, w = h0 + 2 * PAD, w0 + 2 * PAD
    yy, xx = np.mgrid[0:h, 0:w]
    raw_dir = os.path.join(OUT, 'poses', cid)
    for op in ops:
        if 'erase' in op:
            x, y, r = op['erase']
            a = np.asarray(rgba).copy(); a[(xx - x - PAD) ** 2 + (yy - y - PAD) ** 2 <= r * r, 3] = 0
            rgba = Image.fromarray(a)
            continue
        if 'patch' in op:
            # copy an elliptical region from another pose's raw render: {"patch": "attack", "src": [x, y, rx, ry], "dst": [x, y], "scale": 1}
            src = Image.open(os.path.join(raw_dir, op['patch'] + '.png')).convert('RGB')
            sx, sy, rx, ry = op['src']; sc = op.get('scale', 1)
            crop = src.crop((sx - rx, sy - ry, sx + rx, sy + ry))
            if sc != 1:
                crop = crop.resize((int(crop.width * sc), int(crop.height * sc)), Image.LANCZOS)
            m = Image.new('L', crop.size, 0)
            from PIL import ImageDraw, ImageFilter
            ImageDraw.Draw(m).ellipse((2, 2, crop.width - 3, crop.height - 3), fill=255)
            m = m.filter(ImageFilter.GaussianBlur(2))
            dx, dy = op['dst']
            rgba.paste(crop.convert('RGBA'), (int(dx - crop.width / 2 + PAD), int(dy - crop.height / 2 + PAD)), m)
            continue
        art = Image.open(os.path.join(ROOT, 'sprites', 'fx', op['asset'] + '.png')).convert('RGBA')
        if op.get('flip'):
            art = art.transpose(Image.FLIP_LEFT_RIGHT)
        sc = op['len'] / art.width if op.get('len') else op['h'] / art.height
        art = art.resize((max(1, int(art.width * sc)), max(1, int(art.height * sc))), Image.LANCZOS)
        ax, ay = op.get('ax', 0.5) * art.width, op.get('ay', 0.5) * art.height
        # rotate around the anchor: pad so the anchor is the canvas centre, then rotate
        pad = int(max(art.width, art.height) * 2)
        canvas = Image.new('RGBA', (pad, pad))
        canvas.paste(art, (int(pad / 2 - ax), int(pad / 2 - ay)))
        canvas = canvas.rotate(-op.get('ang', 0), resample=Image.BICUBIC)
        layer = Image.new('RGBA', rgba.size)
        layer.paste(canvas, (int(op['x'] + PAD - pad / 2), int(op['y'] + PAD - pad / 2)), canvas)
        rgba = Image.alpha_composite(layer, rgba) if op.get('behind') else Image.alpha_composite(rgba, layer)
    out = np.asarray(rgba).astype(np.float32)
    return out[:, :, :3].astype(np.int16), out[:, :, 3]


POSE_FIX = json.load(open(os.path.join(ROOT, 'tools', 'pose_fix.json'), encoding='utf8')) if os.path.exists(os.path.join(ROOT, 'tools', 'pose_fix.json')) else {}


def do_cut(ids):
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    manifest = {}
    mpath = os.path.join(ROOT, 'sprites', 'manifest.js')
    if os.path.exists(mpath):
        txt = open(mpath, encoding='utf8').read()
        manifest = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    for cid in ids:
        d = os.path.join(OUT, 'poses', cid)
        if not os.path.isdir(d):
            continue
        manifest[cid] = {}
        for fn in sorted(os.listdir(d)):
            pose = fn[:-4]
            im = np.asarray(Image.open(os.path.join(d, fn)).convert('RGB')).astype(np.int16)
            light = im.min(axis=2)
            corners = np.array([im[2, 2], im[2, -3], im[-3, 2], im[-3, -3]])
            r_, g_, b_ = im[:, :, 0], im[:, :, 1], im[:, :, 2]
            is_green = (corners[:, 1] > 150).all() and (corners[:, 0] < 120).all() and (corners[:, 2] < 120).all()
            is_mag = (corners[:, 0] > 150).all() and (corners[:, 2] > 150).all() and (corners[:, 1] < 120).all()
            if is_green or is_mag:
                # chroma-key render. key = how strongly a pixel is the key colour; key2 = the other two channels
                if is_green:
                    key, other, lo = g_, np.maximum(r_, b_), np.minimum(r_, b_)
                else:
                    key, other, lo = np.minimum(r_, b_), g_, g_
                keyish = (key > 100) & (key > other + 40)
                lab, _ = ndimage.label(keyish)
                border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
                bg = np.isin(lab, list(border))
                # enclosed gaps (between arm and body etc.) are removed when they are clearly the key colour
                strong = (key > 170) & (other < 110) & (key - other > 90)
                klab, kn = ndimage.label(strong)
                if kn:
                    sizes = ndimage.sum(strong, klab, range(kn + 1))
                    for i in range(1, kn + 1):
                        if sizes[i] > 60:
                            bg |= klab == i
                alpha = np.where(bg, 0, 255).astype(np.float32)
                edge = ndimage.binary_dilation(bg, iterations=2) & ~bg
                spill = np.clip((key - other) / 120.0, 0, 1)
                alpha[edge] = np.minimum(alpha[edge], (1 - spill[edge]) * 255)
                im = im.copy()
                if is_green:
                    im[:, :, 1] = np.minimum(g_, np.maximum(r_, b_) + 10)          # remove green spill
                else:
                    cap = g_ + 10                                                    # remove magenta spill
                    im[:, :, 0] = np.where(edge, np.minimum(r_, np.maximum(cap, b_ - 40)), r_)
                    im[:, :, 2] = np.where(edge, np.minimum(b_, np.maximum(cap, r_ - 40)), b_)
            else:
                near_white = light > 228
                lab, _ = ndimage.label(near_white)
                border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
                bg = np.isin(lab, list(border))
                # also clear large enclosed pure-white holes (gaps between arms/legs)
                sizes = ndimage.sum(near_white, lab, range(lab.max() + 1))
                for i, sz in enumerate(sizes):
                    if i and i not in border and sz > 20000:
                        reg = lab == i
                        if light[reg].mean() > 248:
                            bg |= reg
                alpha = np.where(bg, 0, 255).astype(np.float32)
                # soften edge: fade near-white pixels touching the background
                edge = ndimage.binary_dilation(bg, iterations=2) & ~bg
                soft = np.clip((255 - light) / (255 - 200), 0, 1) * 255
                alpha[edge] = np.minimum(alpha[edge], soft[edge])
            im, alpha = apply_overlays(cid, pose, im, alpha)
            ys, xs = np.where(alpha > 20)
            if len(ys) == 0:
                continue
            # effects that run off the render edge fade out softly instead of ending in a hard straight cut
            fh, fw = alpha.shape
            band = max(8, int(fw * 0.06))
            ramp = np.clip(np.arange(fw, dtype=np.float32) / band, 0, 1)
            alpha *= np.minimum(ramp[None, :], ramp[::-1][None, :])
            vramp = np.clip(np.arange(fh, dtype=np.float32) / band, 0, 1)
            alpha *= vramp[:, None]
            edges = [n for n, e in (('top', alpha[0]), ('left', alpha[:, 0]), ('right', alpha[:, -1])) if (e > 40).sum() > 6]
            if edges:
                print('  WARN', cid, pose, 'touches the', '/'.join(edges), 'edge of the render (cropped)', flush=True)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            rgba = np.dstack([im.astype(np.uint8), alpha.astype(np.uint8)])[y0:y1, x0:x1]
            img = Image.fromarray(rgba)
            sc = min(1.0, 420 / img.height) if pose != 'ko' else min(1.0, 420 / max(img.height, img.width * 0.75))
            img = img.resize((max(1, round(img.width * sc)), max(1, round(img.height * sc))), Image.LANCZOS)
            a = np.asarray(img)[:, :, 3]
            # anchor x = centre of the lowest 15% of solid pixels (the feet)
            rows = np.where(a.max(axis=1) > 40)[0]
            lo = a[int(rows.min() + (rows.max() - rows.min()) * 0.85):]
            cols = np.where(lo > 40)[1]
            ax = float(cols.mean()) / img.width if len(cols) else 0.5
            # head circle (for portraits): solid pixels in the top 40% of the sprite
            top = a[rows.min():int(rows.min() + (rows.max() - rows.min()) * 0.4)]
            tc = np.where(top.max(axis=0) > 40)[0]
            hr = (tc.max() - tc.min()) / 2 if len(tc) else img.width / 2
            head = [round(float(tc.min() + hr) / img.width, 3), round(float(rows.min() + hr) / img.height, 3), round(float(hr) / img.width, 3)]
            out = os.path.join(ROOT, 'sprites', cid, pose + '.png')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            img.save(out, optimize=True)
            # srcH = height in the original 1024 frame, so poses of one fighter keep a common scale
            # tools/pose_fix.json: per-pose 'scale' (the model drew the character smaller in this render) and
            # 'band' (height band to search for the striking point, e.g. a sword swung down to the floor)
            fix = POSE_FIX.get(f'{cid}/{pose}', {})
            entry = {'w': img.width, 'h': img.height, 'ax': round(ax, 3), 'srcH': int((y1 - y0) / fix.get('scale', 1)), 'head': head}
            # striking point = the right-most solid blob in a height band (sprites face right):
            # fist for punches/specials, foot for kicks. Projectiles and stretch arms start here.
            band_for = {'attack': (0.2, 0.75), 'bazooka': (0.2, 0.8), 'special': (0.2, 0.75), 'super': (0.2, 0.75), 'upper': (0.0, 0.5), 'kick': (0.35, 0.95)}
            # excluded areas (pose_fix 'excl' rects in 0..1 sprite coords, or '<id>/*' for every pose): noses, antlers, hats
            a_ex = a.copy()
            for ex in fix.get('excl', POSE_FIX.get(f'{cid}/*', {}).get('excl', [])):
                a_ex[int(ex[1] * img.height):int(ex[3] * img.height), int(ex[0] * img.width):int(ex[2] * img.width)] = 0
            if pose in band_for:
                lo_f, hi_f = fix.get('band', band_for[pose])
                y0b = int(img.height * lo_f)
                band = a_ex[y0b:int(img.height * hi_f)] > 60
                colsb = np.where(band.any(axis=0))[0]
                if len(colsb):
                    xr = colsb.max(); fw = max(6, int(img.width * 0.06))
                    reg = band[:, max(0, xr - fw):xr + 1]
                    rws = np.where(reg.any(axis=1))[0]
                    if len(rws):
                        r = float(np.clip((rws.max() - rws.min()) / 2, img.width * 0.035, img.width * 0.08))
                        cy = y0b + (rws.min() + rws.max()) / 2
                        entry['fist'] = [round((xr - r) / img.width, 3), round(cy / img.height, 3), round(r / img.width, 3)]
            # strike shape: every thin piece (blade, staff, extended limb: what a 21px opening removes) of 150px+ that
            # reaches in front of the body centre. The strike point is the tip of the biggest such piece (the point farthest
            # from the body centre, in front), so blades swung down/up and punching arms all get the right tip.
            # Hats and heads are thick, so they never count as the attack.
            from scipy import ndimage as _nd
            if pose in band_for or pose in ('slashfinish', 'bazooka'):
                solid = a_ex > 100
                core = _nd.binary_opening(solid, structure=np.ones((21, 21)))
                cys, cxs = np.nonzero(core)
                ccx, ccy = (cxs.mean(), cys.mean()) if len(cxs) else (img.width / 2, img.height / 2)
                lab, nlab = _nd.label(solid & ~core)
                strike = np.zeros_like(solid); best = None
                for li in range(1, nlab + 1):
                    comp = lab == li; n_ = int(comp.sum())
                    if n_ >= 150 and np.where(comp.any(axis=0))[0].max() > ccx + img.width * 0.12 and np.nonzero(comp)[0].mean() < img.height * 0.85:   # not the standing feet
                        strike |= comp
                        if best is None or n_ > best[0]: best = (n_, comp)
                if best is not None and not fix.get('band') and CHARS.get(cid, ('', '', ''))[2] in ('sword', 'staff'):
                    ys_, xs_ = np.nonzero(best[1]); front_ = xs_ >= ccx
                    if front_.any():
                        ys_, xs_ = ys_[front_], xs_[front_]
                        k_ = int(np.argmax((xs_ - ccx) ** 2 + (ys_ - ccy) ** 2))
                        r_ = img.width * 0.05
                        # pull the point slightly back from the very tip so the disc sits on the weapon/fist
                        vx_, vy_ = xs_[k_] - ccx, ys_[k_] - ccy; L_ = max(1.0, (vx_ * vx_ + vy_ * vy_) ** 0.5)
                        px_, py_ = xs_[k_] - vx_ / L_ * r_ * 0.6, ys_[k_] - vy_ / L_ * r_ * 0.6
                        entry['fist'] = [round(float(px_) / img.width, 3), round(float(py_) / img.height, 3), round(float(r_) / img.width, 3)]
                for ad in fix.get('add', []):   # thick weapons (bisento blade): hand-placed strike rects
                    strike[int(ad[1] * img.height):int(ad[3] * img.height), int(ad[0] * img.width):int(ad[2] * img.width)] |= solid[int(ad[1] * img.height):int(ad[3] * img.height), int(ad[0] * img.width):int(ad[2] * img.width)]
                if fix.get('fist'):
                    entry['fist'] = fix['fist']
                if 'fist' in entry:
                    fx_, fy_, fr_ = entry['fist']
                    yy_, xx_ = np.mgrid[0:img.height, 0:img.width]
                    rr_ = max(fr_ * img.width * 1.6, 14)
                    strike |= ((xx_ - fx_ * img.width) ** 2 + (yy_ - fy_ * img.height) ** 2 <= rr_ * rr_) & solid
                sb = []
                for bi in range(28):
                    seg = strike[int(img.height * bi / 28):int(img.height * (bi + 1) / 28)]
                    cs = np.where(seg.any(axis=0))[0]
                    sb.append([round(float(cs.min()) / img.width, 3), round(float(cs.max() + 1) / img.width, 3)] if len(cs) else None)
                entry['strike'] = sb
            # body profile for hurtboxes: 14 horizontal bands, [left, right] of the solid body in each band (0..1 of the
            # sprite width), thin protrusions (blades, staffs, strings) opened away so only the body can be hit
            body = _nd.binary_opening(a > 100, structure=np.ones((15, 15)))
            prof = []
            for bi in range(14):
                seg = body[int(img.height * bi / 14):int(img.height * (bi + 1) / 14)]
                cs = np.where(seg.any(axis=0))[0]
                prof.append([round(float(cs.min()) / img.width, 3), round(float(cs.max() + 1) / img.width, 3)] if len(cs) else None)
            entry['prof'] = prof
            manifest[cid][pose] = entry
        print('cut', cid, len(manifest[cid]), flush=True)
    with open(mpath, 'w', encoding='utf8') as f:
        body = ',\n'.join(json.dumps(k) + ':' + json.dumps(v, separators=(',', ':')) for k, v in manifest.items())
        f.write('// generated by tools/gen_sprites.py cut\nconst SPRITE_MANIFEST = {\n' + body + '\n};\n')


if __name__ == '__main__':
    mode, ids = sys.argv[1], sys.argv[2:] or ([] if sys.argv[1] in ('stages', 'fx', 'fxcut', 'editpose') else list(CHARS))
    {'base': do_base, 'refbase': do_refbase, 'edit': do_edit, 'stages': do_stages, 'fx': do_fx, 'fxcut': do_fxcut, 'editpose': do_editpose, 'extras': do_extras, 'poses': do_poses, 'cut': do_cut}[mode](ids)
