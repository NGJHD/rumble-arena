"""Pick page for Gear 5 Luffy and the stage backgrounds -> tools/out/choose_stages.html"""
import os
from chars import STAGES, USER_REF_DIR, USER_REFS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'out')

def fig(src, cap, h, ok=True):
    return f'<figure><img src="{src}" style="height:{h}px" loading="lazy"><figcaption>{cap}</figcaption></figure>' if ok else '<figure class="missing">not ready</figure>'

rows = []
g5 = ''.join(fig(f'base/luffy_g5_r{n}.png', 'ABCD'[n], 300, os.path.exists(os.path.join(OUT, 'base', f'luffy_g5_r{n}.png'))) for n in range(4))
rows.append(f'<section><h2>G5. Gear 5 Luffy</h2><div class="row">{g5}<figure class="ref"><img src="file:///{USER_REF_DIR}/{USER_REFS["luffy_g5"]}" style="height:300px"><figcaption>your reference</figcaption></figure></div></section>')
for i, (sid, (fn, scene)) in enumerate(STAGES.items(), 1):
    cells = ''.join(fig(f'stages/{sid}_{n}.png', 'ABCD'[n], 210, os.path.exists(os.path.join(OUT, 'stages', f'{sid}_{n}.png'))) for n in range(4))
    rows.append(f'<section><h2>S{i}. {sid}</h2><div class="row">{cells}<figure class="ref"><img src="file:///{USER_REF_DIR}/background/{fn}" style="height:210px"><figcaption>your reference</figcaption></figure></div></section>')

html = f'''<!doctype html><html><head><meta charset="utf-8"><title>Pick Gear 5 and stages</title>
<style>
body{{background:#1e1e24;color:#eee;font:16px system-ui,sans-serif;margin:0;padding:16px}}
h1{{margin:0 0 4px}} p{{color:#aaa;margin:0 0 16px}}
section{{background:#2a2a33;border-radius:10px;padding:10px 14px;margin-bottom:14px}}
h2{{margin:0 0 8px;font-size:20px}}
.row{{display:flex;gap:10px;overflow-x:auto}}
figure{{margin:0;background:#fff;border-radius:8px;padding:4px;text-align:center;flex:0 0 auto}}
figure img{{display:block}}
figcaption{{color:#111;font-weight:bold;font-size:22px}}
figure.ref{{background:#444;margin-left:12px}} figure.ref figcaption{{color:#ddd;font-size:14px}}
.missing{{width:300px;height:220px;display:flex;align-items:center;justify-content:center;color:#888;background:#333}}
</style></head><body>
<h1>Pick Gear 5 Luffy and the 8 stages</h1>
<p>Reply like "G5B S1A S2C ...". The bottom quarter of each stage gets covered by the platform the fighters stand on.</p>
{''.join(rows)}
</body></html>'''
open(os.path.join(OUT, 'choose_stages.html'), 'w', encoding='utf8').write(html)
print('wrote choose_stages.html')
