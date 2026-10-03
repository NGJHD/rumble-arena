"""One labelled sprite sheet per fighter -> tools/out/sheets/<id>.png + tools/out/sheets/index.html"""
import os, json
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'out', 'sheets')
os.makedirs(OUT, exist_ok=True)
txt = open(os.path.join(ROOT, 'sprites', 'manifest.js'), encoding='utf8').read()
man = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
POSES = ['idle', 'attack', 'kick', 'upper', 'special', 'super', 'hurt', 'block', 'jump', 'win', 'ko']
NAMES = {'luffy_g5': 'Luffy (Gear 5 form)', 'chopper_mp': 'Chopper (Monster Point form)'}
try:
    font = ImageFont.truetype('arialbd.ttf', 22)
except OSError:
    font = ImageFont.load_default()

order = ['luffy', 'luffy_g5', 'zoro', 'nami', 'usopp', 'sanji', 'chopper', 'chopper_mp', 'robin', 'franky', 'brook', 'jinbe',
         'akainu', 'kizaru', 'aokiji', 'ace', 'shanks', 'whitebeard', 'blackbeard', 'mihawk', 'crocodile', 'doflamingo',
         'kaido', 'bigmom', 'law', 'hancock', 'garp']
cards = []
for cid in order:
    if cid not in man:
        continue
    cells = []
    for p in POSES + [k for k in man[cid] if k not in POSES]:
        f = os.path.join(ROOT, 'sprites', cid, p + '.png')
        if os.path.exists(f):
            cells.append((p, Image.open(f).convert('RGBA')))
    cw, ch, pad = 330, 440, 12
    cols = 6
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * (cw + pad) + pad, rows * (ch + 40 + pad) + pad), (233, 238, 245, 255))
    d = ImageDraw.Draw(sheet)
    for i, (p, im) in enumerate(cells):
        x, y = pad + (i % cols) * (cw + pad), pad + (i // cols) * (ch + 40 + pad)
        d.rectangle([x, y, x + cw, y + ch + 34], fill=(120, 170, 200, 255))
        sc = min(cw / im.width, ch / im.height)
        im2 = im.resize((int(im.width * sc), int(im.height * sc)))
        sheet.alpha_composite(im2, (x + (cw - im2.width) // 2, y + 34 + ch - im2.height))
        d.text((x + 8, y + 6), p.upper(), fill=(255, 255, 255, 255), font=font)
    sheet.convert('RGB').save(os.path.join(OUT, cid + '.png'))
    cards.append(cid)

html = ['<!doctype html><html><head><meta charset="utf-8"><title>Rumble Arena sprites</title><style>',
        'body{background:#1e1e24;color:#eee;font:16px system-ui;margin:0;padding:16px}',
        'nav{position:sticky;top:0;background:#1e1e24;padding:8px 0;display:flex;flex-wrap:wrap;gap:6px;z-index:1}',
        'nav a{color:#ffd54f;text-decoration:none;background:#2a2a33;padding:4px 8px;border-radius:6px}',
        'section{margin:18px 0}img{max-width:100%;border-radius:8px}h2{margin:6px 0}</style></head><body>',
        '<h1>Rumble Arena — sprites, one fighter at a time</h1><nav>']
html += [f'<a href="#{c}">{NAMES.get(c, c.title())}</a>' for c in cards]
html.append('</nav>')
for i, c in enumerate(cards, 1):
    html.append(f'<section id="{c}"><h2>{i}. {NAMES.get(c, c.title())}</h2><img src="{c}.png" loading="lazy"></section>')
html.append('</body></html>')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write('\n'.join(html))
print(len(cards), 'sheets')
