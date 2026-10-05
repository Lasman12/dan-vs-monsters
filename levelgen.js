'use strict';
/* =========================================================
   Procedural chunks: every level gets its own steps, platform hops,
   spike runs and climbing towers, built within Dan's jump limits
   (up to 3 tiles up, gaps up to 3 tiles), plus mirrored copies of
   the hand-made chunks.
   ========================================================= */
const GEN_H = 12;              // rows in a generated chunk (ground = last 2 rows)
const GS = GEN_H - 3;          // the row Dan stands in on the base ground

function genGrid(w) { return Array.from({ length: GEN_H }, () => Array(w).fill(' ')); }
function genRows(g) { return g.map(r => r.join('')); }
function column(g, x, h) { for (let y = GEN_H - 2 - h; y < GEN_H; y++) if (y >= 0) g[y][x] = '#'; }   // solid from height h down
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));

/* rolling blocks of different heights, with occasional pits */
function genSteps(r, o) {
  const w = ri(r, 18, 28), g = genGrid(w), hs = [];
  let x = 0, h = 0;
  const pitP = o.d >= 2 ? 0.3 : 0.12, maxH = o.d >= 2 ? 5 : 3;
  while (x < w) {
    if (x < 3 || x >= w - 3) { hs[x++] = 0; continue; }
    const prev = hs[x - 1];
    if (r() < pitP && x < w - 7) {
      // across a pit the landing may be at most 2 up (2-wide gap) or level/lower (3-wide gap)
      const gl = ri(r, 2, o.d >= 2 ? 3 : 2);
      for (let k = 0; k < gl; k++) hs[x++] = -1;
      h = clamp(prev + ri(r, -3, gl === 2 ? 2 : 0), 0, maxH);
    } else h = clamp(prev + ri(r, -3, 3), 0, maxH);
    const len = ri(r, 2, 5);
    for (let k = 0; k < len && x < w - 3; k++) hs[x++] = h;
  }
  for (let i = 0; i < w; i++) if (hs[i] >= 0) column(g, i, hs[i]);
  // coins on the tops, a monster on a long flat stretch, a chest on the highest step
  let best = -1, bx = -1;
  for (let i = 3; i < w - 3; i++) {
    if (hs[i] < 0) continue;
    if (hs[i] > best) { best = hs[i]; bx = i; }
    if (r() < 0.22) g[GS - hs[i] - 1][i] = 'C';
  }
  for (let i = 4; i < w - 5; i++) if (hs[i] >= 0 && hs[i] === hs[i + 1] && hs[i] === hs[i + 2] && hs[i] === hs[i + 3] && r() < 0.35) { g[GS - hs[i]][i + 1] = 'E'; i += 6; }
  if (best >= 3 && r() < 0.35) g[GS - best][bx] = '$';
  if (o.gim.includes('cannon') && best >= 3 && r() < 0.5) { const cx = Math.min(w - 4, bx + 1); if (hs[cx] === best) g[GS - best][cx] = 'T'; }
  return { id: 'gen-steps', rows: genRows(g) };
}

/* a pit crossed by floating platforms at changing heights */
function genHops(r, o) {
  const g = genGrid(30);
  for (let x = 0; x < 4; x++) column(g, x, 0);
  let x = 4, s = 0;
  const swap = o.gim.includes('rhythm') && r() < 0.5, crumble = o.d >= 3 && r() < 0.3;
  let k = 0;
  while (x < 23) {
    // going up: short gap; level or going down: the gap can be wider
    const ns = clamp(s + ri(r, -1, 2), 1, 5);
    const gap = ns > s ? 2 : ri(r, 2, 3);
    x += gap; s = ns;
    const len = ri(r, 2, 4);
    const ch = swap ? (k % 2 ? 'b' : 'r') : crumble && r() < 0.5 ? 'X' : r() < 0.5 ? '-' : '#';
    for (let i = 0; i < len && x + i < 26; i++) g[GS - s + 1][x + i] = ch;
    if (r() < 0.5) g[GS - s][x + Math.floor(len / 2)] = 'C';
    if (o.d >= 2 && r() < 0.25 && x > 8) g[Math.max(0, GS - s - 3)][x - 1] = 'B';
    x += len; k++;
  }
  const end = Math.min(x + 2, 26);
  const w = end + 4;
  for (let i = end; i < w; i++) column(g, i, 0);
  return { id: 'gen-hops', rows: genRows(g).map(row => row.slice(0, w)) };
}

/* flat ground with patches of spikes; an upper path with coins */
function genSpikes(r, o) {
  const w = ri(r, 20, 28), g = genGrid(w);
  for (let i = 0; i < w; i++) column(g, i, 0);
  let x = 4;
  while (x < w - 5) {
    const len = ri(r, 1, o.d >= 2 ? 3 : 2);
    for (let i = 0; i < len; i++) g[GS][x + i] = '^';
    if (r() < 0.4) { const py = GS - 3; for (let i = -1; i <= len; i++) if (x + i > 1 && x + i < w - 2) g[py + 1][x + i] = '-'; g[py][x] = 'C'; }
    x += len + ri(r, 3, 5);
    if (x < w - 6 && r() < 0.3) { g[GS][x - 2] = 'E'; }
  }
  if (o.gim.includes('bounce') && r() < 0.5) g[GS][2] = 'Y';
  return { id: 'gen-spikes', rows: genRows(g) };
}

/* a tall tower to wall-climb, with a ledge part way up */
function genClimb(r, o) {
  const w = ri(r, 16, 22), g = genGrid(w), tw = ri(r, 2, 4), tx = ri(r, 6, 9), th = ri(r, 5, 7);
  for (let i = 0; i < w; i++) column(g, i, 0);
  for (let i = tx; i < tx + tw; i++) column(g, i, th);
  if (r() < 0.6) for (let i = tx - 4; i < tx - 1; i++) g[GS - 2][i] = '-';
  g[GS - th][tx + Math.floor(tw / 2)] = r() < 0.3 ? '$' : 'C';
  for (let i = tx + tw + 2; i < w - 3; i += 3) if (r() < 0.5) g[GS - 2][i] = 'C';
  if (r() < 0.5) g[GS][w - 4] = 'E';
  return { id: 'gen-climb', rows: genRows(g), tag: 'wall' };
}

const GENERATORS = [
  { fn: genSteps, d: 1, w: 3 }, { fn: genSpikes, d: 1, w: 2 }, { fn: genHops, d: 2, w: 3 }, { fn: genClimb, d: 3, w: 1.5 },
];
function generateChunk(r, d, gim) {
  const ok = GENERATORS.filter(gn => gn.d <= d);
  let total = ok.reduce((a, gn) => a + gn.w, 0), pick = r() * total;
  for (const gn of ok) { pick -= gn.w; if (pick <= 0) return gn.fn(r, { d, gim }); }
  return ok[0].fn(r, { d, gim });
}
// flip a hand-made chunk left/right (not ones whose doors/levers/switches only work one way)
const MIRROR_SWAP = { '<': '>', '>': '<' };
function canMirror(ch) { return !ch.rows.some(row => /[DL|s]/.test(row)); }
function mirrorChunk(ch) { return Object.assign({}, ch, { rows: ch.rows.map(row => [...row].reverse().map(c => MIRROR_SWAP[c] || c).join('')), mirrored: true }); }
