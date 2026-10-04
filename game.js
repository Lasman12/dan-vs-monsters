'use strict';
/* =========================================================
   דן נגד המפלצות — Dan vs. The Monsters
   Pixel-art platformer. Canvas 480x270, 16px tiles, 60Hz fixed step.
   ========================================================= */
const T = 16, VW = 480, VH = 270, ROWS = 20, LH = ROWS * T;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const $ = id => document.getElementById(id);

/* ---------------- data ---------------- */
const THEMES = [
  { name: 'היער הירוק',        sky: ['#6cc0ee', '#d4f1ff'], far: '#8cc7a0', near: '#5a9a6a', top: '#5bc23c', topD: '#3d8f2a', fill: '#8a5a34', fillD: '#6b4226', plat: '#a0703c', haz: '#3fa7e0', deco: 'clouds' },
  { name: 'מערות האבן',        sky: ['#15131f', '#2c2a40'], far: '#2a2840', near: '#37334f', top: '#8a8a9c', topD: '#5a5a6c', fill: '#4a4658', fillD: '#38344a', plat: '#6d6478', haz: '#3fc8ff', deco: 'crystals' },
  { name: 'מדבר החול הלוהט',   sky: ['#f39a4b', '#ffe2a8'], far: '#eab06a', near: '#d48c45', top: '#f2d27a', topD: '#d9b45c', fill: '#c98e4a', fillD: '#a87038', plat: '#b5813f', haz: '#d8a040', deco: 'sun' },
  { name: 'ביצת הרעל',         sky: ['#3d4d30', '#7d8f5a'], far: '#4a5c3a', near: '#33422a', top: '#7a9a3a', topD: '#4f6a28', fill: '#4a3b2a', fillD: '#38291c', plat: '#5c4a30', haz: '#9be04a', deco: 'fog' },
  { name: 'ההרים המושלגים',     sky: ['#8fb8e0', '#eef6ff'], far: '#d0deef', near: '#a7bdd6', top: '#ffffff', topD: '#cfe0f0', fill: '#7b8fa8', fillD: '#5d6f88', plat: '#a7c7e7', haz: '#7fd6ff', deco: 'snow' },
  { name: 'המבצר העתיק',       sky: ['#4a5a7c', '#9aa8c4'], far: '#55607c', near: '#3b4560', top: '#a4a4b0', topD: '#74747f', fill: '#6a6a76', fillD: '#50505b', plat: '#8b6f4e', haz: '#4aa0e0', deco: 'towers' },
  { name: 'הר הגעש',           sky: ['#2a0808', '#7a2a10'], far: '#4a1a12', near: '#2a0e0a', top: '#6a4034', topD: '#40261f', fill: '#3a2420', fillD: '#2a1814', plat: '#6a4030', haz: '#ff6a1a', deco: 'embers' },
  { name: 'היער הרדוף',        sky: ['#120a24', '#3a2050'], far: '#2a1840', near: '#1e1030', top: '#6a4a8a', topD: '#40285a', fill: '#2e2238', fillD: '#221a2a', plat: '#4a3460', haz: '#b04aff', deco: 'stars' },
  { name: 'ממלכת השמיים',      sky: ['#8fd0ff', '#fff2dc'], far: '#ffffff', near: '#e4f2ff', top: '#ffffff', topD: '#d8e8f8', fill: '#e8d8b0', fillD: '#c8b890', plat: '#ffe8a0', haz: '#7fb8ff', deco: 'clouds' },
  { name: 'טירת מלך המפלצות', sky: ['#0c0406', '#2e0a16'], far: '#26101a', near: '#170609', top: '#5a2e44', topD: '#341a2a', fill: '#2a1820', fillD: '#1c1016', plat: '#5a2a2a', haz: '#ff3030', deco: 'embers' },
];
const MEDALS = [
  { n: 'מדליית העלה', sym: '#3fae3f' }, { n: 'מדליית הקריסטל', sym: '#3fc8ff' }, { n: 'מדליית העקרב', sym: '#d27a2a' },
  { n: 'מדליית הצפרדע', sym: '#7ac03a' }, { n: 'מדליית פתית השלג', sym: '#bfe8ff' }, { n: 'מדליית המגן', sym: '#8a8aa0' },
  { n: 'מדליית הלהבה', sym: '#ff5a1a' }, { n: 'מדליית הירח', sym: '#b07aff' }, { n: 'מדליית הענן', sym: '#ffffff' },
  { n: 'מדליית הכתר', sym: '#ff3050' },
];
const BOSSES = [
  { name: 'מלך הרפשים',      tpl: 'blob',  c1: '#5ccf4a', c2: '#2e8a2a', eye: '#fff', moves: ['hop', 'summon', 'hop'], crown: true },
  { name: 'עכביש המערות',     tpl: 'beast', c1: '#6a5a8a', c2: '#3a2e52', eye: '#ff3a3a', moves: ['charge', 'shoot'] },
  { name: 'מלך העקרבים',      tpl: 'beast', c1: '#d27a2a', c2: '#8a4a14', eye: '#ffef5a', moves: ['charge', 'rain', 'shoot'] },
  { name: 'מכשפת הביצה',      tpl: 'skull', c1: '#6a8a3a', c2: '#3a4a1e', eye: '#d0ff5a', moves: ['teleport', 'shoot', 'summon'] },
  { name: 'גולם הקרח',        tpl: 'golem', c1: '#9ad8f0', c2: '#4a7ea0', eye: '#ffffff', moves: ['slam', 'rain', 'charge'] },
  { name: 'אביר האבדון',      tpl: 'ogre',  c1: '#7a7a90', c2: '#3a3a4a', eye: '#ff3a3a', moves: ['charge', 'slam', 'shoot'], horns: true },
  { name: 'דרקון הלבה',       tpl: 'beast', c1: '#e04a1a', c2: '#7a1a0a', eye: '#ffe05a', moves: ['shoot', 'charge', 'rain', 'slam'] },
  { name: 'מלכת העטלפים',     tpl: 'bat',   c1: '#7a4aa0', c2: '#3a1e5a', eye: '#ff5a5a', moves: ['swoop', 'shoot', 'summon', 'rain'], fly: true },
  { name: 'טיטאן הסערה',      tpl: 'golem', c1: '#f0f0ff', c2: '#7a8ab0', eye: '#5ad0ff', moves: ['slam', 'shoot', 'rain', 'charge'] },
  { name: 'מלך המפלצות',      tpl: 'ogre',  c1: '#a02a3a', c2: '#4a0a14', eye: '#ffef5a', moves: ['charge', 'slam', 'shoot', 'rain', 'summon', 'teleport'], horns: true, crown: true },
];
const ARMORS = [
  { n: 'חולצה רגילה',     red: 0,    p: 0,    body: '#e04848', bodyD: '#a83030', helm: null },
  { n: 'שריון עור',       red: 0.15, p: 80,   body: '#a0683a', bodyD: '#704622', helm: null },
  { n: 'שריון שרשראות',   red: 0.28, p: 220,  body: '#a4aebb', bodyD: '#6e7682', helm: '#8a929c' },
  { n: 'שריון ברזל',      red: 0.40, p: 450,  body: '#d4dce6', bodyD: '#8a96a6', helm: '#c0c8d4' },
  { n: 'שריון זהב',       red: 0.50, p: 800,  body: '#ffcc33', bodyD: '#c08a10', helm: '#ffd84a' },
  { n: 'שריון יהלום',     red: 0.62, p: 1300, body: '#6ff0ff', bodyD: '#2aa8c8', helm: '#8ff6ff' },
];
const WEAPONS = [
  { n: 'אגרופים',    dmg: 10, p: 0,   range: 16, col: '#ffffff' },
  { n: 'אלת עץ',     dmg: 16, p: 100, range: 19, col: '#c08a4a' },
  { n: 'חרב ברזל',    dmg: 24, p: 260, range: 22, col: '#dfe8f2' },
  { n: 'חרב ענק',     dmg: 34, p: 520, range: 26, col: '#7fe3ff' },
  { n: 'חרב אגדית',   dmg: 48, p: 950, range: 30, col: '#ffd54a' },
];
const HP_PRICES = [60, 120, 200, 300, 420];
const DBL_PRICE = 150, DASH_PRICE = 220, POTION_PRICE = 30, MAX_POTIONS = 5;
const TIPS = {
  start: 'חצים / WASD לזוז · רווח לקפוץ · J להרביץ · Q לשתות שיקוי',
  lever: 'טיפ: הרבץ לידית כדי לפתוח את הדלת!',
  spring: 'טיפ: קפוץ על הקפיץ כדי לעוף גבוה!',
  crumble: 'טיפ: הבלוקים האלה מתפוררים – תמשיך לזוז!',
  wall: 'טיפ: קפוץ כשאתה צמוד לקיר כדי לטפס עליו!',
  knight: 'טיפ: לאביר יש מגן מקדימה – תקוף אותו מאחור או מלמעלה (למטה+J באוויר)!',
};

/* ---------------- accounts & save ---------------- */
const ACC_KEY = 'dvm_accounts_v1', CUR_KEY = 'dvm_current_v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
};
function newSave() {
  return { coins: 0, unlocked: 1, medals: Array(10).fill(0), best: Array(10).fill(0), armor: 0, weapon: 0, hpLv: 0, dbl: false, dash: false, potions: 1, tips: {}, kills: 0, bosses: 0 };
}
let account = null;   // username
let save = newSave();
function accounts() { return store.get(ACC_KEY) || {}; }
function persist() {
  if (!account) return;
  const a = accounts();
  if (a[account]) { a[account].save = save; store.set(ACC_KEY, a); }
}
async function hashPass(user, pass) {
  const text = 'dvm::' + user.toLowerCase() + '::' + pass;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x811c9dc5, h2 = 0x1234567;
  for (let r = 0; r < 2000; r++) for (let i = 0; i < text.length; i++) { h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619); h2 = Math.imul(h2 + h1, 2246822507); }
  return 'f' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
}

/* ---------------- sound ---------------- */
let AC = null, muted = false;
function initAudio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); }
const SFX = {
  jump: [['square', 300, 600, 0.08, 0.08]],
  djump: [['square', 400, 800, 0.08, 0.08]],
  swing: [['noise', 0, 0, 0.06, 0.06]],
  hit: [['square', 220, 80, 0.08, 0.12]],
  kill: [['square', 400, 60, 0.18, 0.12], ['noise', 0, 0, 0.12, 0.08]],
  hurt: [['sawtooth', 200, 60, 0.2, 0.12]],
  coin: [['square', 900, 1400, 0.07, 0.06]],
  gem: [['square', 700, 1800, 0.15, 0.07]],
  clang: [['square', 1200, 900, 0.06, 0.08], ['triangle', 600, 600, 0.1, 0.08]],
  spring: [['triangle', 200, 900, 0.18, 0.12]],
  check: [['square', 523, 523, 0.08, 0.07], ['square', 659, 659, 0.08, 0.07, 0.08], ['square', 784, 784, 0.15, 0.07, 0.16]],
  lever: [['square', 300, 300, 0.05, 0.08], ['square', 500, 500, 0.08, 0.08, 0.06]],
  door: [['noise', 0, 0, 0.4, 0.1]],
  dash: [['noise', 0, 0, 0.12, 0.07], ['sawtooth', 600, 200, 0.1, 0.05]],
  potion: [['sine', 400, 900, 0.3, 0.12]],
  buy: [['square', 660, 660, 0.06, 0.07], ['square', 990, 990, 0.12, 0.07, 0.06]],
  boss: [['sawtooth', 110, 55, 0.6, 0.12]],
  slam: [['noise', 0, 0, 0.3, 0.15], ['sine', 120, 40, 0.3, 0.2]],
  shoot: [['square', 700, 300, 0.08, 0.05]],
  medal: [['square', 523, 523, 0.1, 0.07], ['square', 659, 659, 0.1, 0.07, 0.1], ['square', 784, 784, 0.1, 0.07, 0.2], ['square', 1046, 1046, 0.35, 0.08, 0.3]],
  crumble: [['noise', 0, 0, 0.15, 0.05]],
  die: [['sawtooth', 400, 50, 0.7, 0.12]],
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
  const wh = document.createElement('canvas'); wh.width = w; wh.height = h;
  const wx = wh.getContext('2d'); wx.drawImage(o, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#fff'; wx.fillRect(0, 0, w, h);
  const flip = src => { const f = document.createElement('canvas'); f.width = w; f.height = h; const fx = f.getContext('2d'); fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(src, 0, 0); return f; };
  return { n: o, f: flip(o), wn: wh, wf: flip(wh), w, h };
}
function sprite(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
  const x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const col = pal[rows[j][i]]; if (col) { x.fillStyle = col; x.fillRect(i + 1, j + 1, 1, 1); } }
  return finishSprite(c);
}
function drawSpr(s, ent, flip, white, ox = 0, oy = 0) {
  if (!s) return;
  const img = white ? (flip ? s.wf : s.wn) : (flip ? s.f : s.n);
  const dx = Math.round(ent.x + ent.w / 2 - s.w / 2 - cam.x + ox);
  const dy = Math.round(ent.y + ent.h - s.h + 1 - cam.y + oy);
  ctx.drawImage(img, dx, dy);
}

const DAN_TOP = [
  '....hhhh....',
  '...hhhhhh...',
  '..hhhhhhhh..',
  '..hhssssss..',
  '..hsssssEs..',
  '...sssssss..',
  '....ssss....',
];
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
let danSpr = {};
function buildDan() {
  const a = ARMORS[save.armor];
  const pal = { h: a.helm || '#5a3a1e', s: '#f2c49a', E: '#1a1020', b: a.body, B: a.bodyD, l: '#3a4a8a', k: '#4a2e1a' };
  danSpr = {};
  for (const legs of ['idle', 'run1', 'run2', 'jump']) for (const body of ['idle', 'atk'])
    danSpr[body + '_' + legs] = sprite([...DAN_TOP, ...DAN_BODY[body], ...DAN_LEGS[legs]], pal);
}

const ESPR = {};
function buildEnemySprites() {
  ESPR.slime = [
    sprite(['....gggg....', '..gggggggg..', '.gggggggggg.', '.ggWKggWKgg.', 'gggggggggggg', 'gGgggggggggg', 'gggggggggGgg', '.gggggggggg.'], { g: '#5ccf4a', G: '#8ef07a', W: '#fff', K: '#1a1020' }),
    sprite(['............', '....gggg....', '.gggggggggg.', 'gggWKggWKggg', 'gggggggggggg', 'gGgggggggggg', 'gggggggggGgg', 'gggggggggggg'], { g: '#5ccf4a', G: '#8ef07a', W: '#fff', K: '#1a1020' }),
  ];
  const batPal = { p: '#5a3a7a', P: '#3a2052', R: '#ff4040' };
  ESPR.bat = [
    sprite(['P............P', 'PP..........PP', 'PPP..pppp..PPP', '.PPPpRppRpPPP.', '..PPpppppPPP..', '....pppppp....', '.....p..p.....'], batPal),
    sprite(['..............', '..............', '.....pppp.....', '..PPpRppRpPP..', '.PPPpppppPPPP.', 'PPP..pppp..PPP', 'P....p..p....P'], batPal),
  ];
  const gob = { g: '#6ab04a', R: '#ff3030', w: '#fff', b: '#8a5a2a', K: '#1a1020' };
  ESPR.goblin = [
    sprite(['...gggg...', '..gggggg..', 'gggRggRggg', '.gggggggg.', '..gwgwgg..', '...gggg...', '..bbbbbb..', '.gbbbbbbg.', '.g.bbbb.g.', '...bbbb...', '...g..g...', '..gg..gg..'], gob),
    sprite(['...gggg...', '..gggggg..', 'gggRggRggg', '.gggggggg.', '..gwgwgg..', '...gggg...', '..bbbbbb..', '.gbbbbbbg.', '.g.bbbb.g.', '...bbbb...', '..g....g..', '.gg....gg.'], gob),
  ];
  const sk = { w: '#e8e4d8', K: '#1a1020', b: '#8a6a3a' };
  ESPR.skel = [
    sprite(['...wwww...', '..wwwwww..', '..wKwwKw..', '..wwwwww..', '...wKKw...', '....ww....', '..wwwwww..', '.w.wwww.wb', '.w.w..w.wb', '...wwww..b', '....ww....', '...w..w...', '...w..w...', '...w..w...', '..ww..ww..'], sk),
  ];
  const kn = { m: '#5a5a6a', a: '#9aa0b0', K: '#1a1020', S: '#c03030', Y: '#ffd54a' };
  ESPR.knight = [
    sprite(['...mmmmm....', '..mmmmmmm...', '..mKKKKmm...', '..mmmmmmm...', '...mmmmm....', '..aaaaaa.SS.', '.aaaaaaaaSYS', '.aaaaaaaaSYS', '.a.aaaaa.SYS', '...aaaaa.SSS', '...aaaaa.SS.', '...aa.aa....', '...aa.aa....', '...aa.aa....', '..mmm.mmm...'], kn),
  ];
  // pickups / props
  ESPR.coin = [
    sprite(['.yyy.', 'yYyyy', 'yYyyy', 'yYyyy', '.yyy.'], { y: '#ffcc33', Y: '#fff2a0' }),
    sprite(['.yy.', 'yYyy', 'yYyy', 'yYyy', '.yy.'], { y: '#ffcc33', Y: '#fff2a0' }),
    sprite(['.y.', 'yYy', 'yYy', 'yYy', '.y.'], { y: '#ffcc33', Y: '#fff2a0' }),
  ];
  ESPR.gem = [sprite(['..ccc..', '.cCccc.', 'cCcccccc'.slice(0, 7), '.ccccc.', '..ccc..', '...c...'], { c: '#ff4a8a', C: '#ffc0d8' })];
  ESPR.potion = [sprite(['..ww..', '..kk..', '.rrrr.', 'rRrrrr', 'rRrrrr', '.rrrr.'], { w: '#e8e4d8', k: '#8a5a2a', r: '#e03050', R: '#ff9aaa' })];
  ESPR.lever = [
    sprite(['......hh', '.....hh.', '....hh..', '...hh...', '..gggg..', '.gggggg.'], { h: '#c08a4a', g: '#6a6a7a' }),
    sprite(['hh......', '.hh.....', '..hh....', '...hh...', '..gggg..', '.gggggg.'], { h: '#5ccf4a', g: '#6a6a7a' }),
  ];
  ESPR.spring = [sprite(['rrrrrrrrrrrr', '.s.s.s.s.s..', '..s.s.s.s.s.', '.s.s.s.s.s..', 'gggggggggggg'], { r: '#e04848', s: '#c8c8d0', g: '#6a6a7a' })];
  ESPR.flag = [
    sprite(['p.......', 'prr.....', 'prrrr...', 'prrrrrr.', 'prrrr...', 'prr.....', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'gggg....'], { p: '#d8d8e0', r: '#888899', g: '#6a6a7a' }),
    sprite(['p.......', 'prr.....', 'prrrr...', 'prrrrrr.', 'prrrr...', 'prr.....', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'p.......', 'gggg....'], { p: '#d8d8e0', r: '#3fd04a', g: '#6a6a7a' }),
  ];
}

/* procedural boss sprites */
function makeBossSprite(def) {
  const W = 44, H = 44;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const px = (i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
  const rect = (i, j, w, h, col) => { x.fillStyle = col; x.fillRect(i, j, w, h); };
  const ell = (cx, cy, rx, ry, col) => { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1) px(cx + i, cy + j, col); };
  const { c1, c2, eye } = def;
  const light = shade(c1, 40);
  switch (def.tpl) {
    case 'blob':
      ell(22, 28, 19, 14, c2); ell(22, 27, 18, 13, c1); ell(15, 22, 5, 3, light);
      rect(13, 24, 6, 6, '#fff'); rect(26, 24, 6, 6, '#fff'); rect(16, 26, 3, 4, '#1a1020'); rect(29, 26, 3, 4, '#1a1020');
      rect(17, 34, 11, 2, '#1a1020'); rect(18, 34, 2, 2, '#fff'); rect(25, 34, 2, 2, '#fff');
      break;
    case 'ogre':
      rect(12, 22, 20, 14, c1); rect(12, 32, 20, 4, c2);            // body
      ell(22, 14, 8, 8, c1); rect(17, 12, 3, 3, eye); rect(25, 12, 3, 3, eye);
      rect(18, 18, 9, 2, '#1a1020'); px(19, 18, '#fff'); px(25, 18, '#fff');
      rect(6, 22, 6, 12, c1); rect(32, 22, 6, 12, c1); rect(5, 32, 8, 5, c2); rect(31, 32, 8, 5, c2); // arms + fists
      rect(14, 36, 6, 7, c2); rect(24, 36, 6, 7, c2);                 // legs
      rect(14, 24, 16, 3, light);
      break;
    case 'beast':
      ell(20, 28, 15, 9, c1); ell(20, 31, 14, 5, c2);                  // body
      ell(33, 20, 8, 7, c1); rect(34, 17, 3, 3, eye); rect(38, 24, 5, 2, '#fff');
      for (let i = 0; i < 6; i++) rect(8 + i * 4, 17 - (i % 2), 2, 4, c2);  // spikes
      rect(9, 35, 4, 8, c2); rect(17, 35, 4, 8, c2); rect(25, 35, 4, 8, c2); rect(31, 35, 4, 8, c2);
      ell(4, 26, 4, 2, c2);
      break;
    case 'skull':
      rect(10, 24, 24, 18, c2); rect(12, 24, 20, 16, c1);             // robe
      ell(22, 15, 10, 10, '#e8e4d8'); rect(15, 12, 5, 5, '#1a1020'); rect(25, 12, 5, 5, '#1a1020');
      px(17, 14, eye); px(18, 14, eye); px(27, 14, eye); px(28, 14, eye);
      rect(18, 20, 9, 4, '#e8e4d8'); for (let i = 0; i < 4; i++) px(19 + i * 2, 21, '#1a1020');
      rect(6, 26, 5, 10, c1); rect(34, 26, 5, 10, c1); ell(37, 23, 3, 3, eye);
      break;
    case 'golem':
      rect(10, 18, 24, 18, c2); rect(11, 18, 22, 16, c1); rect(14, 8, 16, 11, c1); rect(14, 17, 16, 2, c2);
      rect(17, 11, 4, 3, eye); rect(24, 11, 4, 3, eye);
      rect(3, 18, 8, 16, c1); rect(34, 18, 8, 16, c1); rect(3, 30, 8, 6, c2); rect(34, 30, 8, 6, c2);
      rect(12, 36, 8, 7, c2); rect(25, 36, 8, 7, c2);
      rect(13, 22, 4, 2, light); rect(26, 26, 5, 2, light); rect(18, 29, 3, 3, c2);
      break;
    case 'bat':
      ell(22, 22, 9, 10, c1); for (let i = 0; i < 18; i++) { const hgt = 10 - Math.abs(i - 9) * 0.6; rect(1 + i, 16 + (i % 3), 1, hgt | 0, c2); rect(42 - i, 16 + (i % 3), 1, hgt | 0, c2); }
      rect(17, 17, 4, 3, eye); rect(24, 17, 4, 3, eye); rect(19, 25, 7, 2, '#1a1020'); px(20, 27, '#fff'); px(24, 27, '#fff');
      rect(15, 9, 3, 5, c1); rect(27, 9, 3, 5, c1);
      break;
  }
  if (def.horns) { rect(12, 4, 3, 6, '#e8e4d8'); rect(30, 4, 3, 6, '#e8e4d8'); rect(11, 2, 2, 3, '#e8e4d8'); rect(32, 2, 2, 3, '#e8e4d8'); }
  if (def.crown) { const cy = def.tpl === 'blob' ? 10 : 2; rect(15, cy + 3, 15, 4, '#ffcc33'); px(15, cy + 2, '#ffcc33'); px(22, cy + 1, '#ffcc33'); px(22, cy + 2, '#ffcc33'); px(29, cy + 2, '#ffcc33'); px(19, cy + 4, '#ff3050'); px(25, cy + 4, '#3fc8ff'); }
  return finishSprite(c);
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/* tile textures per theme */
let TEX = {};
function buildTiles(th, seed) {
  const r = mulberry(seed);
  const mk = (fn) => { const c = document.createElement('canvas'); c.width = T; c.height = T; fn(c.getContext('2d')); return c; };
  const noise = (x, base, dark, n) => { x.fillStyle = base; x.fillRect(0, 0, T, T); x.fillStyle = dark; for (let i = 0; i < n; i++) x.fillRect((r() * T) | 0, (r() * T) | 0, 2, 1); };
  TEX = {
    fill: [0, 1, 2].map(() => mk(x => { noise(x, th.fill, th.fillD, 10); })),
    top: [0, 1].map(() => mk(x => {
      noise(x, th.fill, th.fillD, 8);
      x.fillStyle = th.top; x.fillRect(0, 0, T, 4);
      x.fillStyle = th.topD; for (let i = 0; i < T; i++) { const d = (r() * 3) | 0; x.fillRect(i, 4, 1, d); }
      x.fillStyle = shade(th.top, 30); x.fillRect(0, 0, T, 1);
    })),
    plat: mk(x => { x.fillStyle = th.plat; x.fillRect(0, 0, T, 6); x.fillStyle = shade(th.plat, -40); x.fillRect(0, 4, T, 2); x.fillRect(7, 0, 1, 6); x.fillStyle = shade(th.plat, 40); x.fillRect(0, 0, T, 1); }),
    spike: mk(x => { x.fillStyle = '#c8c8d4'; for (let k = 0; k < 4; k++) for (let j = 0; j < 7; j++) { const half = (j / 2) | 0; x.fillRect(k * 4 + 2 - half - 0, 9 + j, 1 + half * 2, 1); } x.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) x.fillRect(k * 4 + 2, 9, 1, 2); }),
    crumble: mk(x => { x.fillStyle = shade(th.fill, 25); x.fillRect(0, 0, T, T); x.fillStyle = shade(th.fill, -30); x.fillRect(0, 7, T, 1); x.fillRect(5, 0, 1, 7); x.fillRect(11, 8, 1, 8); x.fillRect(2, 11, 3, 1); x.fillStyle = shade(th.fill, 55); x.fillRect(0, 0, T, 1); }),
    door: mk(x => { x.fillStyle = '#6a4a2a'; x.fillRect(0, 0, T, T); x.fillStyle = '#4a321a'; x.fillRect(5, 0, 1, T); x.fillRect(10, 0, 1, T); x.fillStyle = '#9aa0b0'; x.fillRect(0, 2, T, 2); x.fillRect(0, 12, T, 2); }),
    gate: mk(x => { x.fillStyle = '#3a3a48'; x.fillRect(0, 0, T, T); x.fillStyle = '#7a7a8a'; x.fillRect(2, 0, 2, T); x.fillRect(7, 0, 2, T); x.fillRect(12, 0, 2, T); x.fillRect(0, 6, T, 2); }),
  };
}

/* ---------------- input ---------------- */
const keys = {}, pressedK = {};
const BIND = {
  left: ['ArrowLeft', 'KeyA', 'T_left'], right: ['ArrowRight', 'KeyD', 'T_right'],
  down: ['ArrowDown', 'KeyS', 'T_down'], up: ['ArrowUp'],
  jump: ['Space', 'KeyW', 'ArrowUp', 'KeyZ', 'T_jump'], attack: ['KeyJ', 'KeyX', 'T_attack'],
  dash: ['KeyK', 'ShiftLeft', 'ShiftRight', 'KeyC', 'T_dash'], potion: ['KeyQ', 'T_potion'], pause: ['Escape', 'KeyP', 'T_pause'],
};
const held = a => BIND[a].some(k => keys[k]);
const tapped = a => BIND[a].some(k => pressedK[k]);
function setKey(code, v) { if (v && !keys[code]) pressedK[code] = true; keys[code] = v; }
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT')) return;
  initAudio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyM' && !e.repeat) { muted = !muted; toast(muted ? 'סאונד כבוי' : 'סאונד פועל'); }
  setKey(e.code, true);
});
addEventListener('keyup', e => setKey(e.code, false));
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function setupTouch() {
  const tc = $('touch');
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  tc.classList.add('on');
  tc.querySelectorAll('[data-k]').forEach(b => {
    const k = b.dataset.k;
    const on = e => { e.preventDefault(); initAudio(); setKey(k, true); b.classList.add('down'); };
    const off = e => { e.preventDefault(); setKey(k, false); b.classList.remove('down'); };
    b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off, { passive: false }); b.addEventListener('touchcancel', off, { passive: false });
    b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); b.addEventListener('mouseleave', off);
  });
}

/* ---------------- level building ---------------- */
// tiles: 0 empty, 1 solid, 2 one-way, 3 spike, 4 crumble, 5 hazard, 6 door, 7 gate
const isSolidT = t => t === 1 || t === 4 || t === 6 || t === 7;
let L = null;
const cam = { x: 0, y: 0, shake: 0 };

function enemyPool(n) {
  const p = ['S', 'O'];
  if (n >= 1) p.push('B');
  if (n >= 2) p.push('K');
  if (n >= 4) p.push('N');
  return p;
}
function buildLevel(n) {
  const r = mulberry(9001 + n * 7919);
  const th = THEMES[n];
  const maxD = n === 0 ? 1 : n === 1 ? 2 : 3;
  const pool = CHUNKS.filter(c => c.d <= maxD);
  const count = 10 + n * 2;
  const seq = [START_CHUNK];
  let last = null;
  for (let i = 0; i < count; i++) {
    let total = 0; const w = pool.map(c => { const v = c === last ? 0 : (c.d === maxD ? 1.4 + n * 0.25 : 1); total += v; return v; });
    let pick = r() * total, ch = pool[0];
    for (let k = 0; k < pool.length; k++) { pick -= w[k]; if (pick <= 0) { ch = pool[k]; break; } }
    seq.push(ch); last = ch;
    if (i % 4 === 3 && i < count - 1) seq.push(CHECKPOINT_CHUNK);
  }
  seq.push(CHECKPOINT_CHUNK);
  const ARENA_W = 34;
  const width = seq.reduce((s, c) => s + c.rows[0].length, 0) + ARENA_W;
  const tiles = new Uint8Array(width * ROWS);
  const lv = {
    n, th, w: width, tiles, enemies: [], pickups: [], platforms: [], springs: [], levers: [], doors: {}, flags: [],
    seq: [], crumbles: new Map(), projectiles: [], particles: [], texts: [], warnings: [], tipZones: [],
    boss: null, arena: null, time: 0, deaths: 0, coinsGot: 0, kills: 0, finished: false,
  };
  const set = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < ROWS) tiles[y * width + x] = v; };
  const pool2 = enemyPool(n);
  let col = 0;
  seq.forEach((ch, ci) => {
    const rows = ch.rows, off = ROWS - rows.length;
    let mCount = 0;
    lv.seq.push({ id: ch.id, col });
    if (ch.tag) lv.tipZones.push({ x: col * T, tag: ch.tag });
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const c = rows[j][i], gx = col + i, gy = off + j;
      const px = gx * T, py = gy * T;
      switch (c) {
        case '#': set(gx, gy, 1); break;
        case '-': set(gx, gy, 2); break;
        case '^': set(gx, gy, 3); break;
        case 'X': set(gx, gy, 4); break;
        case '~': set(gx, gy, 5); break;
        case 'D': for (let y = gy; y >= 0; y--) { if (tiles[y * width + gx] === 0 || y === gy) set(gx, y, 6); }
          (lv.doors[ci] = lv.doors[ci] || []).push(gx); break;
        case 'L': lv.levers.push({ x: px + 4, y: py + 10, w: 8, h: 6, group: ci, on: false }); break;
        case 'J': lv.springs.push({ x: px + 1, y: py + 11, w: 14, h: 5, t: 0 }); break;
        case 'M': lv.platforms.push(mkPlatform(px, py, 'x', 5 * T, Math.PI * (mCount++))); break;
        case 'V': lv.platforms.push(mkPlatform(px, py, 'y', 6 * T, r() * Math.PI * 2)); break;
        case 'C': lv.pickups.push(mkPickup('coin', px + 5, py + 5)); break;
        case 'G': lv.pickups.push(mkPickup('gem', px + 4, py + 4)); break;
        case 'P': lv.pickups.push(mkPickup('potion', px + 4, py + 8)); break;
        case 'F': lv.flags.push({ x: px + 2, y: py + 1, w: 10, h: 15, on: false }); break;
        case 'S': case 'O': case 'B': case 'K': case 'N': case 'E': {
          const type = c === 'E' ? pool2[(r() * pool2.length) | 0] : c;
          lv.enemies.push(mkEnemy(type, px, py, n)); break;
        }
      }
    }
    col += rows[0].length;
  });
  // boss arena
  const a0 = col;
  for (let x = 0; x < ARENA_W; x++) { set(a0 + x, ROWS - 1, 1); set(a0 + x, ROWS - 2, 1); }
  for (let y = 0; y < ROWS; y++) set(a0 + ARENA_W - 1, y, 1);
  for (let x = 8; x <= 12; x++) set(a0 + x, 14, 2);
  for (let x = 21; x <= 25; x++) set(a0 + x, 14, 2);
  for (let x = 14; x <= 18; x++) set(a0 + x, 10, 2);
  lv.arena = { gateX: a0 + 3, left: (a0 + 4) * T, right: (a0 + ARENA_W - 1) * T, trigger: (a0 + 6) * T, camX: (a0 + 3) * T + 8, top: 2 * T, floor: (ROWS - 2) * T, active: false, done: false };
  lv.bossSpawn = { x: (a0 + 26) * T, y: (ROWS - 2) * T };
  lv.spawn = { x: 3 * T, y: (ROWS - 3) * T };
  lv.checkpoint = { ...lv.spawn };
  lv.safe = { ...lv.spawn };
  return lv;
}
function tileAt(tx, ty) {
  if (tx < 0 || tx >= L.w) return 1;
  if (ty >= ROWS) return 0;
  if (ty < 0) { const t = L.tiles[tx]; return isSolidT(t) ? t : 0; }
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
    for (let x = x0; x <= x1; x++) { const t = tileAt(x, ty); if (isSolidT(t) || (t === 2 && !drop && prevBottom <= ty * T + 0.5)) { e.y = ty * T - e.h; return 1; } }
  } else if (dy < 0) {
    const ty = Math.floor(e.y / T);
    for (let x = x0; x <= x1; x++) if (solidAt(x, ty)) { e.y = (ty + 1) * T; return -1; }
  }
  return 0;
}
function groundAhead(e, dir) {
  const fx = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  const t = tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
  return isSolidT(t) || t === 2;
}
function wallAhead(e, dir) {
  const fx = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  return solidAt(Math.floor(fx / T), Math.floor((e.y + e.h - 2) / T));
}

/* ---------------- entities ---------------- */
function mkPlatform(x, y, axis, range, phase) {
  const k = (1 - Math.cos(phase)) / 2 * range;
  return { x: axis === 'x' ? x + k : x, y: axis === 'y' ? y + k : y, w: 48, h: 8, x0: x, y0: y, axis, range, t: phase, spd: 0.018, dx: 0, dy: 0 };
}
function mkPickup(type, x, y, vx = 0, vy = 0, phys = false) {
  const sz = type === 'coin' ? 5 : type === 'gem' ? 7 : 6;
  return { type, x, y, w: sz, h: sz, vx, vy, phys, t: Math.random() * 100, life: phys ? 900 : -1, delay: phys ? 20 : 0 };
}
const EDEF = {
  S: { kind: 'slime', w: 12, h: 8, hp: 20, dmg: 12, coins: 2 },
  O: { kind: 'goblin', w: 10, h: 12, hp: 26, dmg: 15, coins: 3 },
  B: { kind: 'bat', w: 12, h: 7, hp: 12, dmg: 10, coins: 2, fly: true },
  K: { kind: 'skel', w: 10, h: 15, hp: 30, dmg: 12, coins: 4 },
  N: { kind: 'knight', w: 12, h: 15, hp: 55, dmg: 18, coins: 6 },
};
function mkEnemy(type, px, py, n) {
  const d = EDEF[type];
  const hp = Math.round(d.hp * (1 + 0.28 * n));
  return {
    type, kind: d.kind, w: d.w, h: d.h, x: px + (T - d.w) / 2, y: py + T - d.h, hx: px, hy: py,
    vx: 0, vy: 0, hp, max: hp, dmg: Math.round(d.dmg * (1 + 0.12 * n)), coins: d.coins + Math.floor(n / 2), fly: !!d.fly,
    dir: Math.random() < 0.5 ? -1 : 1, face: -1, t: 30 + Math.random() * 60, state: 'idle', flash: 0, kb: 0, onGround: false, anim: Math.random() * 100, turnT: 0, hitBy: -1,
  };
}

/* ---------------- player ---------------- */
const P = { x: 0, y: 0, w: 10, h: 14, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jbuf: 0, airJumps: 0, wallDir: 0, wallLock: 0, dashT: 0, dashCD: 0, atkT: 0, atkCD: 0, atkDown: false, swing: 0, inv: 0, hp: 100, cut: false, plat: null, anim: 0, dead: 0, squash: 0 };
const maxHP = () => 100 + 25 * save.hpLv;
function resetPlayer(pos) {
  Object.assign(P, { x: pos.x, y: pos.y, vx: 0, vy: 0, onGround: false, dashT: 0, atkT: 0, inv: 60, dead: 0, plat: null, wallLock: 0 });
}
function hurtPlayer(amount, srcX) {
  if (P.inv > 0 || P.dashT > 0 || P.dead) return false;
  const dmg = Math.max(1, Math.round(amount * (1 - ARMORS[save.armor].red)));
  P.hp -= dmg; P.inv = 70;
  P.vx = (P.x + P.w / 2 < srcX ? -1 : 1) * 3; P.vy = -3.5; P.atkT = 0;
  floatText(P.x + P.w / 2, P.y - 4, '-' + dmg, '#ff5050');
  sfx('hurt'); cam.shake = 6;
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
  P.hp = maxHP();
  resetPlayer(L.checkpoint);
  if (L.arena.active && !L.arena.done) {   // reset boss fight
    L.arena.active = false; openGate(); L.boss = null;
    L.enemies = L.enemies.filter(e => !e.minion);
    L.projectiles = []; L.warnings = [];
    hideBossBar();
  }
}
function returnToSafe(dmg) {
  if (hurtPlayer(dmg, P.x + P.w / 2)) { if (P.hp > 0) { resetPlayer(L.safe); P.inv = 70; } }
  else if (!P.dead) resetPlayer(L.safe);
}

function updatePlayer() {
  if (P.dead) { P.dead--; if (P.dead === 0) respawn(); return; }
  const W = WEAPONS[save.weapon];
  const left = held('left'), right = held('right'), downH = held('down');
  const inp = (right ? 1 : 0) - (left ? 1 : 0);
  if (P.inv > 0) P.inv--;
  if (P.dashCD > 0) P.dashCD--;
  if (P.atkCD > 0) P.atkCD--;
  if (P.wallLock > 0) P.wallLock--;
  if (tapped('jump')) P.jbuf = 7; else if (P.jbuf > 0) P.jbuf--;

  // dash
  if (tapped('dash') && save.dash && P.dashCD === 0 && P.dashT === 0) {
    P.dashT = 11; P.dashCD = 45; P.vy = 0; if (inp) P.face = inp; P.vx = P.face * 5.6; sfx('dash');
  }
  // potion
  if (tapped('potion')) drinkPotion();
  // attack
  if (tapped('attack') && P.atkCD === 0 && P.dashT === 0) {
    P.atkT = 14; P.atkCD = 20; P.swing++; P.atkDown = downH && !P.onGround; sfx('swing');
  }

  if (P.dashT > 0) {
    P.dashT--;
    P.vx = P.face * 5.6; P.vy = 0;
    if (P.dashT % 2 === 0) L.particles.push({ x: P.x + P.w / 2, y: P.y + P.h / 2, vx: 0, vy: 0, life: 14, max: 14, col: ARMORS[save.armor].body, s: 3, ghost: true, face: P.face });
  } else {
    // horizontal
    if (P.wallLock === 0) {
      const target = inp * 2.3;
      const acc = P.onGround ? 0.45 : 0.28;
      if (P.inv > 50) { /* knockback */ } else if (P.vx < target) P.vx = Math.min(target, P.vx + acc); else if (P.vx > target) P.vx = Math.max(target, P.vx - acc);
      if (inp && P.atkT === 0) P.face = inp;
    }
    // gravity
    P.vy += 0.42;
    // wall slide
    P.wallDir = 0;
    if (!P.onGround) {
      if (wallAhead(P, 1) && (right || P.vx > 0.1)) P.wallDir = 1;
      else if (wallAhead(P, -1) && (left || P.vx < -0.1)) P.wallDir = -1;
      if (P.wallDir && P.vy > 1.3 && ((P.wallDir === 1 && right) || (P.wallDir === -1 && left))) { P.vy = 1.3; if (Math.random() < 0.3) L.particles.push(dust(P.x + (P.wallDir > 0 ? P.w : 0), P.y + P.h - 2)); }
    }
    // jumping
    if (P.jbuf > 0) {
      if (P.onGround || P.coyote > 0) {
        P.vy = -7.6; P.jbuf = 0; P.coyote = 0; P.onGround = false; P.cut = false; P.plat = null; P.squash = -4; sfx('jump');
        for (let i = 0; i < 4; i++) L.particles.push(dust(P.x + P.w / 2, P.y + P.h));
      } else if (P.wallDir) {
        const climbing = inp === P.wallDir;   // holding toward the wall = climb kick
        P.vy = climbing ? -7.4 : -7.2; P.vx = -P.wallDir * (climbing ? 1.3 : 2.8); P.wallLock = climbing ? 5 : 9;
        P.face = -P.wallDir; P.jbuf = 0; P.cut = false; sfx('jump');
        for (let i = 0; i < 4; i++) L.particles.push(dust(P.x + (P.wallDir > 0 ? P.w : 0), P.y + P.h / 2));
      } else if (save.dbl && P.airJumps > 0) {
        P.vy = -6.8; P.airJumps--; P.jbuf = 0; P.cut = false; sfx('djump');
        burst(P.x + P.w / 2, P.y + P.h, 6, ['#ffffff', '#bfe8ff'], 1.5);
      }
    }
    if (!held('jump') && P.vy < -3 && !P.cut && !P.springing) { P.vy = -3; P.cut = true; }
    if (P.vy >= 0) P.springing = false;
    if (P.vy > 7) P.vy = 7;
  }

  // move with platform
  if (P.plat) { P.x += P.plat.dx; moveX(P, 0); P.y = P.plat.y - P.h; }
  const wasGround = P.onGround;
  const hx = moveX(P, P.vx);
  if (hx && P.dashT > 0) P.dashT = 0;
  const hy = moveY(P, P.vy, downH && !held('jump'));
  P.onGround = false;
  if (hy === 1) { P.onGround = true; P.vy = 0; } else if (hy === -1) P.vy = 0.5;
  // moving platforms
  if (P.vy >= 0 && !hy) {
    const prevBottom = P.y + P.h - P.vy;
    for (const p of L.platforms) {
      if (P.x + P.w > p.x && P.x < p.x + p.w && P.y + P.h >= p.y && prevBottom <= p.y + Math.max(0, p.dy) + 2 && !(downH && held('jump'))) {
        P.y = p.y - P.h; P.vy = 0; P.onGround = true; P.plat = p; break;
      }
    }
  }
  if (!P.onGround) P.plat = null;
  else if (P.plat && !(P.x + P.w > P.plat.x && P.x < P.plat.x + P.plat.w)) { P.plat = null; P.onGround = false; }
  if (P.onGround) {
    if (!wasGround) { P.squash = 3; for (let i = 0; i < 3; i++) L.particles.push(dust(P.x + P.w / 2, P.y + P.h)); }
    P.coyote = 7; P.airJumps = 1;
    // remember safe ground
    if (!P.plat) {
      const fy = Math.floor((P.y + P.h + 1) / T), l = Math.floor(P.x / T), rr = Math.floor((P.x + P.w - 0.01) / T);
      const ok = tileAt(l, fy) === 1 && tileAt(rr, fy) === 1 && ![-1, 0, 1, 2].some(d => { const t1 = tileAt(l + d, fy - 1), t2 = tileAt(l + d, fy); return t1 === 3 || t1 === 5 || t2 === 5; });
      if (ok) { L.safe.x = P.x; L.safe.y = P.y; }
    }
  } else if (P.coyote > 0) P.coyote--;
  if (P.squash > 0) P.squash -= 0.5; else if (P.squash < 0) P.squash += 0.5;

  // springs
  for (const s of L.springs) if (P.vy >= 0 && overlap(P, s) && P.y + P.h <= s.y + 6) {
    P.vy = -11.8; P.springing = true; P.onGround = false; P.airJumps = 1; s.t = 12; sfx('spring');
  }
  // crumbling blocks: trigger when standing on them
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
    const t = tileAt(x, y);
    if (t === 3 && P.y + P.h > y * T + 9) spike = true;
    if (t === 5 && P.y + P.h > y * T + 5) haz = true;
  }
  if (haz) returnToSafe(25);
  else if (spike) { if (hurtPlayer(20, P.x + P.w / 2 + P.face)) P.vy = -6; }
  if (P.y > LH + 24) returnToSafe(20);

  // attack hitbox
  if (P.atkT > 0) {
    P.atkT--;
    if (P.atkT <= 11 && P.atkT >= 5) {
      const hb = attackBox(W);
      hitWithBox(hb, W.dmg);
    }
  }
  P.anim += Math.abs(P.vx) * 0.12;

  // checkpoints
  for (const f of L.flags) if (!f.on && overlap(P, { x: f.x - 4, y: f.y - 20, w: f.w + 8, h: f.h + 20 })) {
    L.flags.forEach(o => o.on = false); f.on = true;
    L.checkpoint = { x: f.x, y: f.y + f.h - P.h };
    P.hp = Math.max(P.hp, maxHP()); sfx('check'); toast('נקודת שמירה! ❤ החיים התמלאו');
    burst(f.x + 4, f.y, 14, ['#3fd04a', '#fff'], 2);
  }
  // tips
  for (const z of L.tipZones) if (!z.shown && P.x > z.x - 40) { z.shown = true; if (!save.tips[z.tag]) { save.tips[z.tag] = 1; toast(TIPS[z.tag], 4500); persist(); } }
  // arena trigger
  if (!L.arena.active && !L.arena.done && P.x > L.arena.trigger) startBoss();
}
function attackBox(W) {
  if (P.atkDown) return { x: P.x - 4, y: P.y + P.h - 2, w: P.w + 8, h: 18 };
  const r = W.range;
  return { x: P.face > 0 ? P.x + P.w - 2 : P.x - r + 2, y: P.y - 3, w: r, h: P.h + 6 };
}
function pogo() { P.vy = -6.6; P.cut = true; P.airJumps = 1; P.atkT = Math.min(P.atkT, 4); }
function hitWithBox(hb, dmg) {
  let hitSomething = false;
  for (const e of L.enemies) {
    if (e.dead || e.hitBy === P.swing || !overlap(hb, e)) continue;
    e.hitBy = P.swing;
    // knight shield
    if (e.kind === 'knight' && !P.atkDown) {
      const fromFront = sign((P.x + P.w / 2) - (e.x + e.w / 2)) === e.face;
      if (fromFront) { sfx('clang'); burst(e.x + e.w / 2 + e.face * 6, e.y + 8, 6, ['#ffd54a', '#fff'], 2); P.vx = -P.face * 2.5; e.turnT = Math.max(e.turnT, 10); continue; }
    }
    damageEnemy(e, dmg, P.face);
    hitSomething = true;
  }
  if (L.boss && L.boss.hitBy !== P.swing && L.boss.alpha > 0.5 && overlap(hb, L.boss)) {
    L.boss.hitBy = P.swing; damageBoss(dmg); hitSomething = true;
  }
  for (const lv of L.levers) if (!lv.on && overlap(hb, lv)) pullLever(lv);
  for (const pr of L.projectiles) if (!pr.dead && pr.parry !== false && overlap(hb, pr)) { pr.dead = true; burst(pr.x + pr.w / 2, pr.y + pr.h / 2, 6, ['#fff', '#ffd54a'], 2); sfx('clang'); hitSomething = true; }
  if (P.atkDown) {
    // pogo off spikes too
    const ty = Math.floor((hb.y + hb.h - 4) / T);
    for (let x = Math.floor(hb.x / T); x <= Math.floor((hb.x + hb.w) / T); x++) if (tileAt(x, ty) === 3) hitSomething = true;
    if (hitSomething) pogo();
  }
  if (hitSomething) hitStop = 3;
}
function drinkPotion() {
  if (save.potions <= 0) { toast('אין לך שיקויים! קנה בחנות'); return; }
  if (P.hp >= maxHP()) { toast('החיים כבר מלאים'); return; }
  save.potions--; P.hp = Math.min(maxHP(), P.hp + 50); sfx('potion');
  floatText(P.x + P.w / 2, P.y - 6, '+50', '#5cff7a'); burst(P.x + P.w / 2, P.y + P.h / 2, 12, ['#ff6a8a', '#fff'], 1.5);
  persist();
}
function pullLever(lv) {
  lv.on = true; sfx('lever'); burst(lv.x + 4, lv.y, 8, ['#5ccf4a', '#fff'], 1.5);
  const all = L.levers.filter(o => o.group === lv.group);
  if (all.every(o => o.on)) {
    for (const gx of (L.doors[lv.group] || [])) for (let y = 0; y < ROWS; y++) if (tileAt(gx, y) === 6) { setTile(gx, y, 0); if (y % 2) burst(gx * T + 8, y * T + 8, 2, ['#6a4a2a', '#9aa0b0'], 1.5); }
    sfx('door'); cam.shake = 8; toast('הדלת נפתחה!');
  } else toast(`ידית ${all.filter(o => o.on).length}/${all.length}`);
}

/* ---------------- enemies ---------------- */
let hitStop = 0;
function damageEnemy(e, dmg, dir) {
  e.hp -= dmg; e.flash = 8; e.vx = dir * 2.5; e.kb = 10;
  if (!e.fly) e.vy = -2;
  floatText(e.x + e.w / 2, e.y - 2, String(dmg), '#fff');
  sfx('hit'); burst(e.x + e.w / 2, e.y + e.h / 2, 5, ['#fff', '#ffe08a'], 2);
  if (e.kind === 'knight') e.turnT = Math.min(e.turnT, 6);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; L.kills++; save.kills++;
  sfx('kill'); cam.shake = 3;
  const cols = { slime: ['#5ccf4a', '#8ef07a'], goblin: ['#6ab04a', '#8a5a2a'], bat: ['#5a3a7a', '#ff4040'], skel: ['#e8e4d8', '#8a6a3a'], knight: ['#9aa0b0', '#c03030'] }[e.kind];
  burst(e.x + e.w / 2, e.y + e.h / 2, 16, cols, 2.5);
  dropCoins(e.x + e.w / 2, e.y + e.h / 2, e.coins);
  if (Math.random() < 0.05) L.pickups.push(mkPickup('potion', e.x + e.w / 2 - 3, e.y, 0, -3, true));
}
function dropCoins(x, y, n) {
  for (let i = 0; i < n; i++) L.pickups.push(mkPickup('coin', x - 2, y - 2, (Math.random() - 0.5) * 3, -2 - Math.random() * 3, true));
}
function updateEnemies() {
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
  for (const e of L.enemies) {
    if (e.dead) continue;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    const dx = pcx - ecx, dy = pcy - ecy, dist = Math.hypot(dx, dy);
    if (Math.abs(ecx - (cam.x + VW / 2)) > VW && !e.minion) continue;   // sleep offscreen
    e.anim++; if (e.flash > 0) e.flash--;
    if (e.kb > 0) { e.kb--; e.vx *= 0.85; }
    else switch (e.kind) {
      case 'slime':
        if (e.onGround) {
          e.vx = 0; e.t--;
          if (e.t <= 0) {
            let dir = Math.abs(dx) < 170 ? sign(dx) || 1 : e.dir;
            if (!groundAhead(e, dir)) dir = -dir;
            e.dir = dir; e.vx = dir * (Math.abs(dx) < 170 ? 1.6 : 0.9); e.vy = -4.2 - Math.random(); e.t = 45 + Math.random() * 50;
          }
        }
        break;
      case 'goblin':
        if (e.state === 'idle') {
          e.vx = e.dir * 0.7;
          if (!groundAhead(e, e.dir) || wallAhead(e, e.dir)) e.dir = -e.dir;
          if (Math.abs(dx) < 140 && Math.abs(dy) < 28 && sign(dx) === e.dir) { e.state = 'wind'; e.t = 22; e.vx = 0; }
        } else if (e.state === 'wind') { e.vx = 0; if (--e.t <= 0) { e.state = 'charge'; e.t = 75; } }
        else if (e.state === 'charge') {
          e.vx = e.dir * 3.3;
          if (Math.random() < 0.3) L.particles.push(dust(ecx, e.y + e.h));
          if (--e.t <= 0 || !groundAhead(e, e.dir) || wallAhead(e, e.dir)) { e.state = 'tired'; e.t = 70; e.vx = 0; }
        } else if (e.state === 'tired') { e.vx = 0; if (--e.t <= 0) { e.state = 'idle'; e.dir = sign(dx) || e.dir; } }
        e.face = e.dir;
        break;
      case 'bat':
        if (e.state === 'idle') {
          e.x = e.hx + Math.sin(e.anim * 0.03) * 10; e.y = e.hy + Math.sin(e.anim * 0.07) * 4; e.vx = e.vy = 0;
          if (dist < 150) { e.state = 'chase'; e.t = 200; }
        } else if (e.state === 'chase') {
          const sp = 1.25;
          e.vx += (sign(dx) * sp - e.vx) * 0.06; e.vy += (clamp(dy * 0.05, -sp, sp) + Math.sin(e.anim * 0.15) * 0.8 - e.vy) * 0.1;
          if (--e.t <= 0) { e.state = 'back'; }
        } else if (e.state === 'back') {
          const bx = e.hx - e.x, by = e.hy - e.y, bd = Math.hypot(bx, by);
          if (bd < 4) { e.state = 'idle'; e.anim = 0; } else { e.vx = bx / bd * 1.4; e.vy = by / bd * 1.4; }
        }
        e.face = sign(e.vx) || e.face;
        break;
      case 'skel':
        e.face = sign(dx) || e.face;
        if (Math.abs(e.x - e.hx) > 20) e.dir = sign(e.hx - e.x);
        e.vx = (e.anim % 200 < 100 ? 0.3 : -0.3) * (groundAhead(e, e.dir) ? 1 : 0) * e.dir;
        if (dist < 240 && Math.abs(dx) > 12) {
          if (--e.t <= 0) {
            e.t = 110 + Math.random() * 40;
            const sp = 2.7, ang = Math.atan2(dy - 4, dx);
            L.projectiles.push({ kind: 'bone', x: ecx - 3, y: e.y + 4, w: 6, h: 4, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: e.dmg, life: 200, spin: 0 });
            sfx('shoot');
          }
        }
        break;
      case 'knight':
        if (sign(dx) !== e.face && sign(dx) !== 0) { e.turnT++; if (e.turnT > 45) { e.face = sign(dx); e.turnT = 0; } } else e.turnT = 0;
        if (Math.abs(dx) < 220 && Math.abs(dy) < 40 && e.turnT === 0) {
          e.vx = e.face * 0.55;
          if (!groundAhead(e, e.face) || wallAhead(e, e.face)) e.vx = 0;
        } else e.vx = 0;
        break;
    }
    if (!e.fly) {
      e.vy = Math.min(e.vy + 0.42, 7);
      if (moveX(e, e.vx) && e.kind !== 'slime') e.dir = -e.dir;
      const h = moveY(e, e.vy, false);
      e.onGround = h === 1; if (h) e.vy = 0;
      if (e.kind === 'slime' || e.kind === 'goblin') e.face = sign(e.vx) || e.face;
      if (e.y > LH + 40) { e.dead = true; }
    } else { e.x += e.vx; e.y += e.vy; }
    // contact
    if (!P.dead && overlap(P, e)) {
      const stomp = P.vy > 1 && P.y + P.h - P.vy <= e.y + 4 && !e.fly;
      if (stomp) { P.vy = -6; P.cut = true; damageEnemy(e, Math.ceil(WEAPONS[save.weapon].dmg * 0.6), sign(dx) || 1); }
      else hurtPlayer(e.dmg, ecx);
    }
  }
  L.enemies = L.enemies.filter(e => !e.dead || false);
}

/* ---------------- boss ---------------- */
let bossSprites = [];
function bossHP(n) { return 220 + n * 150; }
function startBoss() {
  const a = L.arena; a.active = true;
  for (let y = 0; y < ROWS - 2; y++) setTile(a.gateX, y, 7);
  const def = BOSSES[L.n];
  const flying = !!def.fly;
  const sz = { blob: [36, 28], ogre: [26, 38], beast: [36, 26], skull: [24, 36], golem: [32, 38], bat: [30, 24] }[def.tpl];
  const hp = bossHP(L.n);
  L.boss = {
    def, w: sz[0], h: sz[1], x: L.bossSpawn.x, y: flying ? a.floor - 120 - sz[1] : L.bossSpawn.y - sz[1], vx: 0, vy: 0, hp, max: hp,
    state: 'intro', t: 90, face: -1, flash: 0, phase2: false, onGround: false, last: '', alpha: 1, hitBy: -1, count: 0, dmg: Math.round(18 * (1 + 0.14 * L.n)), anim: 0, stun: 0,
  };
  sfx('boss'); cam.shake = 10;
  showBossBar(def.name);
  toast('⚔ ' + def.name + ' ⚔', 2500);
}
function openGate() { for (let y = 0; y < ROWS - 2; y++) if (tileAt(L.arena.gateX, y) === 7) setTile(L.arena.gateX, y, 0); }
function damageBoss(dmg) {
  const b = L.boss;
  if (b.state === 'intro' || b.state === 'dying') return;
  const d = b.stun > 0 ? dmg * 2 : dmg;
  b.hp -= d; b.flash = 6;
  floatText(b.x + b.w / 2, b.y - 4, (b.stun > 0 ? '×2 ' : '') + d, b.stun > 0 ? '#ffd54a' : '#fff');
  sfx('hit'); burst(P.x + P.w / 2 + P.face * 14, P.y + 6, 6, ['#fff', b.def.c1], 2.5);
  if (!b.phase2 && b.hp <= b.max / 2) { b.phase2 = true; toast('!' + b.def.name + ' התעצבן', 2000); cam.shake = 12; sfx('boss'); }
  if (b.hp <= 0) { b.hp = 0; b.state = 'dying'; b.t = 150; b.vx = 0; L.projectiles = []; L.warnings = []; L.enemies.forEach(e => { if (e.minion) { e.dead = true; burst(e.x, e.y, 6, ['#fff'], 2); } }); sfx('kill'); }
}
function bossShoot(b, n, spread, speed) {
  const bx = b.x + b.w / 2, by = b.y + b.h * 0.35;
  const base = Math.atan2(P.y + P.h / 2 - by, P.x + P.w / 2 - bx);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * spread;
    L.projectiles.push({ kind: 'orb', col: b.def.eye, x: bx - 4, y: by - 4, w: 8, h: 8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: b.dmg, life: 260 });
  }
  sfx('shoot');
}
function shockwaves(b) {
  const y = L.arena.floor - 12;
  for (const d of [-1, 1]) L.projectiles.push({ kind: 'wave', col: b.def.c1, x: b.x + b.w / 2 - 6, y, w: 12, h: 12, vx: d * (b.phase2 ? 3.6 : 3), vy: 0, dmg: b.dmg, life: 200, parry: false, ground: true });
  sfx('slam'); cam.shake = 10;
}
function updateBoss() {
  const b = L.boss; if (!b) return;
  const A = L.arena, def = b.def, fly = !!def.fly;
  b.anim++; if (b.flash > 0) b.flash--; if (b.stun > 0) b.stun--;
  const pcx = P.x + P.w / 2, bcx = b.x + b.w / 2, dx = pcx - bcx;
  const sp = b.phase2 ? 1.35 : 1;
  const hoverY = A.floor - 120 - b.h;
  const pick = () => {
    let opts = def.moves.filter(m => m !== b.last); if (!opts.length) opts = def.moves;
    if (L.enemies.filter(e => e.minion).length >= 3) opts = opts.filter(m => m !== 'summon') ; if (!opts.length) opts = ['shoot'];
    const m = opts[(Math.random() * opts.length) | 0]; b.last = m; b.state = m; b.count = 0; b.t = 0;
    if (m === 'charge') { b.t = 40; b.sub = 'wind'; b.face = sign(dx) || b.face; }
    if (m === 'hop') b.count = b.phase2 ? 4 : 3;
    if (m === 'shoot') { b.count = b.phase2 ? 4 : 3; b.t = 20; }
    if (m === 'rain') { b.t = 0; b.count = 0; }
    if (m === 'slam') { b.sub = 'up'; }
    if (m === 'teleport') { b.sub = 'out'; b.t = 30; }
    if (m === 'swoop') { b.sub = 'aim'; b.t = 35; }
    if (m === 'summon') b.t = 40;
  };
  switch (b.state) {
    case 'intro': b.t--; b.face = sign(dx) || -1; if (b.t <= 0) { b.state = 'idle'; b.t = 40; } break;
    case 'idle':
      b.face = sign(dx) || b.face; b.vx *= 0.8;
      if (fly) { b.vx += (clamp(dx, -60, 60) * 0.02 - b.vx) * 0.05; b.y += ((hoverY + Math.sin(b.anim * 0.05) * 10) - b.y) * 0.05; }
      if (--b.t <= 0) pick();
      break;
    case 'hop':
      if (b.onGround) {
        b.vx = 0;
        if (b.t-- <= 0) {
          if (b.count-- <= 0) { b.state = 'idle'; b.t = 50 / sp; break; }
          b.vy = -8.5; b.vx = clamp(dx / 45, -3.2, 3.2) * sp; b.t = 14; b.onGround = false;
        }
      }
      break;
    case 'charge':
      if (b.sub === 'wind') { b.vx = 0; if (--b.t <= 0) { b.sub = 'run'; } }
      else if (b.sub === 'run') {
        b.vx = b.face * 4.6 * sp;
        if (b.anim % 3 === 0) L.particles.push(dust(bcx, b.y + b.h));
      }
      break;
    case 'slam':
      if (b.sub === 'up' && b.onGround) { b.vy = -11; b.vx = clamp(dx / 52, -5, 5); b.sub = 'air'; b.onGround = false; }
      break;
    case 'shoot':
      b.face = sign(dx) || b.face; b.vx *= 0.8;
      if (fly) b.y += (hoverY - b.y) * 0.05;
      if (--b.t <= 0) {
        if (b.count-- <= 0) { b.state = 'idle'; b.t = 50 / sp; break; }
        bossShoot(b, b.phase2 ? 5 : 3, 0.28, 2.6 * sp); b.t = 32 / sp;
      }
      break;
    case 'rain':
      b.vx *= 0.8; b.t++;
      if (b.t === 1) { const n = b.phase2 ? 11 : 7; for (let i = 0; i < n; i++) L.warnings.push({ x: A.left + 8 + Math.random() * (A.right - A.left - 24), t: 50 + i * 6, col: def.c1 }); }
      if (b.t > 120) { b.state = 'idle'; b.t = 45 / sp; }
      break;
    case 'summon':
      b.vx *= 0.8;
      if (--b.t <= 0) {
        const pool = enemyPool(L.n).filter(k => k !== 'N' && k !== 'K');
        for (let i = 0; i < 2; i++) {
          const k = pool[(Math.random() * pool.length) | 0];
          const e = mkEnemy(k, bcx - 8 + (i ? 30 : -30), A.floor - T - (k === 'B' ? 40 : 0), L.n); e.minion = true; e.coins = 1; e.state = k === 'B' ? 'chase' : 'idle'; e.t = 9999;
          e.x = clamp(e.x, A.left + 4, A.right - 20);
          L.enemies.push(e); burst(e.x + 6, e.y + 6, 10, ['#fff', def.c1], 2);
        }
        b.state = 'idle'; b.t = 60 / sp;
      }
      break;
    case 'teleport':
      b.vx = 0;
      if (b.sub === 'out') { b.alpha = b.t / 30; if (--b.t <= 0) {
        b.x = (pcx < (A.left + A.right) / 2) ? A.right - b.w - 24 : A.left + 24;
        if (!fly) b.y = A.floor - b.h; b.sub = 'in'; b.t = 30; } }
      else { b.alpha = 1 - b.t / 30; if (--b.t <= 0) { b.alpha = 1; b.state = 'shoot'; b.count = 1; b.t = 10; b.face = sign(dx) || b.face; } }
      break;
    case 'swoop':
      if (b.sub === 'aim') { b.vx *= 0.9; b.face = sign(dx) || b.face; if (--b.t <= 0) { const a = Math.atan2(P.y - b.y, pcx - bcx); b.vx = Math.cos(a) * 5 * sp; b.vy = Math.sin(a) * 5 * sp; b.sub = 'dive'; b.t = 60; } }
      else if (b.sub === 'dive') { if (--b.t <= 0 || b.y + b.h >= A.floor - 2) { b.sub = 'rest'; b.t = 70; b.vx = b.vy = 0; cam.shake = 6; sfx('slam'); } }
      else if (b.sub === 'rest') { b.vx = 0; b.vy = 0; if (b.y + b.h < A.floor) b.vy = 3; if (--b.t <= 0) b.sub = 'up'; }
      else { b.vx *= 0.9; b.vy = -2.5; if (b.y <= hoverY) { b.vy = 0; b.state = 'idle'; b.t = 50 / sp; } }
      break;
    case 'stunned':
      b.vx = 0; if (--b.t <= 0) { b.state = 'idle'; b.t = 30; }
      break;
    case 'dying':
      b.vx = 0; b.t--;
      if (b.t % 8 === 0) { burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 10, ['#fff', def.c1, def.eye, '#ffd54a'], 3); sfx('hit'); cam.shake = 5; }
      if (b.t <= 0) {
        burst(bcx, b.y + b.h / 2, 50, ['#fff', def.c1, def.c2, '#ffd54a'], 4); sfx('kill'); cam.shake = 16;
        dropCoins(bcx, b.y + b.h / 2, 25 + L.n * 6);
        L.boss = null; A.done = true; openGate(); hideBossBar(); save.bosses++;
        L.finishT = 170;
      }
      return;
  }
  // physics
  if (!fly) {
    b.vy = Math.min(b.vy + (b.state === 'slam' ? 0.42 : 0.45), 9);
    const hx = moveX(b, b.vx);
    if (hx && b.state === 'charge' && b.sub === 'run') { b.state = 'stunned'; b.t = 80; b.stun = 80; b.vx = 0; cam.shake = 12; sfx('slam'); toast('הבוס מסוחרר! זה הזמן להרביץ (נזק כפול)', 1600); burst(bcx + b.face * b.w / 2, b.y + b.h / 2, 12, ['#fff', '#ffd54a'], 3); }
    const wasAir = !b.onGround;
    const hy = moveY(b, b.vy, true);
    if (hy === 1) {
      b.vy = 0; b.onGround = true;
      if (wasAir) {
        if (b.state === 'slam') { shockwaves(b); b.state = 'idle'; b.t = 55 / sp; }
        else if (b.state === 'hop') { cam.shake = 5; sfx('slam'); if (b.phase2) shockwaves(b); }
      }
    } else if (hy === -1) b.vy = 0; else b.onGround = false;
  } else {
    b.x += b.vx; b.y += b.vy;
    b.x = clamp(b.x, A.left, A.right - b.w); b.y = clamp(b.y, A.top, A.floor - b.h);
  }
  b.x = clamp(b.x, A.left - 2, A.right - b.w + 2);
  if (!P.dead && b.alpha > 0.6 && overlap(P, { x: b.x + 3, y: b.y + 4, w: b.w - 6, h: b.h - 4 })) hurtPlayer(b.dmg, bcx);
}

/* ---------------- projectiles / pickups / particles ---------------- */
function updateProjectiles() {
  for (const p of L.projectiles) {
    if (p.dead) continue;
    p.x += p.vx; p.y += p.vy; if (p.grav) p.vy = Math.min(p.vy + p.grav, 6);
    if (--p.life <= 0) p.dead = true;
    const cx = Math.floor((p.x + p.w / 2) / T), cy = Math.floor((p.y + p.h / 2) / T);
    if (p.ground) { if (solidAt(Math.floor((p.vx > 0 ? p.x + p.w : p.x) / T), cy)) { p.dead = true; burst(p.x + p.w / 2, p.y + p.h, 6, [p.col, '#fff'], 2); } if (L.n >= 0 && Math.random() < 0.4) L.particles.push(dust(p.x + p.w / 2, p.y + p.h)); }
    else if (solidAt(cx, cy)) { p.dead = true; burst(p.x + p.w / 2, p.y + p.h / 2, 4, ['#fff'], 1.5); }
    if (!p.dead && !P.dead && overlap(P, p)) { if (hurtPlayer(p.dmg, p.x + p.w / 2 - p.vx * 3)) p.dead = !p.ground; }
  }
  L.projectiles = L.projectiles.filter(p => !p.dead);
  for (const w of L.warnings) {
    if (--w.t === 0) L.projectiles.push({ kind: 'rock', col: w.col, x: w.x, y: L.arena.top - 30, w: 10, h: 10, vx: 0, vy: 1, grav: 0.18, dmg: L.boss ? L.boss.dmg : 20, life: 300 });
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
    if (!P.dead && Math.hypot(dx, dy) < 26 && k.type !== 'potion') { k.x += dx * 0.18; k.y += dy * 0.18; }
    if (!P.dead && overlap(P, k)) {
      k.dead = true;
      if (k.type === 'coin') { save.coins += 1; L.coinsGot += 1; sfx('coin'); }
      else if (k.type === 'gem') { save.coins += 15; L.coinsGot += 15; sfx('gem'); floatText(k.x, k.y - 4, '+15', '#ff8ab8'); burst(k.x, k.y, 10, ['#ff4a8a', '#fff'], 2); }
      else if (k.type === 'potion') {
        if (save.potions < MAX_POTIONS) { save.potions++; toast('מצאת שיקוי! (Q לשתות)'); } else { P.hp = Math.min(maxHP(), P.hp + 30); floatText(P.x, P.y - 6, '+30', '#5cff7a'); }
        sfx('potion');
      }
    }
  }
  L.pickups = L.pickups.filter(k => !k.dead);
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
  if (L.particles.length > 600) L.particles.splice(0, L.particles.length - 600);
  for (const t of L.texts) { t.y -= 0.5; t.life--; }
  L.texts = L.texts.filter(t => t.life > 0);
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
    else if (c.state === 'gone' && c.t <= 0) {
      if (!overlap(P, { x: c.x * T, y: c.y * T, w: T, h: T })) { setTile(c.x, c.y, 4); L.crumbles.delete(k); } else c.t = 20;
    }
  }
  if (L.finishT > 0 && --L.finishT === 0) finishLevel();
}

/* ---------------- camera & render ---------------- */
function updateCamera(snap) {
  let tx = P.x + P.w / 2 - VW / 2 + P.face * 30;
  let ty = P.y + P.h / 2 - VH / 2 - 10;
  if (L.arena.active && !L.arena.done) tx = L.arena.camX;
  tx = clamp(tx, 0, L.w * T - VW); ty = clamp(ty, 0, LH - VH);
  if (snap) { cam.x = tx; cam.y = ty; } else { cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.1; }
  if (cam.shake > 0) cam.shake *= 0.85; if (cam.shake < 0.3) cam.shake = 0;
}
function hillY(x, seed, amp, base) { return base + Math.sin(x * 0.011 + seed) * amp + Math.sin(x * 0.027 + seed * 2) * amp * 0.5 + Math.sin(x * 0.005 + seed * 3) * amp * 0.8; }
function drawBackground() {
  const th = L.th;
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const tm = frame;
  // deco far
  if (th.deco === 'stars' || th.deco === 'embers' && L.n === 9) { for (let i = 0; i < 60; i++) { const x = ((i * 97.3 - cam.x * 0.05) % VW + VW) % VW, y = (i * 53.7) % 150; ctx.fillStyle = (i + (tm >> 4)) % 7 === 0 ? '#fff' : 'rgba(255,255,255,0.5)'; ctx.fillRect(x | 0, y | 0, 1, 1); } }
  if (th.deco === 'sun' || th.deco === 'clouds' && L.n === 0) { ctx.fillStyle = th.deco === 'sun' ? '#fff3c0' : '#fff8d0'; const sx = 380, sy = 50; for (let j = -14; j <= 14; j++) { const w = Math.floor(Math.sqrt(196 - j * j)); ctx.fillRect(sx - w, sy + j, w * 2, 1); } }
  if (th.deco === 'stars' && L.n === 7) { ctx.fillStyle = '#e8e0ff'; for (let j = -12; j <= 12; j++) { const w = Math.floor(Math.sqrt(144 - j * j)); ctx.fillRect(400 - w, 50 + j, w * 2, 1); } ctx.fillStyle = th.sky[0]; for (let j = -10; j <= 10; j++) { const w = Math.floor(Math.sqrt(100 - j * j)); ctx.fillRect(406 - w, 46 + j, w * 2, 1); } }
  if (th.deco === 'clouds') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { const x = ((i * 170 - cam.x * 0.1 - tm * 0.05) % (VW + 120) + VW + 120) % (VW + 120) - 60, y = 20 + (i * 37) % 70; ctx.fillRect(x, y, 50, 8); ctx.fillRect(x + 8, y - 6, 30, 6); ctx.fillRect(x + 14, y - 10, 14, 4); } }
  // far hills
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
  const mode = th.deco === 'snow' ? 'mount' : th.deco === 'towers' ? 'tower' : 'hill';
  layer(0.2, th.far, 18, 170, L.n * 3 + 1, mode);
  layer(0.45, th.near, 14, 205, L.n * 5 + 2, th.deco === 'towers' ? 'tower' : 'hill');
  if (th.deco === 'crystals' || L.n === 1) { ctx.fillStyle = th.near; for (let sx = 0; sx < VW; sx += 2) { const wx = sx + cam.x * 0.45; const h = 20 + Math.abs(Math.sin(wx * 0.05)) * 30 * (Math.sin(wx * 0.013) > 0 ? 1 : 0.3); ctx.fillRect(sx, 0, 2, h); } }
  if (th.deco === 'fog') { ctx.fillStyle = 'rgba(180,220,140,0.12)'; for (let i = 0; i < 4; i++) ctx.fillRect(0, 150 + i * 22 + Math.sin(tm * 0.01 + i) * 6, VW, 10); }
}
function drawTiles() {
  const x0 = Math.floor(cam.x / T), x1 = Math.ceil((cam.x + VW) / T), y0 = Math.floor(cam.y / T), y1 = Math.ceil((cam.y + VH) / T);
  const th = L.th;
  for (let ty = y0; ty <= y1 && ty < ROWS; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = tileAt(tx, ty); if (!t) continue;
    const dx = tx * T - Math.round(cam.x), dy = ty * T - Math.round(cam.y);
    switch (t) {
      case 1: { const above = ty > 0 ? tileAt(tx, ty - 1) : 0; const img = isSolidT(above) && above !== 7 && above !== 6 ? TEX.fill[(tx * 7 + ty * 3) % 3] : TEX.top[(tx + ty) % 2]; ctx.drawImage(img, dx, dy); break; }
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
    }
  }
}
function onScreen(e, m = 40) { return e.x + e.w > cam.x - m && e.x < cam.x + VW + m && e.y + e.h > cam.y - m && e.y < cam.y + VH + m; }
function drawRectW(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), w, h); }
function render() {
  const sx = cam.shake ? (Math.random() - 0.5) * cam.shake : 0, sy = cam.shake ? (Math.random() - 0.5) * cam.shake : 0;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
  drawBackground();
  drawTiles();
  // warnings
  for (const w of L.warnings) { const a = (frame >> 2) % 2; drawRectW(w.x, L.arena.top - 8, 10, 4, a ? '#ff3030' : '#ffd54a'); ctx.globalAlpha = 0.25; drawRectW(w.x + 3, L.arena.top, 4, L.arena.floor - L.arena.top, '#ff3030'); ctx.globalAlpha = 1; }
  // props
  for (const s of L.springs) if (onScreen(s)) drawSpr(ESPR.spring[0], { x: s.x, y: s.y - (s.t > 0 ? 3 : 0), w: s.w, h: s.h + (s.t > 0 ? 3 : 0) }, false, false);
  for (const lv of L.levers) if (onScreen(lv)) drawSpr(ESPR.lever[lv.on ? 1 : 0], lv, false, false);
  for (const f of L.flags) if (onScreen(f)) { drawSpr(ESPR.flag[f.on ? 1 : 0], f, false, false); }
  for (const p of L.platforms) if (onScreen(p)) { for (let i = 0; i < 3; i++) ctx.drawImage(TEX.plat, Math.round(p.x - cam.x) + i * T, Math.round(p.y - cam.y)); }
  for (const k of L.pickups) if (onScreen(k)) {
    const bob = k.phys ? 0 : Math.sin(k.t * 0.08) * 1.5;
    if (k.phys && k.life > 0 && k.life < 120 && (frame >> 2) % 2) continue;
    if (k.type === 'coin') drawSpr(ESPR.coin[[0, 1, 2, 1][((k.t / 8) | 0) % 4]], k, false, false, 0, bob);
    else drawSpr(ESPR[k.type][0], k, false, false, 0, bob);
  }
  // enemies
  for (const e of L.enemies) if (onScreen(e)) {
    const white = e.flash > 0 && e.flash % 2 === 0;
    let spr, ox = 0;
    if (e.kind === 'slime') spr = ESPR.slime[e.onGround ? 0 : 1];
    else if (e.kind === 'bat') spr = ESPR.bat[(e.anim >> 3) % 2];
    else if (e.kind === 'goblin') { spr = ESPR.goblin[Math.abs(e.vx) > 0.1 ? (e.anim >> (e.state === 'charge' ? 2 : 3)) % 2 : 0]; if (e.state === 'wind') ox = (frame % 2) ? 1 : -1; }
    else if (e.kind === 'skel') spr = ESPR.skel[0];
    else spr = ESPR.knight[0];
    drawSpr(spr, e, e.face < 0, white, ox);
    if (e.kind === 'goblin' && e.state === 'tired') drawRectW(e.x + e.w / 2 + 4, e.y - 4 - ((frame >> 3) % 3), 2, 3, '#7fd6ff');
    if (e.kind === 'goblin' && e.state === 'wind') drawRectW(e.x + e.w / 2 - 1, e.y - 8, 2, 5, '#ff3030');
    if (e.kind === 'knight' && e.turnT > 0) drawRectW(e.x + e.w / 2 - 1, e.y - 7, 2, 4, '#ffd54a');
    if (e.hp < e.max) { drawRectW(e.x, e.y - 5, e.w, 2, '#3a1020'); drawRectW(e.x, e.y - 5, Math.max(1, e.w * e.hp / e.max), 2, '#ff4a4a'); }
  }
  // boss
  if (L.boss) {
    const b = L.boss; if (!bossSprites[L.n]) bossSprites[L.n] = makeBossSprite(b.def);
    ctx.globalAlpha = clamp(b.alpha, 0, 1);
    let ox = 0, oy = 0;
    if ((b.state === 'charge' && b.sub === 'wind') || b.state === 'dying') ox = (frame % 2) ? 2 : -2;
    if (b.state === 'idle' || b.state === 'intro') oy = Math.sin(b.anim * 0.1) * 1.5;
    drawSpr(bossSprites[L.n], b, b.face > 0 !== (b.def.tpl === 'beast'), b.flash > 0 && b.flash % 2 === 0, ox, oy + 3);
    ctx.globalAlpha = 1;
    if (b.stun > 0) for (let i = 0; i < 3; i++) { const a = frame * 0.1 + i * 2.1; drawRectW(b.x + b.w / 2 + Math.cos(a) * 12, b.y - 6 + Math.sin(a) * 3, 3, 3, '#ffd54a'); }
  }
  // player
  if (!P.dead && !(P.inv > 0 && P.inv < 60 && (frame >> 2) % 2)) {
    let legs = 'idle';
    if (!P.onGround) legs = 'jump'; else if (Math.abs(P.vx) > 0.3) legs = ((P.anim | 0) % 2) ? 'run1' : 'run2';
    const body = P.atkT > 4 && !P.atkDown ? 'atk' : 'idle';
    drawSpr(danSpr[body + '_' + legs], P, P.face < 0, false, 0, 0);
    if (P.atkT > 3) drawSlash();
  }
  // projectiles
  for (const p of L.projectiles) if (onScreen(p)) {
    const x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y);
    if (p.kind === 'bone') { ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, p.w + 2, p.h + 2); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x, y + 1, p.w, 2); ctx.fillRect(x, y, 2, 4); ctx.fillRect(x + p.w - 2, y, 2, 4); }
    else if (p.kind === 'wave') { ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y + 3, p.w + 2, p.h - 2); ctx.fillStyle = p.col; for (let i = 0; i < p.w; i++) { const h = p.h - 2 - Math.abs(i - p.w / 2) * 1.2 + Math.sin(frame * 0.5 + i) * 1.5; ctx.fillRect(x + i, y + p.h - h, 1, h); } }
    else { ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y, p.w + 2, p.h); ctx.fillRect(x, y - 1, p.w, p.h + 2); ctx.fillStyle = p.col || '#ff5050'; ctx.fillRect(x, y, p.w, p.h); ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y + 2, 2, 2); }
  }
  // particles
  for (const p of L.particles) {
    if (p.ghost) { ctx.globalAlpha = p.life / p.max * 0.5; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - cam.x - 5), Math.round(p.y - cam.y - 7), 10, 14); ctx.globalAlpha = 1; continue; }
    ctx.globalAlpha = Math.min(1, p.life / 15); ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.s, p.s);
  }
  ctx.globalAlpha = 1;
  // float texts
  ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
  for (const t of L.texts) { const x = Math.round(t.x - cam.x), y = Math.round(t.y - cam.y); ctx.fillStyle = OUTLINE; ctx.fillText(t.s, x + 1, y + 1); ctx.fillStyle = t.col; ctx.fillText(t.s, x, y); }
  // snow / embers overlay
  const th = L.th;
  if (th.deco === 'snow' || th.deco === 'embers') { ctx.fillStyle = th.deco === 'snow' ? '#fff' : '#ff9a3a'; for (let i = 0; i < 50; i++) { const sp = th.deco === 'snow' ? 1 : -0.6; const x = ((i * 89 + Math.sin(frame * 0.02 + i) * 20 - cam.x * 0.8) % VW + VW) % VW; const y = ((i * 61 + frame * sp * (0.5 + (i % 3) * 0.3)) % VH + VH) % VH; ctx.fillRect(x | 0, y | 0, i % 3 ? 1 : 2, i % 3 ? 1 : 2); } }
  ctx.restore();
}
function drawSlash() {
  const W = WEAPONS[save.weapon];
  const prog = 1 - (P.atkT - 3) / 11;  // 0..1
  ctx.fillStyle = W.col;
  const cx = P.x + P.w / 2 - cam.x, cy = P.y + P.h / 2 - cam.y;
  if (P.atkDown) {
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); const r = 12 + save.weapon; const x = cx + Math.cos(a) * r * (i % 2 ? 1 : 0.85), y = cy + 4 + Math.sin(a) * r; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
    return;
  }
  const r = W.range - 2;
  const start = -1.2, end = 1.2, cur = start + (end - start) * prog;
  for (let a = start; a <= cur; a += 0.12) {
    const x = cx + P.face * (Math.cos(a) * r), y = cy + Math.sin(a) * r * 0.8;
    ctx.globalAlpha = 0.4 + 0.6 * ((a - start) / (cur - start + 0.01));
    ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    if (save.weapon >= 2) ctx.fillRect(Math.round(cx + P.face * Math.cos(a) * (r - 4)), Math.round(cy + Math.sin(a) * (r - 4) * 0.8), 1, 1);
  }
  ctx.globalAlpha = 1;
  if (save.weapon === 0) { ctx.fillStyle = '#f2c49a'; ctx.fillRect(Math.round(cx + P.face * 10) - 2, Math.round(cy - 1), 4, 4); }
  else { // weapon blade
    const a = cur, len = W.range - 6;
    for (let i = 4; i < len; i += 1) { ctx.fillStyle = i < 7 ? '#6a4a2a' : W.col; ctx.fillRect(Math.round(cx + P.face * Math.cos(a) * i), Math.round(cy + Math.sin(a) * i * 0.8), 2, 2); }
  }
}

/* ---------------- HUD / DOM ---------------- */
const hud = { hp: $('hpfill'), hpt: $('hptext'), coins: $('coins'), pots: $('pots'), lvl: $('lvlname'), boss: $('bossbar'), bossfill: $('bossfill'), bossname: $('bossname') };
let hudCache = {};
function updateHUD() {
  const mh = maxHP(), hp = Math.max(0, Math.ceil(P.hp));
  const s = hp + '/' + mh;
  if (hudCache.hp !== s) { hud.hp.style.width = clamp(hp / mh * 100, 0, 100) + '%'; hud.hpt.textContent = s; hudCache.hp = s; hud.hp.classList.toggle('low', hp / mh < 0.3); }
  if (hudCache.c !== save.coins) { hud.coins.textContent = save.coins; hudCache.c = save.coins; }
  if (hudCache.p !== save.potions) { hud.pots.textContent = save.potions; hudCache.p = save.potions; }
  if (L.boss) { const f = (L.boss.hp / L.boss.max * 100).toFixed(1); if (hudCache.b !== f) { hud.bossfill.style.width = f + '%'; hudCache.b = f; } }
}
function showBossBar(name) { hud.bossname.textContent = name; hud.boss.classList.add('on'); hudCache.b = null; }
function hideBossBar() { hud.boss.classList.remove('on'); }
let toastTimer = 0;
function toast(msg, ms = 2200) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), ms); }
function showDeath(on) { $('deathmsg').classList.toggle('on', on); }

/* ---------------- screens ---------------- */
let state = 'login';
const scr = $('screen');
function show(html, cls = '') { scr.className = 'overlay on ' + cls; scr.innerHTML = html; }
function hideScreen() { scr.className = 'overlay'; scr.innerHTML = ''; }
function setGameUI(on) { document.body.classList.toggle('playing', on); }

function medalSVG(tier, sym, size = 64, locked = false) {
  const ring = locked ? '#3a3448' : ['#3a3448', '#cd7f32', '#c8d0da', '#ffcc33'][tier];
  const ringD = locked ? '#26222f' : ['#26222f', '#8a4e1a', '#8a96a6', '#c08a10'][tier];
  const rib = locked ? '#2a2636' : '#c03040';
  return `<svg class="medal" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect x="4" y="0" width="3" height="6" fill="${rib}"/><rect x="9" y="0" width="3" height="6" fill="${locked ? rib : '#3060c0'}"/>
    <rect x="5" y="5" width="6" height="1" fill="${ringD}"/><rect x="4" y="6" width="8" height="9" fill="${ringD}"/><rect x="3" y="7" width="10" height="7" fill="${ringD}"/>
    <rect x="5" y="6" width="6" height="8" fill="${ring}"/><rect x="4" y="7" width="8" height="6" fill="${ring}"/>
    ${locked ? '<rect x="7" y="8" width="2" height="3" fill="#1a1620"/>' : `<rect x="6" y="8" width="4" height="4" fill="${sym}"/><rect x="7" y="7" width="2" height="6" fill="${sym}"/><rect x="5" y="9" width="6" height="2" fill="${sym}"/><rect x="5" y="7" width="1" height="1" fill="#fff" opacity=".7"/>`}
  </svg>`;
}
const tierName = t => ['', 'ארד', 'כסף', 'זהב'][t];

function loginScreen(msg = '') {
  state = 'login'; setGameUI(false);
  const names = Object.keys(accounts());
  show(`
    <div class="panel narrow">
      <h1 class="title">דן נגד המפלצות</h1>
      <p class="sub">כי בא לו.</p>
      <div class="tabs"><button id="tabLogin" class="tab on">כניסה</button><button id="tabReg" class="tab">חשבון חדש</button></div>
      <form id="authForm" autocomplete="on">
        <label>שם משתמש<input id="uName" name="username" maxlength="20" autocomplete="username" required></label>
        <label>סיסמה<input id="uPass" name="password" type="password" maxlength="40" autocomplete="current-password" required></label>
        <label id="pass2Row" class="hidden">אימות סיסמה<input id="uPass2" type="password" maxlength="40" autocomplete="new-password"></label>
        <div class="err" id="authErr">${msg}</div>
        <button class="btn big" id="authBtn" type="submit">היכנס</button>
      </form>
      <p class="hint">${names.length ? 'שחקנים במחשב הזה: ' + names.map(n => `<b>${esc(n)}</b>`).join(' · ') : 'אין עדיין חשבונות – צור חשבון חדש כדי לשמור את ההישגים שלך.'}</p>
      <p class="hint small">החשבונות וההתקדמות נשמרים בדפדפן הזה.</p>
    </div>`, 'title-bg');
  let mode = names.length ? 'login' : 'reg';
  const setMode = m => {
    mode = m; $('tabLogin').classList.toggle('on', m === 'login'); $('tabReg').classList.toggle('on', m === 'reg');
    $('pass2Row').classList.toggle('hidden', m === 'login'); $('authBtn').textContent = m === 'login' ? 'היכנס' : 'צור חשבון';
    $('uPass').autocomplete = m === 'login' ? 'current-password' : 'new-password'; $('authErr').textContent = '';
  };
  setMode(mode);
  $('tabLogin').onclick = () => setMode('login'); $('tabReg').onclick = () => setMode('reg');
  $('authForm').onsubmit = async e => {
    e.preventDefault(); initAudio();
    const u = $('uName').value.trim(), p = $('uPass').value;
    const err = m => { $('authErr').textContent = m; };
    if (u.length < 2) return err('שם המשתמש קצר מדי');
    if (p.length < 4) return err('הסיסמה צריכה להיות לפחות 4 תווים');
    const all = accounts(); const key = Object.keys(all).find(k => k.toLowerCase() === u.toLowerCase());
    const h = await hashPass(u, p);
    if (mode === 'reg') {
      if (key) return err('השם הזה כבר תפוס');
      if (p !== $('uPass2').value) return err('הסיסמאות לא תואמות');
      all[u] = { hash: h, save: newSave(), created: Date.now() }; store.set(ACC_KEY, all);
      login(u); sfx('buy');
    } else {
      if (!key) return err('אין משתמש כזה – צור חשבון חדש');
      if (all[key].hash !== h) return err('סיסמה שגויה');
      login(key); sfx('buy');
    }
  };
  setTimeout(() => $('uName') && $('uName').focus(), 50);
}
function login(name) {
  account = name;
  const a = accounts()[name];
  save = Object.assign(newSave(), a.save || {});
  try { sessionStorage.setItem(CUR_KEY, name); } catch (e) { }
  buildDan();
  titleScreen();
}
function logout() { account = null; try { sessionStorage.removeItem(CUR_KEY); } catch (e) { } loginScreen(); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function titleScreen() {
  state = 'title'; setGameUI(false);
  const medals = save.medals.filter(m => m > 0).length;
  show(`
    <div class="panel narrow">
      <h1 class="title">דן נגד המפלצות</h1>
      <p class="sub">דן לא צריך סיבה. הוא פשוט רוצה להרביץ לכל המפלצות. כי בא לו.</p>
      <div class="dan-hero"><canvas id="heroCv" width="14" height="18"></canvas></div>
      <p class="who">שלום <b>${esc(account)}</b> · 🏅 ${medals}/10 מדליות · 🪙 ${save.coins}</p>
      <div class="col">
        <button class="btn big" id="bPlay">${save.unlocked > 1 || medals ? 'המשך הרפתקה' : 'התחל לשחק'}</button>
        <button class="btn" id="bShop">חנות 🛒</button>
        <button class="btn" id="bMedals">המדליות שלי 🏅</button>
        <button class="btn" id="bHelp">איך משחקים?</button>
        <button class="btn ghost" id="bOut">התנתק</button>
      </div>
    </div>`, 'title-bg');
  drawHero($('heroCv'));
  $('bPlay').onclick = () => mapScreen();
  $('bShop').onclick = () => shopScreen(() => titleScreen());
  $('bMedals').onclick = () => medalsScreen();
  $('bHelp').onclick = () => helpScreen();
  $('bOut').onclick = () => logout();
}
function drawHero(c) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height); x.drawImage(danSpr.idle_idle.n, 0, 0); }
function helpScreen() {
  show(`
    <div class="panel">
      <h2>איך משחקים</h2>
      <div class="help">
        <div><kbd>←</kbd><kbd>→</kbd> / <kbd>A</kbd><kbd>D</kbd> זוז</div>
        <div><kbd>רווח</kbd> / <kbd>W</kbd> / <kbd>↑</kbd> קפיצה (לחיצה ארוכה = קפיצה גבוהה)</div>
        <div><kbd>J</kbd> / <kbd>X</kbd> הרבצה</div>
        <div><kbd>↓</kbd> + <kbd>J</kbd> באוויר — מכה למטה (אפשר לקפוץ ככה מעל אויבים ומעל קוצים!)</div>
        <div><kbd>K</kbd> / <kbd>Shift</kbd> דאש (צריך לקנות בחנות)</div>
        <div><kbd>Q</kbd> שתיית שיקוי (+50 חיים)</div>
        <div><kbd>↓</kbd> + <kbd>רווח</kbd> ירידה דרך פלטפורמה דקה</div>
        <div><kbd>Esc</kbd> עצירה · <kbd>M</kbd> סאונד</div>
      </div>
      <ul class="tips">
        <li>קפוץ כשאתה צמוד לקיר כדי לטפס עליו (פארקור!).</li>
        <li>דגלים הם נקודות שמירה – אם דן נופל הוא חוזר לדגל האחרון וגם החיים מתמלאים.</li>
        <li>אפשר להרביץ לחיצים ולכדורי אש של אויבים כדי להעיף אותם.</li>
        <li>לאבירים יש מגן – תקוף מאחור או מלמעלה. גובלינים מסתערים – תתחמק ותרביץ כשהם עייפים.</li>
        <li>בוסים שמסתערים לתוך קיר מסתחררים – ואז הם חוטפים נזק כפול!</li>
        <li>מדליה: זהב = בלי ליפול בכלל, כסף = עד 2 נפילות, ארד = סיימת.</li>
        <li>אספו מטבעות וקנו שריון, נשק, חיים, קפיצה כפולה ודאש. אפשר לשחק שוב שלבים כדי לאסוף עוד.</li>
      </ul>
      <button class="btn" id="bBack">חזרה</button>
    </div>`, 'title-bg');
  $('bBack').onclick = () => titleScreen();
}
function medalsScreen() {
  show(`
    <div class="panel">
      <h2>המדליות של ${esc(account)}</h2>
      <div class="medals">${MEDALS.map((m, i) => `<div class="mcell ${save.medals[i] ? '' : 'locked'}">${medalSVG(save.medals[i], m.sym, 56, !save.medals[i])}<span>${m.n}</span><small>${save.medals[i] ? tierName(save.medals[i]) + (save.best[i] ? ' · ' + fmtTime(save.best[i]) : '') : 'נעול'}</small></div>`).join('')}</div>
      <p class="who">מפלצות שחוסלו: <b>${save.kills}</b> · בוסים שהובסו: <b>${save.bosses}</b></p>
      <button class="btn" id="bBack">חזרה</button>
    </div>`, 'title-bg');
  $('bBack').onclick = () => titleScreen();
}
function fmtTime(fr) { const s = Math.floor(fr / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function mapScreen() {
  state = 'map'; setGameUI(false);
  show(`
    <div class="panel wide">
      <h2>מפת העולם</h2>
      <div class="map">${THEMES.map((th, i) => {
        const locked = i + 1 > save.unlocked;
        return `<button class="node ${locked ? 'locked' : ''}" data-l="${i}" ${locked ? 'disabled' : ''} style="--c1:${th.sky[0]};--c2:${th.top}">
          <span class="num">${i + 1}</span><span class="nm">${th.name}</span>
          <span class="boss">${locked ? '🔒' : '👹 ' + BOSSES[i].name}</span>
          ${save.medals[i] ? medalSVG(save.medals[i], MEDALS[i].sym, 30) : ''}
        </button>`;
      }).join('')}</div>
      <div class="row"><button class="btn" id="bShop">חנות 🛒 <span class="coin">🪙 ${save.coins}</span></button><button class="btn ghost" id="bBack">תפריט</button></div>
    </div>`, 'title-bg');
  scr.querySelectorAll('.node:not(.locked)').forEach(b => b.onclick = () => startLevel(+b.dataset.l));
  $('bShop').onclick = () => shopScreen(() => mapScreen());
  $('bBack').onclick = () => titleScreen();
}
function shopScreen(back, nextLevel) {
  state = 'shop'; setGameUI(false);
  const items = [];
  const nA = ARMORS[save.armor + 1], nW = WEAPONS[save.weapon + 1];
  items.push({ id: 'armor', icon: '🛡️', name: nA ? nA.n : ARMORS[save.armor].n, desc: nA ? `חוסם ${Math.round(nA.red * 100)}% מהנזק (עכשיו ${Math.round(ARMORS[save.armor].red * 100)}%)` : 'השריון הכי טוב!', price: nA ? nA.p : null, color: nA ? nA.body : ARMORS[save.armor].body });
  items.push({ id: 'weapon', icon: '⚔️', name: nW ? nW.n : WEAPONS[save.weapon].n, desc: nW ? `נזק ${nW.dmg} (עכשיו ${WEAPONS[save.weapon].dmg}), טווח ארוך יותר` : 'הנשק הכי חזק!', price: nW ? nW.p : null, color: nW ? nW.col : WEAPONS[save.weapon].col });
  items.push({ id: 'hp', icon: '❤️', name: 'לב נוסף', desc: save.hpLv < 5 ? `מקסימום חיים ${maxHP()} ← ${maxHP() + 25}` : 'מקסימום!', price: save.hpLv < 5 ? HP_PRICES[save.hpLv] : null });
  items.push({ id: 'dbl', icon: '🪽', name: 'קפיצה כפולה', desc: save.dbl ? 'כבר יש לך!' : 'קפוץ שוב באוויר', price: save.dbl ? null : DBL_PRICE });
  items.push({ id: 'dash', icon: '💨', name: 'דאש', desc: save.dash ? 'כבר יש לך! (K / Shift)' : 'זינוק מהיר שעובר דרך התקפות', price: save.dash ? null : DASH_PRICE });
  items.push({ id: 'potion', icon: '🧪', name: 'שיקוי חיים', desc: `+50 חיים (יש לך ${save.potions}/${MAX_POTIONS})`, price: save.potions < MAX_POTIONS ? POTION_PRICE : null });
  show(`
    <div class="panel wide">
      <h2>החנות של הנפח</h2>
      <p class="who">🪙 <b id="shopCoins">${save.coins}</b> מטבעות · שריון: ${ARMORS[save.armor].n} · נשק: ${WEAPONS[save.weapon].n}</p>
      <div class="shop">${items.map(it => `
        <div class="item ${it.price == null ? 'maxed' : save.coins < it.price ? 'poor' : ''}">
          <div class="ic" ${it.color ? `style="--ic:${it.color}"` : ''}>${it.icon}</div>
          <div class="info"><b>${it.name}</b><small>${it.desc}</small></div>
          ${it.price == null ? '<span class="tag">✔</span>' : `<button class="btn buy" data-id="${it.id}" ${save.coins < it.price ? 'disabled' : ''}>🪙 ${it.price}</button>`}
        </div>`).join('')}</div>
      <div class="row">${nextLevel != null ? `<button class="btn big" id="bNext">לשלב ${nextLevel + 1} ←</button>` : ''}<button class="btn ghost" id="bBack">חזרה</button></div>
    </div>`, 'title-bg');
  scr.querySelectorAll('.buy').forEach(b => b.onclick = () => { buy(b.dataset.id); shopScreen(back, nextLevel); });
  $('bBack').onclick = back;
  if (nextLevel != null) $('bNext').onclick = () => startLevel(nextLevel);
}
function buy(id) {
  const pay = p => { if (save.coins < p) return false; save.coins -= p; sfx('buy'); return true; };
  if (id === 'armor' && ARMORS[save.armor + 1] && pay(ARMORS[save.armor + 1].p)) { save.armor++; buildDan(); }
  if (id === 'weapon' && WEAPONS[save.weapon + 1] && pay(WEAPONS[save.weapon + 1].p)) save.weapon++;
  if (id === 'hp' && save.hpLv < 5 && pay(HP_PRICES[save.hpLv])) save.hpLv++;
  if (id === 'dbl' && !save.dbl && pay(DBL_PRICE)) save.dbl = true;
  if (id === 'dash' && !save.dash && pay(DASH_PRICE)) save.dash = true;
  if (id === 'potion' && save.potions < MAX_POTIONS && pay(POTION_PRICE)) save.potions++;
  persist();
}
function pauseScreen() {
  state = 'pause';
  show(`
    <div class="panel narrow">
      <h2>עצירה</h2>
      <p class="who">${THEMES[L.n].name} · נפילות: ${L.deaths} · ⏱ ${fmtTime(L.time)}</p>
      <div class="col">
        <button class="btn big" id="bRes">המשך</button>
        <button class="btn" id="bRestart">התחל שלב מחדש</button>
        <button class="btn" id="bMap">יציאה למפה</button>
      </div>
      <p class="hint small">המטבעות שאספת כבר נשמרו.</p>
    </div>`);
  $('bRes').onclick = resume;
  $('bRestart').onclick = () => startLevel(L.n);
  $('bMap').onclick = () => { persist(); mapScreen(); };
}
function resume() { hideScreen(); state = 'play'; setGameUI(true); }
function finishLevel() {
  const n = L.n;
  const tier = L.deaths === 0 ? 3 : L.deaths <= 2 ? 2 : 1;
  const prev = save.medals[n];
  save.medals[n] = Math.max(prev, tier);
  if (!save.best[n] || L.time < save.best[n]) save.best[n] = L.time;
  if (save.unlocked < n + 2 && n < 9) save.unlocked = n + 2;
  persist();
  state = 'medal'; setGameUI(false); sfx('medal');
  const last = n === 9;
  show(`
    <div class="panel narrow medal-screen">
      <h2>${BOSSES[n].name} הובס!</h2>
      <div class="medal-big">${medalSVG(tier, MEDALS[n].sym, 128)}</div>
      <h3>${MEDALS[n].n} — ${tierName(tier)}</h3>
      <p class="who">⏱ ${fmtTime(L.time)} · נפילות: ${L.deaths} · מפלצות: ${L.kills} · 🪙 +${L.coinsGot}</p>
      ${tier < 3 ? `<p class="hint">${tier === 2 ? 'סיים בלי ליפול בכלל כדי לקבל זהב!' : 'עד 2 נפילות = כסף, בלי נפילות = זהב'}</p>` : '<p class="hint">מושלם! דן אפילו לא התאמץ.</p>'}
      ${prev > tier ? `<p class="hint small">השיא שלך נשאר: ${tierName(prev)}</p>` : ''}
      <div class="col"><button class="btn big" id="bGo">${last ? 'סוף המשחק ←' : 'לחנות ולשלב הבא ←'}</button><button class="btn ghost" id="bMap">למפה</button></div>
    </div>`, 'title-bg');
  $('bGo').onclick = () => last ? endingScreen() : shopScreen(() => mapScreen(), n + 1);
  $('bMap').onclick = () => mapScreen();
}
function endingScreen() {
  show(`
    <div class="panel">
      <h1 class="title">ניצחון!</h1>
      <p class="sub">דן הביס את מלך המפלצות ואת כל המפלצות בעולם.<br>למה? כי בא לו.</p>
      <div class="medals">${MEDALS.map((m, i) => `<div class="mcell">${medalSVG(save.medals[i], m.sym, 48, !save.medals[i])}<small>${tierName(save.medals[i]) || '-'}</small></div>`).join('')}</div>
      <p class="who">אספת ${save.medals.filter(m => m === 3).length}/10 מדליות זהב. נסה להשיג את כולן!</p>
      <button class="btn big" id="bBack">למפה</button>
    </div>`, 'title-bg');
  $('bBack').onclick = () => mapScreen();
}

/* ---------------- level flow ---------------- */
function startLevel(n) {
  L = buildLevel(n);
  buildTiles(L.th, n * 31 + 7);
  buildDan();
  P.hp = maxHP(); resetPlayer(L.spawn); P.inv = 0; P.face = 1;
  updateCamera(true);
  hideScreen(); hideBossBar(); showDeath(false);
  hud.lvl.textContent = `שלב ${n + 1}: ${L.th.name}`;
  hudCache = {};
  state = 'play'; setGameUI(true);
  toast(`שלב ${n + 1} — ${L.th.name}`, 2200);
  if (!save.tips.start) { save.tips.start = 1; setTimeout(() => toast(TIPS.start, 5000), 2300); persist(); }
}

/* ---------------- main loop ---------------- */
let frame = 0, acc = 0, lastT = performance.now(), saveTimer = 0;
function tick() {
  if (state !== 'play') return;
  if (tapped('pause')) { pauseScreen(); return; }
  if (hitStop > 0) { hitStop--; return; }
  frame++; L.time++;
  updateWorld();
  updatePlayer();
  updateEnemies();
  updateBoss();
  updateProjectiles();
  updatePickups();
  updateParticles();
  updateCamera(false);
  if (++saveTimer > 600) { saveTimer = 0; persist(); }
}
function loop(now) {
  acc += Math.min(100, now - lastT); lastT = now;
  while (acc >= 1000 / 60) {
    tick();
    for (const k in pressedK) delete pressedK[k];
    acc -= 1000 / 60;
  }
  if (state === 'play' || state === 'pause') { render(); updateHUD(); }
  requestAnimationFrame(loop);
}

/* ---------------- resize ---------------- */
function fit() {
  const wrap = $('wrap');
  const s = Math.min(innerWidth / VW, innerHeight / VH);
  const scale = s >= 2 ? Math.floor(s) : s;
  wrap.style.width = VW * scale + 'px'; wrap.style.height = VH * scale + 'px';
  wrap.style.setProperty('--s', scale);
}
addEventListener('resize', fit);

/* ---------------- boot ---------------- */
buildEnemySprites();
fit(); setupTouch();
(function boot() {
  let cur = null; try { cur = sessionStorage.getItem(CUR_KEY); } catch (e) { }
  if (cur && accounts()[cur]) login(cur); else loginScreen();
  requestAnimationFrame(loop);
})();
addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseScreen(); });
