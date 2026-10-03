# Rumble Arena

A flashy 1v1 fighting game with 25 chibi One Piece fighters, made for kids. Plain HTML + JavaScript: no install, no build step.

## Play
- **Windows:** double-click **`Play.bat`**. It starts a tiny local server (needs [Python](https://www.python.org/) installed) and opens the game in your browser. Settings are saved to `settings.json` in this folder.
- **Any OS:** run `python tools/devserver.py`, then open http://localhost:8765/index.html
- Double-clicking `index.html` also works, but then settings are only kept inside that browser.
- Press **F** for fullscreen. Chrome or Edge recommended.

## Modes
- **Arcade** – pick a fighter and difficulty, then win 8 battles in a row. Opponents and stages are chosen for you, and the 8th battle is the final boss **Imu**. His face stays hidden until you reach him. Beat him to see your fighter's ending art.
- **Versus** – two players, each picks a fighter (the same fighter can't be picked twice) and a stage.
- **Training** – practise on a dummy with full super meter.
- **Options** – rounds, timer, volumes, announcer, fullscreen, and **Controls** (controller setup).

## Controls
| | Player 1 | Player 2 |
|---|---|---|
| Move / Jump / Crouch | W A S D | Arrow keys |
| Light / Medium / Heavy | T / Y / U | Numpad 4 / 5 / 6 |
| Special 1 / Special 2 | G / H | Numpad 1 / 2 |
| Super | J | Numpad 3 |
| Pause | Space or Esc | Enter or Esc |

- **Mash Light** for an automatic combo that launches into an air combo. Every fighter has their own moves.
- **Hold back** to block. **Tap forward twice** to dash. **Up in the air** to double jump.
- The round icons next to the super meter show when the two specials are ready again.
- **Super** needs 1 bar. With **3 bars** you get the giant LEVEL 3 MAX version.
- Luffy's Special 2 turns him into **Gear 5** for a few seconds (then it needs a long rest). Chopper's super turns him into **Monster Point**.

**Joysticks / gamepads / arcade sticks:** plug in, press a button on it, then **Options → Controls** → choose which player uses which controller → **Set up controller buttons** if the buttons are mixed up.

## Settings file
`settings.json` holds rounds, timer, volumes, fullscreen and controller setup. It is created automatically the first time the game runs through `Play.bat` / the server, and re-created if you delete it (from the defaults, or from what that browser last remembered). It is not in the repo (each PC keeps its own).

## For developers
- Notes for the code, art pipeline and tests: [`BUILD_NOTES.md`](BUILD_NOTES.md).
- Art was generated with a local ComfyUI pipeline in `tools/` (not needed to play).
- Tests: `node tools/tests/<name>.js` from the repo root.

## Credits
Music and announcer voice are CC0 tracks from OpenGameArt and Kenney: see [`CREDITS.md`](CREDITS.md).

## Disclaimer
Unofficial, non-commercial fan project. One Piece and all its characters belong to Eiichiro Oda, Shueisha and Toei Animation. This project is not affiliated with or endorsed by them.
