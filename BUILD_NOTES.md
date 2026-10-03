# Build Notes — Rumble Arena

Browser fighting game (plain JS + Canvas, no build step, no dependencies). Open `index.html` to play.

## Files (load order matters — classic `<script>` tags, shared globals; ES modules break on `file://`)
- `sprites/manifest.js`, `sprites/fx_manifest.js` generated sprite/effect lists (load first)
- `core.js` constants, helpers, `ELEM` colours, `Settings`, `Sprites` (pose sprites)
- `input.js` keyboard + gamepad → `P1In`, `P2In`, `AnyIn` (merged, used vs CPU), `Menu`
- `audio.js` synthesized SFX/music (`Sound`), `Announcer` = speechSynthesis
- `characters.js` `ROSTER`: look (procedural fallback) + s1/s2/su move specs (type, style, art, power)
- `draw.js` procedural chibi + `drawSprite`/`drawCharArt`/`drawPortrait`
- `effects.js` particles, sparks, comic text, `arc` swooshes, `art` particles (`FX`)
- `stages.js` 8 painted stages; `OLD_STAGES` = procedural fallbacks
- `fxart.js` effect-art loader `FXImg`, `drawArt`, `drawProjArt`
- `moves.js` poses, base normal table, special/super templates, entities (Proj Beam Pillar Wave Rain Screen)
- `supers.js` signature supers (`SUPER_TYPES`) + scripted entities (SlashStorm, Dome, StormCloud, GiantHands, DemonFleur…)
- `kits.js` per-character normal kits (`KITS`, `applyKit`, `strikeFX`) — every fighter's L/M/H/air moves differ
- `specials.js` per-character special mechanics (`SPECIAL_STYLES`: through, spin, drill, erupt, vortexpull, shima, pull…)
- `fighter.js` state machine, chaining, physics, sprite-mode drawing, forms (Gear 5 / Monster Point), freeze/stone status
- `ai.js`, `fight.js` (hit resolution, camera, HUD incl. special cooldown icons), `menus.js`, `main.js`

## Design rules (from the owner)
- Moves must be canon One Piece techniques for that character; never invent names. No generic/recycled moves —
  normals, specials and supers are all per-character. Specials/supers must be flashy (art, screen effects).
- Effects must launch from the sprite's hand/weapon (`handPt` / manifest `fist`) on the strike frame — never from nowhere.
- Both players can't pick the same fighter.
- Balance: slow/narrow moves hit harder (`power` on super specs). Gear 5: 8 s, 25 s cooldown, starts each round on cooldown.

## Key mechanics
- Auto-combo: rank-based chains (`moveFor`). Mash L: L1→L2→L3→L4 launcher → auto super-jump → air chain → slam.
- "Combo magnet" slides normals toward a reeling opponent so mashing connects (all fighters 8–13 hits).
- Damage scaling 7%/hit, min 30% (supers 50%). Juggle hitstun decays 1.6 f per juggle hit.
- Super = 1 bar; 3 bars fires Level 3 MAX. Forms: Luffy H = Gear 5 (super becomes Bajrang Gun); Chopper super = Monster Point.

## Gotchas
- Browsers pause `requestAnimationFrame` in background tabs; in tests call `step()` / scene.update manually.
- The Chrome automation extension can't open `file://`. Serve with `python -m http.server 8765`.
- Painted stages: scenery scaled so its ground starts at y=600; the floor is the painting's own ground strip, mirror-tiled at parallax 1 (`makeGroundTile`). Tune `GROUND_FRAC` per stage.
- Gamepads: standard mapping l/m/h = X/Y/RB, s1/s2/su = A/B/RT; arcade encoders → Controls → set up buttons. Axis-9 hats decoded.

## Art pipeline (tools/, ComfyUI at C:/ai/ComfyUI port 8188, Flux2 Klein 9B GGUF + qwen_3_8b, 4 steps cfg 1)
- `chars.py`: prompts (CHARS), user reference map (USER_REFS, user's refs in Desktop/Scratchpad/Rumble Arena), STAGES, FX_ASSETS, FX_META.
- `gen_sprites.py refbase` redraws a user reference (NOSTYLE=1 avoids the Luffy style anchor leaking hats/proportions), 4 variants → user picks → `tools/out/pick/<id>.png`.
- `gen_sprites.py poses` → 11 poses via ReferenceLatent. `BG=green` renders on green screen for white/outline-less designs (Gear 5, feathers); `SEED=n` re-rolls; `LIMBS` adds anatomy notes (Shanks one arm, Crocodile hook).
- `gen_sprites.py cut` → sprites/<id>/<pose>.png + manifest (srcH scale, ax feet, head crop, fist = striking point for attack/special/kick/upper/super). Auto-detects green-screen renders.
- `gen_sprites.py fx` / `fxcut id:n` → sprites/fx/. Black-background art is converted to real alpha (brightness) and drawn with an extra additive glow pass.
- `stages`, `extras` (Big Mom's Prometheus/Zeus), `edit` (fix one detail of a pick).
- Poses render on a GREEN screen by default (BG=green): flood-fill + enclosed key-green removal keeps white clothing solid. The white-background cut punched holes in white caps/coats/hair.
- `cut` warns when a pose touches the render edge (cropped) and fades edges softly; re-roll those.
- A stale phrase in a description beats every pose instruction (Zoro kept growing scabbards from "three katana swords at his hip"); keep CHARS text consistent with POSE_OVERRIDES.
- If the pick image has an ambiguous detail (Usopp's slingshot holder read as a hand, Crocodile's bulb hook read as a fist), `edit` the pick itself first; re-rolling won't fix it.
- Candidates: `POSEDIR=candN ONLY=pose1,pose2 SEED=n gen_sprites.py poses <id>` then `tools/grid.py` / `cand_grid.py`, copy the winner into out/poses/<id>/.
- Hand compositing: `tools/overlays.json` pastes painted art (sprites/fx/*.png) onto a pose at cut time, or erases a region. Used for Zoro's mouth sword (the model kept swallowing/duplicating it). `tools/coord.py` draws a pixel grid on a raw render to place things.
- `editpose <id> <pose> <png> <instruction>` edits one existing render (keeps the key colour) -> out/e1..e4.
- BG_FOR renders Usopp/Mihawk on MAGENTA (their green slingshot/slash was keyed out on green).
- Hitboxes: in sprite mode a normal's reach comes from the strike sprite's fist point (fighter.attackBox), hurtboxes from the drawn sprite size. tests/sim_range*.js check "art touches = hit" and "art short = no hit".
- Description text matters as much as the reference: "dark skin" in text overrode a lighter pick (Usopp).
- Anatomy (extra arms/hands) is almost never fixed by editpose or re-rolls; paint it out in PIL instead: fill the limb with background/coat colour, redraw the outline, check the zoom at 2x. Done for Crocodile attack and Garp special (raw renders in out/poses are the hand-edited files, originals in out/bak_r10).
- Weapons drift between poses. The pick defines the canon look (Law: purple diamond hilt, no red; Brook: straight thin silver blade, purple grip). Check every pose of a weapon user side by side at full size.
- The model won't draw a blade pointing down after a slash; ask for 'tip almost touching the floor in front of his feet' and verify.
- Hits follow the DRAWN frame: `Fighter.hitRects()` = the pose's strike shape (manifest `strike` bands: thin blades/limbs reaching forward + the strike-point disc) placed through the frame's real transform; `hurtRects()` = the body silhouette (`prof` bands, thin weapons opened away). `fight.collide()` uses both. Both come from `cut`.
- `tools/pose_fix.json` per pose (or `<id>/*`): `scale` (model drew the pose smaller than idle: <1 enlarges), `excl` rects (noses, hats, antlers, hair never count as the strike), `add` rects (thick weapons like the bisento), `fist` (manual strike point), `band`. Check with `tools/out/strikeview.py` and `scaleview.py` sheets after every cut.
- Range audit: `node tools/tests/audit_range_dump.js [id]` records every draw per frame, `python tools/audit_range.py` rasterises the real pixels and reports MISS (art touches, no hit) / PHANTOM. The old sim_range*.js use a 30% body-width guess and are superseded.
- Move names shown on screen are English (owner rule). Use double quotes for names with apostrophes ("Lion's Song") or the game won't load; run `node --check js/*.js` after renames.
- Arcade (js/arcade.js): 7 random foes + Imu (BOSSES in characters.js, not selectable) on BOSS_STAGE `stages/imu.jpg`. Endings: `sprites/ending/<id>.jpg` from `tools/gen_extra.py victory` (realistic anime, text-to-image) -> `pick <id> <n>`; picker page tools/out/victory/index.html. Gear 5 win uses luffy_g5.
- Title art: `tools/title_bg.py` composites the cut sprites -> sprites/ui/title_bg.jpg (re-run after sprite changes).
- Pose size check: compare a stable feature (hat crown, afro) per pose, not face area/template match (turned/shaded faces fool both). Fix with pose_fix `scale`.
- Swords: check the handle continues the blade in ONE straight line; the model often bends it at the hand (reads as broken). `tools/straighten.py` / `tools/unhand.py` are the hand-edit helpers.
- Settings live in browser localStorage (key rumble_arena_settings, ver 2).
- Review sheets: `sheet.py`, `base_sheet.py`, `gallery.py`, `gallery_stages.py` → tools/out.

## Testing (`node tools/tests/<file>.js` from the repo root; headless vm + fake canvas)
- CPU-vs-CPU all 25; force every special/super (101 moves); mash-combo per fighter; special/super connect + damage table.
