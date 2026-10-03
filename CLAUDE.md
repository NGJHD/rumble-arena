# CLAUDE.md – Rumble Arena

One Piece 1v1 fighting game for the owner's kids (6–10). Plain HTML5 canvas + JavaScript: no build step, no runtime dependencies.

## Read first
- `STANDARD.MD` – the owner's rules. Never edit it. Build notes go in `BUILD_NOTES.md` (concise, no stories). Delete any release zip after pushing. Keep `RELEASE_GUIDE.md` current.
- `BUILD_NOTES.md` – architecture, file load order, art/music pipelines, gotchas, tests. Update it when you learn something a future agent would otherwise get wrong.

## Run / test
- Play: `Play.bat` (Windows; `tools/play.ps1` starts `tools/server.ps1`, a PowerShell server on :8765, and opens an Edge/Chrome app window). Dev or non-Windows: `python tools/devserver.py`.
- Tests (Node, from repo root): `node tools/tests/<sim_cpu|sim_moves|sim_mash|sim_hit|sim_jump|sim_select|sim_arcade|sim_boss>.js`. Run them all after gameplay changes; `node --check js/*.js` after edits.
- Browser checks: background tabs pause requestAnimationFrame, so drive `FightScene.update()` / `draw()` from JS instead of waiting for frames.

## Owner's rules that keep coming up
- Moves must be canon One Piece techniques, unique per fighter, shown with English names. Specials/supers must be flashy and start from the sprite's hand/weapon.
- Check sprites at FULL size before calling anything done: extra limbs, broken or bent weapons, wrong weapon design, pose size vs idle (`tools/scaleview.py`), strike points (`tools/strikeview.py`). Hand-edit when the image model keeps failing.
- Hits must follow what is drawn (`hitRects`/`hurtRects` from the manifest); verify with the range audit.
- Kid-friendly: no "kill" lines, no gore.
- Audio: recorded music and voice only (no text-to-speech, no new synth tunes). Only CC0 or owner-supplied assets; record them in `CREDITS.md`.
- Ask before pushing; commit when asked.

## Layout
- `index.html`, `js/` (game), `sprites/` (cut sprites + `manifest.js`, effect art, endings, title art), `stages/`, `sounds/music`, `sounds/voice`.
- `tools/`: ComfyUI art pipeline (`gen_sprites.py`, `gen_extra.py`, `chars.py`, `pose_fix.json`, `overlays.json`), music (`make_music.py`), servers, tests. `tools/out/` is gitignored local working data (raw renders, sources).
- `settings.json` is per-PC, gitignored, auto-created by the server.
