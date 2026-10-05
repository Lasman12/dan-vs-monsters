'use strict';
/* =========================================================
   Menus: home (hub), map, upgrades, weaponsmith, specials, medals, settings, help, pause, results.
   ========================================================= */
const scr = $('screen');
function show(html, cls = '') { closeInfo(); scr.className = 'overlay on ' + cls; scr.innerHTML = html; scr.scrollTop = 0; }
function hideScreen() { closeInfo(); scr.className = 'overlay'; scr.innerHTML = ''; }
function setGameUI(on) { document.body.classList.toggle('playing', on); document.body.classList.remove('paused'); if (!on) releaseTouch(); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const maxHpLevels = () => world2() ? HP_PRICES.length : 10;
const maxArmor = () => world2() ? ARMORS.length : ARMORS.length - 1;
const fmtTime = fr => { const s = Math.floor(fr / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const tierName = tt => ['', t('bronze'), t('silver'), t('gold')][tt] || '';
const SITE_URL = 'https://lasman12.github.io/dan-vs-monsters/';
const APK_URL = 'https://github.com/Lasman12/dan-vs-monsters/releases/latest/download/dan-vs-monsters.apk';
const arrow = () => lang === 'he' ? '←' : '→';

function medalSVG(tier, sym, size = 64, locked = false) {
  const ring = locked ? '#3a3448' : ['#3a3448', '#cd7f32', '#c8d0da', '#ffcc33'][tier];
  const ringD = locked ? '#26222f' : ['#26222f', '#8a4e1a', '#8a96a6', '#c08a10'][tier];
  const rib = locked ? '#2a2636' : '#c03040';
  return `<svg class="medal" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="4" y="0" width="3" height="6" fill="${rib}"/><rect x="9" y="0" width="3" height="6" fill="${locked ? rib : '#3060c0'}"/>
    <rect x="5" y="5" width="6" height="1" fill="${ringD}"/><rect x="4" y="6" width="8" height="9" fill="${ringD}"/><rect x="3" y="7" width="10" height="7" fill="${ringD}"/>
    <rect x="5" y="6" width="6" height="8" fill="${ring}"/><rect x="4" y="7" width="8" height="6" fill="${ring}"/>
    ${locked ? '<rect x="7" y="8" width="2" height="3" fill="#1a1620"/>' : `<rect x="6" y="8" width="4" height="4" fill="${sym}"/><rect x="7" y="7" width="2" height="6" fill="${sym}"/><rect x="5" y="9" width="6" height="2" fill="${sym}"/><rect x="5" y="7" width="1" height="1" fill="#fff" opacity=".7"/>`}
  </svg>`;
}
function powerLevel() {
  const s = save, sp = Object.values(s.spec).reduce((a, b) => a + b, 0);
  return 1 + s.armor + s.weapon + s.hpLv + s.atkLv + s.magLv + Math.floor(s.coinLv / 5) + (s.dbl ? 1 : 0) + (s.dash ? 1 : 0) + s.bowLv + s.hammerLv + s.thunder + s.sharp + sp;
}
function nextLevelIdx() {
  for (let i = 0; i < Math.min(save.unlocked, NLEVELS); i++) if (!save.medals[i]) return i;
  return Math.min(save.unlocked, NLEVELS) - 1;
}

/* ---------------- animated hero (home & upgrade screens) ---------------- */
let heroCv = null, heroT = 0;
function drawHeroFrame(c, tt) {
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
  const W = c.width, H = c.height, fx = Math.floor(W / 2 - 5), fy = H - 19;
  // a little floating island under Dan
  g.fillStyle = '#3a2a20'; g.fillRect(fx - 9, H - 4, 28, 4); g.fillRect(fx - 6, H - 1, 22, 1);
  g.fillStyle = '#5bc23c'; g.fillRect(fx - 10, H - 5, 30, 2); g.fillStyle = '#8ef07a'; g.fillRect(fx - 10, H - 5, 30, 1);
  const swingT = tt % 200, atk = swingT < 14, bob = !atk && ((tt >> 5) % 2) ? -1 : 0;
  const weap = ownedWeapons().includes(save.equip) ? save.equip : 'sword';
  pvDan(g, fx, fy + bob, { atk: atk && weap !== 'bow', swing: swingT / 14, weapon: weap, bowLv: save.bowLv, hammerLv: save.hammerLv });
}
function uiFrame() {
  heroT++;
  if (heroCv && document.body.contains(heroCv)) drawHeroFrame(heroCv, heroT);
  if (pvScenes.length) previewTick();
}

/* ---------------- home ---------------- */
function homeScreen() {
  state = 'home'; setGameUI(false);
  if (newBuild && !IS_APP) { let tried = null; try { tried = sessionStorage.getItem('dvm_reload_for'); } catch (e) { } if (tried !== newBuild) return reloadForUpdate(newBuild); }
  const medals = save.medals.filter(m => m > 0).length, w2 = world2();
  const ni = nextLevelIdx(), th = THEMES[ni];
  const eqW = ownedWeapons().includes(save.equip) ? save.equip : 'sword';
  const weapName = { sword: loc(SWORDS[save.weapon].name), bow: t('bow'), hammer: t('hammer') }[eqW];
  const cat = (id, icon, label, locked, badge = '') => `<button class="cat ${locked ? 'locked' : ''}" id="${id}"><span class="ci">${icon}</span><span class="cl">${label}</span>${locked ? `<small>🔒 ${t('w2Only')}</small>` : badge}</button>`;
  show(`
    <div class="home" style="--sky1:${th.sky[0]};--sky2:${th.sky[1]};--ground:${th.top}">
      <div class="home-top">
        <div class="logo">${esc(t('title'))}</div>
        <div class="pills">
          <div class="pill">🪙 <b>${save.coins}</b></div>
          <div class="pill">🏅 <b>${medals}/${NLEVELS}</b></div>
          <div class="pill">⚡ <b>${t('power', powerLevel())}</b></div>
          <button class="iconbtn" id="hSettings" aria-label="${t('settings')}">⚙️</button>
        </div>
      </div>
      ${IS_APP && newBuild ? `<a class="update-banner" href="${APK_URL}" target="_blank" rel="noopener">🆕 ${esc(t('updateAvail', newBuild))} <b>${t('updateBtn')}</b></a>` : ''}
      <div class="home-mid">
        <div class="home-left">
          ${cat('hUp', '⬆️', t('upgrades'), false)}
          ${cat('hSmith', '⚒️', t('smith'), !w2)}
          ${cat('hSpec', '✨', t('specials'), !w2)}
          ${cat('hMedals', '🏅', t('medals'), false)}
          ${cat('hHelp', '❔', t('help'), false)}
        </div>
        <div class="home-center">
          <div class="stage"><canvas id="homeHero" width="40" height="30"></canvas></div>
          <div class="hero-name">DAN</div>
          <div class="hero-gear">${esc(weapName)} · ${esc(loc(ARMORS[save.armor].name))}</div>
        </div>
        <div class="home-right">
          ${cat('hMap', '🗺️', t('map'), false)}
          <button class="play-btn" id="hPlay"><span>${t('play')}</span><small>${esc(t('continueLv', Math.floor(ni / PER_WORLD) + 1, (ni % PER_WORLD) + 1))}<br>${esc(loc(th.name))}</small></button>
        </div>
      </div>
    </div>`, 'home-bg');
  heroCv = $('homeHero');
  $('hPlay').onclick = () => { initAudio(); goFullscreen(); startLevel(ni); };
  $('hMap').onclick = () => mapScreen();
  $('hUp').onclick = () => upgradesScreen(homeScreen);
  $('hSmith').onclick = () => w2 ? smithScreen(homeScreen) : toast(t('unlockW2'));
  $('hSpec').onclick = () => w2 ? specialsScreen(homeScreen) : toast(t('unlockW2'));
  $('hMedals').onclick = () => medalsScreen();
  $('hHelp').onclick = () => helpScreen();
  $('hSettings').onclick = () => settingsScreen(homeScreen);
}

/* ---------------- map ---------------- */
let mapWorld = 0;
function mapScreen(world) {
  state = 'map'; setGameUI(false);
  if (world !== undefined) mapWorld = world; else mapWorld = Math.floor(nextLevelIdx() / PER_WORLD);
  const w2 = world2();
  const nodes = [];
  for (let i = mapWorld * PER_WORLD; i < (mapWorld + 1) * PER_WORLD; i++) {
    const th = THEMES[i], locked = i + 1 > save.unlocked, chests = [0, 1, 2].filter(k => save.chests[i] & (1 << k)).length;
    nodes.push(`<button class="node ${locked ? 'locked' : ''}" data-l="${i}" ${locked ? 'disabled' : ''} style="--c1:${th.sky[0]};--c2:${th.top}">
      <span class="num">${(i % PER_WORLD) + 1}</span><span class="nm">${esc(loc(th.name))}</span>
      <span class="boss">${locked ? '🔒' : '👹 ' + esc(loc(BOSSES[i].name))}</span>
      ${locked ? '' : `<span class="chests">🎁 ${chests}/3</span>`}
      ${save.medals[i] ? medalSVG(save.medals[i], MEDALS[i].sym, 30) : ''}
    </button>`);
  }
  show(`
    <div class="panel wide">
      <h2>${t('worldMap')}</h2>
      <div class="tabs world-tabs">
        <button class="tab ${mapWorld === 0 ? 'on' : ''}" id="mw0">${t('world', 1)}</button>
        <button class="tab ${mapWorld === 1 ? 'on' : ''} ${w2 ? '' : 'locked'}" id="mw1">${w2 ? '' : '🔒 '}${t('world', 2)}</button>
      </div>
      <div class="map">${nodes.join('')}</div>
      <div class="row"><button class="btn" id="bUp">⬆️ ${t('upgrades')} <span class="coin">🪙 ${save.coins}</span></button><button class="btn ghost" id="bBack">${t('toHome')}</button></div>
    </div>`, 'title-bg');
  scr.querySelectorAll('.node:not(.locked)').forEach(b => b.onclick = () => startLevel(+b.dataset.l));
  $('mw0').onclick = () => mapScreen(0);
  $('mw1').onclick = () => w2 ? mapScreen(1) : toast(t('unlockW2'));
  $('bUp').onclick = () => upgradesScreen(() => mapScreen(mapWorld));
  $('bBack').onclick = homeScreen;
}

/* ---------------- shared card builder ---------------- */
function card(o) {
  // o: { id, icon, title, sub, lv, max, price, color, info, action: 'buy'|'equip'|'equipped'|null, actionLabel, locked, lockText }
  const poor = o.price != null && save.coins < o.price;
  const pips = o.max > 1 ? `<div class="pips">${Array.from({ length: o.max }, (_, i) => `<i class="${i < o.lv ? 'on' : ''}"></i>`).join('')}</div>` : '';
  let act = '';
  if (o.locked) act = `<span class="tag lock">🔒</span>`;
  else if (o.price != null) act = `<button class="btn buy" data-buy="${o.id}" ${poor ? 'disabled' : ''}>🪙 ${o.price}</button>`;
  else if (o.action === 'max') act = `<span class="tag">${t('max')}</span>`;
  const eq = o.equip ? `<button class="btn small ${o.equip === 'on' ? 'on' : 'ghost'}" data-equip="${o.id}" ${o.equip === 'on' ? 'disabled' : ''}>${o.equip === 'on' ? '✔ ' + t('equipped') : t('equip')}</button>` : '';
  return `<div class="up ${o.price == null && !o.locked && !o.equip ? 'maxed' : ''} ${o.locked ? 'is-locked' : ''}">
    <button class="info-btn" data-info="${o.info || o.id}" aria-label="info">i</button>
    <div class="ic" style="--ic:${o.color || 'var(--line)'}">${o.icon}</div>
    <div class="info"><b>${esc(o.title)}</b><small>${o.sub}</small>${o.locked && o.lockText ? `<small class="locktxt">🔒 ${esc(o.lockText)}</small>` : ''}${pips}</div>
    <div class="acts">${eq}${act}</div>
  </div>`;
}
function wireCards(rerender) {
  scr.querySelectorAll('[data-info]').forEach(b => b.onclick = () => openInfo(b.dataset.info));
  scr.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const y = scr.scrollTop; if (buy(b.dataset.buy)) { rerender(); scr.scrollTop = y; const hc = scr.querySelector('.hero-card'); if (hc) hc.classList.add('pop'); } });
  scr.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => { const y = scr.scrollTop; equip(b.dataset.equip); rerender(); scr.scrollTop = y; });
}
function heroCard() {
  const W = SWORDS[save.weapon], A = ARMORS[save.armor];
  const stat = (icon, label, val) => `<div><span>${icon} ${label}</span><b dir="ltr">${val}</b></div>`;
  return `<div class="hero-card">
    <div class="hero-stage"><canvas id="heroCv" width="40" height="30"></canvas></div>
    <div class="coins-big">🪙 <b>${save.coins}</b></div>
    <div class="stats">
      ${stat('❤️', t('hp'), maxHP())}${stat('⚔️', t('sword'), Math.round(W.dmg * sharpMul()))}${stat('🛡️', t('armor'), Math.round(A.red * 100) + '%')}
      ${stat('⚡', t('atk'), (60 / ATK_SPEED[save.atkLv].cd).toFixed(1))}${stat('🧲', t('mag'), MAGNET[save.magLv].r)}${stat('💰', t('coin'), '+' + save.coinLv * COIN_STEP + '%')}${stat('🧪', t('potion'), save.potions + '/' + MAX_POTIONS)}
    </div>
  </div>`;
}

/* ---------------- upgrades ---------------- */
function upgradesScreen(back, nextLevel) {
  enterShop();
  const A = ARMORS[save.armor], W = SWORDS[save.weapon];
  const nA = save.armor + 1 < maxArmor() ? ARMORS[save.armor + 1] : null, nW = SWORDS[save.weapon + 1];
  const atk = ATK_SPEED[save.atkLv], nAtk = ATK_SPEED[save.atkLv + 1], mag = MAGNET[save.magLv], nMag = MAGNET[save.magLv + 1];
  const ps = cd => (60 / cd).toFixed(1), nx = (a, b) => b != null ? `${a} <span class="arrow">${arrow()}</span> <em>${b}</em>` : a;
  const hpMax = maxHpLevels();
  show(`
    <div class="panel wide upg">
      <h2>⬆️ ${t('upgrades')}</h2>
      <div class="upg-grid">
        ${heroCard()}
        <div class="tracks">
          <h4>${t('catPower')}</h4>
          ${card({ id: 'hp', icon: '❤️', title: t('hp'), sub: nx(t('hpVal', maxHP()), save.hpLv < hpMax ? maxHP() + HP_STEP : null), lv: save.hpLv, max: hpMax, price: save.hpLv < hpMax ? HP_PRICES[save.hpLv] : null, color: '#e03050', action: 'max' })}
          ${card({ id: 'sword', icon: '🗡️', title: nW ? loc(nW.name) : loc(W.name), sub: nx(loc(W.name) + ' · ' + t('dmgVal', W.dmg), nW ? t('dmgVal', nW.dmg) : null), lv: save.weapon, max: SWORDS.length - 1, price: nW ? nW.p : null, color: nW ? nW.col : W.col, action: 'max' })}
          ${card({ id: 'armor', icon: '🛡️', title: nA ? loc(nA.name) : loc(A.name), sub: nx(t('blockVal', Math.round(A.red * 100)), nA ? Math.round(nA.red * 100) + '%' : null), lv: save.armor, max: maxArmor() - 1, price: nA ? nA.p : null, color: nA ? nA.body : A.body, action: 'max' })}
          ${card({ id: 'atk', icon: '⚡', title: t('atk'), sub: nx(t('perSec', ps(atk.cd)), nAtk ? ps(nAtk.cd) : null), lv: save.atkLv, max: ATK_SPEED.length - 1, price: nAtk ? nAtk.p : null, color: '#ffcc33', action: 'max' })}
          <h4>🪙</h4>
          ${card({ id: 'coin', icon: '💰', title: t('coin'), sub: nx(t('coinVal', save.coinLv * COIN_STEP), save.coinLv < COIN_MAX ? '+' + (save.coinLv + 1) * COIN_STEP + '%' : null), lv: save.coinLv, max: COIN_MAX, price: save.coinLv < COIN_MAX ? coinPrice(save.coinLv) : null, color: '#ffcc33', action: 'max' })}
          ${card({ id: 'mag', icon: '🧲', title: t('mag'), sub: nx(t('rangeVal', mag.r), nMag ? nMag.r : null), lv: save.magLv, max: MAGNET.length - 1, price: nMag ? nMag.p : null, color: '#7fb8ff', action: 'max' })}
          <h4>${t('catAbilities')}</h4>
          ${card({ id: 'dbl', icon: '🪽', title: t('dbl'), sub: save.dbl ? t('hasIt') : t('dblDesc'), lv: save.dbl ? 1 : 0, max: 1, price: save.dbl ? null : DBL_PRICE, color: '#bfe8ff', action: 'max' })}
          ${card({ id: 'dash', icon: '💨', title: t('dash'), sub: save.dash ? t('hasIt') : t('dashDesc'), lv: save.dash ? 1 : 0, max: 1, price: save.dash ? null : DASH_PRICE, color: '#c8c8d0', action: 'max' })}
          <h4>${t('catShop')}</h4>
          ${card({ id: 'potion', icon: '🧪', title: t('potion'), sub: t('potDesc', save.potions, MAX_POTIONS), lv: save.potions, max: MAX_POTIONS, price: save.potions < MAX_POTIONS ? POTION_PRICE : null, color: '#ff6a8a', action: 'max' })}
        </div>
      </div>
      <div class="row">${nextLevel != null ? `<button class="btn big" id="bNext">${t('level', (nextLevel % PER_WORLD) + 1)} ${arrow()}</button>` : ''}<button class="btn ghost" id="bBack">${t('back')}</button></div>
    </div>`, 'title-bg');
  heroCv = $('heroCv');
  wireCards(() => upgradesScreen(back, nextLevel));
  $('bBack').onclick = back;
  if (nextLevel != null) $('bNext').onclick = () => startLevel(nextLevel);
}
// opened from the pause menu: stay paused under the shop so the level continues afterwards
function enterShop() { if (state === 'pause' || state === 'pauseShop') { state = 'pauseShop'; return; } state = 'shop'; setGameUI(false); }
function buy(id) {
  const pay = p => { if (save.coins < p) return false; save.coins -= p; sfx('buy'); return true; };
  let ok = false;
  const up = (cond, price, fn) => { if (cond && pay(price)) { fn(); ok = true; } };
  up(id === 'armor' && save.armor + 1 < maxArmor(), (ARMORS[save.armor + 1] || {}).p, () => save.armor++);
  up(id === 'sword' && !!SWORDS[save.weapon + 1], (SWORDS[save.weapon + 1] || {}).p, () => save.weapon++);
  up(id === 'hp' && save.hpLv < maxHpLevels(), HP_PRICES[save.hpLv], () => save.hpLv++);
  up(id === 'atk' && !!ATK_SPEED[save.atkLv + 1], (ATK_SPEED[save.atkLv + 1] || {}).p, () => save.atkLv++);
  up(id === 'coin' && save.coinLv < COIN_MAX, coinPrice(save.coinLv), () => save.coinLv++);
  up(id === 'mag' && !!MAGNET[save.magLv + 1], (MAGNET[save.magLv + 1] || {}).p, () => save.magLv++);
  up(id === 'dbl' && !save.dbl, DBL_PRICE, () => save.dbl = true);
  up(id === 'dash' && !save.dash, DASH_PRICE, () => save.dash = true);
  up(id === 'potion' && save.potions < MAX_POTIONS, POTION_PRICE, () => save.potions++);
  up(id === 'bow' && save.bowLv < BOWS.length, (BOWS[save.bowLv] || {}).p, () => { save.bowLv++; if (save.bowLv === 1) save.equip = 'bow'; });
  up(id === 'hammer' && save.hammerLv < HAMMERS.length, (HAMMERS[save.hammerLv] || {}).p, () => { save.hammerLv++; if (save.hammerLv === 1) save.equip = 'hammer'; });
  up(id === 'thunder' && save.weapon === SWORDS.length - 1 && save.thunder < THUNDER.length, (THUNDER[save.thunder] || {}).p, () => save.thunder++);
  up(id === 'sharp' && save.sharp < SHARP.length, (SHARP[save.sharp] || {}).p, () => save.sharp++);
  if (SPECIALS[id] && save.spec[id] < 3) up(true, SPECIALS[id].p[save.spec[id]], () => { save.spec[id]++; if (!save.special) save.special = id; });
  if (ok && state === 'pauseShop' && L && id === 'hp') P.hp = Math.min(maxHP(), P.hp + HP_STEP);   // new heart is filled right away
  if (ok) persist();
  return ok;
}
function equip(id) {
  if (['sword', 'bow', 'hammer'].includes(id)) { save.equip = id; }
  else if (SPECIALS[id] && save.spec[id]) save.special = id;
  sfx('switch'); persist();
}

/* ---------------- weaponsmith (world 2) ---------------- */
function smithScreen(back) {
  enterShop();
  const legend = save.weapon === SWORDS.length - 1;
  const bowN = BOWS[save.bowLv], hamN = HAMMERS[save.hammerLv], thN = THUNDER[save.thunder], shN = SHARP[save.sharp];
  const eq = w => save.equip === w ? 'on' : 'off';
  show(`
    <div class="panel wide upg">
      <h2>⚒️ ${t('smith')}</h2>
      <p class="sub">${t('smithIntro')}</p>
      <div class="upg-grid">
        ${heroCard()}
        <div class="tracks">
          <h4>⚔️</h4>
          ${card({ id: 'sword', info: 'sword', icon: '🗡️', title: loc(SWORDS[save.weapon].name), sub: t('dmgVal', Math.round(SWORDS[save.weapon].dmg * sharpMul())), lv: 0, max: 0, price: null, color: SWORDS[save.weapon].col, equip: eq('sword') })}
          ${card({ id: 'bow', icon: '🏹', title: t('bow') + (save.bowLv ? ' · ' + t('tier', save.bowLv) : ''), sub: (save.bowLv ? t('dmgVal', BOWS[save.bowLv - 1].dmg) + ' · ' : '') + t('bowDesc') + (bowN ? ` <span class="arrow">${arrow()}</span> <em>${t('dmgVal', bowN.dmg)}</em>` : ''), lv: save.bowLv, max: BOWS.length, price: bowN ? bowN.p : null, color: '#c08a4a', equip: save.bowLv ? eq('bow') : null, action: 'max' })}
          ${card({ id: 'hammer', icon: '🔨', title: t('hammer') + (save.hammerLv ? ' · ' + t('tier', save.hammerLv) : ''), sub: (save.hammerLv ? t('dmgVal', HAMMERS[save.hammerLv - 1].dmg) + ' · ' : '') + t('hammerDesc') + (hamN ? ` <span class="arrow">${arrow()}</span> <em>${t('dmgVal', hamN.dmg)}</em>` : ''), lv: save.hammerLv, max: HAMMERS.length, price: hamN ? hamN.p : null, color: '#9aa0b0', equip: save.hammerLv ? eq('hammer') : null, action: 'max' })}
          <h4>✨</h4>
          ${card({ id: 'thunder', icon: '⚡', title: t('thunder'), sub: save.thunder ? t('thunderDesc', Math.round(THUNDER[save.thunder - 1].chance * 100), THUNDER[save.thunder - 1].dmg) + (thN ? ` <span class="arrow">${arrow()}</span> <em>${Math.round(thN.chance * 100)}%</em>` : '') : t('thunderDesc', 2, 200), lv: save.thunder, max: THUNDER.length, price: legend && thN ? thN.p : null, color: '#ffff60', locked: !legend, lockText: t('needLegend'), action: 'max' })}
          ${card({ id: 'sharp', icon: '🔪', title: t('sharp'), sub: t('sharpDesc', save.sharp ? Math.round((SHARP[save.sharp - 1].mult - 1) * 100) : 0) + (shN ? ` <span class="arrow">${arrow()}</span> <em>+${Math.round((shN.mult - 1) * 100)}%</em>` : ''), lv: save.sharp, max: SHARP.length, price: shN ? shN.p : null, color: '#dfe8f2', action: 'max' })}
        </div>
      </div>
      <div class="row"><button class="btn ghost" id="bBack">${t('back')}</button></div>
    </div>`, 'title-bg');
  heroCv = $('heroCv');
  wireCards(() => smithScreen(back));
  $('bBack').onclick = back;
}

/* ---------------- specials (world 2) ---------------- */
function specialsScreen(back) {
  enterShop();
  const cards = Object.keys(SPECIALS).map(k => {
    const S = SPECIALS[k], lv = save.spec[k];
    return card({ id: k, icon: S.icon, title: t(k) + (lv ? ' · ' + t('tier', lv) : ''), sub: specialDesc(k, Math.max(1, lv)) + ' · ' + t('manaCost', S.cost) + (lv && lv < 3 ? ` <span class="arrow">${arrow()}</span> <em>${t('tier', lv + 1)}</em>` : ''), lv, max: 3, price: lv < 3 ? S.p[lv] : null, color: '#b07aff', equip: lv ? (save.special === k ? 'on' : 'off') : null, action: 'max' });
  }).join('');
  show(`
    <div class="panel wide upg">
      <h2>✨ ${t('specials')}</h2>
      <p class="sub">${t('specIntro')}</p>
      <div class="upg-grid">${heroCard()}<div class="tracks">${cards}</div></div>
      <div class="row"><button class="btn ghost" id="bBack">${t('back')}</button></div>
    </div>`, 'title-bg');
  heroCv = $('heroCv');
  wireCards(() => specialsScreen(back));
  $('bBack').onclick = back;
}

/* ---------------- medals / help / settings ---------------- */
function medalsScreen() {
  const cell = i => `<div class="mcell ${save.medals[i] ? '' : 'locked'}">${medalSVG(save.medals[i], MEDALS[i].sym, 48, !save.medals[i])}<span>${esc(loc(MEDALS[i].name))}</span><small>${save.medals[i] ? tierName(save.medals[i]) + (save.best[i] ? ' · ' + fmtTime(save.best[i]) : '') : t('locked')}</small></div>`;
  show(`
    <div class="panel wide">
      <h2>🏅 ${t('myMedals')}</h2>
      <h4 class="wlabel">${t('world', 1)}</h4><div class="medals">${Array.from({ length: PER_WORLD }, (_, i) => cell(i)).join('')}</div>
      <h4 class="wlabel">${t('world', 2)}</h4><div class="medals">${Array.from({ length: PER_WORLD }, (_, i) => cell(i + PER_WORLD)).join('')}</div>
      <p class="who">${t('kills')}: <b>${save.kills}</b> · ${t('bossesBeaten')}: <b>${save.bosses}</b> · 🎁 <b>${save.chests.reduce((a, c) => a + [0, 1, 2].filter(k => c & (1 << k)).length, 0)}/${NLEVELS * 3}</b></p>
      <button class="btn" id="bBack">${t('back')}</button>
    </div>`, 'title-bg');
  $('bBack').onclick = homeScreen;
}
function helpScreen() {
  show(`
    <div class="panel">
      <h2>❔ ${t('help')}</h2>
      <div class="help">${t('helpControls').map(l => `<div>${esc(l)}</div>`).join('')}</div>
      <ul class="tips">${t('helpTips').map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <button class="btn" id="bBack">${t('back')}</button>
    </div>`, 'title-bg');
  $('bBack').onclick = homeScreen;
}
function settingsScreen(back) {
  let armed = false;
  show(`
    <div class="panel narrow">
      <h2>⚙️ ${t('settings')}</h2>
      <div class="settings">
        <div class="set-row"><span>🔊 ${t('sound')}</span><button class="btn toggle ${muted ? 'off' : ''}" id="sSound">${muted ? t('off') : t('on')}</button></div>
        <div class="set-row"><span>🌐 ${t('language')}</span><div class="langs">${Object.keys(LANGS).map(k => `<button class="btn small ${lang === k ? 'on' : 'ghost'}" data-lang="${k}">${LANGS[k]}</button>`).join('')}</div></div>
        <div class="set-block">
          <b>📱 ${t('dlTitle')}</b>
          <a class="btn big dl" href="${APK_URL}" target="_blank" rel="noopener">${t('dlBtn')}</a>
          <small>${t('dlHint')}</small>
        </div>
        <div class="set-block">
          <b>🔗 ${t('linkTitle')}</b>
          <div class="linkrow"><input id="sLink" readonly value="${SITE_URL}" dir="ltr"><button class="btn" id="sCopy">${navigator.share ? t('share') : t('copy')}</button></div>
          <small>${t('linkHint')}</small>
        </div>
        <div class="set-block"><small>💾 ${t('saveNote')}</small><button class="btn ghost danger" id="sReset">${t('reset')}</button></div>
      </div>
      <button class="btn ghost" id="bBack">${t('back')}</button>
    </div>`, state === 'pause' || state === 'pauseShop' ? '' : 'title-bg');
  $('sSound').onclick = () => { setMuted(!muted); initAudio(); sfx('buy'); settingsScreen(back); };
  scr.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { setLang(b.dataset.lang); settingsScreen(back); });
  $('sCopy').onclick = async () => {
    try { if (navigator.share) await navigator.share({ title: t('title'), url: SITE_URL }); else { await navigator.clipboard.writeText(SITE_URL); toast(t('copied')); } }
    catch (e) { $('sLink').select(); }
  };
  $('sReset').onclick = () => {
    if (!armed) { armed = true; $('sReset').textContent = t('resetSure'); $('sReset').classList.add('armed'); return; }
    save = newSave(); persist(); toast(t('resetDone')); homeScreen();
  };
  $('bBack').onclick = back;
}

/* ---------------- in-game: pause & results ---------------- */
function pauseScreen() {
  state = 'pause';
  document.body.classList.add('paused'); releaseTouch();
  const inBoss = L.arena.active && !L.arena.done;   // no shopping in the middle of a boss fight
  show(`
    <div class="panel narrow">
      <h2>${t('paused')}</h2>
      <p class="who">${esc(loc(L.th.name))} · ${t('falls')}: ${L.deaths} · ⏱ ${fmtTime(L.time)}</p>
      <div class="col">
        <button class="btn big" id="bRes">${t('resume')}</button>
        <button class="btn" id="bRestart">${t('restart')}</button>
        ${inBoss ? `<p class="hint small shop-closed">🔒 ${t('shopClosed')}</p>` : `<button class="btn" id="bShopP">⬆️ ${t('upgrades')} <span class="coin">🪙 ${save.coins}</span></button>
        ${world2() ? `<div class="row tight"><button class="btn" id="bSmithP">⚒️ ${t('smith')}</button><button class="btn" id="bSpecP">✨ ${t('specials')}</button></div>` : ''}`}
        <button class="btn" id="bMap">${t('exitMap')}</button>
        <button class="btn ghost" id="bSet">⚙️ ${t('settings')}</button>
      </div>
      <p class="hint small">${t('coinsSaved')}</p>
    </div>`);
  $('bRes').onclick = resume;
  $('bRestart').onclick = () => startLevel(L.n);
  $('bMap').onclick = () => { persist(); mapScreen(); };
  $('bSet').onclick = () => settingsScreen(pauseScreen);
  const backToPause = () => { state = 'pause'; pauseScreen(); };
  if (!inBoss) $('bShopP').onclick = () => upgradesScreen(backToPause);
  if (!inBoss && world2()) { $('bSmithP').onclick = () => smithScreen(backToPause); $('bSpecP').onclick = () => specialsScreen(backToPause); }
}
function resume() {
  hideScreen(); state = 'play'; setGameUI(true);
  // apply anything bought in the pause shop
  P.weap = ownedWeapons().includes(save.equip) ? save.equip : 'sword';
  P.hp = Math.min(P.hp, maxHP()); hudCache = {}; updateTouchExtras();
}
function finishLevel() {
  const n = L.n;
  const tier = L.deaths === 0 ? 3 : L.deaths <= 2 ? 2 : 1;
  const prev = save.medals[n];
  save.medals[n] = Math.max(prev, tier);
  const newBest = !save.best[n] || L.time < save.best[n];
  if (newBest) save.best[n] = L.time;
  const wasW2 = world2();
  if (save.unlocked < n + 2 && n < NLEVELS - 1) save.unlocked = n + 2;
  persist();
  state = 'medal'; setGameUI(false); sfx('medal');
  const last = n === NLEVELS - 1, w2open = !wasW2 && world2();
  const chests = [0, 1, 2].filter(k => save.chests[n] & (1 << k)).length;
  show(`
    <div class="panel narrow medal-screen">
      <h2>${esc(t('defeated', loc(BOSSES[n].name)))}</h2>
      <div class="medal-big">${medalSVG(tier, MEDALS[n].sym, 112)}</div>
      <h3>${esc(loc(MEDALS[n].name))} — ${tierName(tier)}</h3>
      <div class="result-grid">
        <div><span>⏱ ${t('time')}</span><b>${fmtTime(L.time)}${newBest && prev ? ' ★' : ''}</b></div>
        <div><span>💀 ${t('falls')}</span><b>${L.deaths}</b></div>
        <div><span>👾 ${t('monsters')}</span><b>${L.kills}</b></div>
        <div><span>🪙 ${t('coins')}</span><b>+${L.coinsGot}</b></div>
        <div><span>🎁 ${t('chestsFound')}</span><b>${chests}/3</b></div>
      </div>
      ${tier < 3 ? `<p class="hint">${tier === 2 ? t('goldHint') : t('silverHint')}</p>` : `<p class="hint">${t('perfect')}</p>`}
      ${prev > tier ? `<p class="hint small">${t('yourBest', tierName(prev))}</p>` : ''}
      ${w2open ? `<p class="unlock">🎉 ${t('w2Unlocked')}</p>` : ''}
      <div class="col"><button class="btn big" id="bGo">${last || n === PER_WORLD - 1 ? t('theEnd') : t('toNext')}</button><button class="btn ghost" id="bHome">${t('toHome')}</button></div>
    </div>`, 'title-bg');
  $('bGo').onclick = () => (last || n === PER_WORLD - 1) ? endingScreen(last ? 2 : 1) : upgradesScreen(homeScreen, n + 1);
  $('bHome').onclick = homeScreen;
}
function endingScreen(world) {
  const from = (world - 1) * PER_WORLD;
  const golds = save.medals.slice(from, from + PER_WORLD).filter(m => m === 3).length;
  show(`
    <div class="panel">
      <h1 class="title">${t('victory')}</h1>
      <p class="sub">${world === 1 ? t('victoryText') : t('victory2Text')}</p>
      <div class="medals">${Array.from({ length: PER_WORLD }, (_, i) => `<div class="mcell">${medalSVG(save.medals[from + i], MEDALS[from + i].sym, 44, !save.medals[from + i])}<small>${tierName(save.medals[from + i]) || '-'}</small></div>`).join('')}</div>
      <p class="who">${t('goldCount', golds, PER_WORLD)}</p>
      ${world === 1 ? `<p class="unlock">🎉 ${t('w2Unlocked')}</p>` : ''}
      <button class="btn big" id="bBack">${t('toHome')}</button>
    </div>`, 'title-bg');
  $('bBack').onclick = homeScreen;
}

/* ---------------- updates ---------------- */
// Phones keep tabs open for days and cache aggressively, so ask the server which build is current.
let newBuild = null;
async function checkUpdate() {
  try {
    const r = await fetch((IS_APP ? SITE_URL : '') + 'version.json?t=' + Date.now(), { cache: 'no-store' });
    const v = (await r.json()).v;
    if (!v || v === BUILD) return;
    newBuild = v;
    if (IS_APP) { if (state === 'home') homeScreen(); return; }
    let tried = null; try { tried = sessionStorage.getItem('dvm_reload_for'); } catch (e) { }
    if (tried === v) return;   // already reloaded once for this build; don't loop
    if (state === 'home' || state === 'map' || state === 'shop' || state === 'medal') reloadForUpdate(v);
  } catch (e) { }
}
function reloadForUpdate(v) {
  try { sessionStorage.setItem('dvm_reload_for', v); } catch (e) { }
  persist();
  location.replace(location.pathname + '?v=' + v);   // a new URL can't come from the old cache
}

/* ---------------- boot ---------------- */
applyLang();
buildSprites();
fit(); setupTouch();
homeScreen();
requestAnimationFrame(loop);
addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseScreen(); if (!document.hidden) checkUpdate(); });
checkUpdate();
