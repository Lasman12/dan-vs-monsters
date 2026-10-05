'use strict';
/* =========================================================
   Dan vs. The Monsters — engine
   Pixel-art platformer. 16px tiles, 60Hz fixed step.
   ========================================================= */
let VW = 480, VH = 270;   // on phones: zoomed in and widened to the screen's aspect ratio
const $ = id => document.getElementById(id);
const cv = $('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const rnd = (a, b) => a + Math.random() * (b - a);
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && !matchMedia('(pointer: fine)').matches);
const IS_APP = /DanApp/.test(navigator.userAgent);   // running inside the Android app (already fullscreen)

/* ---------------- sound ---------------- */
let AC = null, muted = !!(store.get(SETTINGS_KEY) || {}).muted;
function setMuted(v) { muted = v; store.set(SETTINGS_KEY, Object.assign(store.get(SETTINGS_KEY) || {}, { muted: v })); }
function initAudio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); }
const SFX = {
  jump: [['square', 300, 600, 0.08, 0.08]], djump: [['square', 400, 800, 0.08, 0.08]], swing: [['noise', 0, 0, 0.06, 0.06]],
  hit: [['square', 220, 80, 0.08, 0.12]], kill: [['square', 400, 60, 0.18, 0.12], ['noise', 0, 0, 0.12, 0.08]], hurt: [['sawtooth', 200, 60, 0.2, 0.12]],
  coin: [['square', 900, 1400, 0.07, 0.06]], gem: [['square', 700, 1800, 0.15, 0.07]],
  clang: [['square', 1200, 900, 0.06, 0.08], ['triangle', 600, 600, 0.1, 0.08]], spring: [['triangle', 200, 900, 0.18, 0.12]],
  check: [['square', 523, 523, 0.08, 0.07], ['square', 659, 659, 0.08, 0.07, 0.08], ['square', 784, 784, 0.15, 0.07, 0.16]],
  lever: [['square', 300, 300, 0.05, 0.08], ['square', 500, 500, 0.08, 0.08, 0.06]], door: [['noise', 0, 0, 0.4, 0.1]],
  dash: [['noise', 0, 0, 0.12, 0.07], ['sawtooth', 600, 200, 0.1, 0.05]], potion: [['sine', 400, 900, 0.3, 0.12]],
  buy: [['square', 660, 660, 0.06, 0.07], ['square', 990, 990, 0.12, 0.07, 0.06]], boss: [['sawtooth', 110, 55, 0.6, 0.12]],
  slam: [['noise', 0, 0, 0.3, 0.15], ['sine', 120, 40, 0.3, 0.2]], shoot: [['square', 700, 300, 0.08, 0.05]],
  medal: [['square', 523, 523, 0.1, 0.07], ['square', 659, 659, 0.1, 0.07, 0.1], ['square', 784, 784, 0.1, 0.07, 0.2], ['square', 1046, 1046, 0.35, 0.08, 0.3]],
  crumble: [['noise', 0, 0, 0.15, 0.05]], die: [['sawtooth', 400, 50, 0.7, 0.12]],
  thunder: [['noise', 0, 0, 0.5, 0.18], ['sawtooth', 90, 40, 0.4, 0.1]], explode: [['noise', 0, 0, 0.35, 0.16], ['sine', 160, 40, 0.3, 0.15]],
  arrow: [['triangle', 900, 400, 0.08, 0.06]], smash: [['noise', 0, 0, 0.4, 0.2], ['sine', 90, 30, 0.4, 0.25]],
  chest: [['square', 523, 523, 0.07, 0.07], ['square', 784, 784, 0.07, 0.07, 0.07], ['square', 1046, 1046, 0.2, 0.07, 0.14]],
  magic: [['sine', 300, 1200, 0.3, 0.1], ['triangle', 600, 1800, 0.25, 0.06, 0.05]], switch: [['square', 880, 440, 0.08, 0.07]],
  laser: [['sawtooth', 1400, 200, 0.5, 0.06]], freeze: [['triangle', 1600, 800, 0.2, 0.07]], alarm: [['square', 600, 600, 0.1, 0.06], ['square', 600, 600, 0.1, 0.06, 0.18]],
};
let noiseBuf = null;
function sfx(name) {
  if (!AC || muted) return;
  const list = SFX[name]; if (!list) return;
  const now = AC.currentTime;
  for (const [type, f0, f1, dur, vol, delay = 0] of list) {
    const t0 = now + delay;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    g.connect(AC.destination);
    if (type === 'noise') {
      if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = AC.createBufferSource(); s.buffer = noiseBuf; s.connect(g); s.start(t0); s.stop(t0 + dur);
    } else {
      const o = AC.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      o.connect(g); o.start(t0); o.stop(t0 + dur);
    }
  }
}

/* ---------------- sprites ---------------- */
const OUTLINE = '#160e1c';
function finishSprite(c) {
  const w = c.width, h = c.height, x = c.getContext('2d');
  const d = x.getImageData(0, 0, w, h).data;
  const o = document.createElement('canvas'); o.width = w; o.height = h;
  const ox = o.getContext('2d'); ox.fillStyle = OUTLINE;
  const A = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!A(i, j) && (A(i - 1, j) || A(i + 1, j) || A(i, j - 1) || A(i, j + 1))) ox.fillRect(i, j, 1, 1);
  ox.drawImage(c, 0, 0);
  const tint = col => { const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const x2 = c2.getContext('2d'); x2.drawImage(o, 0, 0); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = col; x2.fillRect(0, 0, w, h); return c2; };
  const flip = src => { const f = document.createElement('canvas'); f.width = w; f.height = h; const fx = f.getContext('2d'); fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(src, 0, 0); return f; };
  const wh = tint('#fff'), gd = tint('#ffcc33');
  return { n: o, f: flip(o), wn: wh, wf: flip(wh), gn: gd, gf: flip(gd), w, h };
}
function sprite(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
  const x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < rows[j].length; i++) { const col = pal[rows[j][i]]; if (col) { x.fillStyle = col; x.fillRect(i + 1, j + 1, 1, 1); } }
  return finishSprite(c);
}
// draw a sprite so its bottom-center sits on the entity's bottom-center
function drawSpr(s, ent, flip, white, ox = 0, oy = 0, c = ctx, camx = cam.x, camy = cam.y) {
  if (!s) return;
  const img = white ? (flip ? s.wf : s.wn) : (flip ? s.f : s.n);
  c.drawImage(img, Math.round(ent.x + ent.w / 2 - s.w / 2 - camx + ox), Math.round(ent.y + ent.h - s.h + 1 - camy + oy));
}
function drawGlow(s, ent, flip, ox = 0, oy = 0) {   // golden outline for elite monsters
  const img = flip ? s.gf : s.gn;
  const x = Math.round(ent.x + ent.w / 2 - s.w / 2 - cam.x + ox), y = Math.round(ent.y + ent.h - s.h + 1 - cam.y + oy);
  ctx.globalAlpha = 0.55 + Math.sin(frame * 0.2) * 0.25;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(img, x + dx, y + dy);
  ctx.globalAlpha = 1;
}

const DAN_TOP = ['....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hhssssss..', '..hsssssEs..', '...sssssss..', '....ssss....'];
const DAN_BODY = {
  idle: ['...bbbbbb...', '..bbbbbbbb..', '..sbBbbBbs..', '..s.bbbb.s..', '....BBBB....'],
  atk:  ['...bbbbbb...', '..bbbbbbbsss', '..bbBbbBb.ss', '....bbbb....', '....BBBB....'],
};
const DAN_LEGS = {
  idle: ['....llll....', '....l..l....', '...kk..kk...', '...kk..kk...'],
  run1: ['....llll....', '...ll..ll...', '..kk....kk..', '..k......k..'],
  run2: ['....llll....', '.....ll.....', '.....kk.....', '.....kk.....'],
  jump: ['...llllll...', '...l....l...', '..kk....kk..', '............'],
};
const danSets = {};
function danSet(ai) {
  if (danSets[ai]) return danSets[ai];
  const a = ARMORS[ai];
  const pal = { h: a.helm || '#5a3a1e', s: '#f2c49a', E: '#1a1020', b: a.body, B: a.bodyD, l: '#3a4a8a', k: '#4a2e1a' };
  const set = {};
  for (const legs of ['idle', 'run1', 'run2', 'jump']) for (const body of ['idle', 'atk'])
    set[body + '_' + legs] = sprite([...DAN_TOP, ...DAN_BODY[body], ...DAN_LEGS[legs]], pal);
  return danSets[ai] = set;
}

const ESPR = {};
function buildSprites() {
  makeSlime('#5ccf4a');
  ESPR.mush = [sprite(['...rrrr...', '.rrWrrWrr.', 'rrrrrrrrrr', 'rWrrrrrWrr', '.rrrrrrrr.', '...cccc...', '..cKccKc..', '..cccccc..', '..cccccc..', '...cccc...'], { r: '#d04040', W: '#fff', c: '#f0e0c0', K: '#1a1020' }),
               sprite(['..........', '...rrrr...', '.rrWrrWrr.', 'rrrrrrrrrr', 'rWrrrrrWrr', '..cccccc..', '..cKccKc..', '..cccccc..', '..cccccc..', '...cccc...'], { r: '#d04040', W: '#fff', c: '#f0e0c0', K: '#1a1020' })];
  const hp = { p: '#7a5a3a', P: '#b08a5a', s: '#e8c8a0', K: '#1a1020', f: '#5a3a2a' };
  ESPR.hedge = [sprite(['....pPpP....', '..pPpPpPpp..', '.pPpPpPpppp.', 'pPpPpPpppsss', 'pppppppps.Ks', 'pPpPpPppssss', '.ppppppppss.', '..ff...ff...'], hp),
                sprite(['...pPpP...', '.pPpPpPpp.', '.pppPpPpp.', 'pPpPpPpPpp', 'pppPpPpppp', 'pPpppPpPpp', 'ppPpPpppPp', '.pppPpPpp.', '.pPpppPpp.', '...pPpP...'], hp)];
  const gh = { w: '#e8f0ff', K: '#2a2050' };
  ESPR.ghost = [sprite(['....wwww....', '..wwwwwwww..', '.wwwwwwwwww.', '.wwKKwwKKww.', 'wwwKKwwKKwww', 'wwwwwwwwwwww', 'wwwwwKKwwwww', 'wwwwKKKKwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'ww.www.www.w', 'w...w...w...'], gh),
                sprite(['....wwww....', '..wwwwwwww..', '.wwwwwwwwww.', '.wwwwwwwwww.', 'wwKKwwwwKKww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwKKwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'ww.www.www.w', 'w...w...w...'], gh)];
  const fr = { g: '#4ab04a', G: '#2e7a2e', e: '#fff', K: '#1a1020', R: '#c03040', y: '#e8f080' };
  ESPR.frog = [sprite(['..ee....ee..', '.eKegggGeKe.', '.gggggggggg.', 'gggggggggggg', 'gRRRRRRRRRgg', 'gyyyyyyyyygg', '.gg.gGGg.gg.', 'gg...gg...gg'], fr),
               sprite(['..ee....ee..', '.eKegggGeKe.', '.gggggggggg.', 'gggggggggggg', 'gRRRRRRRRRgg', '.yyyyyyyyyg.', '..gg....gg..', '.gg......gg.'], fr)];
  const wp = { w: '#cfe8ff', y: '#ffcc33', K: '#1a1020' };
  ESPR.wasp = [sprite(['..ww....ww..', '...ww..ww...', '..yyyKyyyK..', '.yKyyKyyKyy.', 'yyKyyKyyKyyK', '.yKyyKyyKyy.', '..yyyKyyy...', '.........KK.'], wp),
               sprite(['............', '............', '..yyyKyyyK..', '.yKyyKyyKyy.', 'yyKyyKyyKyyK', '.yKyyKyyKyy.', '..wwyKyyww..', '.ww......ww.'], wp)];
  ESPR.rocky = [sprite(['....rmmrrr....', '..rrrrrrrrrr..', '.rrRrrrrrrRrr.', '.rrrEErrEErrr.', 'rrrrrrrrrrrrrr', 'rrrRrrrrrrrRrr', 'rrrrrrrrrrrrrr', '.rrrrrrrrrrrr.', 'rr.rrrRrrrr.rr', 'rr.rrrrrrrr.rr', 'rr.rrrrrrRr.rr', '...rrr..rrr...', '...rrr..rrr...', '..rrrr..rrrr..'], { r: '#8a7a6a', R: '#6a5a4a', E: '#ff8a3a', m: '#4a7a3a' })];
  const batRows = [['P............P', 'PP..........PP', 'PPP..pppp..PPP', '.PPPpRppRpPPP.', '..PPpppppPPP..', '....pppppp....', '.....p..p.....'],
                   ['..............', '..............', '.....pppp.....', '..PPpRppRpPP..', '.PPPpppppPPPP.', 'PPP..pppp..PPP', 'P....p..p....P']];
  ESPR.bat = batRows.map(r => sprite(r, { p: '#5a3a7a', P: '#3a2052', R: '#ff4040' }));
  ESPR.cbat = batRows.map(r => sprite(r, { p: '#5ad0ff', P: '#2a70b0', R: '#ffffff' }));
  const gob = { g: '#6ab04a', R: '#ff3030', w: '#fff', b: '#8a5a2a', K: '#1a1020' };
  ESPR.goblin = [
    sprite(['...gggg...', '..gggggg..', 'gggRggRggg', '.gggggggg.', '..gwgwgg..', '...gggg...', '..bbbbbb..', '.gbbbbbbg.', '.g.bbbb.g.', '...bbbb...', '...g..g...', '..gg..gg..'], gob),
    sprite(['...gggg...', '..gggggg..', 'gggRggRggg', '.gggggggg.', '..gwgwgg..', '...gggg...', '..bbbbbb..', '.gbbbbbbg.', '.g.bbbb.g.', '...bbbb...', '..g....g..', '.gg....gg.'], gob),
  ];
  ESPR.bomber = [sprite(['...gggg...', '..gggggg..', 'gggRggRggg', '.gggggggg.', '..gwgwgg..', '...gggg...', '..pppppp.K', '.gppppppKK', '.g.pppp.KK', '...pppp...', '...g..g...', '..gg..gg..'], { g: '#8ab04a', p: '#6a3a8a', R: '#ff3030', w: '#fff', K: '#1a1020' })];
  ESPR.skel = [sprite(['...wwww...', '..wwwwww..', '..wKwwKw..', '..wwwwww..', '...wKKw...', '....ww....', '..wwwwww..', '.w.wwww.wb', '.w.w..w.wb', '...wwww..b', '....ww....', '...w..w...', '...w..w...', '...w..w...', '..ww..ww..'], { w: '#e8e4d8', K: '#1a1020', b: '#8a6a3a' })];
  ESPR.knight = [sprite(['...mmmmm....', '..mmmmmmm...', '..mKKKKmm...', '..mmmmmmm...', '...mmmmm....', '..aaaaaa.SS.', '.aaaaaaaaSYS', '.aaaaaaaaSYS', '.a.aaaaa.SYS', '...aaaaa.SSS', '...aaaaa.SS.', '...aa.aa....', '...aa.aa....', '...aa.aa....', '..mmm.mmm...'], { m: '#5a5a6a', a: '#9aa0b0', K: '#1a1020', S: '#c03030', Y: '#ffd54a' })];
  ESPR.spear = [sprite(['...yyyy...l', '..yyyyyy..l', '..yKyyKy..l', '..yyyyyy..l', '...yyyy...l', '..oooooo..l', '.oooooooyyl', '.y.oooo...l', '...oooo...l', '...oooo...l', '...y..y....', '..yy..yy...'], { y: '#d8a040', o: '#3a6a9a', l: '#8a6a3a', K: '#1a1020' })];
  ESPR.shaman = [sprite(['...hhhh...', '..hhhhhh..', '..hKhhKh.o', '..hhhhhh.l', '...hhhh..l', '..rrrrrr.l', '.rrrrrrrrl', '.r.rrrr..l', '...rrrr..l', '..rrrrrr.l', '..rr..rr.l'], { h: '#2a6a4a', K: '#ffff40', r: '#4a2a6a', o: '#80ff80', l: '#8a6a3a' })];
  ESPR.brute = [sprite(['.....gggggg.....', '....gggggggg....', '....gRggggRg....', '....gggggggg....', '....gwggggwg....', '.....gggggg.....', '..bbbbbbbbbbbb..', '.bbbbbbbbbbbbbb.', 'gbbbbbbbbbbbbbbg', 'gbbbbbbbbbbbbbbg', 'gg.bbbbbbbbbb.gg', 'gg.bbbbbbbbbb.gg', '...bbbbbbbbbb...', '...bbbb..bbbb...', '...bbb....bbb...', '..ggg......ggg..'], { g: '#7a8a5a', b: '#6a4a3a', R: '#ff3030', w: '#fff' })];
  ESPR.imp = [sprite(['.r......r.', '.rr....rr.', '..rrrrrr..', '.rrYrrYrr.', '.rrrrrrrr.', '..rwwwwr..', 'w.rrrrrr.w', 'ww.rrrr.ww', '....rr....', '...r..r...'], { r: '#d03030', Y: '#ffe040', w: '#5a1a1a' })];
  ESPR.flame = [sprite(['....o.....', '...oo..o..', '..oyoo.o..', '..oyyoooo.', '.ooyyyyoo.', '.oyyWWyyo.', '.oyKyyKyo.', '.oyyyyyyo.', '..oyyyyo..', '...oooo...'], { o: '#ff6a1a', y: '#ffd040', W: '#fff', K: '#1a1020' }),
                sprite(['.....o....', '..o..oo...', '..o.ooyo..', '.ooooyyo..', '.ooyyyyoo.', '.oyyWWyyo.', '.oyKyyKyo.', '.oyyyyyyo.', '..oyyyyo..', '...oooo...'], { o: '#ff6a1a', y: '#ffd040', W: '#fff', K: '#1a1020' })];
  // pickups / props
  ESPR.coin = [sprite(['.yyy.', 'yYyyy', 'yYyyy', 'yYyyy', '.yyy.'], { y: '#ffcc33', Y: '#fff2a0' }), sprite(['.yy.', 'yYyy', 'yYyy', 'yYyy', '.yy.'], { y: '#ffcc33', Y: '#fff2a0' }), sprite(['.y.', 'yYy', 'yYy', 'yYy', '.y.'], { y: '#ffcc33', Y: '#fff2a0' })];
  ESPR.gem = [sprite(['..ccc..', '.cCccc.', 'cCccccc', '.ccccc.', '..ccc..', '...c...'], { c: '#ff4a8a', C: '#ffc0d8' })];
  ESPR.potion = [sprite(['..ww..', '..kk..', '.rrrr.', 'rRrrrr', 'rRrrrr', '.rrrr.'], { w: '#e8e4d8', k: '#8a5a2a', r: '#e03050', R: '#ff9aaa' })];
  ESPR.lever = [sprite(['......hh', '.....hh.', '....hh..', '...hh...', '..gggg..', '.gggggg.'], { h: '#c08a4a', g: '#6a6a7a' }), sprite(['hh......', '.hh.....', '..hh....', '...hh...', '..gggg..', '.gggggg.'], { h: '#5ccf4a', g: '#6a6a7a' })];
  ESPR.spring = [sprite(['rrrrrrrrrrrr', '.s.s.s.s.s..', '..s.s.s.s.s.', '.s.s.s.s.s..', 'gggggggggggg'], { r: '#e04848', s: '#c8c8d0', g: '#6a6a7a' })];
  ESPR.shroom = [sprite(['....rrrrrrrr....', '..rrrWWrrrrrrr..', '.rrrrWWrrrWWrrr.', 'rrWrrrrrrrWWrrrr', 'rrrrrrrrrrrrrrWr', '..cccccccccccc..', '.....cccccc.....', '.....cKccKc.....', '.....cccccc.....'], { r: '#e03a6a', W: '#fff', c: '#f0e0c0', K: '#1a1020' })];
  const flagRows = ['p.......', 'prr.....', 'prrrr...', 'prrrrrr.', 'prrrr...', 'prr.....', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'gggg....'];
  ESPR.flag = [sprite(flagRows, { p: '#d8d8e0', r: '#888899', g: '#6a6a7a' }), sprite(flagRows, { p: '#d8d8e0', r: '#3fd04a', g: '#6a6a7a' })];
  const ch = { b: '#8a5a2a', w: '#b07a40', G: '#ffcc33', Y: '#ffe080', K: '#2a1a10' };
  ESPR.chest = [sprite(['.bbbbbbbbbbbb.', 'bwwbbbbbbbbwwb', 'bbbbbbYYbbbbbb', 'GGGGGGYYGGGGGG', 'bbbbbbYYbbbbbb', 'bwbbbbbbbbbbwb', 'bbbbbbbbbbbbbb', 'bwbbbbbbbbbbwb', '.bbbbbbbbbbbb.'], ch),
                sprite(['.bbbbbbbbbbbb.', 'bwbbbbbbbbbbwb', 'GGGGGGGGGGGGGG', '..............', '..............', 'bKKKKKKKKKKKKb', 'bbbbbbbbbbbbbb', 'bwbbbbbbbbbbwb', '.bbbbbbbbbbbb.'], ch)];
  const sw = (c, d) => sprite(['....cc....', '...cWcc...', '..cWcccc..', '.cWcccccc.', 'cccccccccc', '.cccccccd.', '..ccccdd..', '...cddd...', '....dd....', '..gggggg..', '.gggggggg.'], { c, d, W: '#fff', g: '#5a5a6a' });
  ESPR.switch = [sw('#ff4a5a', '#a02030'), sw('#4a8aff', '#2040a0')];
  ESPR.stalac = [sprite(['gggggggg', '.gGggggg', '.gggggg.', '..gGggg.', '..gggg..', '..ggg...', '...gg...', '...g....'], { g: '#8a8a9a', G: '#c8c8d8' })];
  ESPR.torch = [sprite(['..yo..', '.oyyo.', '.oyyo.', '..oo..', '..bb..', '..bb..', '..bb..', '..bb..', '.bbbb.'], { y: '#ffe060', o: '#ff7a1a', b: '#6a4a2a' })];
}
function makeSlime(col) {
  const pal = { g: col, G: shade(col, 50), W: '#fff', K: '#1a1020' };
  ESPR.slime = [
    sprite(['....gggg....', '..gggggggg..', '.gggggggggg.', '.ggWKggWKgg.', 'gggggggggggg', 'gGgggggggggg', 'gggggggggGgg', '.gggggggggg.'], pal),
    sprite(['............', '....gggg....', '.gggggggggg.', 'gggWKggWKggg', 'gggggggggggg', 'gGgggggggggg', 'gggggggggGgg', 'gggggggggggg'], pal),
  ];
}

/* tile textures per theme */
let TEX = {};
function buildTiles(th, seed) {
  const r = mulberry(seed);
  const mk = fn => { const c = document.createElement('canvas'); c.width = T; c.height = T; fn(c.getContext('2d')); return c; };
  const noise = (x, base, dark, n) => { x.fillStyle = base; x.fillRect(0, 0, T, T); x.fillStyle = dark; for (let i = 0; i < n; i++) x.fillRect((r() * T) | 0, (r() * T) | 0, 2, 1); };
  const block = (col) => mk(x => { x.fillStyle = shade(col, -50); x.fillRect(0, 0, T, T); x.fillStyle = col; x.fillRect(1, 1, T - 2, T - 2); x.fillStyle = shade(col, 50); x.fillRect(1, 1, T - 2, 2); x.fillRect(1, 1, 2, T - 2); x.fillStyle = shade(col, -25); x.fillRect(5, 5, 6, 6); });
  const ghost = (col) => mk(x => { x.fillStyle = col; for (let i = 0; i < T; i += 3) { x.fillRect(i, 0, 1, 1); x.fillRect(i, T - 1, 1, 1); x.fillRect(0, i, 1, 1); x.fillRect(T - 1, i, 1, 1); } });
  TEX = {
    fill: [0, 1, 2].map(() => mk(x => noise(x, th.fill, th.fillD, 10))),
    top: [0, 1].map(() => mk(x => {
      noise(x, th.fill, th.fillD, 8);
      x.fillStyle = th.top; x.fillRect(0, 0, T, 4);
      x.fillStyle = th.topD; for (let i = 0; i < T; i++) x.fillRect(i, 4, 1, (r() * 3) | 0);
      x.fillStyle = shade(th.top, 30); x.fillRect(0, 0, T, 1);
    })),
    ice: mk(x => { noise(x, '#7ab8e0', '#5a98c0', 6); x.fillStyle = '#d8f4ff'; x.fillRect(0, 0, T, 5); x.fillStyle = '#ffffff'; x.fillRect(2, 1, 5, 1); x.fillRect(10, 2, 3, 1); x.fillStyle = '#a0d8f8'; x.fillRect(0, 5, T, 1); }),
    plat: mk(x => { x.fillStyle = th.plat; x.fillRect(0, 0, T, 6); x.fillStyle = shade(th.plat, -40); x.fillRect(0, 4, T, 2); x.fillRect(7, 0, 1, 6); x.fillStyle = shade(th.plat, 40); x.fillRect(0, 0, T, 1); }),
    spike: mk(x => { x.fillStyle = '#c8c8d4'; for (let k = 0; k < 4; k++) for (let j = 0; j < 7; j++) { const half = (j / 2) | 0; x.fillRect(k * 4 + 2 - half, 9 + j, 1 + half * 2, 1); } x.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) x.fillRect(k * 4 + 2, 9, 1, 2); }),
    crumble: mk(x => { x.fillStyle = shade(th.fill, 25); x.fillRect(0, 0, T, T); x.fillStyle = shade(th.fill, -30); x.fillRect(0, 7, T, 1); x.fillRect(5, 0, 1, 7); x.fillRect(11, 8, 1, 8); x.fillRect(2, 11, 3, 1); x.fillStyle = shade(th.fill, 55); x.fillRect(0, 0, T, 1); }),
    door: mk(x => { x.fillStyle = '#6a4a2a'; x.fillRect(0, 0, T, T); x.fillStyle = '#4a321a'; x.fillRect(5, 0, 1, T); x.fillRect(10, 0, 1, T); x.fillStyle = '#9aa0b0'; x.fillRect(0, 2, T, 2); x.fillRect(0, 12, T, 2); }),
    gate: mk(x => { x.fillStyle = '#3a3a48'; x.fillRect(0, 0, T, T); x.fillStyle = '#7a7a8a'; x.fillRect(2, 0, 2, T); x.fillRect(7, 0, 2, T); x.fillRect(12, 0, 2, T); x.fillRect(0, 6, T, 2); }),
    red: block('#e04a5a'), blue: block('#4a7aff'), redG: ghost('#ff6a7a'), blueG: ghost('#6a9aff'),
    cannon: mk(x => { x.fillStyle = '#3a3a44'; x.fillRect(0, 0, T, T); x.fillStyle = '#5a5a66'; x.fillRect(1, 1, T - 2, T - 2); x.fillStyle = '#7a7a88'; x.fillRect(1, 1, T - 2, 2); x.fillStyle = '#ffcc33'; x.fillRect(3, 6, 2, 2); x.fillRect(11, 6, 2, 2); }),
  };
}

/* ---------------- input ---------------- */
const keys = {}, pressedK = {};
const BIND = {
  left: ['ArrowLeft', 'KeyA', 'T_left'], right: ['ArrowRight', 'KeyD', 'T_right'], down: ['ArrowDown', 'KeyS', 'T_down'],
  jump: ['Space', 'KeyW', 'ArrowUp', 'KeyZ', 'T_jump'], attack: ['KeyJ', 'KeyX', 'T_attack'],
  dash: ['KeyK', 'ShiftLeft', 'ShiftRight', 'KeyC', 'T_dash'], potion: ['KeyQ', 'T_potion'], pause: ['Escape', 'KeyP', 'T_pause'],
  special: ['KeyU', 'KeyE', 'T_special'], swap: ['KeyR', 'Tab', 'T_swap'],
};
const held = a => BIND[a].some(k => keys[k]);
const tapped = a => BIND[a].some(k => pressedK[k]);
function setKey(code, v) { if (v && !keys[code]) pressedK[code] = true; keys[code] = v; }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  initAudio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) && state === 'play') e.preventDefault();
  if (e.code === 'KeyM' && !e.repeat) { setMuted(!muted); toast(t(muted ? 'soundOff' : 'soundOn')); }
  setKey(e.code, true);
});
addEventListener('keyup', e => setKey(e.code, false));
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
let joyId = null, joyRelease = null;
function setupTouch() {
  if (!IS_TOUCH) return;
  document.body.classList.add('touch');
  const tc = $('touch'); tc.classList.add('on');
  const btns = [...tc.querySelectorAll('[data-k]')];
  // a touch presses the closest visible button, even if the finger is a bit outside the circle
  const sync = e => {
    if (e.target.closest && e.target.closest('#fsBtn')) return;
    e.preventDefault(); initAudio();
    const now = new Set(), vmin = Math.min(innerWidth, innerHeight) / 100;
    const centers = btns.filter(bt => bt.getClientRects().length > 0).map(bt => { const r = bt.getBoundingClientRect(); return { k: bt.dataset.k, x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2, exact: bt.classList.contains('tpause') }; });
    for (const tt of e.touches) {
      if (tt.identifier === joyId) continue;
      let best = null, bestD = Infinity;
      for (const c of centers) { const d = Math.hypot(tt.clientX - c.x, tt.clientY - c.y) - c.r; if (d < (c.exact ? 0 : 8 * vmin) && d < bestD) { best = c; bestD = d; } }
      if (best) now.add(best.k);
    }
    for (const bt of btns) { const k = bt.dataset.k, on = now.has(k); if (on !== !!keys[k]) setKey(k, on); bt.classList.toggle('down', on); }
  };
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) tc.addEventListener(ev, sync, { passive: false });
  $('fsBtn').addEventListener('click', () => goFullscreen(true));
  document.body.classList.toggle('fs', isFullscreen());
  // floating joystick: appears under the thumb anywhere in the left part of the screen
  const zone = $('jzone'), base = $('jbase'), knob = $('jknob');
  let cx = 0, cy = 0;
  const radius = () => base.offsetWidth / 2;
  const release = () => { joyId = null; setKey('T_left', false); setKey('T_right', false); setKey('T_down', false); base.classList.remove('active'); base.style.left = base.style.top = ''; knob.style.transform = ''; };
  const move = (dx, dy) => {
    const r = radius(), d = Math.hypot(dx, dy), k = d > r ? r / d : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    const nx = dx / r, ny = dy / r;
    setKey('T_left', nx < -0.28); setKey('T_right', nx > 0.28); setKey('T_down', ny > 0.55 && Math.abs(nx) < 0.75);
  };
  const find = list => [...list].find(tt => tt.identifier === joyId);
  joyRelease = release;
  zone.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation(); initAudio();
    if (joyId !== null) return;
    const tt = e.changedTouches[0], zr = zone.getBoundingClientRect(), r = radius();
    joyId = tt.identifier; cx = tt.clientX; cy = tt.clientY;
    base.style.left = (cx - zr.left - r) + 'px'; base.style.top = (cy - zr.top - r) + 'px';
    base.classList.add('active'); move(0, 0);
  }, { passive: false });
  zone.addEventListener('touchmove', e => { e.preventDefault(); e.stopPropagation(); const tt = find(e.changedTouches); if (tt) move(tt.clientX - cx, tt.clientY - cy); }, { passive: false });
  for (const ev of ['touchend', 'touchcancel']) zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); if (find(e.changedTouches)) release(); }, { passive: false });
}
function releaseTouch() {
  for (const k in keys) if (k.startsWith('T_')) keys[k] = false;
  document.querySelectorAll('.tbtn.down').forEach(b => b.classList.remove('down'));
  if (joyRelease) joyRelease();
}
function isFullscreen() { return IS_APP || !!(document.fullscreenElement || document.webkitFullscreenElement) || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches; }
function goFullscreen(force) {
  if (!IS_TOUCH && !force) return;
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => { }); } catch (e) { } };
  if (!isFullscreen() && req) { try { const pr = req.call(el, { navigationUI: 'hide' }); if (pr && pr.then) pr.then(lock).catch(() => { }); else lock(); } catch (e) { } }
  else lock();
}
document.addEventListener('fullscreenchange', () => { document.body.classList.toggle('fs', isFullscreen()); setTimeout(fit, 50); });
document.addEventListener('contextmenu', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

/* ---------------- level building ---------------- */
// tiles: 0 empty 1 solid 2 one-way 3 spike 4 crumble 5 hazard 6 door 7 gate 8 red 9 blue 10 ice 11 belt→ 12 belt← 13 cannon
const TILE_SOLID = [0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1];
let L = null;
const isSolidT = t => t === 8 ? !L.toggle : t === 9 ? L.toggle : TILE_SOLID[t] === 1;
const cam = { x: 0, y: 0, shake: 0 };
const enemyPool = n => POOLS[n];

function buildLevel(n) {
  const r = mulberry(9001 + n * 7919);
  const th = THEMES[n], gim = th.gim || [];
  const has = g => gim.includes(g);
  const maxD = n === 0 ? 1 : n === 1 ? 2 : 3;
  const pool = CHUNKS.filter(c => c.d <= maxD && (!c.need || has(c.need)));
  const count = n < PER_WORLD ? 9 + Math.floor(n * 1.5) : 14 + (n - PER_WORLD);
  const seq = [START_CHUNK];
  const ambushAt = new Set(), used = {}, recent = [];
  const genP = n === 0 ? 0.3 : 0.42;
  for (let k = 1; k <= (th.ambush || 0); k++) ambushAt.add(Math.floor(count * k / ((th.ambush || 0) + 1)));
  let last = null;
  for (let i = 0; i < count; i++) {
    let ch;
    if (r() < genP) ch = generateChunk(r, maxD, gim);   // a fresh, one-of-a-kind chunk
    else {
      // hand-made chunk: nothing from the last few picks, and less of what was already used
      let total = 0;
      const w = pool.map(c => { if (recent.includes(c.id)) return 0; const v = (c.need ? 2.6 : c.d === maxD ? 1.4 + Math.min(n, 9) * 0.25 : 1) / (1 + (used[c.id] || 0) * 1.5); total += v; return v; });
      let pick = r() * total; ch = pool.find(c => !recent.includes(c.id)) || pool[0];
      if (total > 0) for (let k = 0; k < pool.length; k++) { pick -= w[k]; if (pick <= 0) { ch = pool[k]; break; } }
      used[ch.id] = (used[ch.id] || 0) + 1; recent.push(ch.id); if (recent.length > 5) recent.shift();
      if (canMirror(ch) && r() < 0.5) ch = mirrorChunk(ch);
    }
    seq.push(ch); last = ch;
    if (ambushAt.has(i)) seq.push(AMBUSH_CHUNK);
    if (i % 4 === 3 && i < count - 1) seq.push(CHECKPOINT_CHUNK);
  }
  seq.push(CHECKPOINT_CHUNK);
  const ARENA_W = 34;
  const width = seq.reduce((s, c) => s + c.rows[0].length, 0) + ARENA_W;
  const tiles = new Uint8Array(width * ROWS);
  const lv = {
    n, th, gim, w: width, tiles, enemies: [], pickups: [], platforms: [], springs: [], levers: [], doors: {}, flags: [], chests: [], switches: [],
    cannons: [], stalacs: [], geysers: [], torches: [], fires: [], ambushes: [], bolts: [], fx: [],
    seq: [], crumbles: new Map(), projectiles: [], particles: [], texts: [], warnings: [], tipZones: [],
    bosses: [], arena: null, time: 0, deaths: 0, coinsGot: 0, kills: 0, chestsGot: 0,
    toggle: false, rhythm: has('rhythm'), rhyT: 0, dark: has('dark'), wind: has('wind') ? { t: 200, state: 'calm', dir: -1 } : null, chase: null, slowT: 0, ink: 0,
  };
  L = lv;   // tile helpers below read L
  const set = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < ROWS) tiles[y * width + x] = v; };
  const get = (x, y) => (x >= 0 && x < width && y >= 0 && y < ROWS) ? tiles[y * width + x] : 0;
  const pool2 = enemyPool(n);
  const eliteP = n < 2 ? 0 : Math.min(0.25, 0.04 + n * 0.012);
  const chestSpots = [];
  let col = 0;
  seq.forEach((ch, ci) => {
    const rows = ch.rows, off = ROWS - rows.length, cw = rows[0].length;
    let mCount = 0;
    lv.seq.push({ id: ch.id, col });
    if (ch.tag) lv.tipZones.push({ x: col * T, tag: ch.tag });
    if (ch === AMBUSH_CHUNK) lv.ambushes.push({ c0: col, c1: col + cw - 1, floorY: (ROWS - 2) * T, state: 'idle', wave: 0, waves: n < 5 ? 2 : 3, t: 0 });
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const c = rows[j][i], gx = col + i, gy = off + j, px = gx * T, py = gy * T;
      switch (c) {
        case '#': set(gx, gy, 1); break;
        case '-': set(gx, gy, 2); break;
        case '^': set(gx, gy, 3); break;
        case 'X': set(gx, gy, 4); break;
        case '~': set(gx, gy, 5); break;
        case 'r': set(gx, gy, 8); break;
        case 'b': set(gx, gy, 9); break;
        case '|': for (let y = gy; y >= 0; y--) if (get(gx, y) === 0 || y === gy) set(gx, y, 8); break;
        case '>': set(gx, gy, 11); break;
        case '<': set(gx, gy, 12); break;
        case 'T': set(gx, gy, 13); lv.cannons.push({ x: px, y: py, w: T, h: T, t: 60 + r() * 60, hp: 3, ang: Math.PI, dead: false }); break;
        case 's': lv.switches.push({ x: px + 3, y: py + 3, w: 10, h: 13, cd: 0 }); break;
        case 'Y': lv.springs.push({ x: px, y: py + 8, w: 16, h: 8, t: 0, shroom: true }); break;
        case '$': chestSpots.push({ x: px + 1, y: py + 6 }); break;
        case 'D': for (let y = gy; y >= 0; y--) { if (get(gx, y) === 0 || y === gy) set(gx, y, 6); }
          (lv.doors[ci] = lv.doors[ci] || []).push(gx); break;
        case 'L': lv.levers.push({ x: px + 4, y: py + 10, w: 8, h: 6, group: ci, on: false }); break;
        case 'J': lv.springs.push(has('bounce') ? { x: px, y: py + 8, w: 16, h: 8, t: 0, shroom: true } : { x: px + 1, y: py + 11, w: 14, h: 5, t: 0 }); break;
        case 'M': lv.platforms.push(mkPlatform(px, py, 'x', 5 * T, Math.PI * (mCount++))); break;
        case 'V': lv.platforms.push(mkPlatform(px, py, 'y', 6 * T, r() * Math.PI * 2)); break;
        case 'C': lv.pickups.push(mkPickup('coin', px + 5, py + 5)); break;
        case 'G': lv.pickups.push(mkPickup('gem', px + 4, py + 4)); break;
        case 'P': lv.pickups.push(mkPickup('potion', px + 4, py + 8)); break;
        case 'F': lv.flags.push({ x: px + 2, y: py + 1, w: 10, h: 15, on: false }); break;
        case 'S': case 'O': case 'B': case 'K': case 'N': case 'E':
        case 'R': case 'H': case 'W': case 'Q': case 'Z': case 'U': {
          // 'E' is random from the world's pool; ground grunts are swapped for local monsters half the time
          let type = c;
          if (c === 'E' || ((c === 'S' || c === 'O') && r() < 0.5)) type = pool2[(r() * pool2.length) | 0];
          const e = mkEnemy(type, px, py, n);
          if (r() < eliteP) makeElite(e);
          lv.enemies.push(e); break;
        }
      }
    }
    // per-chunk mechanics
    if (ch !== START_CHUNK && ch !== CHECKPOINT_CHUNK && ch !== AMBUSH_CHUNK) {
      if (has('ice') && !['gen-hops', 'gen-switch2'].includes(ch.id) && r() < 0.7) for (let i = 0; i < cw; i++) for (let y = 1; y < ROWS; y++) if (get(col + i, y) === 1 && get(col + i, y - 1) === 0) set(col + i, y, 10);
      if (has('geyser')) for (let i = 2; i < cw - 2; i++) for (let y = 4; y < ROWS; y++) {
        const gx = col + i;
        if ((get(gx, y) === 1 || get(gx, y) === 10) && get(gx, y - 1) === 0 && get(gx, y - 2) === 0 && get(gx, y - 3) === 0 && r() < 0.05 && !lv.geysers.some(g => Math.abs(g.x - gx * T) < 6 * T)) lv.geysers.push({ x: gx * T + 8, y: y * T, t: r() * 220 });
      }
      if (has('stalactites')) for (let i = 1; i < cw - 1; i++) for (let y = 0; y < ROWS - 5; y++) {
        const gx = col + i, tt = get(gx, y);
        if ((tt === 1 || tt === 2) && [1, 2, 3].every(d => get(gx, y + d) === 0) && r() < 0.35 && !lv.stalacs.some(s => Math.abs(s.hx - gx * T) < 3 * T)) {
          lv.stalacs.push({ hx: gx * T + 4, hy: (y + 1) * T, x: gx * T + 4, y: (y + 1) * T, w: 8, h: 14, state: 'hang', t: 0, vy: 0 });
          break;
        }
      }
    }
    col += cw;
  });
  // treasure chests: 3 per level, ambushes give one each, the rest go to hidden spots
  const fromSpots = Math.max(0, 3 - lv.ambushes.length);
  chestSpots.sort((a, b) => a.x - b.x);
  const picked = [];
  if (chestSpots.length <= fromSpots) picked.push(...chestSpots);
  else for (let k = 0; k < fromSpots; k++) picked.push(chestSpots[Math.floor((k + 0.5) * chestSpots.length / fromSpots)]);
  let idx = 0;
  for (const sp of chestSpots) {
    if (picked.includes(sp)) lv.chests.push(mkChest(sp.x, sp.y, idx++));
    else lv.pickups.push(mkPickup('coin', sp.x + 4, sp.y + 2));
  }
  lv.ambushes.forEach(a => { a.idx = idx < 3 ? idx++ : -1; });
  lv.chestTotal = Math.min(3, idx);
  // darkness: torches along the floor give some light
  if (lv.dark) for (let gx = 12; gx < col - 4; gx += 13 + ((r() * 6) | 0)) for (let y = 2; y < ROWS; y++) if (isSolidT(get(gx, y)) && get(gx, y - 1) === 0 && get(gx, y - 2) === 0) { lv.torches.push({ x: gx * T + 5, y: y * T - 16, w: 6, h: 16 }); break; }
  // chase: a hazard wall runs after Dan between two checkpoints
  if (th.chase) {
    const fl = lv.flags.slice().sort((a, b) => a.x - b.x);
    const a = fl.length >= 3 ? fl[1] : fl[0], b = fl.length >= 3 ? fl[2] : fl[1];
    if (a && b) lv.chase = { from: a.x, to: b.x, x: 0, active: false, done: false, kind: th.chase, speed: Math.min(1.85, 1.45 + n * 0.02) };
  }
  // boss arena
  const a0 = col;
  for (let x = 0; x < ARENA_W; x++) { set(a0 + x, ROWS - 1, 1); set(a0 + x, ROWS - 2, 1); }
  for (let y = 0; y < ROWS; y++) set(a0 + ARENA_W - 1, y, 1);
  lv.arena = { a0, gateX: a0 + 3, left: (a0 + 4) * T, right: (a0 + ARENA_W - 1) * T, trigger: (a0 + 6) * T, top: 2 * T, floor: (ROWS - 2) * T, active: false, done: false };
  lv.bossSpawn = { x: (a0 + 26) * T, y: (ROWS - 2) * T };
  buildArena(lv, a0, set, get);
  lv.spawn = { x: 3 * T, y: (ROWS - 3) * T };
  lv.checkpoint = { ...lv.spawn };
  lv.safe = { ...lv.spawn };
  return lv;
}
const AMBUSH_CHUNK = { id: 'ambush', rows: [
  '                            ',
  '                            ',
  '                            ',
  '                            ',
  '                            ',
  '                            ',
  '        -----   -----       ',
  '                            ',
  '                            ',
  '############################',
  '############################',
] };
function tileAt(tx, ty) {
  if (tx < 0 || tx >= L.w) return 1;
  if (ty >= ROWS) return 0;
  if (ty < 0) { const tt = L.tiles[tx]; return isSolidT(tt) ? tt : 0; }
  return L.tiles[ty * L.w + tx];
}
function setTile(tx, ty, v) { if (tx >= 0 && tx < L.w && ty >= 0 && ty < ROWS) L.tiles[ty * L.w + tx] = v; }
function solidAt(tx, ty) { return isSolidT(tileAt(tx, ty)); }

/* ---------------- physics helpers ---------------- */
function moveX(e, dx) {
  e.x += dx;
  const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
  if (dx > 0) { const tx = Math.floor((e.x + e.w - 0.01) / T); for (let y = y0; y <= y1; y++) if (solidAt(tx, y)) { e.x = tx * T - e.w; return 1; } }
  else if (dx < 0) { const tx = Math.floor(e.x / T); for (let y = y0; y <= y1; y++) if (solidAt(tx, y)) { e.x = (tx + 1) * T; return -1; } }
  return 0;
}
function moveY(e, dy, drop) {
  const prevBottom = e.y + e.h;
  e.y += dy;
  const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
  if (dy > 0) {
    const ty = Math.floor((e.y + e.h - 0.01) / T);
    for (let x = x0; x <= x1; x++) { const tt = tileAt(x, ty); if (isSolidT(tt) || (tt === 2 && !drop && prevBottom <= ty * T + 0.5)) { e.y = ty * T - e.h; return 1; } }
  } else if (dy < 0) {
    const ty = Math.floor(e.y / T);
    for (let x = x0; x <= x1; x++) if (solidAt(x, ty)) { e.y = (ty + 1) * T; return -1; }
  }
  return 0;
}
function groundAhead(e, dir) {
  const fx = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  const tt = tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
  return isSolidT(tt) || tt === 2;
}
function wallAhead(e, dir) { return solidAt(Math.floor((dir > 0 ? e.x + e.w + 1 : e.x - 1) / T), Math.floor((e.y + e.h - 2) / T)); }
function insideSolid(e) {
  for (let y = Math.floor(e.y / T); y <= Math.floor((e.y + e.h - 0.01) / T); y++) for (let x = Math.floor(e.x / T); x <= Math.floor((e.x + e.w - 0.01) / T); x++) if (solidAt(x, y)) return true;
  return false;
}
function unstuck(e) { for (let i = 0; i < 40 && insideSolid(e); i++) e.y -= 1; }

/* ---------------- entities ---------------- */
function mkPlatform(x, y, axis, range, phase) {
  const k = (1 - Math.cos(phase)) / 2 * range;
  return { x: axis === 'x' ? x + k : x, y: axis === 'y' ? y + k : y, w: 48, h: 8, x0: x, y0: y, axis, range, t: phase, spd: 0.018, dx: 0, dy: 0 };
}
function mkPickup(type, x, y, vx = 0, vy = 0, phys = false) {
  const sz = type === 'coin' ? 5 : type === 'gem' ? 7 : 6;
  return { type, x, y, w: sz, h: sz, vx, vy, phys, t: Math.random() * 100, life: phys ? 900 : -1, delay: phys ? 20 : 0 };
}
function mkChest(x, y, idx) { return { x, y, w: 14, h: 10, idx, open: false, old: !!(save.chests[L.n] & (1 << idx)) }; }
const EDEF = {
  S: { kind: 'slime', w: 12, h: 8, hp: 20, dmg: 12, coins: 2 },
  O: { kind: 'goblin', w: 10, h: 12, hp: 26, dmg: 15, coins: 3 },
  B: { kind: 'bat', w: 12, h: 7, hp: 12, dmg: 10, coins: 2, fly: true },
  K: { kind: 'skel', w: 10, h: 15, hp: 30, dmg: 12, coins: 4 },
  N: { kind: 'knight', w: 12, h: 15, hp: 55, dmg: 18, coins: 6 },
  R: { kind: 'mush', w: 10, h: 10, hp: 22, dmg: 10, coins: 3 },
  H: { kind: 'hedge', w: 12, h: 8, hp: 26, dmg: 14, coins: 3, spiky: true },
  W: { kind: 'ghost', w: 12, h: 13, hp: 20, dmg: 12, coins: 4, fly: true },
  Q: { kind: 'frog', w: 12, h: 8, hp: 18, dmg: 12, coins: 3 },
  Z: { kind: 'wasp', w: 12, h: 8, hp: 14, dmg: 10, coins: 3, fly: true },
  U: { kind: 'rocky', w: 14, h: 14, hp: 70, dmg: 20, coins: 7, heavy: true },
  bomb: { kind: 'bomber', w: 10, h: 12, hp: 24, dmg: 18, coins: 4 },
  spear: { kind: 'spear', w: 10, h: 12, hp: 30, dmg: 16, coins: 4 },
  shaman: { kind: 'shaman', w: 10, h: 11, hp: 26, dmg: 12, coins: 6 },
  brute: { kind: 'brute', w: 16, h: 16, hp: 110, dmg: 24, coins: 10, heavy: true },
  imp: { kind: 'imp', w: 10, h: 10, hp: 20, dmg: 14, coins: 4, fly: true },
  flame: { kind: 'flame', w: 10, h: 10, hp: 26, dmg: 14, coins: 4, spiky: true },
  cbat: { kind: 'cbat', w: 12, h: 7, hp: 18, dmg: 12, coins: 4, fly: true },
};
function mkEnemy(type, px, py, n) {
  const d = EDEF[type];
  const hp = Math.round(d.hp * (1 + 0.28 * n));
  return {
    type, kind: d.kind, w: d.w, h: d.h, x: px + (T - d.w) / 2, y: py + T - d.h, hx: px, hy: py,
    vx: 0, vy: 0, hp, max: hp, dmg: Math.round(d.dmg * 1.3 * (1 + 0.13 * n)), coins: d.coins + Math.floor(n / 5), fly: !!d.fly, spiky: !!d.spiky, heavy: !!d.heavy, alpha: 1, puff: 0,
    dir: Math.random() < 0.5 ? -1 : 1, face: -1, t: 30 + Math.random() * 60, t2: 60 + Math.random() * 80, state: 'idle', flash: 0, kb: 0, onGround: false, anim: Math.random() * 100, turnT: 0, hitBy: -1,
  };
}
function makeElite(e) { e.elite = true; e.hp = e.max = Math.round(e.max * 2.2); e.dmg = Math.round(e.dmg * 1.3); e.coins = e.coins * 2 + 2; }

/* ---------------- player ---------------- */
const P = { x: 0, y: 0, w: 10, h: 14, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jbuf: 0, airJumps: 0, wallDir: 0, wallLock: 0, dashT: 0, dashCD: 0, atkT: 0, atkCD: 0, abuf: 0, atkDown: false,
  swing: 0, inv: 0, hp: 100, cut: false, plat: null, anim: 0, dead: 0, squash: 0, mana: 0, shieldT: 0, slowT: 0, poisonT: 0, gflip: 0, peakY: 0, smash: false, groundT: 0, weap: 'sword' };
const maxHP = () => 100 + HP_STEP * save.hpLv;
const sharpMul = () => save.sharp ? SHARP[save.sharp - 1].mult : 1;
function curWeapon() {
  const atkMul = ATK_SPEED[save.atkLv].cd / 22;
  if (P.weap === 'bow' && save.bowLv) { const b = BOWS[save.bowLv - 1]; return { kind: 'bow', dmg: Math.round(b.dmg * sharpMul()), cd: Math.round(b.cd * atkMul), range: 0 }; }
  if (P.weap === 'hammer' && save.hammerLv) { const h = HAMMERS[save.hammerLv - 1]; return { kind: 'hammer', dmg: Math.round(h.dmg * sharpMul()), cd: Math.round(h.cd * atkMul), range: 24 }; }
  const s = SWORDS[save.weapon]; return { kind: 'sword', dmg: Math.round(s.dmg * sharpMul()), cd: ATK_SPEED[save.atkLv].cd, range: s.range };
}
function ownedWeapons() { const w = ['sword']; if (save.bowLv) w.push('bow'); if (save.hammerLv) w.push('hammer'); return w; }
function resetPlayer(pos) {
  Object.assign(P, { x: pos.x, y: pos.y, vx: 0, vy: 0, onGround: false, dashT: 0, atkT: 0, inv: 60, dead: 0, plat: null, wallLock: 0, slowT: 0, poisonT: 0, gflip: 0, smash: false, peakY: pos.y });
}
function hurtPlayer(amount, srcX, opt = {}) {
  if (P.dead) return false;
  if (!opt.dot && (P.inv > 0 || P.dashT > 0)) return false;
  if (P.shieldT > 0) { burst(P.x + P.w / 2, P.y + P.h / 2, 6, ['#7fe3ff', '#fff'], 2); return false; }
  const dmg = Math.max(1, Math.round(amount * (1 - ARMORS[save.armor].red)));
  P.hp -= dmg;
  if (!opt.dot) { P.inv = 70; P.vx = (P.x + P.w / 2 < srcX ? -1 : 1) * 3; P.vy = -3.5 * (P.gflip ? -1 : 1); P.atkT = 0; sfx('hurt'); cam.shake = 6; }
  floatText(P.x + P.w / 2, P.y - 4, '-' + dmg, '#ff5050');
  if (P.hp <= 0) killPlayer();
  return true;
}
function killPlayer() {
  P.hp = 0; P.dead = 100; L.deaths++;
  sfx('die'); burst(P.x + P.w / 2, P.y + P.h / 2, 24, ['#e04848', '#f2c49a', '#fff'], 3);
  showDeath(true);
}
function respawn() {
  showDeath(false);
  P.hp = maxHP(); P.shieldT = 0;
  resetPlayer(L.checkpoint);
  L.slowT = 0; L.ink = 0;
  if (L.chase && L.chase.active) { L.chase.active = false; }
  for (const a of L.ambushes) if (a.state === 'fight') resetAmbush(a);
  if (L.arena.active && !L.arena.done) resetBossFight();
}
function returnToSafe(dmg) {
  if (hurtPlayer(dmg, P.x + P.w / 2)) { if (P.hp > 0) { resetPlayer(L.safe); P.inv = 70; } }
  else if (!P.dead) resetPlayer(L.safe);
}

function updatePlayer() {
  if (P.dead) { P.dead--; if (P.dead === 0) respawn(); return; }
  const W = curWeapon();
  const left = held('left'), right = held('right'), downH = held('down');
  const inp = (right ? 1 : 0) - (left ? 1 : 0);
  const g = P.gflip > 0 ? -1 : 1;
  if (P.inv > 0) P.inv--;
  if (P.dashCD > 0) P.dashCD--;
  if (P.atkCD > 0) P.atkCD--;
  if (P.wallLock > 0) P.wallLock--;
  if (P.shieldT > 0) P.shieldT--;
  if (P.slowT > 0) P.slowT--;
  if (P.gflip > 0) { P.gflip--; if (P.gflip === 0) { P.vy = 0; } }
  if (P.poisonT > 0) { P.poisonT--; if (P.poisonT % 30 === 0) hurtPlayer(3, P.x, { dot: true }); }
  if (tapped('jump')) P.jbuf = 7; else if (P.jbuf > 0) P.jbuf--;
  if (tapped('swap')) swapWeapon();
  if (tapped('special')) castSpecial();
  if (L.n >= PER_WORLD || save.special) P.mana = Math.min(100, P.mana + 0.03);

  if (tapped('dash') && save.dash && P.dashCD === 0 && P.dashT === 0) { P.dashT = 11; P.dashCD = 45; P.vy = 0; if (inp) P.face = inp; P.vx = P.face * 5.6; sfx('dash'); }
  if (tapped('potion')) drinkPotion();
  // early taps are remembered, and holding the attack button keeps swinging
  if (tapped('attack')) P.abuf = 12; else if (P.abuf > 0) P.abuf--;
  if ((P.abuf > 0 || held('attack')) && P.atkCD === 0 && P.dashT === 0) {
    P.abuf = 0; P.atkCD = W.cd; P.swing++; P.atkDown = downH && !P.onGround;
    if (W.kind === 'bow') { shootArrow(W); P.atkT = 10; }
    else {
      P.atkT = 14; sfx('swing');
      if (W.kind === 'hammer' && P.atkDown) { P.smash = true; P.vy = Math.max(P.vy * g, 4.5) * g; }
    }
  }

  const speed = P.slowT > 0 ? 1.2 : 2.3;
  if (P.dashT > 0) {
    P.dashT--; P.vx = P.face * 5.6; P.vy = 0;
    if (P.dashT % 2 === 0) L.particles.push({ x: P.x + P.w / 2, y: P.y + P.h / 2, vx: 0, vy: 0, life: 14, max: 14, col: ARMORS[save.armor].body, s: 3, ghost: true });
  } else {
    if (P.wallLock === 0) {
      const target = inp * speed;
      const ice = P.onGround && P.groundT === 10;
      const acc = P.onGround ? (ice ? 0.07 : 0.45) : 0.28;
      if (P.inv > 50) { /* knockback */ } else if (P.vx < target) P.vx = Math.min(target, P.vx + acc); else if (P.vx > target) P.vx = Math.max(target, P.vx - acc);
      if (inp && P.atkT === 0) P.face = inp;
    }
    P.vy += 0.42 * g;
    P.wallDir = 0;
    if (!P.onGround) {
      if (wallAhead(P, 1) && (right || P.vx > 0.1)) P.wallDir = 1;
      else if (wallAhead(P, -1) && (left || P.vx < -0.1)) P.wallDir = -1;
      if (g > 0 && P.wallDir && P.vy > 1.3 && ((P.wallDir === 1 && right) || (P.wallDir === -1 && left))) { P.vy = 1.3; if (Math.random() < 0.3) L.particles.push(dust(P.x + (P.wallDir > 0 ? P.w : 0), P.y + P.h - 2)); }
    }
    if (P.jbuf > 0) {
      if (P.onGround || P.coyote > 0) {
        P.vy = -6.8 * g; P.jbuf = 0; P.coyote = 0; P.onGround = false; P.cut = false; P.plat = null; P.squash = -4; sfx('jump');
        for (let i = 0; i < 4; i++) L.particles.push(dust(P.x + P.w / 2, P.y + (g > 0 ? P.h : 0)));
      } else if (P.wallDir && g > 0) {
        const climbing = inp === P.wallDir;   // holding toward the wall = climb kick
        P.vy = climbing ? -6.9 : -6.6; P.vx = -P.wallDir * (climbing ? 1.3 : 2.8); P.wallLock = climbing ? 5 : 9;
        P.face = -P.wallDir; P.jbuf = 0; P.cut = false; sfx('jump');
        for (let i = 0; i < 4; i++) L.particles.push(dust(P.x + (P.wallDir > 0 ? P.w : 0), P.y + P.h / 2));
      } else if (save.dbl && P.airJumps > 0) {
        P.vy = -6.1 * g; P.airJumps--; P.jbuf = 0; P.cut = false; sfx('djump');
        burst(P.x + P.w / 2, P.y + P.h, 6, ['#ffffff', '#bfe8ff'], 1.5);
      }
    }
    if (!held('jump') && P.vy * g < -3 && !P.cut && !P.springing && !P.smash) { P.vy = -3 * g; P.cut = true; }
    if (P.vy * g >= 0) P.springing = false;
    const maxFall = P.smash ? 8 : 7;
    if (P.vy * g > maxFall) P.vy = maxFall * g;
  }
  // wind gusts
  if (L.wind && L.wind.state === 'gust' && !L.arena.active) P.vx = clamp(P.vx + L.wind.dir * 0.13, -3.4, 3.4);
  // conveyors
  if (P.onGround && (P.groundT === 11 || P.groundT === 12)) moveX(P, P.groundT === 11 ? 1.1 : -1.1);

  if (P.plat) { P.x += P.plat.dx; moveX(P, 0); P.y = P.plat.y - P.h; }
  const wasGround = P.onGround;
  const hx = moveX(P, P.vx);
  if (hx && P.dashT > 0) P.dashT = 0;
  const hy = moveY(P, P.vy, downH && !held('jump'));
  P.onGround = false;
  if (hy === g) { P.onGround = true; P.vy = 0; } else if (hy === -g) P.vy = 0.5 * g;
  if (P.vy * g >= 0 && !hy && g > 0) {
    const prevBottom = P.y + P.h - P.vy;
    for (const p of L.platforms) {
      if (P.x + P.w > p.x && P.x < p.x + p.w && P.y + P.h >= p.y && prevBottom <= p.y + Math.max(0, p.dy) + 2 && !(downH && held('jump'))) { P.y = p.y - P.h; P.vy = 0; P.onGround = true; P.plat = p; break; }
    }
  }
  if (!P.onGround) P.plat = null;
  else if (P.plat && !(P.x + P.w > P.plat.x && P.x < P.plat.x + P.plat.w)) { P.plat = null; P.onGround = false; }
  if (!P.onGround) { if (g > 0) P.peakY = Math.min(P.peakY, P.y); else P.peakY = Math.max(P.peakY, P.y); }
  if (P.onGround) {
    const fy = g > 0 ? Math.floor((P.y + P.h + 1) / T) : Math.floor((P.y - 1) / T);
    P.groundT = P.plat ? 0 : tileAt(Math.floor((P.x + P.w / 2) / T), fy);
    if (!wasGround) {
      P.squash = 3; for (let i = 0; i < 3; i++) L.particles.push(dust(P.x + P.w / 2, P.y + P.h));
      if (P.smash) hammerSlam(Math.abs(P.y - P.peakY));
    }
    P.smash = false; P.peakY = P.y;
    P.coyote = 7; P.airJumps = 1;
    if (!P.plat && g > 0) {
      const l = Math.floor(P.x / T), rr = Math.floor((P.x + P.w - 0.01) / T);
      const okT = tt => tt === 1 || tt === 10;
      const ok = okT(tileAt(l, fy)) && okT(tileAt(rr, fy)) && ![-1, 0, 1, 2].some(d => { const t1 = tileAt(l + d, fy - 1), t2 = tileAt(l + d, fy); return t1 === 3 || t1 === 5 || t2 === 5; })
        && !L.geysers.some(gy => Math.abs(gy.x - P.x) < 24);
      if (ok && !L.arena.active) { L.safe.x = P.x; L.safe.y = P.y; }
    }
  } else if (P.coyote > 0) P.coyote--;
  if (P.squash > 0) P.squash -= 0.5; else if (P.squash < 0) P.squash += 0.5;

  for (const s of L.springs) if (g > 0 && P.vy >= 0 && overlap(P, s) && P.y + P.h <= s.y + (s.shroom ? 10 : 6)) {
    P.vy = s.shroom ? -12 : -11.2; P.springing = true; P.onGround = false; P.airJumps = 1; s.t = 12; sfx('spring');
  }
  if (P.onGround && !P.plat) {
    const fy = Math.floor((P.y + P.h + 1) / T);
    for (let x = Math.floor(P.x / T); x <= Math.floor((P.x + P.w - 0.01) / T); x++) if (tileAt(x, fy) === 4) {
      const k = fy * L.w + x; if (!L.crumbles.has(k)) { L.crumbles.set(k, { x, y: fy, t: 30, state: 'shake' }); sfx('crumble'); }
    }
  }
  // hazards
  const x0 = Math.floor(P.x / T), x1 = Math.floor((P.x + P.w - 0.01) / T), y0 = Math.floor(P.y / T), y1 = Math.floor((P.y + P.h - 0.01) / T);
  let spike = false, haz = false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const tt = tileAt(x, y);
    if (tt === 3 && P.y + P.h > y * T + 9) spike = true;
    if (tt === 5 && P.y + P.h > y * T + 5) haz = true;
  }
  if (haz) returnToSafe(25);
  else if (spike) { if (hurtPlayer(20, P.x + P.w / 2 + P.face)) P.vy = -6; }
  if (P.y > LH + 24 || P.y < -60) returnToSafe(20);

  if (P.atkT > 0) {
    P.atkT--;
    if (W.kind !== 'bow' && P.atkT <= 11 && P.atkT >= 5) hitWithBox(attackBox(W), W.dmg, W.kind);
  }
  P.anim += Math.abs(P.vx) * 0.12;

  for (const f of L.flags) if (!f.on && overlap(P, { x: f.x - 4, y: f.y - 20, w: f.w + 8, h: f.h + 20 })) {
    L.flags.forEach(o => o.on = false); f.on = true;
    L.checkpoint = { x: f.x, y: f.y + f.h - P.h };
    P.hp = Math.max(P.hp, maxHP()); sfx('check'); toast(t('checkpoint'));
    burst(f.x + 4, f.y, 14, ['#3fd04a', '#fff'], 2);
  }
  for (const z of L.tipZones) if (!z.shown && P.x > z.x - 40) { z.shown = true; showTip(z.tag); }
  if (!L.arena.active && !L.arena.done && P.x > L.arena.trigger) startBoss();
}
function showTip(tag) { if (!save.tips[tag]) { save.tips[tag] = 1; toast(t('tip_' + tag), 4500); persist(); } }
function attackBox(W) {
  if (P.atkDown) return { x: P.x - 4, y: P.y + P.h - 2, w: P.w + 8, h: 18 };
  const r = W.range;
  return { x: P.face > 0 ? P.x + P.w - 2 : P.x - r + 2, y: P.y - 3, w: r, h: P.h + 6 };
}
function pogo() { P.vy = -6.0; P.cut = true; P.airJumps = 1; P.atkT = Math.min(P.atkT, 4); }
// a successful hit on a monster: mana, thunder enchant
function onHitLanded(x, y, isBoss) {
  P.mana = Math.min(100, P.mana + (isBoss ? 2.5 : 5));
  if (save.thunder && Math.random() < THUNDER[save.thunder - 1].chance) return THUNDER[save.thunder - 1].dmg;
  return 0;
}
function lightningFx(x, y) {
  L.bolts.push({ x, y0: Math.max(cam.y - 10, y - 220), y1: y, life: 14 });
  sfx('thunder'); cam.shake = Math.max(cam.shake, 5);
  burst(x, y, 12, ['#fff', '#ffff60', '#7fe3ff'], 3);
}
function hitWithBox(hb, dmg, kind) {
  let hitSomething = false;
  const smashBonus = (kind === 'hammer' && P.smash) ? 1 + Math.abs(P.y - P.peakY) / 48 : 1;
  const d = Math.round(dmg * smashBonus);
  for (const e of L.enemies) {
    if (e.dead || e.hitBy === P.swing || !overlap(hb, e)) continue;
    e.hitBy = P.swing;
    if (e.kind === 'knight' && !P.atkDown) {
      const fromFront = sign((P.x + P.w / 2) - (e.x + e.w / 2)) === e.face;
      if (fromFront && kind !== 'hammer') { sfx('clang'); burst(e.x + e.w / 2 + e.face * 6, e.y + 8, 6, ['#ffd54a', '#fff'], 2); P.vx = -P.face * 2.5; e.turnT = Math.max(e.turnT, 10); continue; }
    }
    if (damageEnemy(e, d, P.face)) { hitSomething = true; const th = onHitLanded(e.x, e.y, false); if (th && !e.dead) { lightningFx(e.x + e.w / 2, e.y); damageEnemy(e, th, P.face); } }
  }
  if (bossHitTest(hb, d, P.swing)) hitSomething = true;
  for (const lv of L.levers) if (!lv.on && overlap(hb, lv)) pullLever(lv);
  for (const s of L.switches) if (s.cd === 0 && overlap(hb, s)) hitSwitch(s);
  for (const c of L.chests) if (!c.open && overlap(hb, c)) openChest(c);
  for (const c of L.cannons) if (!c.dead && c.hitBy !== P.swing && overlap(hb, c)) { c.hitBy = P.swing; hitCannon(c); hitSomething = true; }
  for (const s of L.stalacs) if (s.state === 'hang' && overlap(hb, s)) { s.state = 'fall'; s.vy = 0; }
  for (const pr of L.projectiles) if (!pr.dead && !pr.mine && pr.parry !== false && overlap(hb, pr)) {
    if (pr.kind === 'bomb' || pr.kind === 'cball') { pr.vx = P.face * 3.5; pr.vy = -3; pr.mine = true; pr.dmg *= 2; sfx('clang'); }
    else { pr.dead = true; burst(pr.x + pr.w / 2, pr.y + pr.h / 2, 6, ['#fff', '#ffd54a'], 2); sfx('clang'); }
    hitSomething = true;
  }
  if (P.atkDown && kind !== 'hammer') {
    const ty = Math.floor((hb.y + hb.h - 4) / T);
    for (let x = Math.floor(hb.x / T); x <= Math.floor((hb.x + hb.w) / T); x++) if (tileAt(x, ty) === 3) hitSomething = true;
    if (hitSomething) pogo();
  }
  if (hitSomething) hitStop = kind === 'hammer' ? 5 : 3;
}
function hammerSlam(fall) {
  const k = 0.5 + fall / 96, W = curWeapon();
  const dmg = Math.round(W.dmg * k), R = 40 + Math.min(40, fall / 4);
  sfx('smash'); cam.shake = Math.min(16, 5 + fall / 16);
  for (let i = -1; i <= 1; i += 2) for (let j = 0; j < 8; j++) L.particles.push({ x: P.x + P.w / 2, y: P.y + P.h, vx: i * (1 + j * 0.5), vy: -1 - Math.random() * 2, life: 25, max: 25, col: '#e8d8b0', s: 2, g: 0.15 });
  floatText(P.x + P.w / 2, P.y - 10, 'SMASH', '#ffcc33');
  const zone = { x: P.x + P.w / 2 - R, y: P.y - 6, w: R * 2, h: P.h + 10 };
  P.swing++;
  for (const e of L.enemies) if (!e.dead && overlap(zone, e)) { damageEnemy(e, dmg, sign(e.x - P.x) || 1); onHitLanded(e.x, e.y, false); }
  bossHitTest(zone, dmg, P.swing);
}
function shootArrow(W) {
  const down = P.atkDown;
  L.projectiles.push({ kind: 'arrow', mine: true, x: P.x + P.w / 2 - 5, y: P.y + 5, w: 10, h: 3, vx: down ? P.face * 2.5 : P.face * 6.5, vy: down ? 5.5 : -0.4, grav: 0.05, dmg: W.dmg, life: 100, hits: new Set() });
  sfx('arrow');
}
function swapWeapon() {
  const ws = ownedWeapons(); if (ws.length < 2) return;
  P.weap = ws[(ws.indexOf(P.weap) + 1) % ws.length]; save.equip = P.weap;
  toast(t('weaponSwap', t(P.weap)), 1200); sfx('switch'); updateTouchExtras();
}
function castSpecial() {
  const sp = save.special; if (!sp || !save.spec[sp]) return;
  const S = SPECIALS[sp], lv = save.spec[sp] - 1;
  if (P.mana < S.cost) { toast(t('needMana'), 1000); return; }
  P.mana -= S.cost; sfx('magic');
  const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
  if (sp === 'fireball') L.projectiles.push({ kind: 'fireball', mine: true, pierce: true, x: cx - 8, y: cy - 7, w: 16, h: 12, vx: P.face * 4.5, vy: 0, dmg: S.power[lv], life: 150, hits: new Set() });
  if (sp === 'storm') {
    const targets = [...L.enemies.filter(e => !e.dead && onScreen(e, 0)), ...L.bosses.filter(b => !b.dead && b.alpha > 0.5)];
    targets.sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x));
    targets.slice(0, S.power[lv]).forEach((e, i) => setTimeout(() => {
      if (!L || e.dead) return;
      lightningFx(e.x + e.w / 2, e.y + e.h / 2);
      if (L.bosses.includes(e)) damageBoss(e, 160); else damageEnemy(e, 140, 1);
    }, i * 120));
  }
  if (sp === 'shield') P.shieldT = S.power[lv];
  if (sp === 'slow') L.slowT = S.power[lv];
  if (sp === 'heal') { const h = Math.round(maxHP() * S.power[lv]); P.hp = Math.min(maxHP(), P.hp + h); floatText(cx, P.y - 6, '+' + h, '#5cff7a'); burst(cx, cy, 20, ['#5cff7a', '#fff'], 2); }
  burst(cx, cy, 14, ['#b07aff', '#7fe3ff', '#fff'], 2.5);
}
function drinkPotion() {
  if (save.potions <= 0) { toast(t('noPotions')); return; }
  if (P.hp >= maxHP()) { toast(t('fullHp')); return; }
  save.potions--; P.hp = Math.min(maxHP(), P.hp + 50); sfx('potion');
  floatText(P.x + P.w / 2, P.y - 6, '+50', '#5cff7a'); burst(P.x + P.w / 2, P.y + P.h / 2, 12, ['#ff6a8a', '#fff'], 1.5);
  persist();
}
function pullLever(lv) {
  lv.on = true; sfx('lever'); burst(lv.x + 4, lv.y, 8, ['#5ccf4a', '#fff'], 1.5);
  const all = L.levers.filter(o => o.group === lv.group);
  if (all.every(o => o.on)) {
    for (const gx of (L.doors[lv.group] || [])) for (let y = 0; y < ROWS; y++) if (tileAt(gx, y) === 6) { setTile(gx, y, 0); if (y % 2) burst(gx * T + 8, y * T + 8, 2, ['#6a4a2a', '#9aa0b0'], 1.5); }
    sfx('door'); cam.shake = 8; toast(t('doorOpen'));
  } else toast(t('leverN', all.filter(o => o.on).length, all.length));
}
function flipToggle() {
  L.toggle = !L.toggle; sfx('switch');
  unstuck(P);
  for (const e of L.enemies) if (!e.fly) unstuck(e);
}
function hitSwitch(s) { s.cd = 45; flipToggle(); burst(s.x + 5, s.y + 5, 10, [L.toggle ? '#4a8aff' : '#ff4a5a', '#fff'], 2); cam.shake = 3; }
function openChest(c) {
  c.open = true; sfx('chest');
  const n = c.old ? 3 : Math.round(8 + L.n * 1.5);
  dropCoins(c.x + c.w / 2, c.y, n);
  if (!c.old) { dropCoins(c.x + c.w / 2, c.y, 0); L.pickups.push(mkPickup('gem', c.x + 4, c.y - 6, 0, -3, true)); save.chests[L.n] |= (1 << c.idx); L.chestsGot++; persist(); }
  toast(c.old ? t('chestOld') : t('chest', n + 15), 1800);
  burst(c.x + c.w / 2, c.y, 18, ['#ffcc33', '#fff', '#ff4a8a'], 2.5);
}
function hitCannon(c) {
  c.hp--; sfx('clang'); burst(c.x + 8, c.y + 4, 6, ['#ffcc33', '#fff'], 2);
  if (c.hp <= 0) { c.dead = true; sfx('explode'); burst(c.x + 8, c.y + 8, 20, ['#ff8a2a', '#3a3a44', '#ffcc33'], 3); dropCoins(c.x + 8, c.y, 4); cam.shake = 6; }
}

/* ---------------- monsters ---------------- */
let hitStop = 0;
function damageEnemy(e, dmg, dir) {
  if (e.dead) return false;
  if (e.kind === 'ghost' && e.alpha < 0.55) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, ['#e8f0ff'], 1); return false; }
  if (e.kind === 'imp' && e.state === 'blink') return false;
  e.hp -= dmg; e.flash = 8; e.vx = dir * (e.heavy ? 0.8 : 2.5); e.kb = e.heavy ? 4 : 10;
  if (!e.fly && !e.heavy) e.vy = -2;
  if (e.kind === 'hedge' && e.state === 'roll') { e.state = 'idle'; e.t = 40; }
  if (e.kind === 'brute' && e.state === 'wind') { e.state = 'idle'; e.t2 = 60; }
  floatText(e.x + e.w / 2, e.y - 2, String(dmg), '#fff');
  sfx('hit'); burst(e.x + e.w / 2, e.y + e.h / 2, 5, ['#fff', '#ffe08a'], 2);
  if (e.kind === 'knight') e.turnT = Math.min(e.turnT, 6);
  if (e.hp <= 0) killEnemy(e);
  return true;
}
const KILL_COLS = { slime: ['#5ccf4a', '#8ef07a'], goblin: ['#6ab04a', '#8a5a2a'], bat: ['#5a3a7a', '#ff4040'], skel: ['#e8e4d8', '#8a6a3a'], knight: ['#9aa0b0', '#c03030'], mush: ['#d04040', '#f0e0c0'],
  hedge: ['#7a5a3a', '#e8c8a0'], ghost: ['#e8f0ff', '#2a2050'], frog: ['#4ab04a', '#e8f080'], wasp: ['#ffcc33', '#1a1020'], rocky: ['#8a7a6a', '#ff8a3a'], bomber: ['#8ab04a', '#6a3a8a'],
  spear: ['#d8a040', '#3a6a9a'], shaman: ['#2a6a4a', '#80ff80'], brute: ['#7a8a5a', '#6a4a3a'], imp: ['#d03030', '#ffe040'], flame: ['#ff6a1a', '#ffd040'], cbat: ['#5ad0ff', '#fff'] };
function killEnemy(e) {
  e.dead = true; L.kills++; save.kills++;
  sfx('kill'); cam.shake = 3;
  burst(e.x + e.w / 2, e.y + e.h / 2, e.elite ? 26 : 16, e.elite ? ['#ffcc33', '#fff', ...KILL_COLS[e.kind]] : KILL_COLS[e.kind] || ['#fff'], 2.5);
  dropCoins(e.x + e.w / 2, e.y + e.h / 2, e.coins);
  if (Math.random() < (e.elite ? 0.3 : 0.05)) L.pickups.push(mkPickup('potion', e.x + e.w / 2 - 3, e.y, 0, -3, true));
}
function dropCoins(x, y, n) { for (let i = 0; i < n; i++) L.pickups.push(mkPickup('coin', x - 2, y - 2, (Math.random() - 0.5) * 3, -2 - Math.random() * 3, true)); }
function enemyShot(o) { L.projectiles.push(Object.assign({ life: 220 }, o)); }
function updateEnemies() {
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
  for (const e of L.enemies) {
    if (e.dead) continue;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    const dx = pcx - ecx, dy = pcy - ecy, dist = Math.hypot(dx, dy);
    if (Math.abs(ecx - (cam.x + VW / 2)) > VW && !e.minion && !e.amb) continue;   // sleep offscreen
    e.anim++; if (e.flash > 0) e.flash--;
    if (e.kb > 0) { e.kb--; e.vx *= 0.85; }
    else switch (e.kind) {
      case 'slime':
        if (e.onGround) { e.vx = 0; if (--e.t <= 0) { let dir = Math.abs(dx) < 170 ? sign(dx) || 1 : e.dir; if (!groundAhead(e, dir)) dir = -dir; e.dir = dir; e.vx = dir * (Math.abs(dx) < 170 ? 1.6 : 0.9); e.vy = -4.2 - Math.random(); e.t = 45 + Math.random() * 50; } }
        break;
      case 'goblin':
        if (e.state === 'idle') {
          e.vx = e.dir * 0.7;
          if (!groundAhead(e, e.dir) || wallAhead(e, e.dir)) e.dir = -e.dir;
          if (Math.abs(dx) < 140 && Math.abs(dy) < 28 && sign(dx) === e.dir) { e.state = 'wind'; e.t = 22; e.vx = 0; }
        } else if (e.state === 'wind') { e.vx = 0; if (--e.t <= 0) { e.state = 'charge'; e.t = 75; } }
        else if (e.state === 'charge') { e.vx = e.dir * 3.3; if (Math.random() < 0.3) L.particles.push(dust(ecx, e.y + e.h)); if (--e.t <= 0 || !groundAhead(e, e.dir) || wallAhead(e, e.dir)) { e.state = 'tired'; e.t = 70; e.vx = 0; } }
        else if (e.state === 'tired') { e.vx = 0; if (--e.t <= 0) { e.state = 'idle'; e.dir = sign(dx) || e.dir; } }
        e.face = e.dir;
        break;
      case 'bat': case 'cbat':
        if (e.state === 'idle') {
          e.x = e.hx + Math.sin(e.anim * 0.03) * 10; e.y = e.hy + Math.sin(e.anim * 0.07) * 4; e.vx = e.vy = 0;
          if (e.kind === 'bat' && dist < 150) { e.state = 'chase'; e.t = 200; }
          if (e.kind === 'cbat' && Math.abs(dx) < 90 && dy > 0 && dy < 220 && --e.t <= 0) {
            e.t = 120; sfx('shoot');
            for (const k of [-1, 0, 1]) enemyShot({ kind: 'shard', col: '#7fe3ff', x: ecx - 3, y: e.y + e.h, w: 6, h: 6, vx: k * 1.1 + clamp(dx / 120, -1, 1), vy: 2.6, dmg: e.dmg });
          }
        } else if (e.state === 'chase') {
          const sp = 1.25;
          e.vx += (sign(dx) * sp - e.vx) * 0.06; e.vy += (clamp(dy * 0.05, -sp, sp) + Math.sin(e.anim * 0.15) * 0.8 - e.vy) * 0.1;
          if (--e.t <= 0) e.state = 'back';
        } else if (e.state === 'back') {
          const bx = e.hx - e.x, by = e.hy - e.y, bd = Math.hypot(bx, by);
          if (bd < 4) { e.state = 'idle'; e.anim = 0; } else { e.vx = bx / bd * 1.4; e.vy = by / bd * 1.4; }
        }
        e.face = sign(e.vx) || sign(dx) || e.face;
        break;
      case 'skel':
        e.face = sign(dx) || e.face;
        if (Math.abs(e.x - e.hx) > 20) e.dir = sign(e.hx - e.x);
        e.vx = (e.anim % 200 < 100 ? 0.3 : -0.3) * (groundAhead(e, e.dir) ? 1 : 0) * e.dir;
        if (dist < 240 && Math.abs(dx) > 12 && --e.t <= 0) {
          e.t = 110 + Math.random() * 40;
          const ang = Math.atan2(dy - 4, dx);
          enemyShot({ kind: 'bone', x: ecx - 3, y: e.y + 4, w: 6, h: 4, vx: Math.cos(ang) * 2.7, vy: Math.sin(ang) * 2.7, dmg: e.dmg, life: 200 }); sfx('shoot');
        }
        break;
      case 'mush':
        e.vx = 0; e.face = sign(dx) || e.face;
        if (dist < 210 && --e.t <= 0) { e.t = 120 + Math.random() * 40; e.puff = 14; for (const k of [-1, 0, 1]) enemyShot({ kind: 'spore', col: '#c8f07a', x: ecx - 3, y: e.y, w: 6, h: 6, vx: clamp(dx / 70, -2, 2) + k * 0.9, vy: -4.2, grav: 0.14, dmg: e.dmg }); sfx('shoot'); }
        if (e.puff > 0) e.puff--;
        break;
      case 'hedge':
        if (e.state === 'roll') { e.vx = e.dir * 3.4; e.t--; if (Math.random() < 0.3) L.particles.push(dust(ecx, e.y + e.h)); if (e.t <= 0 || !groundAhead(e, e.dir) || wallAhead(e, e.dir)) { e.state = 'idle'; e.t = 60; e.vx = 0; } }
        else { e.vx = e.t > 0 ? 0 : e.dir * 0.4; if (e.t > 0) e.t--; if (!groundAhead(e, e.dir) || wallAhead(e, e.dir)) e.dir = -e.dir; if (e.t <= 0 && Math.abs(dx) < 120 && Math.abs(dy) < 24) { e.dir = sign(dx) || e.dir; e.state = 'roll'; e.t = 70; } }
        e.face = e.dir;
        break;
      case 'ghost': {
        // shy ghost: freezes and fades when Dan looks at it, creeps closer when he looks away
        const watched = sign(ecx - pcx) === P.face && dist < 260;
        e.alpha += ((watched ? 0.3 : 1) - e.alpha) * 0.06;
        if (watched || dist > 260) { e.vx *= 0.85; e.vy *= 0.85; } else { e.vx += (dx / dist * 0.9 - e.vx) * 0.08; e.vy += (dy / dist * 0.9 - e.vy) * 0.08; }
        e.face = sign(dx) || e.face;
        break;
      }
      case 'frog':
        if (e.onGround) { e.vx = 0; if (--e.t <= 0) { let dir = Math.abs(dx) < 180 ? sign(dx) || 1 : e.dir; if (!groundAhead(e, dir)) dir = -dir; e.dir = dir; e.vx = dir * 2.2; e.vy = -6; e.t = 55 + Math.random() * 40; } }
        e.face = e.dir;
        break;
      case 'wasp':
        e.x = e.hx + Math.sin(e.anim * 0.025) * 40; e.y = e.hy - 8 + Math.sin(e.anim * 0.11) * 3;
        e.face = Math.cos(e.anim * 0.025) > 0 ? 1 : -1; e.vx = e.vy = 0;
        if (e.t > 0) e.t--;
        if (e.t <= 0 && Math.abs(dx) < 14 && dy > 0 && dy < 200) { e.t = 70; enemyShot({ kind: 'sting', x: ecx - 2, y: e.y + e.h, w: 4, h: 7, vx: 0, vy: 3.2, dmg: e.dmg, life: 120 }); sfx('shoot'); }
        break;
      case 'rocky':
        e.face = sign(dx) || e.face;
        e.vx = Math.abs(dx) < 200 && Math.abs(dx) > 40 && groundAhead(e, e.face) && !wallAhead(e, e.face) ? e.face * 0.35 : 0;
        if (dist < 230 && --e.t <= 0) { e.t = 150 + Math.random() * 40; e.puff = 12; enemyShot({ kind: 'rock', col: '#8a7a6a', x: ecx - 5, y: e.y - 6, w: 10, h: 10, vx: clamp(dx / 58, -4, 4), vy: -5, grav: 0.17, dmg: e.dmg, life: 240 }); sfx('slam'); }
        if (e.puff > 0) e.puff--;
        break;
      case 'knight':
        if (sign(dx) !== e.face && sign(dx) !== 0) { e.turnT++; if (e.turnT > 45) { e.face = sign(dx); e.turnT = 0; } } else e.turnT = 0;
        if (Math.abs(dx) < 220 && Math.abs(dy) < 40 && e.turnT === 0) { e.vx = e.face * 0.55; if (!groundAhead(e, e.face) || wallAhead(e, e.face)) e.vx = 0; } else e.vx = 0;
        break;
      case 'bomber':
        // keeps its distance and lobs bombs that explode after a short fuse
        e.face = sign(dx) || e.face;
        { const want = Math.abs(dx) < 70 ? -e.face : Math.abs(dx) > 170 ? e.face : 0; e.vx = want * 0.6; if (want && (!groundAhead(e, want) || wallAhead(e, want))) e.vx = 0; }
        if (dist < 230 && --e.t <= 0) { e.t = 130 + Math.random() * 40; e.puff = 10; enemyShot({ kind: 'bomb', x: ecx - 4, y: e.y - 4, w: 8, h: 8, vx: clamp(dx / 48, -3.5, 3.5), vy: -5, grav: 0.2, dmg: e.dmg, fuse: 80, life: 400 }); sfx('shoot'); }
        if (e.puff > 0) e.puff--;
        break;
      case 'spear':
        // aims (red line), then throws a fast spear
        if (e.state === 'aim') { e.vx = 0; if (--e.t <= 0) { e.state = 'idle'; e.t2 = 120; enemyShot({ kind: 'spear', x: ecx - 8, y: e.y + 5, w: 16, h: 3, vx: e.face * 5.4, vy: 0, dmg: e.dmg, life: 120 }); sfx('arrow'); } }
        else {
          e.face = sign(dx) || e.face; e.vx = e.dir * 0.4;
          if (!groundAhead(e, e.dir) || wallAhead(e, e.dir) || Math.abs(e.x - e.hx) > 40) e.dir = -e.dir;
          if (e.t2 > 0) e.t2--;
          if (e.t2 <= 0 && Math.abs(dx) < 230 && Math.abs(dy) < 30) { e.state = 'aim'; e.t = 36; }
        }
        break;
      case 'shaman':
        // runs from Dan, casts a ring of orbs and heals nearby monsters
        e.face = sign(dx) || e.face;
        e.vx = Math.abs(dx) < 80 ? -sign(dx) * 0.8 : 0; if (e.vx && (!groundAhead(e, sign(e.vx)) || wallAhead(e, sign(e.vx)))) e.vx = 0;
        if (dist < 220 && --e.t <= 0) { e.t = 160; e.puff = 16; sfx('magic'); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + e.anim * 0.01; enemyShot({ kind: 'orb', col: '#a060ff', x: ecx - 3, y: ecy - 3, w: 6, h: 6, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, dmg: e.dmg, life: 200 }); } }
        if (--e.t2 <= 0) { e.t2 = 200; for (const o of L.enemies) if (o !== e && !o.dead && o.hp < o.max && Math.hypot(o.x - e.x, o.y - e.y) < 110) { const h = Math.round(o.max * 0.25); o.hp = Math.min(o.max, o.hp + h); floatText(o.x + o.w / 2, o.y - 4, '+' + h, '#5cff7a'); burst(o.x + o.w / 2, o.y + o.h / 2, 6, ['#5cff7a'], 1.5); } }
        if (e.puff > 0) e.puff--;
        break;
      case 'brute':
        // walks up, raises its fists, then pounds the ground (shockwaves both ways)
        e.face = sign(dx) || e.face;
        if (e.state === 'wind') { e.vx = 0; if (--e.t <= 0) { e.state = 'idle'; e.t2 = 140; cam.shake = 7; sfx('slam'); for (const d of [-1, 1]) enemyShot({ kind: 'wave', col: '#a08a6a', x: ecx - 5, y: e.y + e.h - 9, w: 10, h: 9, vx: d * 2.8, vy: 0, dmg: e.dmg, life: 70, parry: false, ground: true }); } }
        else {
          e.vx = Math.abs(dx) > 30 && Math.abs(dx) < 220 && groundAhead(e, e.face) && !wallAhead(e, e.face) ? e.face * 0.5 : 0;
          if (e.t2 > 0) e.t2--;
          if (e.t2 <= 0 && Math.abs(dx) < 70 && Math.abs(dy) < 30 && e.onGround) { e.state = 'wind'; e.t = 34; }
        }
        break;
      case 'imp':
        // blinks behind Dan, glows, then slashes
        if (e.state === 'idle') { e.vx = Math.sin(e.anim * 0.05) * 0.4; e.vy = Math.sin(e.anim * 0.08) * 0.4; e.face = sign(dx) || e.face; if (dist < 200 && --e.t <= 0) { e.state = 'blink'; e.t = 20; } }
        else if (e.state === 'blink') { e.alpha = e.t / 20; e.vx = e.vy = 0; if (--e.t <= 0) { const bx = P.x - P.face * 34; e.x = bx; e.y = P.y - 4; if (insideSolid(e)) { e.x = P.x + P.face * 34; } e.alpha = 1; e.state = 'glow'; e.t = 22; e.face = sign(pcx - (e.x + e.w / 2)) || 1; } }
        else if (e.state === 'glow') { e.vx = e.vy = 0; if (--e.t <= 0) { e.state = 'slash'; e.t = 14; } }
        else if (e.state === 'slash') { e.vx = e.face * 4; e.vy = 0; if (--e.t <= 0) { e.state = 'away'; e.t = 40; } }
        else { e.vx *= 0.9; e.vy = -1.2; if (--e.t <= 0) { e.state = 'idle'; e.t = 140 + Math.random() * 40; } }
        break;
      case 'flame':
        // runs at Dan and leaves a burning trail
        e.face = sign(dx) || e.face;
        e.vx = Math.abs(dx) < 240 ? e.face * 1.3 : 0; if (!groundAhead(e, e.face) || wallAhead(e, e.face)) e.vx = 0;
        if (e.onGround && Math.abs(e.vx) > 0.1 && e.anim % 8 === 0) L.fires.push({ x: ecx - 4, y: e.y + e.h - 8, w: 8, h: 8, life: 100, dmg: Math.round(e.dmg * 0.6) });
        break;
    }
    if (!e.fly) {
      e.vy = Math.min(e.vy + 0.42, 7);
      if (moveX(e, e.vx) && e.kind !== 'slime') e.dir = -e.dir;
      const h = moveY(e, e.vy, false);
      e.onGround = h === 1; if (h) e.vy = 0;
      if (e.kind === 'slime' || e.kind === 'goblin') e.face = sign(e.vx) || e.face;
      if (e.y > LH + 40) e.dead = true;
    } else if (e.kind !== 'wasp' && !(e.kind === 'bat' || e.kind === 'cbat') || e.state !== 'idle') { e.x += e.vx; e.y += e.vy; }
    if (e.amb) { e.x = clamp(e.x, e.amb.c0 * T + 20, (e.amb.c1 - 1) * T - e.w - 4); }
    if (!P.dead && overlap(P, e)) {
      if (e.kind === 'ghost' && e.alpha < 0.55) continue;
      if (e.kind === 'imp' && e.state === 'blink') continue;
      const stomp = P.vy > 1 && P.y + P.h - P.vy <= e.y + 4 && !e.fly && !e.spiky;
      if (stomp) { P.vy = -5.6; P.cut = true; damageEnemy(e, Math.ceil(curWeapon().dmg * 0.6), sign(dx) || 1); }
      else hurtPlayer(e.dmg, ecx);
    }
  }
  L.enemies = L.enemies.filter(e => !e.dead);
}

/* ---------------- level mechanics ---------------- */
function updateMechanics() {
  const pcx = P.x + P.w / 2;
  // rhythm blocks: swap every 2.5s
  if (L.rhythm) { L.rhyT++; if (L.rhyT % 150 === 0) flipToggle(); }
  for (const s of L.switches) if (s.cd > 0) s.cd--;
  // cannons aim and fire at Dan
  for (const c of L.cannons) {
    if (c.dead) continue;
    const dx = pcx - (c.x + 8), dy = P.y + 6 - (c.y + 6);
    if (Math.abs(dx) < 280 && Math.abs(dy) < 150) {
      c.ang = Math.atan2(dy, dx);
      if (--c.t <= 0) {
        c.t = 140; const sp = 2.4;
        enemyShot({ kind: 'cball', x: c.x + 4 + Math.cos(c.ang) * 10, y: c.y + 2 + Math.sin(c.ang) * 10, w: 9, h: 9, vx: Math.cos(c.ang) * sp, vy: Math.sin(c.ang) * sp, dmg: 16 + L.n * 2, life: 240 });
        sfx('explode'); burst(c.x + 8 + Math.cos(c.ang) * 12, c.y + 6 + Math.sin(c.ang) * 12, 6, ['#fff', '#aaa'], 1.5);
      }
    }
  }
  // falling stalactites
  for (const s of L.stalacs) {
    if (s.state === 'hang') { if (Math.abs(pcx - (s.x + 4)) < 20 && P.y > s.y && P.y - s.y < 170) { s.state = 'shake'; s.t = 22; sfx('crumble'); } }
    else if (s.state === 'shake') { if (--s.t <= 0) { s.state = 'fall'; s.vy = 0; } }
    else if (s.state === 'fall') {
      s.vy = Math.min(s.vy + 0.35, 8); s.y += s.vy;
      if (!P.dead && overlap(P, s)) { hurtPlayer(20 + L.n, s.x); shatter(s); }
      for (const e of L.enemies) if (!e.dead && overlap(e, s)) { damageEnemy(e, 40, 1); shatter(s); }
      if (s.state === 'fall' && (solidAt(Math.floor((s.x + 4) / T), Math.floor((s.y + s.h) / T)) || s.y > LH)) shatter(s);
    } else if (s.state === 'gone') { if (--s.t <= 0) { s.state = 'hang'; s.x = s.hx; s.y = s.hy; } }
  }
  // geysers
  for (const g of L.geysers) {
    g.t = (g.t + 1) % 220;
    if (g.t >= 140 && g.t < 180 && g.t % 4 === 0) L.particles.push({ x: g.x + rnd(-5, 5), y: g.y - 2, vx: 0, vy: -0.8, life: 18, max: 18, col: L.th.haz, s: 2 });
    if (g.t >= 180) {
      if (g.t % 2 === 0) L.particles.push({ x: g.x + rnd(-5, 5), y: g.y - rnd(0, 56), vx: rnd(-0.4, 0.4), vy: -2, life: 14, max: 14, col: Math.random() < 0.5 ? L.th.haz : '#fff', s: 2 });
      const zone = { x: g.x - 6, y: g.y - 56, w: 12, h: 56 };
      if (!P.dead && overlap(P, zone)) hurtPlayer(18 + L.n, g.x);
      for (const e of L.enemies) if (!e.dead && !e.fly && overlap(e, zone) && g.t % 20 === 0) damageEnemy(e, 25, 1);
    }
  }
  // fire trails
  for (const f of L.fires) { f.life--; if (!P.dead && overlap(P, f) && P.inv === 0) hurtPlayer(f.dmg, f.x); }
  L.fires = L.fires.filter(f => f.life > 0);
  // wind
  const w = L.wind;
  if (w && !L.arena.active) {
    w.t--;
    if (w.state === 'calm' && w.t <= 0) { w.state = 'warn'; w.t = 60; w.dir = Math.random() < 0.7 ? -1 : 1; toast(t('wind') + (w.dir < 0 ? ' ←' : ' →'), 1200); sfx('alarm'); showTip('wind'); }
    else if (w.state === 'warn' && w.t <= 0) { w.state = 'gust'; w.t = 150; }
    else if (w.state === 'gust' && w.t <= 0) { w.state = 'calm'; w.t = 260 + Math.random() * 120; }
  }
  // chase wall
  const c = L.chase;
  if (c && !c.done && !P.dead) {
    if (!c.active && P.x > c.from + 24 && P.x < c.to) { c.active = true; c.x = P.x - 230; toast(t('run'), 1500); sfx('alarm'); cam.shake = 8; }
    if (c.active) {
      c.x += c.speed;
      if (P.x > c.to) { c.active = false; c.done = true; toast(t('escaped'), 1500); sfx('check'); }
      else if (P.x < c.x + 6) { hurtPlayer(25 + L.n, c.x); c.x -= 110; P.vx = 3; }
    }
  }
  // ambushes
  for (const a of L.ambushes) updateAmbush(a);
  // darkness reminders
  if (L.dark && !save.tips.dark && L.time > 60) showTip('dark');
  if (L.stalacs.length && !save.tips.stalactites && L.stalacs.some(s => s.state !== 'hang')) showTip('stalactites');
  if (L.geysers.length && !save.tips.geyser && L.geysers.some(g => Math.abs(g.x - P.x) < 120)) showTip('geyser');
  if (!save.tips.elite && L.enemies.some(e => e.elite && onScreen(e, 0))) showTip('elite');
  if (!save.tips.chests && L.chests.some(ch => onScreen(ch, 0))) showTip('chests');
  // bolts / misc fx
  for (const b of L.bolts) b.life--;
  L.bolts = L.bolts.filter(b => b.life > 0);
  if (L.slowT > 0) L.slowT--;
  if (L.ink > 0) L.ink--;
}
function shatter(s) { s.state = 'gone'; s.t = 420; burst(s.x + 4, s.y + s.h, 10, ['#8a8a9a', '#c8c8d8'], 2); sfx('crumble'); }
function ambushGates(a, close) { for (const gx of [a.c0 + 1, a.c1 - 1]) for (let y = 0; y < ROWS - 2; y++) { const tt = tileAt(gx, y); if (close && tt === 0) setTile(gx, y, 7); if (!close && tt === 7) setTile(gx, y, 0); } }
function resetAmbush(a) { a.state = 'idle'; a.wave = 0; ambushGates(a, false); L.enemies.forEach(e => { if (e.amb === a) e.dead = true; }); }
function spawnWave(a) {
  a.wave++;
  const n = L.n, pool = enemyPool(n).filter(k => k !== 'N' || n > 4);
  const count = 3 + Math.min(3, Math.floor(n / 3));
  toast(t('wave', a.wave, a.waves), 1200);
  for (let i = 0; i < count; i++) {
    const k = pool[(Math.random() * pool.length) | 0];
    const x = (a.c0 + 4 + Math.random() * (a.c1 - a.c0 - 8)) * T;
    const e = mkEnemy(k, x, 8 * T, n); e.amb = a; e.t = 40 + Math.random() * 60; e.coins = Math.ceil(e.coins / 2);
    if ((a.wave === a.waves && i === 0 && n >= 2) || Math.random() < 0.08 + n * 0.01) makeElite(e);
    // flyers hover just above head height so a jump (or a normal swing) reaches them
    if (e.fly) { e.state = e.kind === 'bat' ? 'chase' : 'idle'; e.hy = a.floorY - (e.kind === 'cbat' ? 46 : 36); e.y = e.hy; }
    L.enemies.push(e); burst(e.x + 6, e.y + 6, 10, ['#fff', '#ff4a5a'], 2);
  }
}
function updateAmbush(a) {
  if (a.state === 'idle' && P.x > (a.c0 + 4) * T && P.x < (a.c1 - 3) * T && !P.dead) {
    a.state = 'fight'; ambushGates(a, true); toast(t('ambush'), 1600); sfx('boss'); cam.shake = 8; a.t = 40;
  } else if (a.state === 'fight') {
    if (a.t > 0) { if (--a.t === 0) spawnWave(a); return; }
    if (!L.enemies.some(e => e.amb === a && !e.dead)) {
      if (a.wave < a.waves) a.t = 50;
      else {
        a.state = 'done'; ambushGates(a, false); sfx('door'); toast(t('ambushClear'), 2000);
        if (a.idx >= 0) { const cx = ((a.c0 + a.c1) / 2) * T; const ch = mkChest(cx, a.floorY - 10, a.idx); L.chests.push(ch); burst(cx + 7, a.floorY - 10, 20, ['#ffcc33', '#fff'], 3); }
      }
    }
  }
}

/* ---------------- projectiles / pickups / particles ---------------- */
function explode(x, y, r, dmg, mine) {
  sfx('explode'); cam.shake = Math.max(cam.shake, 6);
  burst(x, y, 22, ['#ff8a2a', '#ffcc33', '#3a3a3a', '#fff'], 3);
  const zone = { x: x - r, y: y - r, w: r * 2, h: r * 2 };
  if (!P.dead && overlap(P, zone) && !mine) hurtPlayer(dmg, x);
  if (mine) { for (const e of L.enemies) if (!e.dead && overlap(e, zone)) damageEnemy(e, dmg, sign(e.x - x) || 1); bossHitTest(zone, dmg, -Math.random()); }
}
function updateProjectiles() {
  const slowSkip = L.slowT > 0 && frame % 3 !== 0;
  for (const p of L.projectiles) {
    if (p.dead) continue;
    if (slowSkip && !p.mine) continue;
    if (p.homing && !p.mine) { const a = Math.atan2(P.y + 7 - p.y, P.x + 5 - p.x), cur = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy); let d = a - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; const na = cur + clamp(d, -p.homing, p.homing); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp; }
    if (p.kind === 'bomb') {
      p.vy = Math.min(p.vy + 0.2, 6);
      if (moveX(p, p.vx)) p.vx = -p.vx * 0.4;
      if (moveY(p, p.vy, false) === 1) { p.vy = -p.vy * 0.35; p.vx *= 0.6; if (Math.abs(p.vy) < 0.6) p.vy = 0; }
      if (--p.fuse <= 0) { p.dead = true; explode(p.x + 4, p.y + 4, 30, p.dmg, p.mine); }
      continue;
    }
    p.x += p.vx; p.y += p.vy; if (p.grav) p.vy = Math.min(p.vy + p.grav, 6);
    if (--p.life <= 0) { p.dead = true; if (p.kind === 'rocket') explode(p.x + 4, p.y + 4, 20, p.dmg, p.mine); continue; }
    const cx = Math.floor((p.x + p.w / 2) / T), cy = Math.floor((p.y + p.h / 2) / T);
    if (p.kind === 'fireball' && frame % 2 === 0) L.particles.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5), life: 16, max: 16, col: Math.random() < 0.5 ? '#ff8a2a' : '#ffcc33', s: 2 });
    if (p.ground) { if (solidAt(Math.floor((p.vx > 0 ? p.x + p.w : p.x) / T), cy)) { p.dead = true; burst(p.x + p.w / 2, p.y + p.h, 6, [p.col, '#fff'], 2); } if (Math.random() < 0.4) L.particles.push(dust(p.x + p.w / 2, p.y + p.h)); }
    else if (!p.ghost && solidAt(cx, cy)) { p.dead = true; burst(p.x + p.w / 2, p.y + p.h / 2, 4, ['#fff'], 1.5); if (p.kind === 'cball' && p.mine) explode(p.x + 4, p.y + 4, 24, p.dmg, true); if (p.kind === 'rocket') explode(p.x + 4, p.y + 4, 20, p.dmg, p.mine); continue; }
    if (p.mine) {
      // Dan's arrows / fireballs / knocked-back cannonballs
      for (const e of L.enemies) if (!e.dead && overlap(p, e) && !(p.hits && p.hits.has(e))) {
        if (p.hits) p.hits.add(e);
        if (damageEnemy(e, p.dmg, sign(p.vx) || 1)) { const th = onHitLanded(e.x, e.y, false); if (th && !e.dead) { lightningFx(e.x + e.w / 2, e.y); damageEnemy(e, th, 1); } }
        if (!p.pierce) { p.dead = true; break; }
      }
      if (!p.dead && bossHitTest(p, p.dmg, p)) { if (!p.pierce) p.dead = true; }
      for (const s of L.switches) if (s.cd === 0 && overlap(p, s)) { hitSwitch(s); p.dead = !p.pierce; }
      for (const ch of L.chests) if (!ch.open && overlap(p, ch)) { openChest(ch); p.dead = !p.pierce; }
      for (const lv of L.levers) if (!lv.on && overlap(p, lv)) { pullLever(lv); p.dead = !p.pierce; }
      for (const c of L.cannons) if (!c.dead && overlap(p, c)) { hitCannon(c); p.dead = true; }
      continue;
    }
    if (!P.dead && overlap(P, p)) {
      if (P.shieldT > 0) { p.mine = true; p.vx = -p.vx; p.vy = -p.vy; p.dmg *= 2; sfx('clang'); continue; }
      if (hurtPlayer(p.dmg, p.x + p.w / 2 - p.vx * 3)) {
        if (p.slow) { P.slowT = Math.max(P.slowT, p.slow); sfx('freeze'); }
        if (p.poison) P.poisonT = Math.max(P.poisonT, p.poison);
        p.dead = !p.ground;
      }
    }
  }
  L.projectiles = L.projectiles.filter(p => !p.dead);
  for (const w of L.warnings) {
    if (--w.t === 0) L.projectiles.push({ kind: 'rock', col: w.col, x: w.x, y: L.arena.top - 30, w: 10, h: 10, vx: 0, vy: 1, grav: 0.18, dmg: w.dmg || 20, life: 300 });
  }
  L.warnings = L.warnings.filter(w => w.t > 0);
}
function updatePickups() {
  for (const k of L.pickups) {
    k.t++;
    if (k.phys) {
      k.vy = Math.min(k.vy + 0.3, 6);
      if (moveX(k, k.vx)) k.vx = -k.vx * 0.5;
      const h = moveY(k, k.vy, false); if (h === 1) { k.vy = -k.vy * 0.45; k.vx *= 0.7; if (Math.abs(k.vy) < 0.8) k.vy = 0; } else if (h === -1) k.vy = 0;
      if (k.life > 0 && --k.life === 0) k.dead = true;
      if (k.y > LH) k.dead = true;
    }
    if (k.delay > 0) { k.delay--; continue; }
    const dx = P.x + P.w / 2 - (k.x + k.w / 2), dy = P.y + P.h / 2 - (k.y + k.h / 2);
    if (!P.dead && Math.hypot(dx, dy) < MAGNET[save.magLv].r && k.type !== 'potion') { k.x += dx * 0.18; k.y += dy * 0.18; }
    if (!P.dead && overlap(P, k)) {
      k.dead = true;
      if (k.type === 'coin') { gainCoins(1); sfx('coin'); }
      else if (k.type === 'gem') { gainCoins(15); sfx('gem'); floatText(k.x, k.y - 4, '+15', '#ff8ab8'); burst(k.x, k.y, 10, ['#ff4a8a', '#fff'], 2); }
      else if (k.type === 'potion') { if (save.potions < MAX_POTIONS) { save.potions++; toast(t('foundPotion')); } else { P.hp = Math.min(maxHP(), P.hp + 30); floatText(P.x, P.y - 6, '+30', '#5cff7a'); } sfx('potion'); }
    }
  }
  L.pickups = L.pickups.filter(k => !k.dead);
}
// coin bonus upgrade; fractions carry over so +2% really adds up
let coinFrac = 0;
function gainCoins(v) {
  const extra = v * save.coinLv * COIN_STEP / 100 + coinFrac, whole = Math.floor(extra);
  coinFrac = extra - whole;
  save.coins += v + whole; L.coinsGot += v + whole;
}
function dust(x, y) { return { x, y, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 0.8, life: 18, max: 18, col: 'rgba(255,255,255,0.7)', s: 2, g: -0.01 }; }
function burst(x, y, n, cols, spd) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * spd + 0.3;
    L.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 25 + Math.random() * 20, max: 45, col: cols[(Math.random() * cols.length) | 0], s: Math.random() < 0.5 ? 2 : 1, g: 0.12 });
  }
}
function floatText(x, y, s, col) { L.texts.push({ x, y, s, col, life: 50 }); }
function updateParticles() {
  for (const p of L.particles) { p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--; }
  L.particles = L.particles.filter(p => p.life > 0);
  if (L.particles.length > 700) L.particles.splice(0, L.particles.length - 700);
  for (const tx of L.texts) { tx.y -= 0.5; tx.life--; }
  L.texts = L.texts.filter(tx => tx.life > 0);
}
function updateWorld() {
  for (const p of L.platforms) {
    p.t += p.spd;
    const ox = p.x, oy = p.y, k = (1 - Math.cos(p.t)) / 2 * p.range;
    if (p.axis === 'x') p.x = p.x0 + k; else p.y = p.y0 + k;
    p.dx = p.x - ox; p.dy = p.y - oy;
  }
  for (const s of L.springs) if (s.t > 0) s.t--;
  for (const [k, c] of L.crumbles) {
    c.t--;
    if (c.state === 'shake' && c.t <= 0) { setTile(c.x, c.y, 0); c.state = 'gone'; c.t = 200; burst(c.x * T + 8, c.y * T + 8, 6, [L.th.fill, L.th.fillD], 1.5); }
    else if (c.state === 'gone' && c.t <= 0) { if (!overlap(P, { x: c.x * T, y: c.y * T, w: T, h: T })) { setTile(c.x, c.y, c.orig || 4); L.crumbles.delete(k); } else c.t = 20; }
  }
  if (L.finishT > 0 && --L.finishT === 0) finishLevel();
}

/* ---------------- camera & render ---------------- */
function updateCamera(snap) {
  let tx = P.x + P.w / 2 - VW / 2 + P.face * 30;
  let ty = P.y + P.h / 2 - VH / 2 - 10;
  if (L.arena.active && !L.arena.done) tx = (L.arena.left + L.arena.right) / 2 - VW / 2;
  // on phones the camera may sink below the level so the action sits above the touch buttons
  tx = clamp(tx, 0, L.w * T - VW); ty = clamp(ty, 0, LH - VH + (IS_TOUCH ? 44 : 0));
  if (snap) { cam.x = tx; cam.y = ty; } else { cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.1; }
  if (cam.shake > 0) cam.shake *= 0.85; if (cam.shake < 0.3) cam.shake = 0;
}
function hillY(x, seed, amp, base) { return base + Math.sin(x * 0.011 + seed) * amp + Math.sin(x * 0.027 + seed * 2) * amp * 0.5 + Math.sin(x * 0.005 + seed * 3) * amp * 0.8; }
function drawBackground() {
  const th = L.th, n = L.n;
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const tm = frame;
  if (th.deco === 'stars' || th.deco === 'storm' || (th.deco === 'embers' && (n === 9 || n === 18))) for (let i = 0; i < 60; i++) { const x = ((i * 97.3 - cam.x * 0.05) % VW + VW) % VW, y = (i * 53.7) % 150; ctx.fillStyle = (i + (tm >> 4)) % 7 === 0 ? '#fff' : 'rgba(255,255,255,0.5)'; ctx.fillRect(x | 0, y | 0, 1, 1); }
  const disc = (sx, sy, r, col) => { ctx.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j)); ctx.fillRect(sx - w, sy + j, w * 2, 1); } };
  if (th.deco === 'sun' || (th.deco === 'clouds' && n === 0)) disc(VW - 100, 50, 14, th.deco === 'sun' ? '#fff3c0' : '#fff8d0');
  if (th.deco === 'stars' && (n === 7 || n === 17)) { disc(VW - 80, 50, 12, '#e8e0ff'); disc(VW - 74, 46, 10, th.sky[0]); }
  if (th.deco === 'storm' && (tm % 300) < 6) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, VW, VH); }
  if (th.deco === 'clouds') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { const x = ((i * 170 - cam.x * 0.1 - tm * 0.05) % (VW + 120) + VW + 120) % (VW + 120) - 60, y = 20 + (i * 37) % 70; ctx.fillRect(x, y, 50, 8); ctx.fillRect(x + 8, y - 6, 30, 6); ctx.fillRect(x + 14, y - 10, 14, 4); } }
  const layer = (par, col, amp, base, seed, mode) => {
    ctx.fillStyle = col;
    for (let sx = 0; sx < VW; sx += 2) {
      const wx = sx + cam.x * par;
      let h;
      if (mode === 'mount') { const p = ((wx * 0.6) % 140 + 140) % 140; h = base - (p < 70 ? p : 140 - p) * 1.1 - Math.sin(wx * 0.05 + seed) * 6; }
      else if (mode === 'tower') { const p = ((wx) % 120 + 120) % 120; h = p > 20 && p < 50 ? base - 90 - (p > 25 && p < 45 && ((p | 0) % 6 < 3) ? 6 : 0) : base - 30; }
      else h = hillY(wx, seed, amp, base);
      const y = h - cam.y * par * 0.5;
      ctx.fillRect(sx, y | 0, 2, VH - y + 2);
    }
  };
  const mode = th.deco === 'snow' || th.deco === 'storm' ? 'mount' : th.deco === 'towers' ? 'tower' : 'hill';
  layer(0.2, th.far, 18, VH * 0.63, n * 3 + 1, mode);
  layer(0.45, th.near, 14, VH * 0.76, n * 5 + 2, th.deco === 'towers' ? 'tower' : 'hill');
  if (th.deco === 'crystals') { ctx.fillStyle = th.near; for (let sx = 0; sx < VW; sx += 2) { const wx = sx + cam.x * 0.45; const h = 20 + Math.abs(Math.sin(wx * 0.05)) * 30 * (Math.sin(wx * 0.013) > 0 ? 1 : 0.3); ctx.fillRect(sx, 0, 2, h); } }
  if (th.deco === 'fog') { ctx.fillStyle = 'rgba(180,220,140,0.12)'; for (let i = 0; i < 4; i++) ctx.fillRect(0, VH * 0.55 + i * 22 + Math.sin(tm * 0.01 + i) * 6, VW, 10); }
  if (th.deco === 'bubbles') { ctx.fillStyle = 'rgba(200,240,255,0.5)'; for (let i = 0; i < 25; i++) { const x = ((i * 71 - cam.x * 0.3) % VW + VW) % VW, y = VH - ((i * 37 + tm * (0.3 + (i % 3) * 0.2)) % (VH + 20)); ctx.fillRect(x | 0, y | 0, 2, 2); } }
}
function drawTiles() {
  const x0 = Math.floor(cam.x / T), x1 = Math.ceil((cam.x + VW) / T), y0 = Math.floor(cam.y / T), y1 = Math.ceil((cam.y + VH) / T);
  const th = L.th;
  const blink = L.rhythm && (L.rhyT % 150) > 110 && (frame >> 2) % 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const tt = ty < ROWS ? tileAt(tx, ty) : (TILE_SOLID[tileAt(tx, ROWS - 1)] ? 1 : 0); if (!tt) continue;
    const dx = tx * T - Math.round(cam.x), dy = ty * T - Math.round(cam.y);
    switch (tt) {
      case 1: { const above = ty > ROWS ? 1 : ty > 0 ? tileAt(tx, ty - 1) : 0; const img = isSolidT(above) && above !== 7 && above !== 6 && above !== 8 && above !== 9 ? TEX.fill[(tx * 7 + ty * 3) % 3] : TEX.top[(tx + ty) % 2]; ctx.drawImage(img, dx, dy); break; }
      case 2: ctx.drawImage(TEX.plat, dx, dy); break;
      case 3: ctx.drawImage(TEX.spike, dx, dy); break;
      case 4: { const c = L.crumbles.get(ty * L.w + tx); const sh = c && c.state === 'shake' ? ((frame >> 1) % 2 ? 1 : -1) : 0; ctx.drawImage(TEX.crumble, dx + sh, dy); break; }
      case 5: {
        ctx.fillStyle = th.haz; ctx.fillRect(dx, dy + 4, T, T - 4);
        ctx.fillStyle = shade(th.haz, 50); for (let i = 0; i < T; i += 2) { const h = Math.sin((tx * T + i) * 0.3 + frame * 0.08) * 1.5 + 4; ctx.fillRect(dx + i, dy + h | 0, 2, 2); }
        ctx.fillStyle = shade(th.haz, -40); ctx.fillRect(dx, dy + 12, T, 4); break;
      }
      case 6: ctx.drawImage(TEX.door, dx, dy); break;
      case 7: ctx.drawImage(TEX.gate, dx, dy); break;
      case 8: case 9: {
        const solid = isSolidT(tt);
        if (solid && blink) { ctx.globalAlpha = 0.5; }
        ctx.drawImage(solid ? (tt === 8 ? TEX.red : TEX.blue) : (tt === 8 ? TEX.redG : TEX.blueG), dx, dy);
        if (!solid && blink) { ctx.globalAlpha = 0.4; ctx.drawImage(tt === 8 ? TEX.red : TEX.blue, dx, dy); }
        ctx.globalAlpha = 1; break;
      }
      case 10: ctx.drawImage(TEX.ice, dx, dy); break;
      case 11: case 12: {
        ctx.fillStyle = '#3a3a44'; ctx.fillRect(dx, dy, T, T); ctx.fillStyle = '#5a5a66'; ctx.fillRect(dx, dy + 2, T, 7);
        const dir = tt === 11 ? 1 : -1, off = ((frame * 0.6 * dir) % 8 + 8) % 8;
        ctx.fillStyle = '#ffcc33';
        for (let k = -1; k < 3; k++) { const ax = dx + ((k * 8 + off) | 0); if (ax < dx - 3 || ax > dx + T - 2) continue; for (let j = 0; j < 3; j++) ctx.fillRect(clamp(ax + (dir > 0 ? j : 2 - j), dx, dx + T - 1), dy + 3 + j, 1, 1), ctx.fillRect(clamp(ax + (dir > 0 ? j : 2 - j), dx, dx + T - 1), dy + 7 - j, 1, 1); }
        ctx.fillStyle = '#2a2a30'; ctx.fillRect(dx, dy + 10, T, 6); ctx.fillStyle = '#6a6a76'; ctx.fillRect(dx + 3, dy + 12, 2, 2); ctx.fillRect(dx + 11, dy + 12, 2, 2);
        break;
      }
      case 13: ctx.drawImage(TEX.cannon, dx, dy); break;
    }
  }
}
function onScreen(e, m = 40) { return e.x + e.w > cam.x - m && e.x < cam.x + VW + m && e.y + e.h > cam.y - m && e.y < cam.y + VH + m; }
function drawRectW(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), w, h); }
const ENEMY_SPR = e => {
  switch (e.kind) {
    case 'slime': return ESPR.slime[e.onGround ? 0 : 1];
    case 'bat': return ESPR.bat[(e.anim >> 3) % 2];
    case 'cbat': return ESPR.cbat[(e.anim >> 3) % 2];
    case 'goblin': return ESPR.goblin[Math.abs(e.vx) > 0.1 ? (e.anim >> (e.state === 'charge' ? 2 : 3)) % 2 : 0];
    case 'skel': return ESPR.skel[0];
    case 'mush': return ESPR.mush[e.puff > 0 ? 1 : 0];
    case 'hedge': return ESPR.hedge[e.state === 'roll' ? 1 : 0];
    case 'ghost': return ESPR.ghost[e.alpha < 0.6 ? 1 : 0];
    case 'frog': return ESPR.frog[e.onGround ? 0 : 1];
    case 'wasp': return ESPR.wasp[(e.anim >> 2) % 2];
    case 'rocky': return ESPR.rocky[0];
    case 'bomber': return ESPR.bomber[0];
    case 'spear': return ESPR.spear[0];
    case 'shaman': return ESPR.shaman[0];
    case 'brute': return ESPR.brute[0];
    case 'imp': return ESPR.imp[0];
    case 'flame': return ESPR.flame[(e.anim >> 3) % 2];
    default: return ESPR.knight[0];
  }
};
function drawEnemies() {
  for (const e of L.enemies) if (onScreen(e)) {
    const white = e.flash > 0 && e.flash % 2 === 0;
    const spr = ENEMY_SPR(e);
    let ox = 0, oy = 0;
    if ((e.kind === 'goblin' && e.state === 'wind') || (e.kind === 'brute' && e.state === 'wind') || (e.kind === 'rocky' && e.puff > 0)) ox = (frame % 2) ? 1 : -1;
    if (e.kind === 'ghost') { ctx.globalAlpha = e.alpha; oy = Math.sin(e.anim * 0.06) * 2; }
    if (e.kind === 'imp') ctx.globalAlpha = clamp(e.alpha, 0.1, 1);
    if (e.kind === 'brute' && e.state === 'wind') oy = -3;
    const flip = e.kind === 'hedge' && e.state === 'roll' ? (e.anim >> 2) % 2 === 0 : e.face < 0;
    if (e.elite) drawGlow(spr, e, flip, ox, oy);
    drawSpr(spr, e, flip, white || (e.kind === 'imp' && e.state === 'glow' && frame % 4 < 2), ox, oy);
    ctx.globalAlpha = 1;
    if (e.kind === 'goblin' && e.state === 'tired') drawRectW(e.x + e.w / 2 + 4, e.y - 4 - ((frame >> 3) % 3), 2, 3, '#7fd6ff');
    if ((e.kind === 'goblin' || e.kind === 'brute') && e.state === 'wind') drawRectW(e.x + e.w / 2 - 1, e.y - 8, 2, 5, '#ff3030');
    if (e.kind === 'knight' && e.turnT > 0) drawRectW(e.x + e.w / 2 - 1, e.y - 7, 2, 4, '#ffd54a');
    if (e.kind === 'spear' && e.state === 'aim' && frame % 4 < 3) { ctx.globalAlpha = 0.6; drawRectW(e.face > 0 ? e.x + e.w : e.x - 200, e.y + 6, 200, 1, '#ff3030'); ctx.globalAlpha = 1; }
    if (e.kind === 'shaman' && e.puff > 0) { ctx.globalAlpha = 0.5; drawRectW(e.x - 4, e.y - 4, e.w + 8, e.h + 8, '#a060ff'); ctx.globalAlpha = 1; }
    if (e.hp < e.max) { drawRectW(e.x, e.y - 5, e.w, 2, '#3a1020'); drawRectW(e.x, e.y - 5, Math.max(1, e.w * e.hp / e.max), 2, e.elite ? '#ffcc33' : '#ff4a4a'); }
  }
}
function drawProps() {
  for (const s of L.springs) if (onScreen(s)) {
    if (s.shroom) drawSpr(ESPR.shroom[0], { x: s.x, y: s.y + (s.t > 0 ? 2 : 0), w: s.w, h: s.h }, false, false);
    else drawSpr(ESPR.spring[0], { x: s.x, y: s.y - (s.t > 0 ? 3 : 0), w: s.w, h: s.h + (s.t > 0 ? 3 : 0) }, false, false);
  }
  for (const lv of L.levers) if (onScreen(lv)) drawSpr(ESPR.lever[lv.on ? 1 : 0], lv, false, false);
  for (const f of L.flags) if (onScreen(f)) drawSpr(ESPR.flag[f.on ? 1 : 0], f, false, false);
  for (const tc of L.torches) if (onScreen(tc)) { drawSpr(ESPR.torch[0], tc, false, false); if (frame % 6 === 0) L.particles.push({ x: tc.x + 3 + rnd(-1, 1), y: tc.y, vx: 0, vy: -0.6, life: 14, max: 14, col: '#ffcc33', s: 1 }); }
  for (const s of L.switches) if (onScreen(s)) drawSpr(ESPR.switch[L.toggle ? 1 : 0], s, false, s.cd > 14, 0, Math.sin(frame * 0.08) * 1);
  for (const c of L.chests) if (onScreen(c)) { const sh = !c.open && !c.old && frame % 90 < 6 ? ((frame >> 1) % 2 ? 1 : -1) : 0; drawSpr(ESPR.chest[c.open ? 1 : 0], c, false, false, sh); if (!c.open && !c.old && frame % 20 === 0) L.particles.push({ x: c.x + rnd(0, 14), y: c.y + rnd(0, 6), vx: 0, vy: -0.4, life: 20, max: 20, col: '#fff2a0', s: 1 }); }
  for (const c of L.cannons) if (onScreen(c)) {
    if (c.dead) { drawRectW(c.x + 2, c.y - 2, 12, 3, '#2a2a30'); continue; }
    const cx = Math.round(c.x + 8 - cam.x), cy = Math.round(c.y + 4 - cam.y);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(c.ang);
    ctx.fillStyle = OUTLINE; ctx.fillRect(-1, -4, 15, 8); ctx.fillStyle = '#2a2a34'; ctx.fillRect(0, -3, 13, 6); ctx.fillStyle = '#5a5a6a'; ctx.fillRect(0, -3, 13, 2); ctx.fillStyle = c.t < 20 && frame % 4 < 2 ? '#ff5a3a' : '#1a1a20'; ctx.fillRect(11, -2, 2, 4);
    ctx.restore();
  }
  for (const s of L.stalacs) if (s.state !== 'gone' && onScreen(s)) drawSpr(ESPR.stalac[0], s, false, false, s.state === 'shake' ? ((frame >> 1) % 2 ? 1 : -1) : 0, 0);
  for (const g of L.geysers) if (onScreen({ x: g.x - 8, y: g.y - 60, w: 16, h: 60 })) {
    drawRectW(g.x - 6, g.y - 3, 12, 3, '#2a2a2a'); drawRectW(g.x - 4, g.y - 4, 8, 1, '#4a4a4a');
    if (g.t >= 180) { const hgt = 56 * Math.min(1, (g.t - 180) / 6); ctx.globalAlpha = 0.85; drawRectW(g.x - 5, g.y - hgt, 10, hgt, L.th.haz); ctx.globalAlpha = 1; drawRectW(g.x - 2, g.y - hgt, 4, hgt, '#fff'); }
  }
  for (const f of L.fires) { const h = 4 + Math.sin(frame * 0.4 + f.x) * 2; ctx.globalAlpha = Math.min(1, f.life / 30); drawRectW(f.x, f.y + 8 - h, 8, h, '#ff6a1a'); drawRectW(f.x + 2, f.y + 8 - h * 0.6, 4, h * 0.6, '#ffd040'); ctx.globalAlpha = 1; }
  for (const p of L.platforms) if (onScreen(p)) for (let i = 0; i < 3; i++) ctx.drawImage(TEX.plat, Math.round(p.x - cam.x) + i * T, Math.round(p.y - cam.y));
}
function drawPickups() {
  for (const k of L.pickups) if (onScreen(k)) {
    const bob = k.phys ? 0 : Math.sin(k.t * 0.08) * 1.5;
    if (k.phys && k.life > 0 && k.life < 120 && (frame >> 2) % 2) continue;
    if (k.type === 'coin') drawSpr(ESPR.coin[[0, 1, 2, 1][((k.t / 8) | 0) % 4]], k, false, false, 0, bob);
    else drawSpr(ESPR[k.type][0], k, false, false, 0, bob);
  }
}
function drawPlayer() {
  if (P.dead || (P.inv > 0 && P.inv < 60 && (frame >> 2) % 2)) return;
  let legs = 'idle';
  if (!P.onGround) legs = 'jump'; else if (Math.abs(P.vx) > 0.3) legs = ((P.anim | 0) % 2) ? 'run1' : 'run2';
  const W = curWeapon();
  const body = P.atkT > 4 && !P.atkDown && W.kind !== 'bow' ? 'atk' : 'idle';
  const set = danSet(save.armor);
  if (P.gflip > 0) {
    ctx.save(); ctx.translate(0, Math.round((P.y - cam.y) * 2 + P.h)); ctx.scale(1, -1);
    drawSpr(set[body + '_' + legs], P, P.face < 0, false); ctx.restore();
  } else drawSpr(set[body + '_' + legs], P, P.face < 0, false);
  const hx = Math.round(P.x - cam.x) + (P.face > 0 ? 8 : 1), hy = Math.round(P.y - cam.y) + 7;
  if (P.gflip > 0) { /* weapon hidden while upside down */ }
  else if (W.kind === 'bow') drawBow(ctx, hx, hy, P.face, save.bowLv, P.atkT > 0);
  else if (P.atkT > 3) drawSlash(W);
  else if (W.kind === 'hammer') drawHammer(ctx, hx, hy, P.face, save.hammerLv);
  else drawHeld(ctx, hx, hy, P.face, save.weapon);
  if (P.shieldT > 0) { const r = 13 + Math.sin(frame * 0.2); ctx.globalAlpha = P.shieldT < 40 && frame % 6 < 3 ? 0.15 : 0.35; ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.round(P.x + P.w / 2 - cam.x), Math.round(P.y + P.h / 2 - cam.y), r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  if (P.slowT > 0 && frame % 8 === 0) L.particles.push({ x: P.x + rnd(0, P.w), y: P.y + rnd(0, P.h), vx: 0, vy: -0.3, life: 20, max: 20, col: '#bfe8ff', s: 1 });
  if (P.poisonT > 0 && frame % 8 === 0) L.particles.push({ x: P.x + rnd(0, P.w), y: P.y, vx: 0, vy: -0.5, life: 20, max: 20, col: '#90ff40', s: 1 });
}
function drawProjectiles() {
  for (const p of L.projectiles) if (onScreen(p)) {
    const x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y);
    switch (p.kind) {
      case 'sting': ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, p.w + 2, p.h + 2); ctx.fillStyle = '#ffcc33'; ctx.fillRect(x, y, p.w, 3); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x + 1, y + 3, 2, 4); break;
      case 'bone': ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, p.w + 2, p.h + 2); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x, y + 1, p.w, 2); ctx.fillRect(x, y, 2, 4); ctx.fillRect(x + p.w - 2, y, 2, 4); break;
      case 'wave': ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y + 3, p.w + 2, p.h - 2); ctx.fillStyle = p.col; for (let i = 0; i < p.w; i++) { const h = p.h - 2 - Math.abs(i - p.w / 2) * 1.2 + Math.sin(frame * 0.5 + i) * 1.5; ctx.fillRect(x + i, y + p.h - h, 1, h); } break;
      case 'arrow': { const d = sign(p.vx) || 1; ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, p.w + 2, p.h + 2); ctx.fillStyle = '#c08a4a'; ctx.fillRect(x, y + 1, p.w, 1); ctx.fillStyle = '#dfe8f2'; ctx.fillRect(d > 0 ? x + p.w - 3 : x, y, 3, 3); ctx.fillStyle = '#fff'; ctx.fillRect(d > 0 ? x : x + p.w - 2, y, 2, 3); break; }
      case 'spear': { const d = sign(p.vx) || 1; ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, p.w + 2, p.h + 2); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x, y + 1, p.w, 1); ctx.fillStyle = '#dfe8f2'; ctx.fillRect(d > 0 ? x + p.w - 4 : x, y, 4, 3); break; }
      case 'bomb': { ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y, p.w + 2, p.h); ctx.fillRect(x, y - 1, p.w, p.h + 2); ctx.fillStyle = p.fuse < 30 && frame % 4 < 2 ? '#ff4a3a' : '#2a2a34'; ctx.fillRect(x, y, p.w, p.h); ctx.fillStyle = '#ffcc33'; ctx.fillRect(x + p.w - 2, y - 2, 2, 2); break; }
      case 'cball': ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y, p.w + 2, p.h); ctx.fillRect(x, y - 1, p.w, p.h + 2); ctx.fillStyle = p.mine ? '#ffcc33' : '#2a2a34'; ctx.fillRect(x, y, p.w, p.h); ctx.fillStyle = '#7a7a8a'; ctx.fillRect(x + 2, y + 2, 2, 2); break;
      case 'fireball': { ctx.fillStyle = '#ff6a1a'; ctx.fillRect(x, y + 2, p.w, p.h - 4); ctx.fillRect(x + 2, y, p.w - 4, p.h); ctx.fillStyle = '#ffd040'; ctx.fillRect(x + 4, y + 3, p.w - 8, p.h - 6); ctx.fillStyle = '#fff'; ctx.fillRect(x + (p.vx > 0 ? p.w - 6 : 3), y + 5, 3, 2); break; }
      case 'rocket': { ctx.save(); ctx.translate(x + 5, y + 3); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillStyle = OUTLINE; ctx.fillRect(-6, -3, 13, 6); ctx.fillStyle = '#c0c0c8'; ctx.fillRect(-5, -2, 10, 4); ctx.fillStyle = '#ff3a2a'; ctx.fillRect(3, -2, 3, 4); ctx.restore(); if (frame % 2 === 0) L.particles.push({ x: p.x + 5 - p.vx * 2, y: p.y + 3 - p.vy * 2, vx: 0, vy: 0, life: 12, max: 12, col: '#ffcc33', s: 2 }); break; }
      case 'bubble': ctx.strokeStyle = p.col || '#b0ff60'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + p.w / 2, y + p.h / 2, p.w / 2, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(180,255,120,0.25)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x + 3, y + 3, 2, 2); break;
      case 'blade': { ctx.save(); ctx.translate(x + p.w / 2, y + p.h / 2); ctx.rotate(frame * 0.5); ctx.fillStyle = OUTLINE; ctx.fillRect(-8, -2, 16, 4); ctx.fillRect(-2, -8, 4, 16); ctx.fillStyle = '#dfe8f2'; ctx.fillRect(-7, -1, 14, 2); ctx.fillRect(-1, -7, 2, 14); ctx.restore(); break; }
      default: ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y, p.w + 2, p.h); ctx.fillRect(x, y - 1, p.w, p.h + 2); ctx.fillStyle = p.col || '#ff5050'; ctx.fillRect(x, y, p.w, p.h); ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y + 2, 2, 2);
    }
  }
}
// a bouncing "HIT ME!" sign over every crystal (drawn above the darkness)
function drawSwitchSigns() {
  for (const s of L.switches) if (onScreen(s)) {
    const bx = Math.round(s.x + s.w / 2 - cam.x), by = Math.round(s.y - 9 - cam.y + Math.sin(frame * 0.15) * 2);
    ctx.font = '6px "Press Start 2P", Rubik, monospace'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
    const label = t('hitMe'), lw = Math.ceil(ctx.measureText(label).width) + 6;
    ctx.fillStyle = OUTLINE; ctx.fillRect(bx - lw / 2 - 1, by - 9, lw + 2, 10);
    ctx.fillStyle = L.toggle ? '#4a7aff' : '#e04a5a'; ctx.fillRect(bx - lw / 2, by - 8, lw, 8);
    ctx.fillStyle = '#fff'; ctx.fillText(label, bx, by - 1);
    ctx.fillStyle = OUTLINE; ctx.fillRect(bx - 3, by + 1, 7, 1); ctx.fillRect(bx - 2, by + 2, 5, 1); ctx.fillRect(bx - 1, by + 3, 3, 1);
  }
}
function drawDarkness(radius) {
  if (!drawDarkness.c) drawDarkness.c = document.createElement('canvas');
  const c = drawDarkness.c; if (c.width !== VW || c.height !== VH) { c.width = VW; c.height = VH; }
  const x = c.getContext('2d');
  x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, VW, VH);
  x.fillStyle = 'rgba(4,2,10,0.93)'; x.fillRect(0, 0, VW, VH);
  x.globalCompositeOperation = 'destination-out';
  const light = (wx, wy, r) => { const sx = wx - cam.x, sy = wy - cam.y; if (sx < -r || sx > VW + r || sy < -r || sy > VH + r) return; const g = x.createRadialGradient(sx, sy, r * 0.25, sx, sy, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(sx - r, sy - r, r * 2, r * 2); };
  light(P.x + P.w / 2, P.y + P.h / 2, radius + Math.sin(frame * 0.1) * 2);
  for (const f of L.flags) light(f.x + 5, f.y, 46);
  for (const tc of L.torches) light(tc.x + 3, tc.y, 64 + Math.sin(frame * 0.2 + tc.x) * 3);
  for (const ch of L.chests) if (!ch.open) light(ch.x + 7, ch.y + 4, 26);
  for (const p of L.projectiles) if (p.kind === 'fireball' || p.mine) light(p.x, p.y, 40);
  for (const b of L.bosses) light(b.x + b.w / 2, b.y + b.h / 2, 60);
  for (const g of L.geysers) if (g.t >= 140) light(g.x, g.y - 20, 40);
  for (const s of L.switches) light(s.x + 5, s.y + 6, 26);
  ctx.drawImage(c, 0, 0);
}
function render() {
  const sx = cam.shake ? (Math.random() - 0.5) * cam.shake : 0, sy = cam.shake ? (Math.random() - 0.5) * cam.shake : 0;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
  drawBackground();
  drawBossBack();
  drawTiles();
  for (const w of L.warnings) { const a = (frame >> 2) % 2; drawRectW(w.x, L.arena.top - 8, 10, 4, a ? '#ff3030' : '#ffd54a'); ctx.globalAlpha = 0.25; drawRectW(w.x + 3, L.arena.top, 4, L.arena.floor - L.arena.top, '#ff3030'); ctx.globalAlpha = 1; }
  drawProps();
  drawPickups();
  drawEnemies();
  drawBosses();
  drawPlayer();
  drawProjectiles();
  for (const p of L.particles) {
    if (p.ghost) { ctx.globalAlpha = p.life / p.max * 0.5; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - cam.x - 5), Math.round(p.y - cam.y - 7), 10, 14); ctx.globalAlpha = 1; continue; }
    ctx.globalAlpha = Math.min(1, p.life / 15); ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.s, p.s);
  }
  ctx.globalAlpha = 1;
  for (const b of L.bolts) { // lightning bolts
    ctx.fillStyle = b.life % 4 < 2 ? '#ffffff' : '#ffff80';
    let bx = b.x;
    for (let y = b.y0; y < b.y1; y += 6) { const nx = bx + rnd(-4, 4); ctx.fillRect(Math.round(Math.min(bx, nx) - cam.x), Math.round(y - cam.y), Math.abs(nx - bx) + 2, 7); bx = nx; }
  }
  drawBossFx();
  const c = L.chase;
  if (c && c.active) {
    const col = { lava: '#ff5a1a', sand: '#d8a050', water: '#2a90d0', toxic: '#80e020', void: '#7a20d0' }[c.kind] || '#ff5a1a';
    const ex = c.x - cam.x;
    if (ex > -20) {
      ctx.fillStyle = shade(col, -60); ctx.fillRect(0, 0, ex - 8, VH);
      ctx.fillStyle = col; for (let y = 0; y < VH; y += 4) { const w = 10 + Math.sin(y * 0.15 + frame * 0.2) * 6; ctx.fillRect(ex - 14, y, w, 4); }
      if (frame % 2 === 0) L.particles.push({ x: c.x + rnd(-6, 4), y: cam.y + rnd(0, VH), vx: rnd(0.5, 2), vy: rnd(-1, 1), life: 20, max: 20, col: Math.random() < 0.5 ? col : '#fff', s: 2 });
    }
  }
  if (L.wind && L.wind.state !== 'calm' && !L.arena.active) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; const n = L.wind.state === 'gust' ? 40 : 12; for (let i = 0; i < n; i++) { const x = ((i * 53 + frame * 9 * L.wind.dir) % VW + VW) % VW, y = (i * 41) % VH; ctx.fillRect(x | 0, y, 14, 1); } }
  ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
  for (const tx of L.texts) { const x = Math.round(tx.x - cam.x), y = Math.round(tx.y - cam.y); ctx.fillStyle = OUTLINE; ctx.fillText(tx.s, x + 1, y + 1); ctx.fillStyle = tx.col; ctx.fillText(tx.s, x, y); }
  const th = L.th;
  if (th.deco === 'snow' || th.deco === 'embers') { ctx.fillStyle = th.deco === 'snow' ? '#fff' : '#ff9a3a'; for (let i = 0; i < 50; i++) { const sp = th.deco === 'snow' ? 1 : -0.6; const x = ((i * 89 + Math.sin(frame * 0.02 + i) * 20 - cam.x * 0.8) % VW + VW) % VW; const y = ((i * 61 + frame * sp * (0.5 + (i % 3) * 0.3)) % VH + VH) % VH; ctx.fillRect(x | 0, y | 0, i % 3 ? 1 : 2, i % 3 ? 1 : 2); } }
  const darkR = L.ink > 0 ? 60 : (L.dark || (L.arena.active && L.arena.dark)) ? 88 : 0;
  if (darkR) drawDarkness(darkR);
  drawSwitchSigns();
  if (L.slowT > 0) { ctx.fillStyle = 'rgba(120,80,255,0.12)'; ctx.fillRect(0, 0, VW, VH); }
  ctx.restore();
}
function drawSlash(W) {
  const S = SWORDS[save.weapon];
  const col = W.kind === 'hammer' ? '#c8c8d0' : S.col;
  const prog = 1 - (P.atkT - 3) / 11;
  ctx.fillStyle = col;
  const cx = P.x + P.w / 2 - cam.x, cy = P.y + P.h / 2 - cam.y;
  if (P.atkDown) {
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); const r = 12 + save.weapon; ctx.fillRect(Math.round(cx + Math.cos(a) * r * (i % 2 ? 1 : 0.85)), Math.round(cy + 4 + Math.sin(a) * r), 2, 2); }
    if (W.kind === 'hammer') drawHammer(ctx, Math.round(cx) - 1, Math.round(cy) + 12, P.face, save.hammerLv, true);
    return;
  }
  const r = W.range - 2, start = -1.2, end = 1.2, cur = start + (end - start) * prog;
  for (let a = start; a <= cur; a += 0.12) {
    ctx.globalAlpha = 0.4 + 0.6 * ((a - start) / (cur - start + 0.01));
    ctx.fillRect(Math.round(cx + P.face * Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 2, 2);
    if (save.weapon >= 2 || W.kind === 'hammer') ctx.fillRect(Math.round(cx + P.face * Math.cos(a) * (r - 4)), Math.round(cy + Math.sin(a) * (r - 4) * 0.8), 1, 1);
  }
  ctx.globalAlpha = 1;
  const a = cur, len = W.range - 6;
  if (W.kind === 'hammer') {
    for (let i = 3; i < len - 4; i++) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(Math.round(cx + P.face * Math.cos(a) * i), Math.round(cy + Math.sin(a) * i * 0.8), 2, 2); }
    const hx = Math.round(cx + P.face * Math.cos(a) * (len - 2)), hy = Math.round(cy + Math.sin(a) * (len - 2) * 0.8);
    ctx.fillStyle = OUTLINE; ctx.fillRect(hx - 4, hy - 4, 9, 9); ctx.fillStyle = HAMMER_COLS[Math.max(0, save.hammerLv - 1)]; ctx.fillRect(hx - 3, hy - 3, 7, 7);
  } else for (let i = 4; i < len; i++) { ctx.fillStyle = i < 7 ? '#6a4a2a' : i < 8 ? S.guard : S.col; ctx.fillRect(Math.round(cx + P.face * Math.cos(a) * i), Math.round(cy + Math.sin(a) * i * 0.8), 2, 2); }
}
// sword in Dan's hand; (hx, hy) is the hand pixel
function drawHeld(c, hx, hy, face, wi) {
  const W = SWORDS[wi], len = 7 + wi, wide = wi >= 3;
  const pts = []; for (let i = 0; i < len; i++) pts.push([hx + face * Math.floor(i / 3), hy - i]);
  c.fillStyle = OUTLINE;
  for (const [x, y] of pts) c.fillRect(x - 1, y - 1, wide ? 4 : 3, 3);
  c.fillRect(hx - 2, hy - 3, 5, 3);
  pts.forEach(([x, y], i) => { c.fillStyle = i < 2 ? '#5a3a1e' : W.col; c.fillRect(x, y, wide && i >= 2 ? 2 : 1, 1); });
  c.fillStyle = W.guard; c.fillRect(hx - 1, hy - 2, 3, 1);
  if (wi >= 4) { c.fillStyle = '#ffffff'; c.fillRect(pts[len - 2][0], pts[len - 2][1], 1, 1); }
}
const HAMMER_COLS = ['#9aa0b0', '#ffcc33', '#7fe3ff'];
function drawHammer(c, hx, hy, face, lv, down) {
  const col = HAMMER_COLS[Math.max(0, lv - 1)];
  c.fillStyle = OUTLINE;
  if (down) { c.fillRect(hx - 1, hy - 9, 4, 10); c.fillRect(hx - 4, hy, 10, 7); c.fillStyle = '#6a4a2a'; c.fillRect(hx, hy - 8, 2, 8); c.fillStyle = col; c.fillRect(hx - 3, hy + 1, 8, 5); return; }
  c.fillRect(hx - 1, hy - 10, 3, 12); c.fillRect(hx - 4 + (face > 0 ? 0 : -1), hy - 14, 10, 7);
  c.fillStyle = '#6a4a2a'; c.fillRect(hx, hy - 9, 1, 10);
  c.fillStyle = col; c.fillRect(hx - 3 + (face > 0 ? 0 : -1), hy - 13, 8, 5);
  c.fillStyle = '#ffffff'; c.fillRect(hx - 2 + (face > 0 ? 0 : -1), hy - 13, 2, 1);
}
function drawBow(c, hx, hy, face, lv, drawn) {
  const col = ['#c08a4a', '#7a5a9a', '#ffcc33'][Math.max(0, lv - 1)];
  const bx = hx + face * 2;
  c.fillStyle = OUTLINE; c.fillRect(bx - 1, hy - 8, 4, 14);
  c.fillStyle = col; for (let i = -6; i <= 6; i++) c.fillRect(bx + face * Math.round(2 - Math.abs(i) * 0.3), hy - 1 + i, 1, 1);
  c.fillStyle = '#e8e4d8'; c.fillRect(bx - face * (drawn ? 2 : 0), hy - 7, 1, 13);
}

/* ---------------- HUD ---------------- */
const hud = { hp: $('hpfill'), hpt: $('hptext'), mana: $('manafill'), manaBar: $('manabar'), coins: $('coins'), pots: $('pots'), chests: $('chestsHud'), lvl: $('lvlname'), boss: $('bossbar'), bossfill: $('bossfill'), bossname: $('bossname'), weap: $('weapHud'), spec: $('specHud') };
let hudCache = {};
function updateHUD() {
  const mh = maxHP(), hp = Math.max(0, Math.ceil(P.hp));
  const s = hp + '/' + mh;
  if (hudCache.hp !== s) { hud.hp.style.width = clamp(hp / mh * 100, 0, 100) + '%'; hud.hpt.textContent = s; hudCache.hp = s; hud.hp.classList.toggle('low', hp / mh < 0.3); }
  if (hudCache.c !== save.coins) { hud.coins.textContent = save.coins; hudCache.c = save.coins; }
  if (hudCache.p !== save.potions) { hud.pots.textContent = save.potions; hudCache.p = save.potions; }
  const ch = (L.chestsFoundBefore + L.chestsGot) + '/' + L.chestTotal;
  if (hudCache.ch !== ch) { hud.chests.textContent = ch; hudCache.ch = ch; }
  const hasSpec = !!(save.special && save.spec[save.special]);
  const m = hasSpec ? Math.floor(P.mana) : -1;
  if (hudCache.m !== m) {
    hud.manaBar.style.display = hasSpec ? '' : 'none';
    if (hasSpec) { hud.mana.style.width = m + '%'; const ready = P.mana >= SPECIALS[save.special].cost; hud.manaBar.classList.toggle('ready', ready); if (ready && !hudCache.ready) sfx('magic'); hudCache.ready = ready; hud.spec.textContent = SPECIALS[save.special].icon; }
    hudCache.m = m;
  }
  if (hudCache.w !== P.weap) { hud.weap.textContent = { sword: '🗡️', bow: '🏹', hammer: '🔨' }[P.weap]; hud.weap.style.display = ownedWeapons().length > 1 ? '' : 'none'; hudCache.w = P.weap; }
  const alive = L.bosses.filter(b => !b.clone);
  if (alive.length) { const tot = alive.reduce((a, b) => a + Math.max(0, b.hp), 0), max = L.bossMax || alive.reduce((a, b) => a + b.max, 0); const f = (tot / max * 100).toFixed(1); if (hudCache.b !== f) { hud.bossfill.style.width = f + '%'; hudCache.b = f; } }
}
function updateTouchExtras() {
  document.body.classList.toggle('has-swap', ownedWeapons().length > 1);
  document.body.classList.toggle('has-special', !!(save.special && save.spec[save.special]));
  const sb = document.querySelector('.tspec'); if (sb && save.special) sb.textContent = SPECIALS[save.special].icon;
}
function showBossBar(name) { hud.bossname.textContent = name; hud.boss.classList.add('on'); hudCache.b = null; }
function hideBossBar() { hud.boss.classList.remove('on'); }
let toastTimer = 0;
function toast(msg, ms = 2200) { const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), ms); }
function showDeath(on) { $('deathmsg').classList.toggle('on', on); if (on) { $('deathT1').textContent = t('danFell'); $('deathT2').textContent = t('backToCp'); } }

/* ---------------- level flow ---------------- */
let state = 'home';
function startLevel(n) {
  goFullscreen();
  L = buildLevel(n);
  L.chestsFoundBefore = 0;
  for (let i = 0; i < 3; i++) if (save.chests[n] & (1 << i)) L.chestsFoundBefore++;
  L.chestsFoundBefore = Math.min(L.chestsFoundBefore, L.chestTotal);
  buildTiles(L.th, n * 31 + 7);
  makeSlime(L.th.slime);
  P.weap = ownedWeapons().includes(save.equip) ? save.equip : 'sword';
  P.hp = maxHP(); P.mana = 0; P.shieldT = 0; resetPlayer(L.spawn); P.inv = 0; P.face = 1;
  updateCamera(true);
  hideScreen(); hideBossBar(); showDeath(false);
  hud.lvl.textContent = t('levelToast', (n % PER_WORLD) + 1, loc(L.th.name));
  hudCache = {};
  state = 'play'; setGameUI(true); updateTouchExtras();
  toast(t('levelToast', (n % PER_WORLD) + 1, loc(L.th.name)), 2200);
  if (!save.tips.start) { save.tips.start = 1; setTimeout(() => toast(t(IS_TOUCH ? 'tip_startTouch' : 'tip_start'), 5000), 2300); persist(); }
  const firstGim = (L.gim || []).find(g => ['ice', 'bounce', 'cannon', 'conveyor'].includes(g));
  if (firstGim) setTimeout(() => state === 'play' && showTip(firstGim), 2600);
}

/* ---------------- main loop ---------------- */
let frame = 0, acc = 0, lastT = performance.now(), saveTimer = 0;
function tick() {
  if (state !== 'play') return;
  if (tapped('pause')) { pauseScreen(); return; }
  if (hitStop > 0) { hitStop--; return; }
  frame++; L.time++;
  const slowSkip = L.slowT > 0 && frame % 3 !== 0;
  updateWorld();
  updatePlayer();
  updateMechanics();
  if (!slowSkip) { updateEnemies(); updateBosses(); }
  updateProjectiles();
  updatePickups();
  updateParticles();
  updateCamera(false);
  if (++saveTimer > 600) { saveTimer = 0; persist(); }
}
function loop(now) {
  acc += Math.min(100, now - lastT); lastT = now;
  while (acc >= 1000 / 60) { tick(); for (const k in pressedK) delete pressedK[k]; acc -= 1000 / 60; }
  if (state === 'play' || state === 'pause') { render(); updateHUD(); }
  uiFrame(now);
  requestAnimationFrame(loop);
}

/* ---------------- resize ---------------- */
function fit() {
  const wrap = $('wrap');
  const W = innerWidth, H = innerHeight;
  if (IS_TOUCH) {
    // show more of the world instead of black bars on wide phones
    const nh = 216, nv = clamp(Math.round(nh * Math.max(W, H) / Math.min(W, H) / 2) * 2, 384, 560);
    if (nv !== VW || nh !== VH) { VW = nv; VH = nh; cv.width = VW; cv.height = VH; ctx.imageSmoothingEnabled = false; }
  }
  const s = Math.min(W / VW, H / VH);
  const scale = !IS_TOUCH && s >= 2 ? Math.floor(s) : s;
  wrap.style.width = VW * scale + 'px'; wrap.style.height = VH * scale + 'px';
  wrap.style.setProperty('--s', scale);
  if (L && state === 'play') updateCamera(true);
}
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 200));
