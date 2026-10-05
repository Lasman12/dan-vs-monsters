'use strict';
/* =========================================================
   Bosses: sprites, arenas and attacks.
   Every boss has its own arena layout and signature moves (data.js BOSSES).
   Bosses punish button-mashing with a shove, so dodging and timing matter.
   ========================================================= */

/* ---------------- sprites ---------------- */
const bossSprites = {};
const BOSS_SIZE = { blob: [36, 28], ogre: [26, 38], beast: [36, 26], skull: [24, 36], golem: [32, 38], bat: [30, 24], spider: [36, 22], mush: [30, 36], robot: [32, 38], squid: [32, 34], serpent: [26, 18] };
const FACES_RIGHT = { beast: 1, serpent: 1, robot: 1 };
function makeBossSprite(def) {
  const W = 44, H = 44;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const px = (i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
  const rect = (i, j, w, h, col) => { x.fillStyle = col; x.fillRect(i, j, w, h); };
  const ell = (cx, cy, rx, ry, col) => { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1) px(cx + i, cy + j, col); };
  const line = (x0, y0, x1, y1, col, th = 2) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) rect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), th, th, col); };
  const { c1, c2, eye } = def;
  const light = shade(c1, 40);
  switch (def.tpl) {
    case 'blob':
      ell(22, 28, 19, 14, c2); ell(22, 27, 18, 13, c1); ell(15, 22, 5, 3, light);
      rect(13, 24, 6, 6, '#fff'); rect(26, 24, 6, 6, '#fff'); rect(16, 26, 3, 4, '#1a1020'); rect(29, 26, 3, 4, '#1a1020');
      rect(17, 34, 11, 2, '#1a1020'); rect(18, 34, 2, 2, '#fff'); rect(25, 34, 2, 2, '#fff');
      break;
    case 'ogre':
      rect(12, 22, 20, 14, c1); rect(12, 32, 20, 4, c2);
      ell(22, 14, 8, 8, c1); rect(17, 12, 3, 3, eye); rect(25, 12, 3, 3, eye);
      rect(18, 18, 9, 2, '#1a1020'); px(19, 18, '#fff'); px(25, 18, '#fff');
      rect(6, 22, 6, 12, c1); rect(32, 22, 6, 12, c1); rect(5, 32, 8, 5, c2); rect(31, 32, 8, 5, c2);
      rect(14, 36, 6, 7, c2); rect(24, 36, 6, 7, c2); rect(14, 24, 16, 3, light);
      if (def.ghost) { for (let i = 0; i < 5; i++) rect(13 + i * 4, 40, 2, 3, c1); }
      break;
    case 'beast':
      ell(20, 28, 15, 9, c1); ell(20, 31, 14, 5, c2);
      ell(33, 20, 8, 7, c1); rect(34, 17, 3, 3, eye); rect(38, 24, 5, 2, '#fff');
      for (let i = 0; i < 6; i++) rect(8 + i * 4, 17 - (i % 2), 2, 4, c2);
      rect(9, 35, 4, 8, c2); rect(17, 35, 4, 8, c2); rect(25, 35, 4, 8, c2); rect(31, 35, 4, 8, c2);
      ell(4, 26, 4, 2, c2);
      break;
    case 'skull':
      rect(10, 24, 24, 18, c2); rect(12, 24, 20, 16, c1);
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
    case 'spider':
      for (let k = 0; k < 4; k++) { line(14, 28 + k * 2, 3, 34 + k * 3 - (k % 2) * 6, c2); line(3, 34 + k * 3 - (k % 2) * 6, 1 + k, 43, c2, 1); line(30, 28 + k * 2, 41, 34 + k * 3 - (k % 2) * 6, c2); line(41, 34 + k * 3 - (k % 2) * 6, 42 - k, 43, c2, 1); }
      ell(22, 30, 11, 8, c1); ell(22, 25, 7, 5, c2);
      rect(17, 23, 2, 2, eye); rect(21, 22, 2, 2, eye); rect(25, 23, 2, 2, eye); rect(19, 26, 2, 2, eye); rect(23, 26, 2, 2, eye);
      rect(19, 30, 2, 4, '#fff'); rect(24, 30, 2, 4, '#fff'); ell(18, 31, 3, 2, light);
      break;
    case 'mush':
      ell(22, 16, 20, 11, c2); ell(22, 15, 19, 10, c1);
      for (const [i, j, r] of [[12, 12, 3], [24, 9, 3], [33, 15, 2], [18, 19, 2], [29, 20, 2]]) ell(i, j, r, r, '#fff');
      rect(14, 25, 16, 16, '#f0e0c0'); rect(14, 25, 16, 2, '#d8c8a0');
      rect(17, 29, 3, 4, '#1a1020'); rect(24, 29, 3, 4, '#1a1020'); px(18, 29, eye); px(25, 29, eye);
      rect(19, 36, 6, 2, '#1a1020'); rect(9, 29, 5, 3, '#f0e0c0'); rect(30, 29, 5, 3, '#f0e0c0');
      break;
    case 'robot':
      rect(12, 4, 18, 12, c2); rect(13, 5, 16, 10, c1); rect(15, 8, 13, 3, '#1a1020'); rect(16 + (def.eyeX || 6), 8, 5, 3, eye);
      rect(21, 1, 2, 4, c2); rect(20, 0, 4, 2, eye);
      rect(9, 17, 26, 16, c2); rect(10, 18, 24, 14, c1); ell(22, 25, 5, 5, c2); ell(22, 25, 3, 3, light); rect(21, 22, 2, 6, c2);
      rect(34, 19, 9, 6, c2); rect(40, 20, 4, 4, '#1a1020'); rect(2, 19, 8, 10, c2); rect(3, 27, 6, 4, c1);
      rect(10, 34, 24, 8, '#2a2a30'); for (let i = 0; i < 6; i++) rect(11 + i * 4, 36, 2, 4, '#6a6a76');
      break;
    case 'squid':
      ell(22, 14, 14, 12, c2); ell(22, 13, 13, 11, c1); ell(16, 9, 4, 3, light);
      rect(15, 15, 5, 5, '#fff'); rect(25, 15, 5, 5, '#fff'); rect(17, 16, 3, 4, '#1a1020'); rect(27, 16, 3, 4, '#1a1020'); px(17, 16, eye); px(27, 16, eye);
      for (let k = 0; k < 6; k++) { const bx = 9 + k * 5; for (let j = 0; j < 16; j++) rect(bx + Math.round(Math.sin(j * 0.5 + k) * 2), 24 + j, 3, 1, j % 4 === 3 ? c2 : c1); }
      break;
    case 'serpent':
      ell(20, 22, 14, 9, c1); ell(20, 26, 13, 5, c2); rect(30, 20, 12, 6, c1); rect(32, 25, 10, 3, '#fff'); for (let i = 0; i < 4; i++) px(33 + i * 2, 25, '#1a1020');
      rect(24, 16, 4, 3, eye); rect(10, 12, 3, 6, light); rect(16, 10, 3, 6, light); rect(22, 11, 3, 5, light);
      line(4, 18, 0, 12, c2); line(6, 26, 1, 30, c2);
      break;
  }
  if (def.horns) { rect(12, 4, 3, 6, '#e8e4d8'); rect(30, 4, 3, 6, '#e8e4d8'); rect(11, 2, 2, 3, '#e8e4d8'); rect(32, 2, 2, 3, '#e8e4d8'); }
  if (def.crown) { const cy = def.tpl === 'blob' ? 10 : def.tpl === 'mush' ? -1 : 2; rect(15, cy + 3, 15, 4, '#ffcc33'); px(15, cy + 2, '#ffcc33'); px(22, cy + 1, '#ffcc33'); px(22, cy + 2, '#ffcc33'); px(29, cy + 2, '#ffcc33'); px(19, cy + 4, '#ff3050'); px(25, cy + 4, '#3fc8ff'); }
  return finishSprite(c);
}
let serpentSeg = null;
function bossSpriteFor(def) {
  const k = BOSSES.indexOf(def);
  if (!bossSprites[k]) bossSprites[k] = makeBossSprite(def);
  if (def.tpl === 'serpent' && !serpentSeg) {
    const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d');
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j <= 36) { x.fillStyle = j > 2 ? def.c2 : (i + j) % 4 === 0 ? shade(def.c1, -25) : def.c1; x.fillRect(8 + i, 8 + j, 1, 1); }
    serpentSeg = finishSprite(c);
  }
  return bossSprites[k];
}

/* ---------------- arenas ---------------- */
function buildArena(lv, a0, set, get) {
  const def = BOSSES[lv.n], A = lv.arena;
  const row = (y, c0, c1, tt) => { for (let x = c0; x <= c1; x++) set(a0 + x, y, tt); };
  const plat = (y, c0, c1) => row(y, c0, c1, 2);
  const shroom = col => lv.springs.push({ x: (a0 + col) * T, y: 17 * T + 8, w: 16, h: 8, t: 0, shroom: true });
  const std = () => { plat(15, 8, 12); plat(15, 21, 25); plat(12, 14, 18); };
  A.kind = def.arena; A.dark = false;
  switch (def.arena) {
    case 'meadow': std(); shroom(5); shroom(29); break;
    case 'cave': row(0, 4, 32, 1); row(1, 4, 32, 1); row(2, 4, 32, 1); row(3, 4, 32, 1); A.top = 4 * T; A.rocks = true; std(); break;
    case 'desert': row(18, 9, 10, 5); row(18, 23, 24, 5); plat(15, 7, 12); plat(15, 21, 26); plat(12, 15, 19); break;
    case 'swamp': plat(15, 6, 10); plat(15, 14, 18); plat(15, 22, 26); plat(12, 10, 13); plat(12, 19, 22); break;
    case 'ice': row(18, 4, 32, 10); std(); break;
    case 'castle': row(17, 4, 5, 3); row(17, 31, 32, 3); plat(12, 15, 18);
      lv.platforms.push(mkPlatform((a0 + 7) * T, 15 * T, 'x', 4 * T, 0)); lv.platforms.push(mkPlatform((a0 + 23) * T, 15 * T, 'x', 4 * T, Math.PI)); break;
    case 'volcano': row(18, 5, 9, 5); row(18, 27, 31, 5); plat(15, 5, 9); plat(15, 27, 31); plat(12, 12, 15); plat(12, 20, 23); break;
    case 'belfry': std(); plat(9, 9, 12); plat(9, 21, 24); break;
    case 'storm': row(17, 4, 5, 3); row(17, 31, 32, 3); row(15, 9, 13, 4); row(15, 20, 24, 4); plat(12, 14, 19); break;
    case 'throne': plat(15, 7, 11); plat(15, 22, 26); plat(12, 13, 20); break;
    case 'crystal': std(); A.dark = true; break;
    case 'jungle': shroom(7); shroom(17); shroom(27); plat(12, 11, 14); plat(12, 20, 23); plat(9, 15, 19); break;
    case 'factory': row(18, 4, 17, 11); row(18, 18, 32, 12); std(); break;
    case 'ruins': row(18, 4, 6, 5); row(18, 30, 32, 5); plat(15, 5, 9); plat(15, 27, 31); plat(15, 15, 19); plat(12, 10, 13); plat(12, 21, 24); break;
    case 'peaks': row(15, 8, 12, 4); row(15, 22, 26, 4); plat(12, 14, 19); plat(9, 9, 12); plat(9, 22, 25); break;
    case 'citadel': row(18, 4, 32, 10); std(); plat(9, 15, 17); break;
    case 'toxic': row(18, 8, 9, 5); row(18, 16, 17, 5); row(18, 24, 25, 5); plat(15, 7, 10); plat(15, 15, 18); plat(15, 23, 26); plat(12, 11, 14); plat(12, 19, 22); break;
    case 'ship': A.dark = true; plat(15, 7, 11); plat(15, 22, 26); plat(12, 14, 19); plat(9, 16, 17); break;
    case 'magma': row(18, 7, 9, 5); row(18, 15, 18, 5); row(18, 25, 27, 5); plat(15, 6, 10); plat(15, 14, 19); plat(15, 24, 28); plat(12, 11, 13); plat(12, 20, 22); break;
    case 'void': row(0, 4, 32, 1); row(1, 4, 32, 1); row(2, 4, 32, 1); A.top = 3 * T; std(); plat(6, 9, 12); plat(6, 22, 25); break;
    default: std();
  }
}

/* ---------------- boss lifecycle ---------------- */
function bossHP(n) { return n < PER_WORLD ? 260 + n * 190 + Math.max(0, n - 4) ** 2 * 60 : 2600 + (n - PER_WORLD) * 450; }
function mkBoss(def, x, y, hp) {
  const sz = BOSS_SIZE[def.tpl];
  return { def, w: sz[0], h: sz[1], x, y, vx: 0, vy: 0, hp, max: hp, state: 'intro', t: 90, sub: '', count: 0, face: -1, flash: 0, phase: 1, onGround: false, last: '', alpha: 1, hitBy: null,
    dmg: Math.round(22 * (1 + 0.15 * L.n) * (L.n >= PER_WORLD ? 1.1 : 1)), anim: 0, stun: 0, ghost: false, hidden: false, guard: false, hits: [], shards: null, trail: [], pathT: 0 };
}
function startBoss() {
  const A = L.arena; A.active = true;
  for (let y = 0; y < ROWS - 2; y++) if (tileAt(A.gateX, y) === 0) setTile(A.gateX, y, 7);
  L.safe = { x: A.left + 24, y: A.floor - P.h };
  const def = BOSSES[L.n];
  const sz = BOSS_SIZE[def.tpl];
  const hp = Math.round(bossHP(L.n) * (def.hpMul || 1) * (L.n >= PER_WORLD ? 1.15 : 1) * (L.hard ? 1.4 : 1));
  const b = mkBoss(def, L.bossSpawn.x, def.fly ? A.floor - 120 - sz[1] : L.bossSpawn.y - sz[1], hp);
  if (def.shards) b.shards = [0, 1, 2, 3].map(i => ({ alive: true, a: i * Math.PI / 2, regrow: 0 }));
  L.bosses = [b]; L.bossMax = hp;
  A.flood = null; A.shrink = null; A.gust = null; A.fx = []; A.rockT = 200; A.shoveTold = false;
  sfx('boss'); cam.shake = 10; buzz([60, 40, 60]);
  playMusic(L.n >= PER_WORLD ? 'boss2' : 'boss1');
  showBossBar(loc(def.name));
  toast('⚔ ' + loc(def.name) + ' ⚔', 2500);
}
function resetBossFight() {
  const A = L.arena;
  A.active = false; A.flood = null; A.shrink = null; A.gust = null; A.fx = [];
  for (let y = 0; y < ROWS - 2; y++) if (tileAt(A.gateX, y) === 7) setTile(A.gateX, y, 0);
  L.bosses = []; L.enemies = L.enemies.filter(e => !e.minion);
  L.projectiles = []; L.warnings = []; L.ink = 0; P.gflip = 0;
  hideBossBar();
  playMusic('lvl' + L.n);
}
function bossAlive() { return L.bosses.some(b => !b.clone && b.state !== 'dying'); }
const bossBox = b => ({ x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 2 });

/* ---------------- damage ---------------- */
function bossHitTest(box, dmg, key) {
  let hit = false;
  const A = L.arena;
  for (const b of L.bosses) {
    if (b.dead || b.state === 'dying') continue;
    // orbiting crystal shards protect the golem: smash them first
    if (b.shards) for (const s of b.shards) if (s.alive) { const sx = b.x + b.w / 2 + Math.cos(s.a) * 30 - 5, sy = b.y + b.h / 2 + Math.sin(s.a) * 22 - 5; if (overlap(box, { x: sx, y: sy, w: 10, h: 10 })) { s.alive = false; s.regrow = 420; burst(sx + 5, sy + 5, 10, ['#8ae0ff', '#fff'], 2.5); sfx('clang'); hit = true; } }
    // the serpent's body is armored, only the head takes damage
    if (b.def.tpl === 'serpent') for (let i = 1; i <= 6; i++) { const p = b.trail[i * 7]; if (p && overlap(box, { x: p.x - 7, y: p.y - 7, w: 14, h: 14 })) { if (b.hitBy !== key) { sfx('clang'); burst(p.x, p.y, 4, ['#fff'], 1.5); } hit = true; } }
    if (b.hidden || b.alpha < 0.5 || b.hitBy === key || !overlap(box, bossBox(b))) continue;
    b.hitBy = key;
    if (damageBoss(b, dmg)) { hit = true; const th = onHitLanded(b.x, b.y, true); if (th) { lightningFx(b.x + b.w / 2, b.y); damageBoss(b, th); } }
    else hit = true;
  }
  // kraken tentacles: hitting them hurts the kraken
  if (A && A.fx) for (const f of A.fx) if (f.type === 'tent' && f.h > 20 && f.hitBy !== key && overlap(box, { x: f.x - 7, y: A.floor - f.h, w: 14, h: f.h })) {
    f.hitBy = key; const b = L.bosses.find(o => !o.clone); if (b) damageBoss(b, Math.round(dmg * 0.6)); burst(f.x, A.floor - f.h / 2, 6, [b ? b.def.c1 : '#fff', '#fff'], 2); hit = true;
  }
  return hit;
}
function damageBoss(b, dmg) {
  if (b.state === 'intro' || b.state === 'dying' || b.hidden) return false;
  if (b.shards && b.shards.some(s => s.alive)) { sfx('clang'); burst(b.x + b.w / 2, b.y + b.h / 2, 5, ['#8ae0ff', '#fff'], 2); return false; }
  if (b.clone) { b.dead = true; burst(b.x + b.w / 2, b.y + b.h / 2, 16, [b.def.c1, '#fff'], 2.5); sfx('crumble'); return true; }
  if (b.guard) {
    const front = sign((P.x + P.w / 2) - (b.x + b.w / 2)) === b.face;
    if (front) { sfx('clang'); burst(b.x + b.w / 2 + b.face * 12, b.y + 14, 8, ['#ffd54a', '#fff'], 2); toast(t('blocked'), 1200); b.guard = false; setMove(b, 'combo'); P.vx = -P.face * 3; return false; }
    dmg *= 2;
  }
  const d = Math.round(b.stun > 0 ? dmg * 2 : dmg);
  b.hp -= d; b.flash = 6; buzz(15);
  floatText(b.x + b.w / 2, b.y - 4, (b.stun > 0 || b.guard ? '×2 ' : '') + d, b.stun > 0 ? '#ffd54a' : '#fff');
  sfx('hit'); burst(b.x + b.w / 2, b.y + b.h / 2, 6, ['#fff', b.def.c1], 2.5);
  // mashing the attack button gets punished with a shove
  b.hits.push(frame); b.hits = b.hits.filter(f => frame - f < 80);
  if (b.hits.length >= 6 && !['stunned', 'shove', 'dying', 'intro'].includes(b.state) && !b.stun) { b.hits = []; b.queueShove = true; }
  const alive = L.bosses.filter(o => !o.clone);
  const frac = alive.reduce((a, o) => a + Math.max(0, o.hp), 0) / L.bossMax;
  const ph = frac <= 0.25 ? 3 : frac <= 0.5 ? 2 : 1;
  for (const o of alive) if (ph > o.phase) {
    o.phase = ph;
    if (o === b) { toast(t(ph === 2 ? 'angry' : 'furious', loc(b.def.name)), 2000); cam.shake = 12 + ph * 2; sfx('boss'); }
  }
  if (b.hp <= 0) { b.hp = 0; b.state = 'dying'; b.t = 150; b.vx = 0; b.alpha = 1; b.hidden = false; b.ghost = false; b.guard = false; sfx('kill'); if (!bossAlive()) clearBossHazards(); }
  return true;
}
function clearBossHazards() {
  L.projectiles = L.projectiles.filter(p => p.mine); L.warnings = [];
  L.enemies.forEach(e => { if (e.minion) { e.dead = true; burst(e.x, e.y, 6, ['#fff'], 2); } });
  L.bosses.forEach(o => { if (o.clone) o.dead = true; });
  const A = L.arena; A.fx = []; A.flood = null; A.gust = null; L.ink = 0; P.gflip = 0;
}

/* ---------------- attacks ---------------- */
function bossShoot(b, n, spread, speed, extra = {}) {
  const bx = b.x + b.w / 2, by = b.y + b.h * 0.35;
  const base = Math.atan2(P.y + P.h / 2 - by, P.x + P.w / 2 - bx);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * spread;
    L.projectiles.push(Object.assign({ kind: 'orb', col: b.def.eye, x: bx - 4, y: by - 4, w: 8, h: 8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: b.dmg, life: 260 }, extra));
  }
  sfx('shoot');
}
function shockwaves(b, small) {
  const y = L.arena.floor - (small ? 9 : 12);
  for (const d of [-1, 1]) L.projectiles.push({ kind: 'wave', col: b.def.c1, x: b.x + b.w / 2 - 6, y, w: 12, h: small ? 9 : 12, vx: d * (b.phase >= 2 ? 3.8 : 3.2), vy: 0, dmg: b.dmg, life: 200, parry: false, ground: true });
  sfx('slam'); cam.shake = 10;
}
function addFx(f) { L.arena.fx.push(f); return f; }
function arenaX(margin = 20) { const A = L.arena; return A.left + margin + Math.random() * (A.right - A.left - margin * 2); }
function setMove(b, m) {
  b.state = m; b.last = m; b.count = 0; b.t = 0; b.sub = '';
  const M = MOVES[m]; if (M && M.start) M.start(b);
}
function movePool(b) {
  const d = b.def;
  let opts = [...d.moves, ...(b.phase >= 2 ? d.p2 || [] : []), ...(b.phase >= 3 ? d.p3 || [] : [])];
  const A = L.arena;
  opts = opts.filter(m => {
    if (m === 'summon') return L.enemies.filter(e => e.minion).length < 3;
    if (m === 'flood' || m === 'lavaRise') return !A.flood;
    if (m === 'shrink') return !A.shrink;
    if (m === 'split') return !b.didSplit && !b.twin;
    if (m === 'clones') return !L.bosses.some(o => o.clone);
    if (m === 'gravity') return P.gflip <= 0;
    if (m === 'shards') return b.shards && b.shards.some(s => s.alive);
    if (m === 'ink') return L.ink <= 0;
    return true;
  });
  // one-off phase moves happen right away
  for (const once of ['split', 'shrink']) if (opts.includes(once)) return [once];
  const fresh = opts.filter(m => m !== b.last);
  return fresh.length ? fresh : opts.length ? opts : ['shoot'];
}

const MOVES = {
  idle: { update(b, c) { b.face = sign(c.dx) || b.face; b.vx *= 0.8; if (c.fly) hover(b, c); if (--b.t <= 0) { const p = movePool(b); setMove(b, p[(Math.random() * p.length) | 0]); } } },
  hop: { start(b) { b.count = b.phase >= 2 ? 4 : 3; }, update(b, c) { if (b.onGround) { b.vx = 0; if (b.t-- <= 0) { if (b.count-- <= 0) return toIdle(b, c, 50); b.vy = -8.5; b.vx = clamp(c.dx / 45, -3.2, 3.2) * c.sp; b.t = 14; b.onGround = false; } } }, land(b) { cam.shake = 5; sfx('slam'); if (b.phase >= 2 || L.n >= 2) shockwaves(b, true); } },
  charge: { start(b) { b.t = 40; b.sub = 'wind'; b.face = sign(P.x - b.x) || b.face; }, update(b, c) { if (b.sub === 'wind') { b.vx = 0; if (--b.t <= 0) b.sub = 'run'; } else { b.vx = b.face * 5 * c.sp; if (b.anim % 3 === 0) L.particles.push(dust(b.x + b.w / 2, b.y + b.h)); } } },
  slam: { start(b) { b.sub = 'up'; }, update(b, c) { if (b.sub === 'up' && b.onGround) { b.vy = -11; b.vx = clamp(c.dx / 52, -5, 5); b.sub = 'air'; b.onGround = false; } }, land(b, c) { shockwaves(b); toIdle(b, c, 55); } },
  shoot: { start(b) { b.count = b.phase >= 2 ? 4 : 3; b.t = 20; }, update(b, c) { b.face = sign(c.dx) || b.face; b.vx *= 0.8; if (c.fly) hover(b, c); if (--b.t <= 0) { if (b.count-- <= 0) return toIdle(b, c, 50); bossShoot(b, Math.min(7, 3 + Math.floor(L.n / 4) + (b.phase >= 2 ? 2 : 0)), 0.26, 2.6 * c.sp); b.t = c.wait(32); } } },
  sting: { start(b) { b.count = 2; b.t = 20; }, update(b, c) { b.face = sign(c.dx) || b.face; b.vx = 0; if (--b.t <= 0) { if (b.count-- <= 0) return toIdle(b, c, 50); bossShoot(b, 3, 0.3, 2.8 * c.sp, { col: '#90ff40', poison: 180 }); b.t = 36; } } },
  rain: { update(b, c) { b.vx *= 0.8; if (c.fly) hover(b, c); if (++b.t === 1) { const n = 8 + Math.min(10, L.n) + (b.phase >= 2 ? 4 : 0); for (let i = 0; i < n; i++) L.warnings.push({ x: arenaX(8), t: 50 + i * 6, col: b.def.c1, dmg: b.dmg }); } if (b.t > 120) toIdle(b, c, 45); } },
  summon: { start(b) { b.t = 40; }, update(b, c) {
    b.vx *= 0.8; if (c.fly) hover(b, c);
    if (--b.t <= 0) {
      const pool = enemyPool(L.n).filter(k => !['N', 'K', 'U', 'R', 'brute', 'shaman', 'spear', 'bomb'].includes(k)); if (!pool.length) pool.push('S');
      for (let i = 0; i < (b.phase >= 2 ? 3 : 2); i++) {
        const k = pool[(Math.random() * pool.length) | 0];
        const e = mkEnemy(k, b.x + b.w / 2 - 8 + (i - 1) * 34, L.arena.floor - T - (EDEF[k].fly ? 40 : 0), L.n); e.minion = true; e.coins = 1; e.state = k === 'B' ? 'chase' : 'idle'; e.t = 60;
        e.x = clamp(e.x, L.arena.left + 4, L.arena.right - 20); L.enemies.push(e); burst(e.x + 6, e.y + 6, 10, ['#fff', b.def.c1], 2);
      }
      toIdle(b, c, 60);
    } } },
  teleport: { start(b) { b.sub = 'out'; b.t = 30; }, update(b, c) {
    b.vx = 0;
    if (b.sub === 'out') { b.alpha = b.t / 30; if (--b.t <= 0) { teleportNear(b, c); b.sub = 'in'; b.t = 30; } }
    else { b.alpha = 1 - b.t / 30; if (--b.t <= 0) { b.alpha = 1; setMove(b, 'shoot'); b.count = 1; b.t = 40; } } } },
  swoop: { start(b) { b.sub = 'aim'; b.t = 35; }, update(b, c) {
    if (b.sub === 'aim') { b.vx *= 0.9; b.face = sign(c.dx) || b.face; if (--b.t <= 0) { const a = Math.atan2(P.y - b.y, P.x - b.x); b.vx = Math.cos(a) * 5 * c.sp; b.vy = Math.sin(a) * 5 * c.sp; b.sub = 'dive'; b.t = 60; } }
    else if (b.sub === 'dive') { if (--b.t <= 0 || b.y + b.h >= L.arena.floor - 2) { b.sub = 'rest'; b.t = 70; b.vx = b.vy = 0; cam.shake = 6; sfx('slam'); } }
    else if (b.sub === 'rest') { b.vx = 0; b.vy = b.y + b.h < L.arena.floor ? 3 : 0; if (--b.t <= 0) b.sub = 'up'; }
    else { b.vx *= 0.9; b.vy = -2.5; if (b.y <= c.hoverY) { b.vy = 0; toIdle(b, c, 50); } } } },
  stunned: { update(b) { b.vx = 0; if (--b.t <= 0) { b.state = 'idle'; b.t = 30; } } },
  // ---------- signature moves ----------
  web: { start(b) { b.count = 3; b.t = 15; }, update(b, c) { b.vx = 0; b.face = sign(c.dx) || b.face; if (--b.t <= 0) { if (b.count-- <= 0) return toIdle(b, c, 45); bossShoot(b, 3, 0.35, 2.4 * c.sp, { kind: 'orb', col: '#e8e8f0', w: 9, h: 9, grav: 0.06, slow: 120, dmg: Math.round(b.dmg * 0.5) }); b.t = 30; } } },
  ceiling: { start(b) { b.sub = 'up'; b.ghost = true; b.vy = -9; }, update(b, c) {
    const A = L.arena;
    if (b.sub === 'up') { b.vx = 0; b.vy = -9; if (b.y < A.top - 70) { b.sub = 'track'; b.t = 80; b.hidden = true; b.vy = 0; } }
    else if (b.sub === 'track') { if (b.t > 18) b.x += (P.x + P.w / 2 - b.w / 2 - b.x) * 0.08; b.x = clamp(b.x, A.left, A.right - b.w); if (--b.t <= 0) { b.sub = 'drop'; b.hidden = false; b.y = A.top - 40; b.vy = 11; } }
    else if (b.sub === 'drop') { b.vy = 11; if (b.y + b.h >= A.floor) { b.y = A.floor - b.h; b.ghost = false; b.vy = 0; shockwaves(b); cam.shake = 14; toIdle(b, c, 55); } } },
    draw(b) { if (b.sub === 'track') { const A = L.arena; const w = b.w * (1 - b.t / 120); ctx.globalAlpha = 0.45; drawRectW(b.x + b.w / 2 - w / 2, A.floor - 4, w, 4, '#000'); ctx.globalAlpha = 1; if (b.t < 30 && frame % 6 < 3) drawRectW(b.x + b.w / 2 - 1, A.top, 2, A.floor - A.top, '#ff3030'); } } },
  burrow: { start(b) { b.sub = 'down'; b.t = 30; b.ghost = true; }, update(b, c) {
    const A = L.arena;
    if (b.sub === 'down') { b.vx = 0; b.vy = 0; b.y += 1.3; b.alpha = Math.max(0, b.t / 30); if (--b.t <= 0) { b.sub = 'under'; b.t = 110; b.hidden = true; } }
    else if (b.sub === 'under') {
      if (b.t > 28) b.x += clamp(P.x + P.w / 2 - (b.x + b.w / 2), -2.3 * c.sp, 2.3 * c.sp);
      b.x = clamp(b.x, A.left, A.right - b.w);
      if (b.anim % (b.t < 28 ? 1 : 4) === 0) L.particles.push({ x: b.x + b.w / 2 + rnd(-10, 10), y: A.floor - 2, vx: rnd(-1, 1), vy: -rnd(0.5, b.t < 28 ? 3 : 1.2), life: 20, max: 20, col: L.th.top, s: 2, g: 0.1 });
      if (b.t < 28) cam.shake = 3;
      if (--b.t <= 0) { b.sub = 'erupt'; b.hidden = false; b.alpha = 1; b.y = A.floor - b.h * 0.4; b.vy = -10; b.t = 12; sfx('slam'); }
    } else if (b.sub === 'erupt') { if (--b.t <= 0) { b.ghost = false; b.sub = 'air'; } } },
    land(b, c) { if (b.sub === 'air') { shockwaves(b, true); toIdle(b, c, 50); } } },
  bubbles: { update(b, c) { b.vx = 0; if (++b.t === 20) { for (let i = 0; i < 3 + (b.phase >= 2 ? 1 : 0); i++) L.projectiles.push({ kind: 'bubble', col: '#b0ff60', x: b.x + b.w / 2 - 6 + (i - 1) * 14, y: b.y, w: 12, h: 12, vx: (i - 1) * 0.8, vy: -1, homing: 0.035, dmg: b.dmg, life: 300, ghost: true, poison: 90 }); sfx('magic'); } if (b.t > 50) toIdle(b, c, 60); } },
  flood: { update(b, c) { b.vx = 0; startFlood(b.def.arena === 'swamp' || b.def.arena === 'toxic' ? 'poison' : 'water'); toIdle(b, c, 40); } },
  lavaRise: { update(b, c) { b.vx = 0; startFlood('lava'); toIdle(b, c, 40); } },
  breath: { start(b) { b.sub = 'aim'; b.t = 36; b.face = sign(P.x - b.x) || b.face; const m = mouth(b); b.ang = Math.atan2(P.y + P.h / 2 - m.y, P.x + P.w / 2 - m.x); }, update(b, c) {
    b.vx = 0; const m = mouth(b), frost = b.def.breath === 'frost';
    if (b.sub === 'aim') { if (b.t > 12) { b.ang = Math.atan2(P.y + P.h / 2 - m.y, P.x + P.w / 2 - m.x); b.face = sign(Math.cos(b.ang)) || b.face; } if (--b.t <= 0) { b.sub = 'fire'; b.t = 70; sfx(frost ? 'freeze' : 'explode'); } }
    else {
      for (let k = 0; k < 3; k++) { const d = rnd(10, 160); L.particles.push({ x: m.x + Math.cos(b.ang) * d + rnd(-6, 6), y: m.y + Math.sin(b.ang) * d + rnd(-6, 6), vx: Math.cos(b.ang) * 2, vy: Math.sin(b.ang) * 2, life: 10, max: 10, col: frost ? (Math.random() < 0.5 ? '#bfe8ff' : '#fff') : (Math.random() < 0.5 ? '#ff6a1a' : '#ffd040'), s: 3 }); }
      const px = P.x + P.w / 2 - m.x, py = P.y + P.h / 2 - m.y, along = px * Math.cos(b.ang) + py * Math.sin(b.ang), off = Math.abs(-px * Math.sin(b.ang) + py * Math.cos(b.ang));
      if (along > 0 && along < 165 && off < 13) { if (hurtPlayer(b.dmg, m.x) && frost) { P.slowT = 130; sfx('freeze'); } }
      if (--b.t <= 0) toIdle(b, c, 50);
    } },
    draw(b) { if (b.sub === 'aim') { const m = mouth(b); ctx.globalAlpha = 0.35 + (b.t < 12 ? 0.3 : 0); ctx.strokeStyle = b.def.breath === 'frost' ? '#bfe8ff' : '#ff5a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(m.x - cam.x, m.y - cam.y); ctx.lineTo(m.x + Math.cos(b.ang) * 165 - cam.x, m.y + Math.sin(b.ang) * 165 - cam.y); ctx.stroke(); ctx.globalAlpha = 1; } } },
  flyBreath: { start(b) { b.sub = 'rise'; b.ghost = true; b.flyMode = true; b.side = P.x < (L.arena.left + L.arena.right) / 2 ? 1 : -1; }, update(b, c) {
    const A = L.arena; const tx = b.side > 0 ? A.right - b.w - 10 : A.left + 10, ty = A.top + 16;
    if (b.sub === 'rise') { b.x += (tx - b.x) * 0.06; b.y += (ty - b.y) * 0.08; b.vx = b.vy = 0; b.face = -b.side; if (Math.abs(tx - b.x) < 6 && Math.abs(ty - b.y) < 6) { b.sub = 'sweep'; b.t = 0; } }
    else if (b.sub === 'sweep') {
      b.x -= b.side * 2.1 * c.sp; b.t++;
      const on = (b.t % 64) < 40;
      if (on) {
        for (let k = 0; k < 3; k++) L.particles.push({ x: b.x + b.w / 2 + rnd(-8, 8), y: b.y + b.h + rnd(0, A.floor - b.y - b.h), vx: rnd(-0.5, 0.5), vy: 2, life: 10, max: 10, col: Math.random() < 0.5 ? '#ff6a1a' : '#ffd040', s: 3 });
        if (overlap(P, { x: b.x + b.w / 2 - 11, y: b.y + b.h, w: 22, h: A.floor - b.y - b.h })) hurtPlayer(b.dmg, b.x + b.w / 2);
      }
      if ((b.side > 0 && b.x <= A.left + 8) || (b.side < 0 && b.x >= A.right - b.w - 8)) { b.sub = 'land'; b.ghost = false; b.flyMode = false; }
    } else { /* falling back to the floor */ } },
    land(b, c) { if (b.sub === 'land') { cam.shake = 8; sfx('slam'); toIdle(b, c, 45); } } },
  pillars: { start(b) { b.count = 4 + b.phase; b.t = 10; }, update(b, c) { b.vx = 0; if (--b.t <= 0) { if (b.count-- <= 0) return toIdle(b, c, 40); addFx({ type: 'pillar', x: clamp(P.x + P.w / 2, L.arena.left + 8, L.arena.right - 8), t: 0, warn: 36, col: b.def.c1, dmg: b.dmg }); b.t = Math.round(28 / c.sp); } } },
  block: { start(b) { b.t = 110; b.guard = true; }, update(b, c) { b.vx = 0; b.face = sign(c.dx) || b.face; if (--b.t <= 0) { b.guard = false; toIdle(b, c, 25); } } },
  combo: { start(b) { b.count = 3; b.sub = 'tel'; b.t = 18; b.guard = false; }, update(b, c) {
    if (b.sub === 'tel') { b.vx = 0; b.face = sign(P.x + P.w / 2 - (b.x + b.w / 2)) || b.face; if (--b.t <= 0) { b.sub = 'dash'; b.t = 14; sfx('dash'); } }
    else { b.vx = b.face * 6.2 * c.sp; if (b.anim % 2 === 0) L.particles.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 0, vy: 0, life: 12, max: 12, col: b.def.c1, s: 4 }); if (--b.t <= 0) { b.vx = 0; if (--b.count <= 0) return toIdle(b, c, 45); b.sub = 'tel'; b.t = 12; } } },
    draw(b) { if (b.sub === 'tel' && frame % 4 < 2) { ctx.globalAlpha = 0.5; drawRectW(b.x - 3, b.y - 3, b.w + 6, b.h + 6, '#ff3030'); ctx.globalAlpha = 1; } } },
  boomerang: { update(b, c) { b.vx = 0; if (++b.t === 15) { addFx({ type: 'blade', ox: b.x + b.w / 2, y: b.y + b.h * 0.5, dir: b.face, t: 0, dmg: b.dmg }); if (b.phase >= 3) addFx({ type: 'blade', ox: b.x + b.w / 2, y: L.arena.floor - 10, dir: b.face, t: -20, dmg: b.dmg }); sfx('swing'); } if (b.t > 40) toIdle(b, c, 50); } },
  screech: { update(b, c) { b.vx *= 0.9; if (c.fly) hover(b, c); b.t++; if (b.t === 30 || (b.phase >= 3 && b.t === 60)) { addFx({ type: 'ring', x: b.x + b.w / 2, y: b.y + b.h / 2, r: 0, max: 170, dmg: b.dmg, col: b.def.eye }); sfx('laser'); cam.shake = 6; } if (b.t > 80) toIdle(b, c, 50); },
    draw(b) { if (b.t < 30 && frame % 4 < 2) { ctx.globalAlpha = 0.4; drawRectW(b.x - 4, b.y - 4, b.w + 8, b.h + 8, b.def.eye); ctx.globalAlpha = 1; } } },
  lightning: { update(b, c) {
    b.vx *= 0.8; if (c.fly) hover(b, c);
    if (++b.t === 1) { const n = 3 + b.phase; for (let i = 0; i < n; i++) addFx({ type: 'bolt', x: i === 0 ? P.x + P.w / 2 : arenaX(16), t: -i * 10, warn: 50, dmg: b.dmg }); }
    if (b.t > 100) toIdle(b, c, 40); } },
  gust: { update(b, c) { b.vx = 0; const A = L.arena; A.gust = { dir: sign(P.x + P.w / 2 - (A.left + A.right) / 2) || 1, t: 200, warn: 45 }; toast(t('wind'), 1200); sfx('alarm'); toIdle(b, c, 40); } },
  shrink: { update(b, c) { const A = L.arena; A.shrink = { l: A.left, r: A.right, tl: A.left + 88, tr: A.right - 88 }; toast(t('furious', loc(b.def.name)), 1500); sfx('alarm'); cam.shake = 10; toIdle(b, c, 30); } },
  shards: { update(b, c) {
    b.vx = 0;
    if (++b.t === 30) { for (const s of b.shards) if (s.alive) { s.alive = false; s.regrow = 360 + Math.random() * 120; const sx = b.x + b.w / 2 + Math.cos(s.a) * 30, sy = b.y + b.h / 2 + Math.sin(s.a) * 22, a = Math.atan2(P.y + 7 - sy, P.x + 5 - sx); L.projectiles.push({ kind: 'shard', col: '#8ae0ff', x: sx - 5, y: sy - 5, w: 10, h: 10, vx: Math.cos(a) * 3.4, vy: Math.sin(a) * 3.4, dmg: b.dmg, life: 200, ghost: true }); } sfx('shoot'); cam.shake = 5; }
    if (b.t > 60) toIdle(b, c, 50); },
    draw(b) { if (b.t < 30 && frame % 4 < 2) { ctx.globalAlpha = 0.4; drawRectW(b.x - 6, b.y - 6, b.w + 12, b.h + 12, '#8ae0ff'); ctx.globalAlpha = 1; } } },
  spores: { update(b, c) { b.vx = 0; if (++b.t === 20) { const n = 3 + b.phase; for (let i = 0; i < n; i++) addFx({ type: 'cloud', x: b.x + b.w / 2, y: b.y + 6, vx: rnd(-1.6, 1.6), vy: rnd(-1.2, -0.2), r: 18, life: 330, dmg: Math.round(b.dmg * 0.4), col: b.def.arena === 'toxic' ? '#90ff40' : '#d090ff' }); sfx('magic'); } if (b.t > 50) toIdle(b, c, 50); } },
  laser: { start(b) { b.count = b.phase >= 3 ? 2 : 1; b.sub = 'aim'; b.t = 45; b.low = Math.random() < 0.5; }, update(b, c) {
    b.vx = 0; b.face = sign(c.dx) || b.face;
    if (b.sub === 'aim') { if (--b.t <= 0) { b.sub = 'fire'; b.t = 40; sfx('laser'); cam.shake = 5; } }
    else { const ly = laserY(b); if (overlap(P, { x: L.arena.left, y: ly - 4, w: L.arena.right - L.arena.left, h: 8 })) hurtPlayer(b.dmg, b.x); if (--b.t <= 0) { if (--b.count <= 0) return toIdle(b, c, 45); b.low = !b.low; b.sub = 'aim'; b.t = 26; } } },
    draw(b) { const A = L.arena, ly = laserY(b); if (b.sub === 'aim') { if (frame % 4 < 3) { ctx.globalAlpha = 0.6; drawRectW(A.left, ly, A.right - A.left, 1, '#ff3030'); ctx.globalAlpha = 1; } } else { drawRectW(A.left, ly - 4, A.right - A.left, 8, '#ff3030'); drawRectW(A.left, ly - 2, A.right - A.left, 4, '#ffffff'); } } },
  rockets: { update(b, c) { b.vx = 0; if (++b.t % 22 === 0 && b.t <= 22 * (b.phase >= 3 ? 3 : 2)) { L.projectiles.push({ kind: 'rocket', x: b.x + b.w / 2 + b.face * 14, y: b.y + 10, w: 10, h: 6, vx: b.face * 1.5, vy: -2.2, homing: 0.045, dmg: b.dmg, life: 260 }); sfx('shoot'); } if (b.t > 90) toIdle(b, c, 45); } },
  tentacles: { update(b, c) { b.vx = 0; if (++b.t === 1) { const n = 3 + b.phase; const xs = [P.x + P.w / 2]; for (let i = 1; i < n; i++) { let x, k = 0; do { x = arenaX(24); } while (xs.some(o => Math.abs(o - x) < 40) && ++k < 20); xs.push(x); } xs.forEach((x, i) => addFx({ type: 'tent', x, t: -i * 8, warn: 45, h: 0, dmg: b.dmg, col: b.def.c1 })); } if (b.t > 70) toIdle(b, c, 60); } },
  ink: { update(b, c) { L.ink = 280; sfx('magic'); toIdle(b, c, 30); } },
  serpent: { start(b) { b.sub = 'aim'; b.t = 30; }, update(b, c) {
    if (b.sub === 'aim') { serpentPath(b, c); if (--b.t <= 0) { const a = Math.atan2(P.y + 7 - (b.y + b.h / 2), P.x + 5 - (b.x + b.w / 2)); b.vx = Math.cos(a) * 5 * c.sp; b.vy = Math.sin(a) * 5 * c.sp; b.sub = 'dive'; b.t = 70; } }
    else if (b.sub === 'dive') { b.x += b.vx; b.y += b.vy; b.face = sign(b.vx) || b.face; if (--b.t <= 0 || b.y + b.h >= L.arena.floor - 4) { b.sub = 'back'; b.t = 60; } }
    else { const p = pathPoint(b); b.x += (p.x - b.x) * 0.06; b.y += (p.y - b.y) * 0.06; if (--b.t <= 0) toIdle(b, c, 40); } } },
  clones: { update(b, c) {
    b.vx = 0;
    if (++b.t === 20) {
      const spots = [arenaX(30), arenaX(30), arenaX(30)];
      spots.forEach((x, i) => {
        const y = L.arena.floor - b.h;
        if (i === 0) { b.x = x - b.w / 2; burst(x, y + b.h / 2, 12, [b.def.c1, '#fff'], 2); return; }
        const cl = mkBoss(b.def, x - b.w / 2, b.def.fly ? b.y : y, 1); cl.clone = true; cl.state = 'cloneIdle'; cl.t = 60 + i * 30; cl.life = 480; cl.phase = b.phase; cl.dmg = Math.round(b.dmg * 0.7);
        L.bosses.push(cl); burst(x, y + b.h / 2, 12, [b.def.c1, '#fff'], 2);
      });
      sfx('magic');
    }
    if (b.t > 40) toIdle(b, c, 50); } },
  cloneIdle: { update(b, c) { b.face = sign(c.dx) || b.face; b.vx = 0; if (--b.life <= 0) { b.dead = true; burst(b.x + b.w / 2, b.y + b.h / 2, 10, [b.def.c1], 2); return; } if (--b.t <= 0) { bossShoot(b, 3, 0.3, 2.3, { dmg: b.dmg }); b.t = 110; } } },
  split: { update(b, c) {
    b.didSplit = true;
    const half = Math.ceil(b.hp / 2);
    b.hp = half;
    const tw = mkBoss(b.def, clamp(b.x + 40, L.arena.left, L.arena.right - b.w), b.y, half); tw.max = b.max; tw.state = 'idle'; tw.t = 40; tw.phase = b.phase; tw.twin = true; b.twin = true; tw.vy = -6; tw.vx = 2;
    L.bosses.push(tw); b.vy = -6; b.vx = -2;
    burst(b.x + b.w / 2, b.y + b.h / 2, 30, [b.def.c1, b.def.c2, '#fff'], 3); sfx('explode'); cam.shake = 12;
    toIdle(b, c, 40); } },
  invis: { start(b) { b.sub = 'fade'; b.t = 30; }, update(b, c) {
    if (b.sub === 'fade') { b.vx = 0; b.alpha = Math.max(0.06, b.t / 30); if (--b.t <= 0) { b.sub = 'stalk'; b.t = 100; b.hidden = true; } }
    else if (b.sub === 'stalk') { b.vx = clamp(c.dx * 0.05, -1.8, 1.8); if (--b.t <= 0 || Math.abs(c.dx) < 30) { b.sub = 'appear'; b.t = 16; b.hidden = false; } }
    else { b.vx = 0; b.alpha = Math.min(1, b.alpha + 0.07); if (--b.t <= 0) { b.alpha = 1; setMove(b, 'combo'); b.count = 2; } } },
    draw(b) { if (b.sub === 'stalk') { ctx.globalAlpha = 0.25; drawRectW(b.x + 2, L.arena.floor - 3, b.w - 4, 3, '#000'); ctx.globalAlpha = 1; } } },
  cannons: { update(b, c) {
    b.vx = 0;
    if (++b.t === 1) { const n = 6 + b.phase * 2; for (let i = 0; i < n; i++) { const side = Math.random() < 0.5 ? -1 : 1; addFx({ type: 'cannonWarn', side, y: rnd(L.arena.top + 30, L.arena.floor - 12), t: -i * 14, warn: 40, dmg: b.dmg }); } sfx('alarm'); }
    if (b.t > 60) toIdle(b, c, 60); } },
  gravity: { update(b, c) { P.gflip = 300; P.vy = 0; toast(t('gravity'), 1400); sfx('magic'); cam.shake = 10; toIdle(b, c, 30); } },
  blackhole: { update(b, c) { b.vx = 0; if (++b.t === 25) { addFx({ type: 'hole', x: clamp(P.x + rnd(-80, 80), L.arena.left + 40, L.arena.right - 40), y: L.arena.top + 70, life: 240, dmg: b.dmg }); sfx('laser'); } if (b.t > 50) toIdle(b, c, 50); } },
  shove: { start(b) { b.t = 14; }, update(b, c) {
    b.vx = 0;
    if (--b.t <= 0) {
      addFx({ type: 'ring', x: b.x + b.w / 2, y: b.y + b.h / 2, r: 10, max: 70, dmg: Math.round(b.dmg * 0.6), col: '#ff5a3a', push: true });
      sfx('slam'); cam.shake = 8;
      if (!L.arena.shoveTold) { L.arena.shoveTold = true; toast(t('shove'), 2000); }
      toIdle(b, c, 25);
    } },
    draw(b) { if (frame % 4 < 2) { ctx.globalAlpha = 0.55; drawRectW(b.x - 4, b.y - 4, b.w + 8, b.h + 8, '#ff3a2a'); ctx.globalAlpha = 1; } } },
};
function toIdle(b, c, v) { b.state = 'idle'; b.t = c.wait(v); b.sub = ''; b.ghost = false; b.hidden = false; b.alpha = 1; }
function hover(b, c) { if (b.def.tpl === 'serpent') return serpentPath(b, c); b.vx += (clamp(c.dx, -60, 60) * 0.02 - b.vx) * 0.05; b.y += ((c.hoverY + Math.sin(b.anim * 0.05) * 10) - b.y) * 0.05; }
function mouth(b) { return { x: b.x + b.w / 2 + b.face * b.w * 0.45, y: b.y + b.h * 0.3 }; }
function laserY(b) { return b.low ? L.arena.floor - 7 : L.arena.floor - 42; }
function teleportNear(b) {
  const A = L.arena, pcx = P.x + P.w / 2;
  // reappear a few steps from Dan (not across the whole arena), on whichever side has room
  let side = Math.random() < 0.5 ? -1 : 1; const dist = 70 + Math.random() * 60;
  if (pcx + side * dist < A.left + 24 || pcx + side * dist > A.right - 24) side = -side;
  b.x = clamp(pcx + side * dist - b.w / 2, A.left + 8, A.right - b.w - 8);
  if (!b.def.fly) b.y = A.floor - b.h;
}
function pathPoint(b) { const A = L.arena, cx = (A.left + A.right) / 2; return { x: cx + Math.cos(b.pathT * 0.9) * 180 - b.w / 2, y: A.top + 50 + Math.sin(b.pathT * 1.7) * 50 + 40 }; }
function serpentPath(b, c) { b.pathT += 0.011 * c.sp; const p = pathPoint(b); const ox = b.x; b.x += (p.x - b.x) * 0.1; b.y += (p.y - b.y) * 0.1; b.face = sign(b.x - ox) || b.face; b.vx = 0; b.vy = 0; }
function startFlood(kind) {
  const A = L.arena;
  A.flood = { kind, y: A.floor, top: 15 * T + 7, state: 'rise', t: 300, col: kind === 'lava' ? '#ff6a1a' : kind === 'poison' ? '#9be04a' : '#2a9ad0', dmg: kind === 'lava' ? 16 + L.n : 10 + L.n };
  toast('⚠ ' + (kind === 'lava' ? '🔥' : '🌊'), 1200); sfx('alarm');
}

/* ---------------- update ---------------- */
function updateBosses() {
  const A = L.arena;
  if (!A || !A.active) return;
  for (const b of L.bosses.slice()) if (!b.dead) updateBoss(b);
  L.bosses = L.bosses.filter(b => !b.dead);
  updateArenaFx();
}
function updateBoss(b) {
  const A = L.arena, def = b.def;
  b.anim++; if (b.flash > 0) b.flash--; if (b.stun > 0) b.stun--;
  const pcx = P.x + P.w / 2, bcx = b.x + b.w / 2, dx = pcx - bcx;
  // pace grows with the world number and each phase; later phases chain moves together
  const sp = (1 + Math.min(L.n, 12) * 0.045) * (b.phase >= 2 ? 1.25 : 1) * (b.phase >= 3 ? 1.15 : 1) * (L.hard ? 1.15 : 1);
  const c = { dx, sp, fly: !!def.fly && !b.flyMode, hoverY: A.floor - 120 - b.h, wait: v => (b.phase >= 2 && Math.random() < (b.phase >= 3 ? 0.5 : 0.3)) ? 6 : v * 0.7 / sp };
  if (b.phase >= 3 && b.anim % 5 === 0 && !b.hidden) L.particles.push({ x: b.x + Math.random() * b.w, y: b.y + b.h, vx: 0, vy: -1 - Math.random(), life: 30, max: 30, col: '#ff3a2a', s: 2, g: -0.02 });
  if (b.shards) for (const s of b.shards) { s.a += 0.03; if (!s.alive && b.state !== 'shards' && --s.regrow <= 0) { s.alive = true; burst(bcx + Math.cos(s.a) * 30, b.y + b.h / 2 + Math.sin(s.a) * 22, 6, ['#8ae0ff'], 1.5); } }
  if (def.tpl === 'serpent') { b.trail.unshift({ x: bcx, y: b.y + b.h / 2 }); if (b.trail.length > 60) b.trail.pop(); }
  if (b.queueShove && !['stunned', 'dying', 'intro'].includes(b.state) && !b.hidden && !b.clone) { b.queueShove = false; b.ghost = false; b.flyMode = false; setMove(b, 'shove'); }

  if (b.state === 'dying') {
    b.vx = 0; b.t--;
    if (b.t % 8 === 0) { burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 10, ['#fff', def.c1, def.eye, '#ffd54a'], 3); sfx('hit'); cam.shake = 5; }
    if (b.t <= 0) {
      b.dead = true;
      burst(bcx, b.y + b.h / 2, 50, ['#fff', def.c1, def.c2, '#ffd54a'], 4); sfx('kill'); cam.shake = 16;
      if (!L.bosses.some(o => o !== b && !o.dead && !o.clone && o.state !== 'dying') && !L.bosses.some(o => o !== b && !o.dead && !o.clone)) {
        dropCoins(bcx, b.y + b.h / 2, 20 + L.n * 4);
        A.done = true; for (let y = 0; y < ROWS - 2; y++) if (tileAt(A.gateX, y) === 7) setTile(A.gateX, y, 0);
        hideBossBar(); save.bosses++; L.finishT = 170; clearBossHazards(); A.shrink = null; L.bossDown = true; stopMusic(); buzz([100, 60, 100, 60, 200]);
      }
    }
    return;
  }
  if (b.state === 'intro') { b.face = sign(dx) || -1; if (--b.t <= 0) { b.state = 'idle'; b.t = 40; } if (def.tpl === 'serpent') serpentPath(b, c); }
  else { const M = MOVES[b.state]; if (M) M.update(b, c); else b.state = 'idle'; }
  if (def.tpl === 'serpent' && b.state === 'idle') serpentPath(b, c);

  // physics
  const free = (def.fly && !b.flyMode) || b.ghost || b.flyMode || def.tpl === 'serpent';
  if (!free) {
    b.vy = Math.min(b.vy + (b.state === 'slam' ? 0.42 : 0.45), 9);
    const hx = moveX(b, b.vx);
    if (hx && b.state === 'charge' && b.sub === 'run') { buzz(80); b.state = 'stunned'; b.t = 80; b.stun = 80; b.vx = 0; cam.shake = 12; sfx('slam'); toast(t('stunned'), 1600); burst(bcx + b.face * b.w / 2, b.y + b.h / 2, 12, ['#fff', '#ffd54a'], 3); }
    const wasAir = !b.onGround;
    const hy = moveY(b, b.vy, true);
    if (hy === 1) { b.vy = 0; b.onGround = true; if (wasAir) { const M = MOVES[b.state]; if (M && M.land) M.land(b, c); } }
    else if (hy === -1) b.vy = 0; else b.onGround = false;
  } else if (def.tpl !== 'serpent' || b.state === 'serpent') {
    if (!(b.state === 'serpent')) { b.x += b.vx; b.y += b.vy; }
    if (!b.ghost && !b.hidden) { b.x = clamp(b.x, A.left, A.right - b.w); b.y = clamp(b.y, A.top - 10, A.floor - b.h); }
  }
  if (b.flyMode && b.sub === 'land') { b.vy = Math.min((b.vy || 0) + 0.45, 9); b.y += b.vy; if (b.y + b.h >= A.floor) { b.y = A.floor - b.h; b.vy = 0; b.flyMode = false; const M = MOVES[b.state]; if (M && M.land) M.land(b, c); } }
  b.x = clamp(b.x, A.left - 2, A.right - b.w + 2);
  // touching the boss hurts (its whole body, or for the serpent also its tail)
  if (!P.dead && !b.hidden && b.alpha > 0.6 && overlap(P, bossBox(b))) hurtPlayer(b.dmg, bcx);
  if (def.tpl === 'serpent' && !P.dead) for (let i = 1; i <= 6; i++) { const p = b.trail[i * 7]; if (p && overlap(P, { x: p.x - 6, y: p.y - 6, w: 12, h: 12 })) hurtPlayer(Math.round(b.dmg * 0.6), p.x); }
}
function updateArenaFx() {
  const A = L.arena;
  // falling rocks in the cave arena
  if (A.rocks && --A.rockT <= 0) { A.rockT = 170; for (let i = 0; i < 3; i++) L.warnings.push({ x: arenaX(10), t: 45 + i * 15, col: '#8a8a9a', dmg: 14 + L.n }); }
  // rising water / poison / lava
  const f = A.flood;
  if (f) {
    if (f.state === 'rise') { f.y += (f.top - f.y) * 0.04; if (Math.abs(f.y - f.top) < 1) { f.y = f.top; f.state = 'hold'; } }
    else if (f.state === 'hold') { if (--f.t <= 0) f.state = 'fall'; }
    else { f.y += 0.8; if (f.y >= A.floor) A.flood = null; }
    if (A.flood && P.y + P.h > f.y + 4 && !P.dead && frame % 30 === 0) { hurtPlayer(f.dmg, P.x + P.w / 2, { dot: true }); if (f.kind === 'poison') P.poisonT = Math.max(P.poisonT, 90); burst(P.x + P.w / 2, f.y, 6, [f.col, '#fff'], 1.5); }
    if (A.flood && frame % 3 === 0) L.particles.push({ x: rnd(A.left, A.right), y: f.y + 2, vx: 0, vy: -0.6, life: 16, max: 16, col: '#fff', s: 1 });
  }
  // spike walls closing in
  const s = A.shrink;
  if (s) {
    s.l += (s.tl - s.l) * 0.01; s.r += (s.tr - s.r) * 0.01;
    if (!P.dead && P.x < s.l + 6) { hurtPlayer(20 + L.n, s.l - 20); P.x = s.l + 8; }
    if (!P.dead && P.x + P.w > s.r - 6) { hurtPlayer(20 + L.n, s.r + 20); P.x = s.r - 8 - P.w; }
    for (const b of L.bosses) b.x = clamp(b.x, s.l + 4, s.r - b.w - 4);
  }
  // wind gusts pushing Dan toward the spikes
  const g = A.gust;
  if (g) { if (g.warn > 0) g.warn--; else { P.vx = clamp(P.vx + g.dir * 0.2, -3.5, 3.5); if (--g.t <= 0) A.gust = null; } }
  for (const x of A.fx) updateFx(x);
  A.fx = A.fx.filter(x => !x.dead);
}
function updateFx(f) {
  const A = L.arena;
  switch (f.type) {
    case 'pillar':
      f.t++;
      if (f.t > f.warn && f.t <= f.warn + 40) { const h = Math.min(56, (f.t - f.warn) * 8); if (overlap(P, { x: f.x - 7, y: A.floor - h, w: 14, h })) hurtPlayer(f.dmg, f.x); if (f.t === f.warn + 1) { sfx('slam'); cam.shake = 4; } }
      if (f.t > f.warn + 40) f.dead = true; break;
    case 'bolt':
      f.t++;
      if (f.t === f.warn) { sfx('thunder'); cam.shake = 7; L.bolts.push({ x: f.x, y0: A.top, y1: A.floor, life: 14 }); }
      if (f.t >= f.warn && f.t < f.warn + 12 && overlap(P, { x: f.x - 8, y: A.top, w: 16, h: A.floor - A.top })) hurtPlayer(f.dmg, f.x);
      if (f.t > f.warn + 12) f.dead = true; break;
    case 'ring': {
      f.r += f.push ? 5 : 3.4;
      const d = Math.hypot(P.x + P.w / 2 - f.x, P.y + P.h / 2 - f.y);
      if (!f.done && Math.abs(d - f.r) < 8) { if (hurtPlayer(f.dmg, f.x) && f.push) { P.vx = sign(P.x - f.x) * 5; P.vy = -4; } f.done = true; }
      if (f.r > f.max) f.dead = true; break;
    }
    case 'blade': {
      f.t++;
      if (f.t < 0) break;
      f.x = f.ox + f.dir * Math.sin(f.t * 0.032) * 175;
      if (overlap(P, { x: f.x - 7, y: f.y - 7, w: 14, h: 14 })) hurtPlayer(f.dmg, f.x);
      if (f.t > 98) f.dead = true; break;
    }
    case 'cloud':
      f.x += f.vx; f.y += f.vy; f.vx *= 0.985; f.vy *= 0.97; f.life--;
      if (frame % 25 === 0 && Math.hypot(P.x + P.w / 2 - f.x, P.y + P.h / 2 - f.y) < f.r) { hurtPlayer(f.dmg, f.x, { dot: true }); P.poisonT = Math.max(P.poisonT, 60); }
      if (f.life <= 0) f.dead = true; break;
    case 'tent':
      f.t++;
      if (f.t > f.warn) { const k = f.t - f.warn; f.h = k < 10 ? k * 7 : k < 120 ? 70 : Math.max(0, 70 - (k - 120) * 7); if (f.h > 10 && overlap(P, { x: f.x - 6, y: A.floor - f.h, w: 12, h: f.h })) hurtPlayer(f.dmg, f.x); if (k === 1) sfx('slam'); if (k > 130) f.dead = true; }
      break;
    case 'cannonWarn':
      f.t++;
      if (f.t === f.warn) { L.projectiles.push({ kind: 'cball', x: f.side < 0 ? A.left - 4 : A.right - 6, y: f.y, w: 10, h: 10, vx: -f.side * 3.2, vy: 0, dmg: f.dmg, life: 220, ghost: true }); sfx('explode'); f.dead = true; }
      break;
    case 'hole': {
      f.life--;
      const dx = f.x - (P.x + P.w / 2), dy = f.y - (P.y + P.h / 2), d = Math.hypot(dx, dy) || 1;
      if (d < 200) { P.vx = clamp(P.vx + dx / d * 0.22, -3.5, 3.5); P.vy += dy / d * 0.16; }
      if (d < 14) hurtPlayer(f.dmg, f.x);
      if (frame % 2 === 0) { const a = Math.random() * Math.PI * 2, r = rnd(20, 60); L.particles.push({ x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r, vx: -Math.cos(a) * 1.5, vy: -Math.sin(a) * 1.5, life: 24, max: 24, col: Math.random() < 0.5 ? '#a050ff' : '#ff40ff', s: 2 }); }
      if (f.life <= 0) f.dead = true; break;
    }
  }
}

/* ---------------- drawing ---------------- */
function drawBossBack() { }
function drawBosses() {
  if (!L.arena || !L.arena.active) return;
  for (const b of L.bosses) {
    if (b.dead) continue;
    const spr = bossSpriteFor(b.def);
    if (b.def.tpl === 'serpent' && serpentSeg) for (let i = 6; i >= 1; i--) { const p = b.trail[i * 7]; if (p) ctx.drawImage(serpentSeg.n, Math.round(p.x - 8 - cam.x), Math.round(p.y - 8 - cam.y)); }
    if (b.hidden) continue;
    ctx.globalAlpha = clamp(b.clone ? b.alpha * 0.75 : b.alpha, 0, 1);
    let ox = 0, oy = 0;
    if ((b.state === 'charge' && b.sub === 'wind') || b.state === 'dying') ox = (frame % 2) ? 2 : -2;
    if (b.state === 'idle' || b.state === 'intro') oy = Math.sin(b.anim * 0.1) * 1.5;
    const flip = FACES_RIGHT[b.def.tpl] ? b.face < 0 : b.face > 0;
    if (b.clone) drawGlow(spr, b, flip, ox, oy + 3);
    drawSpr(spr, b, flip, b.flash > 0 && b.flash % 2 === 0, ox, oy + 3);
    ctx.globalAlpha = 1;
    if (b.guard) { const sx = b.face > 0 ? b.x + b.w - 2 : b.x - 6; drawRectW(sx - 1, b.y + 4, 9, b.h - 8, OUTLINE); drawRectW(sx, b.y + 5, 7, b.h - 10, '#c03030'); drawRectW(sx + 2, b.y + 8, 3, b.h - 16, '#ffd54a'); }
    if (b.stun > 0) for (let i = 0; i < 3; i++) { const a = frame * 0.1 + i * 2.1; drawRectW(b.x + b.w / 2 + Math.cos(a) * 12, b.y - 6 + Math.sin(a) * 3, 3, 3, '#ffd54a'); }
    if (b.shards) for (const s of b.shards) if (s.alive) { const sx = b.x + b.w / 2 + Math.cos(s.a) * 30, sy = b.y + b.h / 2 + Math.sin(s.a) * 22; drawRectW(sx - 5, sy - 5, 10, 10, OUTLINE); drawRectW(sx - 4, sy - 4, 8, 8, '#8ae0ff'); drawRectW(sx - 3, sy - 3, 3, 3, '#fff'); }
    const M = MOVES[b.state]; if (M && M.draw) M.draw(b);
  }
}
function drawBossFx() {
  const A = L.arena;
  if (!A || !A.active) return;
  for (const b of L.bosses) {
    if (b.state === 'flyBreath' && b.sub === 'sweep' && (b.t % 64) < 40) { ctx.globalAlpha = 0.75; drawRectW(b.x + b.w / 2 - 9, b.y + b.h, 18, A.floor - b.y - b.h, '#ff6a1a'); drawRectW(b.x + b.w / 2 - 4, b.y + b.h, 8, A.floor - b.y - b.h, '#ffd040'); ctx.globalAlpha = 1; }
    if (b.state === 'breath' && b.sub === 'fire') { const m = mouth(b); ctx.globalAlpha = 0.55; ctx.strokeStyle = b.def.breath === 'frost' ? '#bfe8ff' : '#ff6a1a'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(m.x - cam.x, m.y - cam.y); ctx.lineTo(m.x + Math.cos(b.ang) * 160 - cam.x, m.y + Math.sin(b.ang) * 160 - cam.y); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1; }
  }
  for (const f of A.fx) {
    switch (f.type) {
      case 'pillar':
        if (f.t < f.warn) { if (frame % 4 < 2) drawRectW(f.x - 7, A.floor - 3, 14, 3, '#ff3030'); if (frame % 3 === 0) L.particles.push(dust(f.x + rnd(-6, 6), A.floor)); }
        else { const h = Math.min(56, (f.t - f.warn) * 8) * (f.t > f.warn + 30 ? (f.warn + 40 - f.t) / 10 : 1); drawRectW(f.x - 8, A.floor - h, 16, h, OUTLINE); drawRectW(f.x - 7, A.floor - h + 1, 14, h, f.col); drawRectW(f.x - 7, A.floor - h + 1, 4, h, shade(f.col, 40)); }
        break;
      case 'bolt': if (f.t >= 0 && f.t < f.warn) { ctx.globalAlpha = 0.18 + (f.t / f.warn) * 0.3; drawRectW(f.x - 8, A.top, 16, A.floor - A.top, '#ffff60'); ctx.globalAlpha = 1; if (frame % 4 < 2) drawRectW(f.x - 4, A.top - 6, 8, 4, '#ffff60'); } break;
      case 'ring': ctx.strokeStyle = f.col; ctx.lineWidth = 3; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(f.x - cam.x, f.y - cam.y, f.r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1; break;
      case 'blade': if (f.t >= 0) { ctx.save(); ctx.translate(Math.round(f.x - cam.x), Math.round(f.y - cam.y)); ctx.rotate(frame * 0.5); ctx.fillStyle = OUTLINE; ctx.fillRect(-9, -2, 18, 4); ctx.fillRect(-2, -9, 4, 18); ctx.fillStyle = '#dfe8f2'; ctx.fillRect(-8, -1, 16, 2); ctx.fillRect(-1, -8, 2, 16); ctx.restore(); } break;
      case 'cloud': ctx.globalAlpha = Math.min(0.5, f.life / 60); ctx.fillStyle = f.col; for (let k = 0; k < 5; k++) { const a = k * 1.3 + frame * 0.02; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 8 - cam.x, f.y + Math.sin(a) * 5 - cam.y, f.r * 0.6, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; break;
      case 'tent':
        if (f.t >= 0 && f.t <= f.warn) { if (frame % 3 === 0) L.particles.push({ x: f.x + rnd(-6, 6), y: A.floor - 2, vx: 0, vy: -1.5, life: 14, max: 14, col: '#ffffff', s: 2 }); if (frame % 6 < 3) drawRectW(f.x - 6, A.floor - 2, 12, 2, '#ff3030'); }
        if (f.h > 0) { for (let y = 0; y < f.h; y += 2) { const w = 12 - y / f.h * 6, sx = f.x + Math.sin(y * 0.15 + frame * 0.1) * 3 - w / 2; drawRectW(sx - 1, A.floor - y - 2, w + 2, 2, OUTLINE); drawRectW(sx, A.floor - y - 2, w, 2, (y >> 2) % 3 === 0 ? shade(f.col, 40) : f.col); } }
        break;
      case 'cannonWarn': if (f.t >= 0 && frame % 4 < 2) { const x = f.side < 0 ? A.left + 2 : A.right - 12; drawRectW(x, f.y + 2, 10, 6, '#ff3030'); } break;
      case 'hole': { const r = 12 + Math.sin(frame * 0.3) * 2; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(f.x - cam.x, f.y - cam.y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff40ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x - cam.x, f.y - cam.y, r + 3, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; break; }
    }
  }
  const fl = A.flood;
  if (fl) { ctx.globalAlpha = 0.6; drawRectW(A.left - 16, fl.y, A.right - A.left + 32, A.floor - fl.y + 40, fl.col); ctx.globalAlpha = 1; for (let x = A.left - 16; x < A.right + 16; x += 4) drawRectW(x, fl.y + Math.sin(x * 0.2 + frame * 0.12) * 1.5, 4, 2, shade(fl.col, 60)); }
  const s = A.shrink;
  if (s) for (const [x0, dir] of [[s.l, 1], [s.r, -1]]) { drawRectW(dir > 0 ? A.left - 40 : x0, A.top, dir > 0 ? x0 - A.left + 40 : A.right - x0 + 40, A.floor - A.top, '#3a2028'); for (let y = A.top; y < A.floor; y += 8) for (let k = 0; k < 4; k++) drawRectW(x0 + dir * k - (dir > 0 ? 1 : 0), y + k, 1, 8 - k * 2, '#c8c8d4'); }
  if (A.gust && A.gust.warn <= 0) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 30; i++) { const x = ((i * 53 + frame * 10 * A.gust.dir) % VW + VW) % VW, y = (i * 41) % VH; ctx.fillRect(x | 0, y, 16, 1); } }
}
