"""Arcade-mode art (no reference images; Flux2 Klein text-to-image through tools/gen_sprites.py's graph()).

  python tools/gen_extra.py stage_imu            -> tools/out/stages/imu_<n>.png   (Imu's boss stage, 1536x864)
  python tools/gen_extra.py victory [ids...]     -> tools/out/victory/<id>_<n>.png (ending: hero standing over Imu, 1280x720)
  N=<count> sets candidates per item (default 2). Finished picks are copied to sprites/ending/<id>.jpg by `pick`.
  python tools/gen_extra.py pick <id> <n>        -> sprites/ending/<id>.jpg
"""
import os, sys, zlib, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_sprites as G
from chars import CHARS, USER_REF_DIR

OUT = G.OUT
ROOT = G.ROOT

IMU_REAL = ('Imu, the demon god-king of One Piece: dark skin, long wild white hair, two black curved horns, red ringed eyes, '
            'black fur-trimmed cloak, black wings of shadow flame dotted with red eyes')

# realistic One Piece anime look (adult proportions) for each hero, used only for the ending art
REAL = {
    'luffy': 'Monkey D. Luffy, straw hat, open red vest, X scar on his chest, blue shorts, sandals, huge grin',
    'luffy_g5': 'Monkey D. Luffy in Gear 5 Sun God form: fluffy wavy WHITE hair, white smoke curls around his neck, glowing red-ringed eyes, huge laughing grin, open WHITE shirt, white baggy pants, purple sash, everything white and glowing (no straw hat, no red or orange or yellow clothes)',
    'zoro': 'Roronoa Zoro, green hair, scar over his left eye, dark green kimono with a red sash, three katanas, one katana held in his mouth',
    'nami': 'Nami, long orange hair, blue bikini top, jeans, holding her blue Clima-Tact staff crackling with lightning',
    'usopp': 'Usopp, long nose, curly black hair, bandana and goggles, brown overalls, holding his green Kabuto slingshot',
    'sanji': 'Sanji, blond hair over one eye, curly eyebrow, black suit with a blue shirt, smoking a cigarette, one leg on fire',
    'chopper': 'Tony Tony Chopper, small cute reindeer with a pink top hat with a white cross, antlers, blue backpack',
    'robin': 'Nico Robin, long straight black hair, sunglasses on her head, elegant purple outfit, arms crossed, flower petals around her',
    'franky': 'Franky, blue pompadour hair, sunglasses on his forehead, huge blue cyborg forearms with star tattoos, red open shirt, speedo',
    'brook': 'Brook, tall skeleton with a big black afro and a crown, top hat, black suit and fur coat, cane sword',
    'jinbe': 'Jinbe, big blue whale-shark fishman with tusks, black hair in a topknot, orange kimono, fists raised',
    'akainu': 'Admiral Akainu, Marine admiral, red striped suit, white Marine coat on his shoulders, Marine cap, fists of glowing magma',
    'kizaru': 'Admiral Kizaru, tall Marine admiral, yellow striped suit, white Marine coat, dark sunglasses, glowing yellow light',
    'aokiji': 'Aokiji Kuzan, tall man with curly black afro hair, white suit with a blue shirt, sleeping mask on his forehead, frost and ice',
    'ace': 'Portgas D. Ace: a young man with messy BLACK hair and freckles across his cheeks, orange cowboy hat with two small blue faces on it, shirtless muscular torso, red bead necklace, black shorts, both fists covered in fire',
    'shanks': 'Red-Haired Shanks, red hair, three scars over his left eye, white shirt, long black cape, holding his saber Gryphon',
    'whitebeard': 'Edward Newgate Whitebeard: a GIANT old man twice as tall as normal people, huge muscular bare chest covered in scars, a huge white crescent-shaped moustache, black bandana, white captain coat worn over his shoulders like a cape, holding a very long BISENTO polearm (a long pole with a big curved single-edged blade on top), NOT a sword',
    'blackbeard': 'Marshall D. Teach Blackbeard, big man with a black beard and missing teeth, black captain coat, bandana, dark swirling darkness',
    'mihawk': 'Dracule Mihawk: a man with short BLACK hair, a thin black curled moustache and small beard, sharp yellow hawk eyes, a wide black hat with a big white plume, open black coat with red lining showing his bare chest and a small cross necklace, holding his huge pitch black sword Yoru shaped like a giant cross with a gold guard',
    'crocodile': 'Sir Crocodile: a tall man with slicked back black hair, a long stitched scar across his face, a thick black FUR coat with a fluffy fur collar, a large GOLDEN HOOK instead of his left hand, cigar in his mouth, swirling desert sand',
    'doflamingo': 'Donquixote Doflamingo, short blond hair, red pointed sunglasses, huge pink feather coat, white strings from his fingers',
    'kaido': 'Kaido: a GIANT very muscular man, long wild black hair, two big curved white horns on his head, black beard, open purple coat, bare chest, holding Hassaikai: a long black iron kanabo club shaped like a long baseball bat with short metal studs, NOT a mace, NO ball and NO chain',
    'bigmom': 'Charlotte Linlin Big Mom, huge woman with pink hair, pirate captain hat, pink polka dot dress, Zeus the thundercloud and Prometheus the sun beside her',
    'law': 'Trafalgar Law, white spotted fur hat, goatee, yellow and black hoodie, holding his long nodachi Kikoku, a blue Room dome',
    'hancock': 'Boa Hancock, very long straight black hair, purple dress with a long slit, golden snake earrings, the snake Salome',
    'garp': 'Monkey D. Garp, old Marine vice admiral with white hair and beard, white Marine coat, a giant clenched fist',
}


def make(prompt, seed, dest, w, h, refs=None):
    if os.path.exists(dest):
        return
    g = G.graph(prompt, seed, 'rumble/extra', refs)
    g['13']['inputs'].update({'width': w, 'height': h})
    t = time.time()
    G.run(g, dest)
    print(os.path.basename(dest), f'{time.time() - t:.1f}s', flush=True)


def stage_imu():
    p = ('Wide panoramic background painting for a 2D anime fighting game: the Empty Throne in Pangaea Castle at Mary Geoise, One Piece. '
         'A vast dark royal hall, a giant flat stone throne in the center with twenty tall swords stuck into the floor around it, '
         'enormous gold and black pillars, a huge round window showing a blood red sky and a blazing black sun, floating eye-shaped black flames, '
         'sinister purple and crimson lighting, ominous and epic. Clean anime background art with crisp details, no characters, no people, no text. '
         'Camera at ground level looking straight ahead; the important scenery is in the upper two thirds and the bottom quarter is a plain flat polished stone floor.')
    for n in range(int(os.environ.get('N', 4))):
        make(p, 9100 + n * 37, os.path.join(OUT, 'stages', f'imu_{n}.png'), 1536, 864)


def victory(ids):
    for cid in ids or list(REAL):
        hero = REAL[cid]
        p = (f'Official One Piece anime screenshot, Toei animation style, realistic anime proportions (not chibi), dramatic cinematic shot. '
             f'Extreme low angle worm\'s-eye camera from the ground: {hero} stands tall and triumphant in a victory pose, '
             f'towering over the ONE defeated {IMU_REAL} (there is only one Imu in the picture), who lies beaten face up on the cracked stone floor in the foreground. '
             f'The hero looks down at Imu and celebrates. Setting: the dark throne hall of Mary Geoise with a red sky and black sun behind, rays of light breaking through. '
             f'Epic, colorful, highly detailed anime illustration, sharp line art, cel shading, no text, no watermark.')
        for n in range(int(os.environ.get('N', 2))):
            make(p, 5150 + n * 7919 + zlib.crc32(cid.encode()) % 1000, os.path.join(OUT, 'victory', f'{cid}_{n}.png'), 1280, 720)


VREF_DIR = USER_REF_DIR + '/victory'   # realistic references for the arcade ending art
VREF = {'ace': 'ace.jpeg', 'akainu': 'akainu.webp', 'bigmom': 'big mom 2.jpg', 'blackbeard': 'blackbeard.webp', 'hancock': 'boa 2.jpg',
        'brook': 'brook.webp', 'chopper': 'chopper.webp', 'crocodile': 'crocodile.webp', 'doflamingo': 'doflamingo.jpg', 'franky': 'franky.jpg',
        'garp': 'garp.png', 'jinbe': 'jinbe.webp', 'kaido': 'kaido.webp', 'kizaru': 'kizaru 3.jpg', 'aokiji': 'kuzan.webp', 'law': 'law.webp',
        'luffy': 'luffy.png', 'mihawk': 'mihawk.png', 'nami': 'nami.jpg', 'robin': 'robin.jpg', 'sanji': 'sanji.webp', 'shanks': 'shanks.jpg',
        'usopp': 'usopp.jpg', 'whitebeard': 'whitebeard.webp', 'zoro': 'zoro 2.jpg',
        'luffy_g5': 'luffy g5.jpg'}

NOTES = {
    'bigmom': 'Big Mom is a HUGE woman, much taller and wider than a normal person, with curly pink hair, a black pirate captain hat and a pink dress with white polka dots; beside her float Prometheus (a living sun with a face) and Zeus (a white thundercloud with a face).',
    'crocodile': 'Prosthetic hook: his LEFT forearm ends in a large golden hook fused to the end of his sleeve where his left hand would be (the hook IS his left hand, it is NOT held by anything). His left arm hangs at his side showing the hook; his right hand is a bare fist. No sword, no cane, no staff.',
    'hancock': 'Boa Hancock: her WHOLE head is fully visible with a clear forehead and straight black bangs, very long straight black hair, a long red dress with green and pink circle patterns and a high slit, a purple cape, exactly as in image 1. Beautiful proud expression looking down, one hand on her hip. Keep her entire figure, head to toes, inside the frame. Her black hair must stand out against a bright red sky: the black sun is far off to the side, NOT behind her head.',
    'kizaru': 'Kizaru exactly as in image 1: a tall lanky middle-aged man with a long narrow face, short dark hair, a thin mustache and small goatee, small round tinted sunglasses, a sly relaxed grin; yellow pinstriped double-breasted suit, purple tie, white admiral coat with gold epaulettes on his shoulders; one hand raised with a small glowing yellow star of light at his fingertip. NO weapon.',
    'luffy': 'Luffy has a big X-shaped scar across the middle of his bare chest, clearly visible through his open red shirt, and a small scar under his left eye.',
    'usopp': 'Usopp has a VERY LONG straight nose sticking far out of his face like a long cylinder, the most important feature; curly black hair, a bandana and goggles on his head, holding his green Kabuto slingshot.',
    'whitebeard': 'Whitebeard holds his bisento Murakumogiri upright beside him exactly as in image 1: a long dark pole with ONE giant broad curved blade at the top, shaped like a huge silver crescent cleaver with a wavy black temper line and an ornate gold base where it joins the pole. No axe, no spear, no hook, no second blade, no other weapon.',
    'luffy_g5': 'Gear 5 Luffy has normal BLACK eyes (black pupils, NOT red, no glowing eyes), a big X-shaped scar across his bare chest, fluffy white hair, white clouds around his neck, white clothes with a purple sash, laughing wildly. Adult anime proportions, NOT chibi.',
    'zoro': 'Zoro exactly as in image 1: short green hair, a scar over his closed left eye, a confident grin with his right eye open, three gold earrings on his left ear, open dark green robe with a long diagonal scar across his chest, red sash; all THREE katanas sheathed together at his left hip with one hand resting on their handles. His mouth holds NOTHING.',
}

UNARMED = {c: 'The hero is completely empty-handed: NO sword, NO knife, NO weapon of any kind, bare fists only.' for c in
           ('luffy', 'luffy_g5', 'sanji', 'chopper', 'robin', 'franky', 'jinbe', 'akainu', 'kizaru', 'aokiji', 'ace', 'blackbeard', 'doflamingo', 'bigmom', 'hancock', 'garp')}


def victory_ref(ids):
    """Ending art from the owner's references: image 1 = the hero, image 2 = Imu -> tools/out/victory2/<id>_<n>.png"""
    imu = G.stage_input(os.path.join(VREF_DIR, 'imu.jpg'), 'rumble_vref_imu.png')
    for cid in ids or list(VREF):
        hero = G.stage_input(os.path.join(VREF_DIR, VREF[cid]), f'rumble_vref_{cid}.png')
        p = (f'Official One Piece anime key visual, Toei animation style, realistic anime proportions (not chibi). '
             f'HERO: the character from image 1 ({REAL[cid]}), drawn exactly as in image 1 - same face, hair, outfit and colors; '
             f'the hero holds only the weapon shown in image 1, and no weapon at all if image 1 shows none. {UNARMED.get(cid, "")} {NOTES.get(cid, "")} '
             f'The hero stands tall and triumphant in a victory pose, seen from an extreme low worm-eye angle from the ground. '
             f'DEFEATED: lying knocked out face up on the cracked stone floor at the feet of the hero is Imu from image 2: a huge demon man much bigger than a human, '
             f'dark brown skin covered in small white dots, long wild white hair, two curved black horns, a black fur cloak, a black and yellow striped skirt with gold rings on the belt, '
             f'and two huge black flame-shaped wings covered in red eyes spread out on the floor. Imu wears only his own clothes from image 2, never the clothes of the hero. '
             f'Exactly ONE hero and ONE Imu. Setting: the dark throne hall of Mary Geoise, a blood red sky and a black sun behind the hero, rays of light. '
             f'Epic, colorful, highly detailed anime illustration, sharp line art, cel shading, no text, no watermark, no logo.')
        for n in range(int(os.environ.get('N', 3))):
            make(p, int(os.environ.get('SEED', 7150)) + n * 7919 + zlib.crc32(cid.encode()) % 1000, os.path.join(OUT, os.environ.get('VOUT', 'victory2'), f'{cid}_{n}.png'), 1280, 720, [hero, imu])


def vedit(cid, n, instr):
    """img2img fix of one ending image -> tools/out/victory3/<id>_e<k>.png"""
    src = G.stage_input(os.path.join(OUT, 'victory3', f'{cid}_{n}.png'), f'rumble_vedit_{cid}.png')
    p = instr + ' Keep everything else in the picture exactly the same: same characters, poses, colors, background and art style.'
    for k in range(int(os.environ.get('N', 4))):
        dest = os.path.join(OUT, 'victory3', f'{cid}_e{k}.png')
        if os.path.exists(dest): os.remove(dest)
        make(p, 555 + k * 7919, dest, 1280, 720, [src])


def pick(cid, n):
    from PIL import Image
    d = os.path.join(ROOT, 'sprites', 'ending'); os.makedirs(d, exist_ok=True)
    Image.open(os.path.join(OUT, os.environ.get('VDIR', 'victory2'), f'{cid}_{n}.png')).convert('RGB').save(os.path.join(d, cid + '.jpg'), quality=88)
    print('ending', cid, '<-', n)


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'stage_imu': stage_imu()
    elif mode == 'victory': victory(sys.argv[2:])
    elif mode == 'victory_ref': victory_ref(sys.argv[2:])
    elif mode == 'vedit': vedit(sys.argv[2], sys.argv[3], ' '.join(sys.argv[4:]))
    elif mode == 'pick': pick(sys.argv[2], sys.argv[3])
