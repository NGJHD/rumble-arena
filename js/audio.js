'use strict';
// All sound is synthesized with WebAudio, so the game needs no audio files.
const Sound = {
  ctx: null, sfxGain: null, musicGain: null, noiseBuf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = this.ctx.createDynamicsCompressor();
      comp.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(comp);
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(comp);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.setVolumes();
    } catch (e) { this.ctx = null; }
  },
  setVolumes() {
    if (!this.ctx) return;
    this.sfxGain.gain.value = Settings.data.sfx;
    this.musicGain.gain.value = Settings.data.music * 0.5;
    if (this.trackEl) this.trackEl.volume = Math.min(1, Settings.data.music * ((MUSIC[this.musicId] || {}).vol || 1));
  },
  tone(freq, dur, type, vol, slideTo, delay, dest) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, freq, ftype, slideTo, delay, dest) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = ftype || 'lowpass';
    f.frequency.setValueAtTime(freq || 1000, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'hitL': this.noise(0.08, 0.5, 2500, 'bandpass'); this.tone(180, 0.08, 'sine', 0.5, 80); break;
      case 'hitM': this.noise(0.12, 0.6, 1800, 'bandpass'); this.tone(140, 0.12, 'sine', 0.7, 60); break;
      case 'hitH': this.noise(0.25, 0.8, 1200, 'lowpass', 200); this.tone(110, 0.25, 'sine', 0.9, 40); this.tone(60, 0.3, 'triangle', 0.6, 30); break;
      case 'block': this.tone(900, 0.06, 'square', 0.15, 600); this.noise(0.05, 0.3, 4000, 'highpass'); break;
      case 'whoosh': this.noise(0.15, 0.25, 600, 'bandpass', 3000); break;
      case 'jump': this.tone(300, 0.12, 'square', 0.08, 600); break;
      case 'land': this.noise(0.08, 0.25, 300, 'lowpass'); break;
      case 'dash': this.noise(0.2, 0.3, 400, 'bandpass', 2500); break;
      case 'fire': this.noise(0.45, 0.5, 900, 'lowpass', 200); this.tone(90, 0.3, 'sawtooth', 0.15, 50); break;
      case 'ice': this.tone(1800, 0.25, 'triangle', 0.15, 2600); this.noise(0.3, 0.3, 6000, 'highpass'); break;
      case 'light': this.tone(1200, 0.3, 'sine', 0.2, 3000); this.tone(2400, 0.2, 'triangle', 0.1, 4000); break;
      case 'lightning': for (let i = 0; i < 4; i++) this.noise(0.06, 0.6, 3000, 'bandpass', 800, i * 0.05); this.tone(70, 0.4, 'sawtooth', 0.3, 30); break;
      case 'slash': this.noise(0.18, 0.5, 2000, 'highpass', 8000); this.tone(1400, 0.1, 'sawtooth', 0.06, 500); break;
      case 'quake': this.tone(50, 0.7, 'sine', 0.9, 25); this.noise(0.6, 0.6, 250, 'lowpass', 60); break;
      case 'dark': this.tone(120, 0.6, 'sawtooth', 0.25, 40); this.noise(0.5, 0.3, 500, 'lowpass', 80); break;
      case 'beam': this.tone(220, 0.8, 'sawtooth', 0.15, 900); this.noise(0.8, 0.3, 1500, 'bandpass', 3000); break;
      case 'explode': this.noise(0.6, 0.9, 800, 'lowpass', 60); this.tone(70, 0.5, 'sine', 0.8, 25); break;
      case 'proj': this.tone(500, 0.15, 'square', 0.1, 900); this.noise(0.12, 0.2, 2000, 'bandpass'); break;
      case 'super':
        this.tone(220, 0.6, 'sawtooth', 0.15, 880); this.tone(330, 0.6, 'sawtooth', 0.1, 1320);
        this.noise(0.6, 0.3, 500, 'bandpass', 6000); break;
      case 'ko': this.noise(1.2, 1, 1000, 'lowpass', 40); this.tone(80, 1.2, 'sine', 1, 20); this.tone(160, 0.8, 'square', 0.15, 40); break;
      case 'select': this.tone(660, 0.06, 'square', 0.1); break;
      case 'confirm': this.tone(523, 0.08, 'square', 0.12); this.tone(784, 0.15, 'square', 0.12, null, 0.07); break;
      case 'back': this.tone(392, 0.1, 'square', 0.1, 260); break;
      case 'round': this.tone(392, 0.15, 'square', 0.15); this.tone(523, 0.15, 'square', 0.15, null, 0.15); this.tone(784, 0.4, 'square', 0.15, null, 0.3); break;
      case 'drum': this.tone(90, 0.18, 'sine', 0.6, 50); this.tone(140, 0.12, 'sine', 0.4, 70, 0.14); this.noise(0.06, 0.2, 2000, 'bandpass', null, 0.28); break;
      case 'pop': this.tone(900, 0.07, 'sine', 0.2, 1800); break;
    }
  },
  elem(e) {
    const m = { fire: 'fire', magma: 'fire', ice: 'ice', light: 'light', laser: 'light', lightning: 'lightning', slash: 'slash', quake: 'quake', dark: 'dark', haki: 'dark', water: 'whoosh', sand: 'whoosh', string: 'slash', love: 'light', soul: 'ice', room: 'light' };
    this.play(m[e] || 'whoosh');
  },

  // ---------- Music: tiny step sequencer ----------
  seq: null,
  playMusic(id) {
    if (!this.ctx) { this.pendingSong = id; return; }
    if (this.musicId === id) return;
    this.stopMusic();
    this.musicId = id;
    if (MUSIC[id]) { this._playTrack(id, MUSIC[id]); return; }
    const song = SONGS[id];
    if (!song) return;
    this.seq = { id, song, step: 0, next: this.ctx.currentTime + 0.1 };
    this.seq.timer = setInterval(() => this._sched(), 25);
  },
  stopMusic() {
    if (this.seq) { clearInterval(this.seq.timer); this.seq = null; }
    for (const n of this.trackNodes || []) { try { n.stop(); } catch (e) { /* not started */ } }
    if (this.trackEl) { this.trackEl.pause(); this.trackEl = null; }
    this.trackNodes = []; this.musicId = null;
  },
  // Served over http (Play.bat): WebAudio buffers, intro then a seamless loop. Opened as file://: a looping <audio> element.
  _playTrack(id, t) {
    const vol = t.vol || 1;
    if (!SERVED) {
      const el = new Audio('sounds/music/' + t.loop); el.loop = true; el.volume = Math.min(1, Settings.data.music * vol);
      el.play().catch(() => {}); this.trackEl = el; return;
    }
    Promise.all([t.intro ? loadBuf('sounds/music/' + t.intro) : null, loadBuf('sounds/music/' + t.loop)]).then(([ib, lb]) => {
      if (this.musicId !== id || !lb) return;
      const g = this.ctx.createGain(); g.gain.value = vol; g.connect(this.musicGain);
      let at = this.ctx.currentTime + 0.05;
      if (ib) { const s = this.ctx.createBufferSource(); s.buffer = ib; s.connect(g); s.start(at); at += ib.duration; this.trackNodes.push(s); }
      const l = this.ctx.createBufferSource(); l.buffer = lb; l.loop = true; l.connect(g); l.start(at); this.trackNodes.push(l);
    });
  },
  _sched() {
    const q = this.seq; if (!q || !this.ctx) return;
    const spb = 60 / q.song.bpm / 4;
    while (q.next < this.ctx.currentTime + 0.15) { this._step(q.song, q.step, q.next); q.next += spb; q.step++; }
  },
  _note(midi, t, dur, type, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  },
  _drum(kind, t) {
    const c = this.ctx, g = c.createGain();
    g.connect(this.musicGain);
    if (kind === 'k') {
      const o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); o.start(t); o.stop(t + 0.16);
    } else {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000;
      const d = kind === 's' ? 0.15 : 0.04;
      g.gain.setValueAtTime(kind === 's' ? 0.5 : 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      s.connect(f); f.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.01);
    }
  },
  _step(song, step, t) {
    const i = step % 16;
    const bar = Math.floor(step / 16) % song.prog.length;
    const [root, minor] = song.prog[bar];
    const chord = [0, minor ? 3 : 4, 7, 12];
    const spb = 60 / song.bpm / 4;
    if (song.kick[i] === 'x') this._drum('k', t);
    if (song.snare[i] === 'x') this._drum('s', t);
    if (song.hat[i] === 'x') this._drum('h', t);
    const b = song.bass[i];
    if (b !== '.') this._note(root - 12 + (b === 'o' ? 12 : b === '5' ? 7 : 0), t, spb * 1.8, 'triangle', 0.35);
    const l = song.lead[i];
    if (l !== '.') this._note(root + 12 + chord[+l % 4] + (+l >= 4 ? 12 : 0), t, spb * 1.5, song.leadType || 'square', 0.07);
  },
};

// Songs: prog = bars of [rootMidi, isMinor]; patterns are 16-step strings.
const SONGS = {
  menu: { bpm: 120, prog: [[57, 1], [53, 0], [48, 0], [55, 0]], kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x..x..x.x..x..5.', lead: '0.1.2.3.4.3.2.1.', leadType: 'triangle' },
  sunny: { bpm: 150, prog: [[48, 0], [53, 0], [55, 0], [48, 0]], kick: 'x...x...x...x...', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx', bass: 'x.xo.xx.x.xo.x5.', lead: '0..2..4.3..2.1..' },
  marineford: { bpm: 156, prog: [[50, 1], [46, 0], [48, 0], [45, 0]], kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx', bass: 'xx.xx.xxx.xx.x5o', lead: '4.3.2.1.0.1.2.3.' },
  wano: { bpm: 140, prog: [[52, 1], [52, 1], [48, 0], [50, 0]], kick: 'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x..x5.x.x..x5.o.', lead: '2.3.4...2.1.0...', leadType: 'triangle' },
  alabasta: { bpm: 146, prog: [[57, 1], [58, 0], [57, 1], [52, 0]], kick: 'x..x....x..x....', snare: '....x.......x.x.', hat: 'x.x.xxx.x.x.xxx.', bass: 'x.x.5.x.x.x.5.o.', lead: '0.1.2.1.4.2.3.1.' },
  thriller: { bpm: 112, prog: [[50, 1], [53, 0], [49, 1], [45, 0]], kick: 'x.......x..x....', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x..x..x.x.....5.', lead: '4...3...2...1...', leadType: 'triangle' },
  elbaph: { bpm: 132, prog: [[45, 1], [48, 0], [43, 0], [50, 1]], kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x.xox.x.x.xox.5.', lead: '0.2.4.2.1.3.4.3.' },
  boss: { bpm: 108, prog: [[45, 1], [46, 0], [45, 1], [44, 0]], kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'xx.xx.xxxx.xx.xo', lead: '4.3.2...4.3.1...', leadType: 'sawtooth' },
  results: { bpm: 128, prog: [[48, 0], [55, 0], [57, 1], [53, 0]], kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x...x...x...x...', lead: '0.2.4.2.0.2.4.2.' },
};

// Recorded music (CC0, see CREDITS.md). loop = seamless loop file, intro = played once before it. vol = level trim.
const MUSIC = {
  menu: { loop: 'menu.ogg' },
  sunny: { intro: 'sunny_intro.ogg', loop: 'sunny.ogg' },
  marineford: { intro: 'marineford_intro.ogg', loop: 'marineford.ogg' },
  wano: { loop: 'wano.ogg' },
  alabasta: { intro: 'alabasta_intro.ogg', loop: 'alabasta.ogg' },
  enies: { loop: 'enies.ogg' },
  skyisland: { loop: 'skyisland.ogg' },
  thriller: { intro: 'thriller_intro.ogg', loop: 'thriller.ogg' },
  elbaph: { loop: 'elbaph.ogg' },
  boss: { loop: 'boss.ogg' },
  results: { loop: 'results.ogg' },
};
const SERVED = typeof location !== 'undefined' && location.protocol.startsWith('http');
const BUFS = {};
function loadBuf(url) {
  if (!BUFS[url]) BUFS[url] = fetch(url).then(r => r.arrayBuffer()).then(a => Sound.ctx.decodeAudioData(a)).catch(() => null);
  return BUFS[url];
}

// Announcer: recorded arcade-announcer clips (sounds/voice, CC0 Kenney voiceover pack) in a big echoing arena.
const Announcer = {
  bus: null,
  _bus() {
    const c = Sound.ctx;
    if (this.bus || !c) return this.bus;
    const dry = c.createGain(), wet = c.createGain(), verb = c.createConvolver(), out = c.createGain();
    // synthetic arena impulse: 1.8 s of decaying noise
    const len = Math.floor(c.sampleRate * 1.8), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir; dry.gain.value = 1; wet.gain.value = 0.35; out.gain.value = 1.6;
    dry.connect(out); wet.connect(verb); verb.connect(out); out.connect(Sound.sfxGain);
    this.bus = { dry, wet };
    return this.bus;
  },
  // play(clip[, delaySeconds]). Clips: round_1..3 final_round fight time tie you_win you_lose winner player_1 player_2
  // flawless combo prepare choose arcade_mode battle_mode game_over ready congratulations power_up go
  play(clip, delay) {
    if (!Settings.data.announcer || !Sound.ctx) return;
    const url = 'sounds/voice/' + clip + '.ogg';
    if (!SERVED) { const el = new Audio(url); el.volume = Math.min(1, Settings.data.sfx + 0.2); setTimeout(() => el.play().catch(() => {}), (delay || 0) * 1000); return; }
    loadBuf(url).then(b => {
      if (!b) return;
      const bus = this._bus(), s = Sound.ctx.createBufferSource(); s.buffer = b;
      s.connect(bus.dry); s.connect(bus.wet); s.start(Sound.ctx.currentTime + (delay || 0));
    });
  },
  say() { /* text-to-speech removed: it sounded flat. Kept so old calls stay harmless. */ },
};
