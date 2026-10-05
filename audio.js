'use strict';
/* =========================================================
   Background music (procedural chiptune, one song per world + boss + menu)
   and vibration.
   ========================================================= */
const MUSIC_VOL = 0.055;
const Music = { want: null, cur: null, step: 0, nextT: 0, timer: 0, gain: null, song: null, ducked: false };
const musicOn = () => (store.get(SETTINGS_KEY) || {}).music !== false;
const vibOn = () => (store.get(SETTINGS_KEY) || {}).vib !== false;
function setSetting(k, v) { store.set(SETTINGS_KEY, Object.assign(store.get(SETTINGS_KEY) || {}, { [k]: v })); }

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10] };
// a short song: 4-bar chord loop, a repeating melody motif, bass and drums
function makeSong(key) {
  const boss = key.startsWith('boss'), menu = key === 'menu';
  const wi = boss ? (key === 'boss2' ? 21 : 20) : menu ? 22 : +key.slice(3);
  const r = mulberry(4242 + wi * 977);
  const th = THEMES[wi] || THEMES[0];
  const bright = !boss && !menu && ['clouds', 'sun', 'snow', 'fog', 'bubbles'].includes(th.deco) && wi !== 3;
  const mode = boss ? 'minor' : menu ? 'major' : bright ? 'major' : (r() < 0.5 ? 'minor' : 'dorian');
  const root = 48 + [0, 2, 3, 5, 7, 9][(r() * 6) | 0];
  const progs = mode === 'major' ? [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 4], [5, 3, 0, 4]] : [[0, 5, 6, 4], [0, 3, 6, 4], [0, 6, 5, 4], [0, 0, 5, 6]];
  const prog = progs[(r() * progs.length) | 0];
  // motif: 8 eighth-notes of chord-ish scale degrees with rests
  const motif = [];
  for (let i = 0; i < 8; i++) motif.push(r() < (menu ? 0.45 : 0.25) ? null : [0, 2, 4, 2, 4, 6, 7, 4][(r() * 8) | 0] + (r() < 0.2 ? 1 : 0));
  const answer = motif.map((d, i) => d === null ? (r() < 0.5 ? null : 4) : d + (i > 4 ? -1 : 1));
  return {
    bpm: boss ? 168 : menu ? 104 : 118 + ((r() * 26) | 0),
    scale: SCALES[mode], root, prog, motif, answer, drums: !menu, boss, menu,
    lead: boss ? 'sawtooth' : 'square',
  };
}
function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function noteOf(song, deg, oct) { const s = song.scale, d = ((deg % 7) + 7) % 7, o = Math.floor(deg / 7); return song.root + s[d] + 12 * (o + oct); }
function tone(type, hz, t0, dur, vol, glideTo) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(hz, t0); if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(Music.gain); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noiseHit(t0, dur, vol, hp) {
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(Music.gain); s.start(t0); s.stop(t0 + dur + 0.02);
}
function playStep(song, step, t0) {
  const e8 = 60 / song.bpm / 2;
  const bar = Math.floor(step / 8) % 4, pos = step % 8, chord = song.prog[bar];
  // melody: motif on bars 1 & 3, answer on bars 2 & 4, shifted to the chord
  const line = bar % 2 === 0 ? song.motif : song.answer, d = line[pos];
  if (d !== null && d !== undefined) tone(song.lead, midiHz(noteOf(song, chord + d, 1)), t0, e8 * (song.menu ? 1.8 : 0.9), song.boss ? 0.32 : 0.38);
  if (song.menu) { if (pos % 2 === 0) tone('triangle', midiHz(noteOf(song, chord + [0, 2, 4, 2][pos / 2], 0)), t0, e8 * 1.6, 0.35); }
  else {
    // bass
    if ([0, 3, 4, 6].includes(pos) || (song.boss && pos % 2 === 0)) tone('triangle', midiHz(noteOf(song, chord, -1)), t0, e8 * 0.9, 0.6);
    // drums
    if (pos === 0 || pos === 4 || (song.boss && pos === 6)) tone('sine', 150, t0, 0.14, 0.9, 40);
    if (pos === 2 || pos === 6) noiseHit(t0, 0.09, 0.35, 1500);
    if (pos % 2 === 1) noiseHit(t0, 0.025, 0.18, 7000);
  }
}
function musicTick() {
  if (!AC || !Music.song) return;
  const e8 = 60 / Music.song.bpm / 2;
  while (Music.nextT < AC.currentTime + 0.15) { playStep(Music.song, Music.step, Music.nextT); Music.nextT += e8; Music.step++; }
}
function startMusicNow() {
  if (!AC || !musicOn() || !Music.want) return;
  if (Music.cur === Music.want && Music.timer) return;
  stopMusic(true);
  Music.gain = AC.createGain(); Music.gain.gain.value = Music.ducked ? MUSIC_VOL * 0.35 : MUSIC_VOL; Music.gain.connect(AC.destination);
  Music.song = makeSong(Music.want); Music.cur = Music.want; Music.step = 0; Music.nextT = AC.currentTime + 0.08;
  Music.timer = setInterval(musicTick, 25);
}
function playMusic(key) { Music.want = key; startMusicNow(); }
function stopMusic(keepWant) {
  if (Music.timer) clearInterval(Music.timer);
  Music.timer = 0;
  if (Music.gain) { const g = Music.gain; try { g.gain.setTargetAtTime(0, AC.currentTime, 0.05); setTimeout(() => g.disconnect(), 300); } catch (e) { } }
  Music.gain = null; Music.cur = null; Music.song = null;
  if (!keepWant) Music.want = null;
}
function duckMusic(on) { Music.ducked = on; if (Music.gain && AC) Music.gain.gain.setTargetAtTime(on ? MUSIC_VOL * 0.35 : MUSIC_VOL, AC.currentTime, 0.1); }
function setMusicOn(v) { setSetting('music', v); if (v) startMusicNow(); else stopMusic(true); }

/* ---------------- vibration ---------------- */
let lastBuzz = 0;
function buzz(p) {
  if (!vibOn() || !navigator.vibrate || !IS_TOUCH) return;
  const now = performance.now();
  if (typeof p === 'number' && now - lastBuzz < 70) return;
  lastBuzz = now;
  try { navigator.vibrate(p); } catch (e) { }
}
