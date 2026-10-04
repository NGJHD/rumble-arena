'use strict';
// Options -> UPDATE GAME. Talks to the local server (tools/server.ps1): it checks GitHub's latest release, and on
// "update" a background worker (tools/update.ps1) downloads, verifies and installs it, then the game reloads.
class UpdateScene {
  constructor() {
    this.t = 0; this.state = 'checking'; this.msg = ''; this.info = null; this.status = null;
    if (!SERVED) { this.state = 'error'; this.msg = 'Start the game with Play.bat to update it.'; return; }
    this.req('update/check').then(i => {
      this.info = i;
      if (!i.ok) { this.state = 'error'; this.msg = i.error; }
      else if (i.newer) this.state = 'offer';
      else { this.state = 'latest'; this.msg = 'Version ' + i.current + ' is the latest.'; }
    }).catch(() => { this.state = 'error'; this.msg = 'The game server is not answering.'; });
  }
  req(path, post) { return fetch(path, post ? { method: 'POST' } : undefined).then(r => r.json()); }
  install() {
    this.state = 'installing'; this.status = { state: 'download', got: 0, total: this.info.size || 0, msg: 'Starting...' };
    this.req('update/install', true).then(r => {
      if (!r.ok) { this.state = 'error'; this.msg = r.error; return; }
      this.poll();
    }).catch(() => { this.state = 'error'; this.msg = 'The game server is not answering.'; });
  }
  poll() {
    // the server restarts near the end, so failed polls are expected for a moment
    this.req('update/status').then(s => {
      if (s.state === 'done') { this.state = 'done'; this.msg = s.msg; setTimeout(() => location.reload(), 2500); return; }
      if (s.state === 'error') { this.state = 'error'; this.msg = s.msg + ' Nothing was changed.'; return; }
      if (s.state !== 'idle') this.status = s;
      setTimeout(() => this.poll(), 400);
    }).catch(() => setTimeout(() => this.poll(), 700));
  }
  update() {
    this.t++;
    const busy = this.state === 'installing' || this.state === 'done' || this.state === 'checking';
    if (!busy && Menu.back()) { Sound.play('back'); Game.goto(new OptionsScene()); return; }
    if (Menu.ok()) {
      if (this.state === 'offer') { Sound.play('confirm'); this.install(); }
      else if (this.state === 'latest' || this.state === 'error') { Sound.play('back'); Game.goto(new OptionsScene()); }
    }
  }
  draw(ctx) {
    menuBg(ctx, this.t, '#263238', '#0d47a1');
    drawText(ctx, 'UPDATE GAME', W / 2, 90, 70, '#ffeb3b', '#1a1a1a', 'center', 10);
    drawText(ctx, 'This version: ' + GAME_VERSION, W / 2, 170, 28, '#cfd8dc', '#1a1a1a', 'center', 5);
    const mb = b => (b / 1048576).toFixed(1) + ' MB';
    const line = (txt, y, size, col) => drawText(ctx, txt, W / 2, y, size || 38, col || '#ffffff', '#1a1a1a', 'center', 6);
    if (this.state === 'checking') line('Checking for a new version' + '.'.repeat(1 + Math.floor(this.t / 20) % 3), 320);
    if (this.state === 'latest') { line(this.msg, 320, 44, '#69f0ae'); line('Press attack or back to return', 470, 26, '#90a4ae'); }
    if (this.state === 'error') { line(this.msg, 320, this.msg.length > 50 ? 28 : 36, '#ff8a80'); line('Press attack or back to return', 470, 26, '#90a4ae'); }
    if (this.state === 'offer') {
      line('Version ' + this.info.latest + ' is available! (' + mb(this.info.size || 0) + ')', 300, 44, '#69f0ae');
      line('Press attack to update  ·  Back to cancel', 400, 30);
      line('The game will restart by itself when it is done.', 460, 24, '#90a4ae');
    }
    if (this.state === 'installing' && this.status) {
      const s = this.status, total = s.total || (this.info && this.info.size) || 0;
      const k = s.state === 'download' ? (total ? s.got / total : 0) : 1;
      line(s.msg || 'Updating...', 290, 40);
      const bw = 700, bx = W / 2 - bw / 2, by = 340;
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx - 4, by - 4, bw + 8, 44);
      ctx.fillStyle = '#37474f'; ctx.fillRect(bx, by, bw, 36);
      ctx.fillStyle = '#69f0ae'; ctx.fillRect(bx, by, bw * Math.min(1, k), 36);
      if (s.state === 'download') line(mb(s.got || 0) + ' of ' + mb(total), 420, 28, '#cfd8dc');
      line('Please wait, do not close the game.', 500, 24, '#90a4ae');
    }
    if (this.state === 'done') { line(this.msg + '!', 320, 50, '#69f0ae'); line('Restarting...', 400, 30); }
  }
}
