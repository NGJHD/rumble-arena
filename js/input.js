'use strict';
// Keyboard + gamepad input. Actions per player:
// up down left right | l m h (light/medium/heavy) | s1 s2 (specials) | su (super) | start
const ACTIONS = ['up', 'down', 'left', 'right', 'l', 'm', 'h', 's1', 's2', 'su', 'start'];
const BUTTON_ACTIONS = ['l', 'm', 'h', 's1', 's2', 'su', 'start'];
const ACTION_LABEL = { l: 'LIGHT', m: 'MEDIUM', h: 'HEAVY', s1: 'SPECIAL 1', s2: 'SPECIAL 2', su: 'SUPER', start: 'START / PAUSE' };

const KEYMAP = [
  { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right', KeyT: 'l', KeyY: 'm', KeyU: 'h', KeyG: 's1', KeyH: 's2', KeyJ: 'su', Space: 'start' },
  {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    Numpad4: 'l', Numpad5: 'm', Numpad6: 'h', Numpad1: 's1', Numpad2: 's2', Numpad3: 'su', NumpadEnter: 'start', Enter: 'start',
    // laptop fallback
    KeyI: 'l', KeyO: 'm', KeyP: 'h', KeyK: 's1', KeyL: 's2', Semicolon: 'su',
  },
];
const KEY_LABELS = [
  { move: 'W A S D', l: 'T', m: 'Y', h: 'U', s1: 'G', s2: 'H', su: 'J' },
  { move: 'ARROWS', l: 'Num 4', m: 'Num 5', h: 'Num 6', s1: 'Num 1', s2: 'Num 2', su: 'Num 3' },
];

const Input = {
  keys: new Set(),
  tapped: new Set(),
  sysPressed: new Set(), // raw key codes pressed this frame (for Escape etc.)
  pads: [],
  anyPressedFlag: false,
  init() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
      if (!e.repeat) { this.tapped.add(e.code); this.sysPressed.add(e.code); }
      this.keys.add(e.code);
      this.anyPressedFlag = true;
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  },
  pollPads() {
    let list = [];
    try { list = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { list = []; }
    this.pads = Array.from(list || []).filter(p => p && p.connected);
  },
  pad(i) { return this.pads[i] || null; },
  endFrame() { this.tapped.clear(); this.sysPressed.clear(); this.anyPressedFlag = false; },
  sys(code) { return this.sysPressed.has(code); },
};

function defaultPadMap(pad) {
  if (pad && pad.mapping === 'standard') return { l: 2, m: 3, h: 5, s1: 0, s2: 1, su: 7, start: 9 };
  return { l: 0, m: 1, h: 2, s1: 3, s2: 4, su: 5, start: 9 };
}
function padMap(pad) { return Settings.data.padMaps[pad.id] || defaultPadMap(pad); }
function btnDown(pad, i) { const b = pad.buttons[i]; return !!b && (b.pressed || b.value > 0.5); }

// Read directions from a pad: sticks, d-pad buttons, or a DirectInput hat on axis 9.
function padDirs(pad, out) {
  const ax = pad.axes;
  if (ax.length > 1) {
    if (ax[0] < -0.5) out.left = true;
    if (ax[0] > 0.5) out.right = true;
    if (ax[1] < -0.5) out.up = true;
    if (ax[1] > 0.5) out.down = true;
  }
  if (btnDown(pad, 12)) out.up = true;
  if (btnDown(pad, 13)) out.down = true;
  if (btnDown(pad, 14)) out.left = true;
  if (btnDown(pad, 15)) out.right = true;
  if (ax.length > 9) {
    const v = ax[9];
    if (v >= -1.05 && v <= 1.05 && Math.abs(v) > 0.02) {
      const i = Math.round((v + 1) / (2 / 7)) % 8; // 0 up, 1 up-right ... 7 up-left
      if (i === 7 || i === 0 || i === 1) out.up = true;
      if (i >= 1 && i <= 3) out.right = true;
      if (i >= 3 && i <= 5) out.down = true;
      if (i >= 5 && i <= 7) out.left = true;
    }
  }
}

class PlayerInput {
  constructor(idx) {
    this.idx = idx;
    this.held = {}; this.pressed = {}; this.prev = {};
    for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; this.prev[a] = false; }
  }
  poll() {
    const h = {};
    for (const a of ACTIONS) h[a] = false;
    const km = KEYMAP[this.idx];
    for (const code in km) if (Input.keys.has(code) || Input.tapped.has(code)) h[km[code]] = true;
    const padIndex = this.idx === 0 ? Settings.data.padP1 : Settings.data.padP2;
    const pad = padIndex >= 0 ? Input.pad(padIndex) : null;
    if (pad) {
      padDirs(pad, h);
      const map = padMap(pad);
      for (const a of BUTTON_ACTIONS) if (map[a] != null && btnDown(pad, map[a])) h[a] = true;
    }
    for (const a of ACTIONS) {
      this.pressed[a] = h[a] && !this.prev[a];
      this.held[a] = h[a];
      this.prev[a] = h[a];
    }
  }
}

// Combines several inputs (used when one human plays vs CPU so either keyboard side works).
class MergedInput {
  constructor(list) { this.list = list; this.held = {}; this.pressed = {}; }
  poll() {
    for (const a of ACTIONS) {
      this.held[a] = this.list.some(i => i.held[a]);
      this.pressed[a] = this.list.some(i => i.pressed[a]);
    }
  }
}

const P1In = new PlayerInput(0), P2In = new PlayerInput(1);
const AnyIn = new MergedInput([P1In, P2In]);

// Menu helper: navigation pressed by either player or Enter/Escape keys.
const Menu = {
  up(i) { const s = i || AnyIn; return s.pressed.up; },
  down(i) { const s = i || AnyIn; return s.pressed.down; },
  left(i) { const s = i || AnyIn; return s.pressed.left; },
  right(i) { const s = i || AnyIn; return s.pressed.right; },
  ok(i) {
    const s = i || AnyIn;
    return s.pressed.l || s.pressed.m || s.pressed.h || s.pressed.start || (!i && (Input.sys('Enter') || Input.sys('NumpadEnter')));
  },
  back(i) {
    const s = i || AnyIn;
    return s.pressed.su || (!i && (Input.sys('Escape') || Input.sys('Backspace')));
  },
};
