"""Title screen background: two crews of chibi sprites charging in from the sides, an open gap in the middle
for the title and menu (layout inspired by the owner's background.jpg). -> sprites/ui/title_bg.jpg

Each entry: (id, pose, x of feet centre, feet y, on-screen height, flip toward the middle?, depth 0=back..2=front)
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1280, 720

LEFT = [   # Straw Hats and allies, facing right (toward the middle): four staggered rows
    ('whitebeard', 'idle', 55, 400, 240, 0), ('garp', 'attack', 175, 395, 205, 0), ('jinbe', 'idle', 285, 405, 200, 0), ('franky', 'idle', 390, 405, 195, 0),
    ('brook', 'idle', 25, 520, 225, 1), ('robin', 'idle', 125, 525, 215, 1), ('hancock', 'idle', 225, 530, 215, 1), ('law', 'idle', 330, 535, 205, 1), ('shanks', 'idle', 440, 540, 210, 1),
    ('nami', 'attack', 35, 650, 225, 2), ('ace', 'special', 165, 650, 215, 2), ('usopp', 'special', 300, 655, 210, 2), ('chopper', 'idle', 545, 775, 150, 3),
    ('zoro', 'attack', 95, 790, 275, 3), ('sanji', 'kick', 255, 780, 265, 3), ('luffy', 'attack', 425, 790, 295, 3),
]
RIGHT = [  # rivals and villains, flipped to face left (toward the middle)
    ('kaido', 'idle', 1170, 450, 310, 0), ('bigmom', 'idle', 1000, 450, 280, 0),
    ('kizaru', 'idle', 1240, 590, 260, 1), ('blackbeard', 'idle', 1110, 600, 270, 1), ('doflamingo', 'idle', 960, 600, 275, 1), ('akainu', 'special', 850, 600, 255, 1),
    ('crocodile', 'idle', 1230, 760, 300, 2), ('aokiji', 'attack', 1100, 755, 300, 2),
    ('mihawk', 'attack', 940, 775, 320, 3),
]


def bg():
    y = np.linspace(0, 1, H)[:, None]
    top, mid, bot = np.array([18, 20, 70]), np.array([110, 18, 60]), np.array([190, 30, 20])
    c = np.where(y[..., None] < 0.5, top + (mid - top) * (y[..., None] / 0.5), mid + (bot - mid) * ((y[..., None] - 0.5) / 0.5))
    img = np.repeat(c, W, axis=1)
    # horizontal speed streaks like the reference
    rng = np.random.default_rng(7)
    for _ in range(70):
        yy = rng.integers(0, H); h = rng.integers(2, 6); a = rng.uniform(0.04, 0.12)
        img[yy:yy + h] = img[yy:yy + h] * (1 - a) + 255 * a
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')


def place(canvas, cid, pose, x, y, h, flip, depth):
    p = os.path.join(ROOT, 'sprites', cid, pose + '.png')
    im = Image.open(p).convert('RGBA')
    w = int(im.width * h / im.height)
    im = im.resize((w, h), Image.LANCZOS)
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if depth == 0:   # back row: darker and a touch hazy so the front reads first
        rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.6)
        im = Image.merge('RGBA', (*rgb.split(), im.split()[3]))
    elif depth == 1:
        rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.82)
        im = Image.merge('RGBA', (*rgb.split(), im.split()[3]))
    # dark outline glow for separation
    a = im.split()[3].filter(ImageFilter.MaxFilter(5))
    shadow = Image.new('RGBA', im.size, (0, 0, 0, 0)); shadow.putalpha(a.point(lambda v: int(v * 0.55)))
    canvas.alpha_composite(shadow, (int(x - w / 2), int(y - h)))
    canvas.alpha_composite(im, (int(x - w / 2), int(y - h)))


def main():
    c = bg()
    for d in range(4):
        for (cid, pose, x, y, h, dep) in LEFT:
            if dep == d: place(c, cid, pose, x, y, h, False, dep)
        for (cid, pose, x, y, h, dep) in RIGHT:
            if dep == d: place(c, cid, pose, x, y, h, True, dep)
    # soft dark glow in the middle so the title and menu stay readable
    glow = Image.new('L', (W, H), 0); ImageDraw.Draw(glow).ellipse((W / 2 - 300, 40, W / 2 + 300, H - 40), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    dark = Image.new('RGBA', (W, H), (8, 6, 20, 255)); dark.putalpha(glow)
    c.alpha_composite(dark)
    out = os.path.join(ROOT, 'sprites', 'ui'); os.makedirs(out, exist_ok=True)
    c.convert('RGB').save(os.path.join(out, 'title_bg.jpg'), quality=90)
    print('saved')


if __name__ == '__main__':
    main()
