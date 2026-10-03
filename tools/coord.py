"""Overlay a labelled coordinate grid on a raw render: python tools/coord.py <png> <out.jpg> [x0 y0 x1 y1]"""
import sys
from PIL import Image, ImageDraw, ImageFont
im = Image.open(sys.argv[1]).convert('RGB')
if len(sys.argv) > 3:
    x0, y0, x1, y1 = map(int, sys.argv[3:7]); im = im.crop((x0, y0, x1, y1))
else:
    x0 = y0 = 0
d = ImageDraw.Draw(im); f = ImageFont.truetype('arial.ttf', 14)
step = 25
for x in range((x0 // step) * step, x0 + im.width, step):
    c = (255, 0, 0) if x % 100 == 0 else (255, 255, 255)
    d.line([(x - x0, 0), (x - x0, im.height)], fill=c, width=1)
    if x % 100 == 0: d.text((x - x0 + 2, 2), str(x), fill=(255, 0, 0), font=f)
for y in range((y0 // step) * step, y0 + im.height, step):
    c = (255, 0, 0) if y % 100 == 0 else (255, 255, 255)
    d.line([(0, y - y0), (im.width, y - y0)], fill=c, width=1)
    if y % 100 == 0: d.text((2, y - y0 + 2), str(y), fill=(255, 0, 0), font=f)
im.save(sys.argv[2], quality=90)
