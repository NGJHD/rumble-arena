"""Build a pick page: python tools/gallery.py [tag] [ids...]  (tag r = first round, s = redos, e = edits)
-> tools/out/choose.html (all) or choose_<tag>.html."""
import os, sys
from chars import CHARS, USER_REF_DIR, USER_REFS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'out')
TAG = sys.argv[1] if len(sys.argv) > 1 else 'r'
IDS = sys.argv[2:] or list(CHARS)
rows = []
for item in IDS:
    cid, _, own = item.partition(':')  # id:tag overrides the tag for one row
    i = list(CHARS).index(cid) + 1
    tag = own or ('e' if (TAG == 's' and cid == 'law') else TAG)
    name = CHARS[cid][0]
    ref = USER_REFS.get(cid)
    cells = ''.join(
        f'<figure><img src="base/{cid}_{tag}{n}.png" loading="lazy"><figcaption>{"ABCD"[n]}</figcaption></figure>'
        if os.path.exists(os.path.join(OUT, 'base', f'{cid}_{tag}{n}.png')) else '<figure class="missing">not ready</figure>'
        for n in range(4))
    refimg = f'<figure class="ref"><img src="file:///{USER_REF_DIR}/{ref}"><figcaption>your reference</figcaption></figure>' if ref else ''
    rows.append(f'<section><h2>{i}. {name} <small>({cid})</small></h2><div class="row">{cells}{refimg}</div></section>')

html = f'''<!doctype html><html><head><meta charset="utf-8"><title>Pick the designs</title>
<style>
body{{background:#1e1e24;color:#eee;font:16px system-ui,sans-serif;margin:0;padding:16px}}
h1{{margin:0 0 4px}} p{{color:#aaa;margin:0 0 16px}}
section{{background:#2a2a33;border-radius:10px;padding:10px 14px;margin-bottom:14px}}
h2{{margin:0 0 8px;font-size:20px}} small{{color:#888;font-weight:normal}}
.row{{display:flex;gap:10px;overflow-x:auto}}
figure{{margin:0;background:#fff;border-radius:8px;padding:4px;text-align:center;flex:0 0 auto}}
figure img{{height:300px;display:block}}
figcaption{{color:#111;font-weight:bold;font-size:22px}}
figure.ref{{background:#444;margin-left:12px}} figure.ref figcaption{{color:#ddd;font-size:14px}}
.missing{{width:225px;height:330px;display:flex;align-items:center;justify-content:center;color:#888;background:#333}}
</style></head><body>
<h1>Rumble Arena: pick a design for each fighter</h1>
<p>Reply with a letter per fighter, e.g. "1A 2C 3B ...". Your reference is on the right of each row.</p>
{''.join(rows)}
</body></html>'''
fn = os.path.join(OUT, 'choose.html' if TAG == 'r' else f'choose_{TAG}.html')
open(fn, 'w', encoding='utf8').write(html)
print('wrote', fn)
