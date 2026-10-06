'use strict';
/* =========================================================
   Online accounts (Supabase): username + password, progress synced across devices.
   Optional: the game works fully offline without an account.
   ========================================================= */
const CLOUD = {
  url: 'https://zqtqhmkngsmhapyjxykz.supabase.co',
  key: 'sb_publishable_ayuo9gC6FmXQs2zfxSM1AQ_zNj8oEzP',   // the project's publishable key — public by design
};
const CLOUD_KEY = 'dvm_cloud_v1';
const cloudReady = () => !!(CLOUD.url && CLOUD.key);
let cloud = store.get(CLOUD_KEY);   // { name, uid, access, refresh, exp }
const nameToEmail = n => n.toLowerCase() + '@players.dan-vs-monsters.app';
const validName = n => /^[A-Za-z0-9_]{3,16}$/.test(n);

async function cloudApi(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const h = Object.assign({ apikey: CLOUD.key, 'Content-Type': 'application/json' }, headers);
  if (auth && cloud) h.Authorization = 'Bearer ' + cloud.access;
  const r = await fetch(CLOUD.url + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { }
  if (!r.ok) { const err = new Error((data && (data.msg || data.message || data.error_description || data.error)) || ('HTTP ' + r.status)); err.status = r.status; err.data = data; throw err; }
  return data;
}
function keepSession(name, d) {
  cloud = { name, uid: d.user.id, access: d.access_token, refresh: d.refresh_token, exp: Date.now() + (d.expires_in || 3600) * 1000 - 60000 };
  store.set(CLOUD_KEY, cloud);
}
async function cloudFresh() {
  if (!cloud) return false;
  if (Date.now() < cloud.exp) return true;
  try { keepSession(cloud.name, await cloudApi('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: cloud.refresh } })); return true; }
  catch (e) { if (e.status === 400 || e.status === 401) cloudLogout(); return false; }
}
// how far along a save is, to decide which copy to keep
function progressOf(s) { return (s.unlocked || 0) * 1e6 + (s.medals || []).reduce((a, b) => a + b, 0) * 1e4 + (s.crowns || []).reduce((a, b) => a + b, 0) * 1e4 + (s.bosses || 0) * 100 + (s.kills || 0); }
async function cloudPull() {
  const rows = await cloudApi('/rest/v1/saves?select=data,updated_at&user_id=eq.' + cloud.uid, { auth: true });
  return rows && rows[0] ? rows[0].data : null;
}
async function cloudPush() {
  if (!cloudReady() || !cloud || !(await cloudFresh())) return false;
  await cloudApi('/rest/v1/saves', { method: 'POST', auth: true, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: cloud.uid, name: cloud.name, data: save, updated_at: new Date().toISOString() } });
  cloud.lastSync = Date.now(); store.set(CLOUD_KEY, cloud);
  return true;
}
// after logging in: keep whichever copy has more progress, then make both the same
async function cloudSync() {
  if (!cloudReady() || !cloud || !(await cloudFresh())) return 'off';
  const remote = await cloudPull();
  if (remote && progressOf(remote) > progressOf(save)) {
    save = fixSave(remote); store.set(SAVE_KEY, save);
    cloud.lastSync = Date.now(); store.set(CLOUD_KEY, cloud);
    return 'loaded';
  }
  await cloudPush();
  return 'pushed';
}
async function cloudSignup(name, pass) {
  const d = await cloudApi('/auth/v1/signup', { method: 'POST', body: { email: nameToEmail(name), password: pass, data: { username: name } } });
  if (!d || !d.access_token) throw Object.assign(new Error('confirm'), { status: 0 });
  keepSession(name, d);
  return cloudSync();
}
async function cloudLogin(name, pass) {
  keepSession(name, await cloudApi('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: nameToEmail(name), password: pass } }));
  return cloudSync();
}
function cloudLogout() { cloud = null; store.del(CLOUD_KEY); }
// every save also goes up to the account (bundled so we don't spam the server)
let cloudTimer = 0;
const persistLocal = persist;
persist = function () { persistLocal(); if (cloud && cloudReady()) { clearTimeout(cloudTimer); cloudTimer = setTimeout(() => cloudPush().catch(() => { }), 4000); } };
function cloudErrorText(e) {
  const m = (e && e.message || '').toLowerCase();
  if (m.includes('already') || m.includes('registered')) return t('cloudTaken');
  if (m.includes('invalid login') || m.includes('invalid credentials')) return t('cloudWrong');
  if (m.includes('password')) return t('cloudShortPass');
  if (e && e.status === 0) return t('cloudConfirm');
  if (!navigator.onLine || m.includes('failed to fetch') || m.includes('network')) return t('cloudOffline');
  return t('cloudError') + (e && e.message ? ' (' + e.message + ')' : '');
}
// public leaderboards: only names, furthest level and crowns are exposed (server function)
async function fetchLeaderboard(kind) {
  if (cloud) { try { await cloudPush(); } catch (e) { } }   // make sure our own row is current
  return cloudApi('/rest/v1/rpc/leaderboard', { method: 'POST', body: { kind } });
}
// on start: bring in progress made on another device
async function cloudBoot() {
  if (!cloudReady() || !cloud) return;
  try { const r = await cloudSync(); if (r === 'loaded') { toast(t('cloudLoaded')); if (state === 'home') homeScreen(); } } catch (e) { }
}
