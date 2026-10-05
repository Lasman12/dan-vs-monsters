'use strict';
/* =========================================================
   "i" previews: tiny looping scenes that show what an upgrade does,
   side by side: NOW vs. NEXT LEVEL.
   ========================================================= */
const PV_W = 128, PV_H = 72, PV_FLOOR = 60;
let pvScenes = [];   // [{ canvas, draw(g, t), t }]

function pvDan(g, x, y, o = {}) {
  const set = danSet(o.armor !== undefined ? o.armor : save.armor, o.skin || save.skin);
  const legs = o.legs || 'idle', body = o.atk ? 'atk' : 'idle', face = o.face || 1;
  const ent = { x, y, w: 10, h: 14 };
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  drawSpr(set[body + '_' + legs], ent, face < 0, !!o.white, 0, 0, g, 0, 0);
  g.globalAlpha = 1;
  const hx = Math.round(x) + (face > 0 ? 8 : 1), hy = Math.round(y) + 7;
  if (o.weapon === 'bow') drawBow(g, hx, hy, face, o.bowLv || 1, o.atk);
  else if (o.weapon === 'hammer') { if (o.smash) drawHammer(g, Math.round(x) + 4, Math.round(y) + 14, face, o.hammerLv || 1, true); else drawHammer(g, hx, hy, face, o.hammerLv || 1); }
  else if (o.weapon !== 'none') {
    const wi = o.sword !== undefined ? o.sword : save.weapon;
    if (o.atk) { // simple swing arc
      const S = SWORDS[wi], a = -1.2 + 2.4 * (o.swing || 0), r = S.range - 2, cx = x + 5, cy = y + 7;
      g.fillStyle = S.col; for (let k = -1.2; k <= a; k += 0.15) g.fillRect(Math.round(cx + face * Math.cos(k) * r), Math.round(cy + Math.sin(k) * r * 0.8), 2, 2);
    } else drawHeld(g, hx, hy, face, wi);
  }
}
function pvMon(g, kind, x, y, o = {}) {
  const spr = (ESPR[kind] || ESPR.slime)[o.frame || 0];
  const e = { x, y, w: 12, h: kind === 'goblin' ? 12 : 8 };
  drawSpr(spr, e, o.flip !== undefined ? o.flip : true, !!o.white, 0, 0, g, 0, 0);
}
function pvBar(g, x, y, w, frac, col, h = 4) { g.fillStyle = OUTLINE; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = '#3a1020'; g.fillRect(x, y, w, h); g.fillStyle = col; g.fillRect(x, y, Math.max(0, Math.round(w * clamp(frac, 0, 1))), h); }
function pvText(g, s, x, y, col = '#fff', size = 6, align = 'center') { g.font = size + 'px "Press Start 2P", monospace'; g.textAlign = align; g.direction = 'ltr'; g.fillStyle = OUTLINE; g.fillText(s, x + 1, y + 1); g.fillStyle = col; g.fillText(s, x, y); }
function pvBg(g, top = '#2a2040', bottom = '#4a3a6a') {
  const gr = g.createLinearGradient(0, 0, 0, PV_H); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, PV_W, PV_H);
  g.fillStyle = '#5bc23c'; g.fillRect(0, PV_FLOOR, PV_W, 3); g.fillStyle = '#8a5a34'; g.fillRect(0, PV_FLOOR + 3, PV_W, PV_H - PV_FLOOR - 3);
}
function pvCoin(g, x, y, t) { const s = ESPR.coin[[0, 1, 2, 1][((t / 8) | 0) % 4]]; g.drawImage(s.n, Math.round(x - s.w / 2), Math.round(y - s.h / 2)); }
function pvLock(g) { g.fillStyle = 'rgba(10,6,20,0.7)'; g.fillRect(0, 0, PV_W, PV_H); pvText(g, '🔒', PV_W / 2, PV_H / 2 + 6, '#fff', 14); }
function pvFloat(g, s, x, y, k, col) { if (k < 0 || k > 40) return; pvText(g, s, x, y - k * 0.5, col); }
function pvBolt(g, x, y1) { g.fillStyle = '#ffff80'; let bx = x; for (let y = 0; y < y1; y += 5) { const nx = bx + (Math.random() * 6 - 3); g.fillRect(Math.round(Math.min(bx, nx)), y, Math.abs(nx - bx) + 2, 6); bx = nx; } }

/* each scene: (g, t, v) where v = value for that side (level, stat...) */
const PV = {
  hp: (g, t, v) => {
    pvBg(g); const max = 100 + HP_STEP * v, k = t % 160;
    const hit = k > 70 && k < 110 ? 40 : 0;
    pvDan(g, 40, PV_FLOOR - 14, { white: k > 70 && k < 76 });
    pvMon(g, 'goblin', k < 70 ? 128 - k * 1.1 : 52 + (k - 70) * 0.6, PV_FLOOR - 12, { frame: (t >> 3) % 2 });
    pvBar(g, 6, 6, Math.round(116 * max / 500), (max - hit) / max, '#ff4a5a', 5);
    pvText(g, (max - hit) + '/' + max, 64, 22, '#fff');
    if (hit) pvFloat(g, '-40', 44, 40, k - 70, '#ff5050');
  },
  sword: (g, t, v) => {
    pvBg(g); const S = SWORDS[v], k = t % 30, sw = k < 14;
    const hp = 60, hitsTo = Math.ceil(hp / S.dmg), cyc = Math.floor(t / 30) % (hitsTo + 2), dealt = Math.min(hp, cyc * S.dmg);
    pvDan(g, 40, PV_FLOOR - 14, { sword: v, atk: sw, swing: k / 14 });
    if (cyc <= hitsTo) { pvMon(g, 'slime', 62, PV_FLOOR - 8, { white: k < 4 && cyc > 0 }); pvBar(g, 60, PV_FLOOR - 16, 16, (hp - dealt) / hp, '#ff4a4a', 2); }
    if (k < 25 && cyc > 0 && cyc <= hitsTo) pvFloat(g, String(S.dmg), 68, PV_FLOOR - 22, k, '#fff');
    pvText(g, S.dmg + ' DMG', 64, 12, '#ffcc33', 8);
  },
  armor: (g, t, v) => {
    pvBg(g); const red = ARMORS[v].red, k = t % 140, dmg = Math.round(40 * (1 - red));
    pvDan(g, 40, PV_FLOOR - 14, { armor: v, white: k > 60 && k < 66 });
    pvMon(g, 'goblin', k < 60 ? 128 - k * 1.25 : 52 + (k - 60) * 0.8, PV_FLOOR - 12, { frame: (t >> 3) % 2 });
    if (k > 60) pvFloat(g, '-' + dmg, 44, 40, k - 60, '#ff5050');
    pvText(g, Math.round(red * 100) + '% BLOCK', 64, 12, '#7fe3ff', 7);
  },
  atk: (g, t, v) => {
    pvBg(g); const cd = ATK_SPEED[v].cd, k = t % cd;
    pvDan(g, 44, PV_FLOOR - 14, { atk: k < Math.min(14, cd - 2), swing: k / Math.min(14, cd - 2) });
    pvMon(g, 'slime', 66, PV_FLOOR - 8, { white: k < 3 });
    pvText(g, (60 / cd).toFixed(1) + '/s', 64, 12, '#ffcc33', 8);
  },
  mag: (g, t, v) => {
    pvBg(g); const r = MAGNET[v].r * 0.6, k = t % 220, dx = 8 + k * 0.5;
    g.strokeStyle = 'rgba(127,184,255,0.6)'; g.beginPath(); g.arc(dx + 5, PV_FLOOR - 7, r, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
      let cx = 20 + i * 13, cy = PV_FLOOR - 8 - j * 22;
      const d = Math.hypot(cx - dx - 5, cy - PV_FLOOR + 7);
      const passed = cx < dx + 5 && Math.abs(cy - PV_FLOOR + 7) < r;
      if (d < r || passed) continue;
      pvCoin(g, cx, cy, t);
    }
    pvDan(g, dx, PV_FLOOR - 14, { legs: (t >> 3) % 2 ? 'run1' : 'run2' });
    pvText(g, 'RANGE ' + MAGNET[v].r, 64, 12, '#7fb8ff', 7);
  },
  coin: (g, t, v) => {
    pvBg(g); const k = t % 120, n = Math.min(100, Math.floor(k * 1.6));
    for (let i = 0; i < 9; i++) pvCoin(g, 16 + i * 12, ((k * 1.5 + i * 13) % 50) + 4, t + i * 5);
    pvDan(g, 58, PV_FLOOR - 14, {});
    pvText(g, '+' + Math.floor(n * (1 + v * COIN_STEP / 100)), 64, 40, '#ffcc33', 10);
  },
  dbl: (g, t, v) => {
    pvBg(g); g.fillStyle = '#8a5a34'; g.fillRect(80, 24, 48, 36); g.fillStyle = '#5bc23c'; g.fillRect(80, 24, 48, 3);
    drawSpr(ESPR.chest[0], { x: 104, y: 14, w: 14, h: 10 }, false, false, 0, 0, g, 0, 0);
    const k = t % 110; let x = 30, y = PV_FLOOR - 14;
    if (k < 70) { const tt = k / 70; x = 30 + tt * (v ? 60 : 38); const arc = v ? (tt < 0.5 ? Math.sin(tt * Math.PI) * 26 : 26 + Math.sin((tt - 0.5) * Math.PI) * 18 - (tt - 0.5) * 30) : Math.sin(tt * Math.PI) * 28; y = PV_FLOOR - 14 - (v ? Math.min(40, arc) : arc); if (v && tt > 0.85) y = 24 - 14; }
    else { x = v ? 90 : 68; y = v ? 24 - 14 : PV_FLOOR - 14; }
    if (v && k > 34 && k < 40) for (let i = 0; i < 4; i++) g.fillRect(x + i * 3, y + 15, 2, 2);
    pvDan(g, x, y, { legs: k < 70 ? 'jump' : 'idle' });
    if (!v) pvText(g, '✗', 100, 46, '#ff5050', 10);
  },
  dash: (g, t, v) => {
    pvBg(g); const k = t % 120;
    const fx = 128 - k * 1.6;
    let dx = 40;
    if (v && k > 40 && k < 52) { dx = 40 + (k - 40) * 4; for (let i = 1; i < 4; i++) { g.globalAlpha = 0.25; g.fillStyle = ARMORS[save.armor].body; g.fillRect(dx - i * 7, PV_FLOOR - 13, 9, 12); g.globalAlpha = 1; } }
    else if (v && k >= 52) dx = 88;
    if (fx > 0 && !(!v && fx < 50)) { g.fillStyle = '#ff6a1a'; g.fillRect(fx, PV_FLOOR - 10, 8, 6); g.fillStyle = '#ffd040'; g.fillRect(fx + 2, PV_FLOOR - 9, 4, 4); }
    pvDan(g, dx, PV_FLOOR - 14, { white: !v && k > 48 && k < 54 });
    if (!v && k > 48) pvFloat(g, '-20', 44, 40, k - 48, '#ff5050');
  },
  potion: (g, t, v) => {
    pvBg(g); const k = t % 140, frac = k < 50 ? 0.3 : Math.min(1, 0.3 + (k - 50) / 60 * 0.5);
    pvDan(g, 56, PV_FLOOR - 14, {});
    if (k > 40 && k < 60) drawSpr(ESPR.potion[0], { x: 64, y: PV_FLOOR - 22, w: 6, h: 6 }, false, false, 0, 0, g, 0, 0);
    pvBar(g, 14, 8, 100, frac, '#ff4a5a', 5);
    if (k > 55) pvFloat(g, '+50', 62, 40, k - 55, '#5cff7a');
    pvText(g, v + '/' + MAX_POTIONS, 64, 26, '#ff9aaa', 7);
  },
  bow: (g, t, v) => {
    pvBg(g); if (!v) { pvDan(g, 30, PV_FLOOR - 14, {}); pvMon(g, 'slime', 100, PV_FLOOR - 8); return pvLock(g); }
    const B = BOWS[v - 1], k = t % B.cd, ax = 40 + (t % 60) * 1.4;
    pvDan(g, 26, PV_FLOOR - 14, { weapon: 'bow', bowLv: v, atk: k < 8 });
    if (ax < 100) { g.fillStyle = '#c08a4a'; g.fillRect(ax, PV_FLOOR - 9, 8, 1); g.fillStyle = '#dfe8f2'; g.fillRect(ax + 6, PV_FLOOR - 10, 2, 3); }
    pvMon(g, 'slime', 100, PV_FLOOR - 8, { white: ax >= 100 && ax < 106 });
    if (ax >= 98) pvFloat(g, String(B.dmg), 104, PV_FLOOR - 14, (t % 60) - 41, '#fff');
    pvText(g, B.dmg + ' DMG', 64, 12, '#ffcc33', 8);
  },
  hammer: (g, t, v) => {
    pvBg(g); if (!v) { pvDan(g, 56, PV_FLOOR - 14, {}); return pvLock(g); }
    const H = HAMMERS[v - 1], k = t % 120;
    let y = PV_FLOOR - 14; if (k < 40) y -= Math.sin(k / 40 * Math.PI / 2) * 40; else if (k < 55) y = PV_FLOOR - 54 + (k - 40) * 2.7;
    const smash = k >= 40 && k < 56;
    pvDan(g, 58, y, { weapon: 'hammer', hammerLv: v, smash, legs: k < 56 ? 'jump' : 'idle' });
    const hitK = k - 56, dmg = Math.round(H.dmg * (1 + 40 / 48));
    if (hitK >= 0 && hitK < 20) { g.fillStyle = '#e8d8b0'; for (let i = 0; i < 6; i++) { g.fillRect(63 - hitK * 2 - i * 3, PV_FLOOR - 4 - (i % 3), 2, 2); g.fillRect(63 + hitK * 2 + i * 3, PV_FLOOR - 4 - (i % 3), 2, 2); } }
    if (hitK < 0 || hitK > 30) { pvMon(g, 'slime', 30, PV_FLOOR - 8); pvMon(g, 'slime', 88, PV_FLOOR - 8, { flip: false }); }
    if (hitK >= 0) pvFloat(g, String(dmg), 64, 30, hitK, '#ffcc33');
    pvText(g, 'SMASH', 64, 12, '#ffcc33', 8);
  },
  thunder: (g, t, v) => {
    pvBg(g, '#1a1a30', '#3a3a5a'); if (!v) { pvDan(g, 40, PV_FLOOR - 14, {}); pvMon(g, 'slime', 66, PV_FLOOR - 8); return pvLock(g); }
    const Th = THUNDER[v - 1], k = t % 30, cyc = Math.floor(t / 30), strike = cyc % Math.max(2, Math.round(6 - v)) === 0 && k < 12;
    pvDan(g, 44, PV_FLOOR - 14, { sword: 5, atk: k < 14, swing: k / 14 });
    pvMon(g, 'slime', 66, PV_FLOOR - 8, { white: strike });
    if (strike) { pvBolt(g, 72, PV_FLOOR - 6); pvFloat(g, String(Th.dmg), 72, 30, k, '#ffff60'); }
    pvText(g, Math.round(Th.chance * 100) + '% ⚡' + Th.dmg, 64, 12, '#ffff60', 7);
  },
  sharp: (g, t, v) => {
    pvBg(g); const mult = v ? SHARP[v - 1].mult : 1, base = SWORDS[save.weapon].dmg, k = t % 30;
    pvDan(g, 44, PV_FLOOR - 14, { atk: k < 14, swing: k / 14 });
    pvMon(g, 'slime', 66, PV_FLOOR - 8, { white: k < 3 });
    pvFloat(g, String(Math.round(base * mult)), 72, 40, k, '#fff');
    pvText(g, '+' + Math.round((mult - 1) * 100) + '%', 64, 12, '#ffcc33', 8);
  },
  fireball: (g, t, v) => {
    pvBg(g, '#2a1020', '#5a2a3a'); if (!v) { pvDan(g, 20, PV_FLOOR - 14, {}); return pvLock(g); }
    const k = t % 120, fx = 30 + k * 1.3;
    pvDan(g, 20, PV_FLOOR - 14, { atk: k < 10 });
    [60, 80, 100].forEach((x, i) => { if (fx < x) pvMon(g, 'slime', x, PV_FLOOR - 8); else pvFloat(g, String(SPECIALS.fireball.power[v - 1]), x + 6, 40, (fx - x) / 1.3, '#ffcc33'); });
    if (fx < 128) { g.fillStyle = '#ff6a1a'; g.fillRect(fx, PV_FLOOR - 14, 14, 10); g.fillStyle = '#ffd040'; g.fillRect(fx + 3, PV_FLOOR - 12, 8, 6); }
  },
  storm: (g, t, v) => {
    pvBg(g, '#1a1a30', '#3a3a5a'); if (!v) { pvDan(g, 20, PV_FLOOR - 14, {}); return pvLock(g); }
    const k = t % 120, n = SPECIALS.storm.power[v - 1];
    pvDan(g, 14, PV_FLOOR - 14, {});
    const xs = [34, 50, 66, 82, 98, 114, 26, 106].slice(0, 8);
    xs.forEach((x, i) => { const hitK = k - 20 - i * 8; if (i < n && hitK >= 0 && hitK < 8) pvBolt(g, x + 6, PV_FLOOR - 6); if (!(i < n && hitK >= 8)) pvMon(g, i % 2 ? 'bat' : 'slime', x, i % 2 ? PV_FLOOR - 30 : PV_FLOOR - 8); });
    pvText(g, '×' + n, 64, 12, '#ffff60', 8);
  },
  shield: (g, t, v) => {
    pvBg(g); if (!v) { pvDan(g, 50, PV_FLOOR - 14, {}); return pvLock(g); }
    const k = t % 120, secs = (SPECIALS.shield.power[v - 1] / 60).toFixed(0);
    pvDan(g, 50, PV_FLOOR - 14, {});
    g.strokeStyle = '#7fe3ff'; g.beginPath(); g.arc(55, PV_FLOOR - 7, 13, 0, Math.PI * 2); g.stroke();
    const ox = k < 50 ? 128 - k * 1.3 : 63 + (k - 50) * 1.6;
    g.fillStyle = '#ff5050'; g.fillRect(ox, PV_FLOOR - 10, 6, 6);
    pvText(g, secs + 's', 64, 12, '#7fe3ff', 8);
  },
  slow: (g, t, v) => {
    pvBg(g, '#2a2050', '#4a3a8a'); if (!v) { pvDan(g, 30, PV_FLOOR - 14, {}); return pvLock(g); }
    const k = t % 160, slow = k > 40, mx = 120 - (slow ? 40 + (k - 40) * 0.25 : k);
    if (slow) { g.fillStyle = 'rgba(120,80,255,0.2)'; g.fillRect(0, 0, PV_W, PV_H); }
    pvDan(g, 30, PV_FLOOR - 14, {});
    pvMon(g, 'goblin', mx, PV_FLOOR - 12, { frame: slow ? (t >> 5) % 2 : (t >> 3) % 2 });
    pvText(g, (SPECIALS.slow.power[v - 1] / 60).toFixed(1) + 's', 64, 12, '#b07aff', 8);
  },
  heal: (g, t, v) => {
    pvBg(g); if (!v) { pvDan(g, 56, PV_FLOOR - 14, {}); return pvLock(g); }
    const p = SPECIALS.heal.power[v - 1], k = t % 140, frac = k < 40 ? 0.2 : Math.min(0.2 + p, 0.2 + (k - 40) / 50 * p);
    pvDan(g, 56, PV_FLOOR - 14, {});
    if (k > 40 && k < 80) for (let i = 0; i < 4; i++) { g.fillStyle = '#5cff7a'; g.fillRect(52 + i * 5, PV_FLOOR - 16 - ((k * 2 + i * 9) % 20), 2, 2); }
    pvBar(g, 14, 8, 100, frac, '#5cff7a', 5);
    pvText(g, '+' + Math.round(p * 100) + '%', 64, 26, '#5cff7a', 8);
  },
};
// what to show on each side, and the description line for each side
function infoConfig(kind) {
  const nx = (cur, max) => cur < max ? cur + 1 : null;
  switch (kind) {
    case 'hp': return { title: t('hp'), scene: 'hp', now: save.hpLv, next: save.hpLv < maxHpLevels() ? save.hpLv + 1 : null, label: v => t('hpVal', 100 + HP_STEP * v) };
    case 'sword': return { title: t('sword'), scene: 'sword', now: save.weapon, next: nx(save.weapon, SWORDS.length - 1), label: v => loc(SWORDS[v].name) + ' · ' + t('dmgVal', SWORDS[v].dmg) };
    case 'armor': return { title: t('armor'), scene: 'armor', now: save.armor, next: save.armor + 1 < maxArmor() ? save.armor + 1 : null, label: v => loc(ARMORS[v].name) + ' · ' + t('blockVal', Math.round(ARMORS[v].red * 100)) };
    case 'atk': return { title: t('atk'), scene: 'atk', now: save.atkLv, next: nx(save.atkLv, ATK_SPEED.length - 1), label: v => t('perSec', (60 / ATK_SPEED[v].cd).toFixed(1)) };
    case 'mag': return { title: t('mag'), scene: 'mag', now: save.magLv, next: nx(save.magLv, MAGNET.length - 1), label: v => t('rangeVal', MAGNET[v].r) };
    case 'coin': return { title: t('coin'), scene: 'coin', now: save.coinLv, next: nx(save.coinLv, COIN_MAX), label: v => t('coinVal', v * COIN_STEP) };
    case 'dbl': return { title: t('dbl'), scene: 'dbl', now: save.dbl ? 1 : 0, next: save.dbl ? null : 1, label: v => v ? t('hasIt') : t('notOwned') };
    case 'dash': return { title: t('dash'), scene: 'dash', now: save.dash ? 1 : 0, next: save.dash ? null : 1, label: v => v ? t('hasIt') : t('notOwned') };
    case 'potion': return { title: t('potion'), scene: 'potion', now: save.potions, next: save.potions < MAX_POTIONS ? save.potions + 1 : null, label: v => v + '/' + MAX_POTIONS };
    case 'bow': return { title: t('bow'), scene: 'bow', now: save.bowLv, next: nx(save.bowLv, BOWS.length), label: v => v ? t('tier', v) + ' · ' + t('dmgVal', BOWS[v - 1].dmg) : t('notOwned') };
    case 'hammer': return { title: t('hammer'), scene: 'hammer', now: save.hammerLv, next: nx(save.hammerLv, HAMMERS.length), label: v => v ? t('tier', v) + ' · ' + t('dmgVal', HAMMERS[v - 1].dmg) : t('notOwned') };
    case 'thunder': return { title: t('thunder'), scene: 'thunder', now: save.thunder, next: nx(save.thunder, THUNDER.length), label: v => v ? t('thunderDesc', Math.round(THUNDER[v - 1].chance * 100), THUNDER[v - 1].dmg) : t('notOwned') };
    case 'sharp': return { title: t('sharp'), scene: 'sharp', now: save.sharp, next: nx(save.sharp, SHARP.length), label: v => t('sharpDesc', v ? Math.round((SHARP[v - 1].mult - 1) * 100) : 0) };
    default: if (SPECIALS[kind]) { const lv = save.spec[kind]; const S = SPECIALS[kind]; return { title: t(kind), scene: kind, now: lv, next: nx(lv, 3), label: v => v ? t('tier', v) + ' · ' + specialDesc(kind, v) : t('notOwned') }; }
  }
  return null;
}
function specialDesc(kind, v) {
  const p = SPECIALS[kind].power[Math.max(0, v - 1)];
  switch (kind) {
    case 'fireball': return t('fireballDesc', p);
    case 'storm': return t('stormDesc', p);
    case 'shield': return t('shieldDesc', (p / 60).toFixed(0));
    case 'slow': return t('slowDesc', (p / 60).toFixed(1));
    case 'heal': return t('healDesc', Math.round(p * 100));
  }
  return '';
}
function openInfo(kind) {
  const cfg = infoConfig(kind); if (!cfg) return;
  closeInfo();
  const m = document.createElement('div');
  m.className = 'modal'; m.id = 'infoModal';
  m.innerHTML = `
    <div class="modal-box" role="dialog" aria-label="${esc(cfg.title)}">
      <h3>${esc(cfg.title)}</h3>
      <div class="pv-row">
        <figure><figcaption>${t('now')}</figcaption><canvas width="${PV_W}" height="${PV_H}" id="pvNow"></canvas><small>${esc(cfg.label(cfg.now))}</small></figure>
        <div class="pv-arrow">${lang === 'he' ? '←' : '→'}</div>
        <figure class="${cfg.next == null ? 'maxed' : ''}"><figcaption>${cfg.next == null ? t('max') : t('next')}</figcaption><canvas width="${PV_W}" height="${PV_H}" id="pvNext"></canvas><small>${cfg.next == null ? '—' : esc(cfg.label(cfg.next))}</small></figure>
      </div>
      <button class="btn" id="pvClose">${t('close')}</button>
    </div>`;
  scr.appendChild(m);
  const mk = (id, v) => { const c = $(id); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { g, v, t: 0 }; };
  pvScenes = [mk('pvNow', cfg.now)];
  pvScenes[0].scene = cfg.scene;
  if (cfg.next != null) { const s = mk('pvNext', cfg.next); s.scene = cfg.scene; pvScenes.push(s); }
  else { const g = $('pvNext').getContext('2d'); pvBg(g); pvText(g, t('max'), 64, 40, '#ffcc33', 10); }
  m.addEventListener('click', e => { if (e.target === m) closeInfo(); });
  $('pvClose').onclick = closeInfo;
  $('pvClose').focus();
}
function closeInfo() { const m = $('infoModal'); if (m) m.remove(); pvScenes = []; }
function previewTick() {
  for (const s of pvScenes) { s.t++; s.g.clearRect(0, 0, PV_W, PV_H); try { PV[s.scene](s.g, s.t, s.v); } catch (e) { } }
}
addEventListener('keydown', e => { if (e.code === 'Escape' && $('infoModal')) { closeInfo(); e.stopPropagation(); } }, true);
