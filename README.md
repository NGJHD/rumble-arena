# Rumble Arena

A flashy 1v1 fighting game with 25 One Piece fighters. **Double-click `Play.bat`** to play (opens in Chrome or Edge; settings are saved to `settings.json` in this folder). Double-clicking `index.html` also works, but then settings stay inside the browser. Press **F** for fullscreen.

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
- The round icons next to the super meter show when **G / H** specials are ready again.
- **Super** needs 1 bar. With **3 bars** you get the giant LEVEL 3 MAX version.
- Luffy's **H** turns him into **Gear 5** for a few seconds (then it needs a long rest). Chopper's super turns him into **Monster Point**.

Joysticks / gamepads: plug them in, then **Options → Controls** → pick which player uses which controller → **Set up controller buttons** if the buttons are mixed up.

## For grown-ups
- Dev server (always serves the newest files): `python tools/devserver.py` → http://localhost:8765/index.html
- Art is generated with the local ComfyUI pipeline in `tools/` — see `BUILD_NOTES.md`.
