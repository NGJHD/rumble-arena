import sys, json
sys.path.insert(0, 'tools')
import numpy as np
from PIL import Image
import audit_range as AR
cid, key, dfn, air, dist, out = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
c = [c for c in json.load(open(f'tools/out/audit/{cid}.json')) if c['key'] == key and c['def'] == dfn and c['air'] == air][0]
r = [r for r in c['recs'] if r['dist'] == dist][0]
frs = [fr for fr in r['frames'] if fr['act'] or any(d['o'] == 'AE' for d in fr['draws'])]
fr = max(frs, key=lambda f: AR.contact(f))
m = AR.masks(fr, 40)
A = [d for d in fr['draws'] if d['o'] in ('A', 'AE')]; D = [d for d in fr['draws'] if d['o'] == 'D' and d['k'] == 'img']
allb = A + D
box = [int(min(d['bb'][0] for d in allb)) - 42, int(min(d['bb'][1] for d in allb)) - 42, int(max(d['bb'][2] for d in allb)) + 42, int(max(d['bb'][3] for d in allb)) + 42]
a = AR.raster(A, box); dd = AR.raster(D, box)
img = np.zeros(a.shape + (3,), np.uint8)
img[a] = (110, 40, 40); img[dd] = (30, 60, 110)
if m: img[m[1]] = (60, 120, 220); img[m[0]] = (255, 80, 80); img[m[0] & m[1]] = (255, 255, 0)
Image.fromarray(img).resize((img.shape[1] * 3, img.shape[0] * 3), Image.NEAREST).save(out)
print(key, dist, 'frame', fr['i'], 'af', fr['af'], 'contact', AR.contact(fr), 'hitF', r['hitF'], [d['src'].split('/')[-2:] if 'src' in d else d['k'] for d in A])
