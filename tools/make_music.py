"""Convert the downloaded CC0 tracks (tools/out/music_src, see CREDITS.md) into sounds/music/*.ogg.
Loudness-normalised (EBU R128, -15 LUFS) so every stage plays at the same level; OGG loops without gaps.
usage: python tools/make_music.py      (needs ffmpeg on PATH)
"""
import os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'out', 'music_src')
DST = os.path.join(ROOT, 'sounds', 'music')

# game id -> source file (relative to SRC). *_intro plays once, then the loop file repeats.
TRACKS = {
    'menu': 'jrpg5/Action2 - Army Approaching.ogg',
    'sunny_intro': 'jrpg_battle_intro.mp3', 'sunny': 'jrpg_battle_loop.mp3',
    'marineford_intro': 'boss_battle_9_metal_opening.wav', 'marineford': 'boss_battle_9_metal_loop.wav',
    'wano': 'battleThemeA.mp3',
    'alabasta_intro': 'unchained_destiny_opening.wav', 'alabasta': 'unchained_destiny_loop.wav',
    'enies': 'fight_looped.wav',
    'skyisland': 'determined_pursuit_loop.wav',
    'thriller_intro': 'bb2/boss_battle_#2_metal_opening.wav', 'thriller': 'bb2/boss_battle_#2_metal_loop.wav',
    'elbaph': 'Fighting is not an option.ogg',
    'boss': 'Juhani Junkala - Epic Boss Battle [Seamlessly Looping].wav',
    'results': 'Victory1_1.mp3',
}

os.makedirs(DST, exist_ok=True)
for gid, src in TRACKS.items():
    path = os.path.join(SRC, src)
    if not os.path.exists(path):
        print('missing', src); continue
    out = os.path.join(DST, gid + '.ogg')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11',
                    '-ar', '44100', '-ac', '2', '-c:a', 'libvorbis', '-q:a', '4', out], check=True)
    print(gid, os.path.getsize(out) // 1024, 'KB')
