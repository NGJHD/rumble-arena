'use strict';
// Boot, fixed 60 fps loop, scaling and fullscreen.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const Game = {
  scene: null, fight: null,
  goto(s) { FX.clear(); this.scene = s; if (!(s instanceof FightScene)) this.fight = null; },
};

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', resize);
resize();

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  } catch (e) { /* not allowed */ }
}

Input.init();
window.addEventListener('keydown', e => {
  Sound.init();
  if (Sound.pendingSong) { Sound.playMusic(Sound.pendingSong); Sound.pendingSong = null; }
  if (e.code === 'KeyF' && !e.repeat) toggleFullscreen();
  else if (Settings.data.autoFull && !Game.triedFull && !document.fullscreenElement) { Game.triedFull = true; toggleFullscreen(); }
});
window.addEventListener('mousedown', () => Sound.init());

Sprites.init();
FXImg.init();
Game.goto(new TitleScene());

const STEP = 1000 / 60;
let last = performance.now(), acc = 0;
function step() {
  Input.pollPads();
  if (!Input.anyPressedFlag && Input.pads.some(p => p.buttons.some(b => b.pressed))) Input.anyPressedFlag = !Game._padHeld;
  Game._padHeld = Input.pads.some(p => p.buttons.some(b => b.pressed));
  P1In.poll(); P2In.poll(); AnyIn.poll();
  Game.scene.update();
  Input.endFrame();
}
function frame(now) {
  acc += Math.min(100, now - last);
  last = now;
  let n = 0;
  while (acc >= STEP && n < 4) {
    try { step(); } catch (err) { console.error(err); }
    acc -= STEP; n++;
  }
  if (n === 4) acc = 0;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  try { Game.scene.draw(ctx); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
