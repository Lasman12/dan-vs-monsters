'use strict';
/* =========================================================
   Dan vs. The Monsters — game content (themes, bosses, gear, save)
   Names are { en, es, he }; loc() picks the current language.
   ========================================================= */
const T = 16, ROWS = 20, LH = ROWS * T;
const NLEVELS = 20, PER_WORLD = 10;
const BUILD = '2.1.0';   // bump together with version.json and the ?v= in index.html
const n3 = (en, es, he) => ({ en, es, he });

/* gim: level mechanics. chase: hazard wall chasing Dan between two checkpoints. */
const THEMES = [
  { name: n3('Green Forest', 'Bosque Verde', 'היער הירוק'), sky: ['#6cc0ee', '#d4f1ff'], far: '#8cc7a0', near: '#5a9a6a', top: '#5bc23c', topD: '#3d8f2a', fill: '#8a5a34', fillD: '#6b4226', plat: '#a0703c', haz: '#3fa7e0', deco: 'clouds', slime: '#5ccf4a',
    gim: ['chests'], ambush: 1 },
  { name: n3('Stone Caves', 'Cuevas de Piedra', 'מערות האבן'), sky: ['#15131f', '#2c2a40'], far: '#2a2840', near: '#37334f', top: '#8a8a9c', topD: '#5a5a6c', fill: '#4a4658', fillD: '#38344a', plat: '#6d6478', haz: '#3fc8ff', deco: 'crystals', slime: '#4a9aff',
    gim: ['dark', 'stalactites'], ambush: 1 },
  { name: n3('Scorching Desert', 'Desierto Ardiente', 'מדבר החול הלוהט'), sky: ['#f39a4b', '#ffe2a8'], far: '#eab06a', near: '#d48c45', top: '#f2d27a', topD: '#d9b45c', fill: '#c98e4a', fillD: '#a87038', plat: '#b5813f', haz: '#d8a040', deco: 'sun', slime: '#e0a040',
    gim: ['cannon'], chase: 'sand', ambush: 1 },
  { name: n3('Poison Swamp', 'Pantano Venenoso', 'ביצת הרעל'), sky: ['#3d4d30', '#7d8f5a'], far: '#4a5c3a', near: '#33422a', top: '#7a9a3a', topD: '#4f6a28', fill: '#4a3b2a', fillD: '#38291c', plat: '#5c4a30', haz: '#9be04a', deco: 'fog', slime: '#a05ad0',
    gim: ['bounce', 'switch'], ambush: 1 },
  { name: n3('Snowy Peaks', 'Picos Nevados', 'ההרים המושלגים'), sky: ['#8fb8e0', '#eef6ff'], far: '#d0deef', near: '#a7bdd6', top: '#ffffff', topD: '#cfe0f0', fill: '#7b8fa8', fillD: '#5d6f88', plat: '#a7c7e7', haz: '#7fd6ff', deco: 'snow', slime: '#9ae0ff',
    gim: ['ice', 'stalactites'], ambush: 1 },
  { name: n3('Ancient Fortress', 'Fortaleza Antigua', 'המבצר העתיק'), sky: ['#4a5a7c', '#9aa8c4'], far: '#55607c', near: '#3b4560', top: '#a4a4b0', topD: '#74747f', fill: '#6a6a76', fillD: '#50505b', plat: '#8b6f4e', haz: '#4aa0e0', deco: 'towers', slime: '#9aa0b0',
    gim: ['cannon', 'conveyor', 'switch'], ambush: 2 },
  { name: n3('Volcano', 'Volcán', 'הר הגעש'), sky: ['#2a0808', '#7a2a10'], far: '#4a1a12', near: '#2a0e0a', top: '#6a4034', topD: '#40261f', fill: '#3a2420', fillD: '#2a1814', plat: '#6a4030', haz: '#ff6a1a', deco: 'embers', slime: '#ff5a2a',
    gim: ['geyser'], chase: 'lava', ambush: 1 },
  { name: n3('Haunted Woods', 'Bosque Embrujado', 'היער הרדוף'), sky: ['#120a24', '#3a2050'], far: '#2a1840', near: '#1e1030', top: '#6a4a8a', topD: '#40285a', fill: '#2e2238', fillD: '#221a2a', plat: '#4a3460', haz: '#b04aff', deco: 'stars', slime: '#c050ff',
    gim: ['dark', 'rhythm'], ambush: 2 },
  { name: n3('Sky Kingdom', 'Reino del Cielo', 'ממלכת השמיים'), sky: ['#8fd0ff', '#fff2dc'], far: '#ffffff', near: '#e4f2ff', top: '#ffffff', topD: '#d8e8f8', fill: '#e8d8b0', fillD: '#c8b890', plat: '#ffe8a0', haz: '#7fb8ff', deco: 'clouds', slime: '#ff9ad0',
    gim: ['wind', 'bounce', 'rhythm'], ambush: 1 },
  { name: n3('Monster King\'s Castle', 'Castillo del Rey Monstruo', 'טירת מלך המפלצות'), sky: ['#0c0406', '#2e0a16'], far: '#26101a', near: '#170609', top: '#5a2e44', topD: '#341a2a', fill: '#2a1820', fillD: '#1c1016', plat: '#5a2a2a', haz: '#ff3030', deco: 'embers', slime: '#e03040',
    gim: ['cannon', 'conveyor', 'switch'], chase: 'lava', ambush: 2 },
  // ---------------- World 2 ----------------
  { name: n3('Crystal Caverns', 'Cavernas de Cristal', 'מערות הקריסטל'), sky: ['#0c1028', '#1e2a5a'], far: '#1a2450', near: '#24306a', top: '#8ae0ff', topD: '#4aa0d0', fill: '#2a3a6a', fillD: '#1e2a50', plat: '#5a7ac0', haz: '#3ff0ff', deco: 'crystals', slime: '#5ad0ff',
    gim: ['dark', 'switch', 'stalactites'], ambush: 1 },
  { name: n3('Mushroom Jungle', 'Jungla de Hongos', 'ג׳ונגל הפטריות'), sky: ['#2a4a2a', '#8ac070'], far: '#3a6a3a', near: '#2a502a', top: '#a0d040', topD: '#6a9a20', fill: '#5a3a2a', fillD: '#40281c', plat: '#d04040', haz: '#c0ff40', deco: 'fog', slime: '#c060ff',
    gim: ['bounce', 'geyser'], ambush: 2 },
  { name: n3('Clockwork Factory', 'Fábrica de Engranajes', 'מפעל השעונים'), sky: ['#2a2a30', '#5a5048'], far: '#3a3830', near: '#2a2820', top: '#b08a4a', topD: '#806030', fill: '#4a4a52', fillD: '#36363e', plat: '#8a8a96', haz: '#ff8a2a', deco: 'towers', slime: '#c0a060',
    gim: ['conveyor', 'cannon', 'rhythm'], ambush: 1 },
  { name: n3('Sunken Ruins', 'Ruinas Hundidas', 'החורבות השקועות'), sky: ['#0a3a5a', '#2a8aa0'], far: '#145070', near: '#0e3a55', top: '#7ab0a0', topD: '#4a8070', fill: '#5a6a70', fillD: '#465458', plat: '#8aa0a0', haz: '#2ad0ff', deco: 'bubbles', slime: '#40e0c0',
    gim: ['bounce', 'switch'], chase: 'water', ambush: 1 },
  { name: n3('Thunder Peaks', 'Cumbres del Trueno', 'פסגות הרעם'), sky: ['#2a2a40', '#6a6a90'], far: '#4a4a68', near: '#36364e', top: '#c8c8e0', topD: '#9090b0', fill: '#5a5a70', fillD: '#46465a', plat: '#a0a0c0', haz: '#ffff60', deco: 'storm', slime: '#ffe040',
    gim: ['wind', 'rhythm', 'cannon'], ambush: 1 },
  { name: n3('Frozen Citadel', 'Ciudadela Helada', 'המצודה הקפואה'), sky: ['#3a5a8a', '#c0e0ff'], far: '#a0c0e0', near: '#7090c0', top: '#e0f8ff', topD: '#a0d0f0', fill: '#6080b0', fillD: '#4a6a98', plat: '#a0d0ff', haz: '#a0f0ff', deco: 'snow', slime: '#80c0ff',
    gim: ['ice', 'stalactites'], ambush: 2 },
  { name: n3('Toxic Factory', 'Fábrica Tóxica', 'המפעל הרעיל'), sky: ['#1a2a10', '#4a6a20'], far: '#2a3a18', near: '#1e2a10', top: '#8ac030', topD: '#5a8a20', fill: '#3a3a30', fillD: '#2a2a22', plat: '#6a7a40', haz: '#a0ff20', deco: 'fog', slime: '#90ff40',
    gim: ['conveyor', 'geyser'], chase: 'toxic', ambush: 1 },
  { name: n3('Ghost Ship', 'Barco Fantasma', 'ספינת הרפאים'), sky: ['#0a0a1a', '#2a2a4a'], far: '#1a1a30', near: '#121226', top: '#7a5a3a', topD: '#5a4028', fill: '#4a3424', fillD: '#36261a', plat: '#8a6a4a', haz: '#3a6aff', deco: 'stars', slime: '#80a0ff',
    gim: ['dark', 'cannon', 'wind'], ambush: 2 },
  { name: n3('Magma Core', 'Núcleo de Magma', 'ליבת המאגמה'), sky: ['#3a0800', '#a03000'], far: '#5a1808', near: '#3a0e04', top: '#4a2a20', topD: '#2a1610', fill: '#2a1410', fillD: '#1a0c08', plat: '#5a3020', haz: '#ffaa20', deco: 'embers', slime: '#ff8020',
    gim: ['geyser', 'switch'], chase: 'lava', ambush: 2 },
  { name: n3('The Void', 'El Vacío', 'הריק'), sky: ['#05000a', '#1a0830'], far: '#14062a', near: '#0c0418', top: '#a050ff', topD: '#6a28c0', fill: '#1a1028', fillD: '#100a1a', plat: '#5a3a8a', haz: '#ff40ff', deco: 'stars', slime: '#ff40ff',
    gim: ['dark', 'rhythm', 'wind', 'cannon'], chase: 'void', ambush: 2 },
];

const MEDALS = [
  ['Leaf', 'Hoja', 'העלה', '#3fae3f'], ['Crystal', 'Cristal', 'הקריסטל', '#3fc8ff'], ['Scorpion', 'Escorpión', 'העקרב', '#d27a2a'],
  ['Frog', 'Rana', 'הצפרדע', '#7ac03a'], ['Snowflake', 'Copo', 'פתית השלג', '#bfe8ff'], ['Shield', 'Escudo', 'המגן', '#8a8aa0'],
  ['Flame', 'Llama', 'הלהבה', '#ff5a1a'], ['Moon', 'Luna', 'הירח', '#b07aff'], ['Cloud', 'Nube', 'הענן', '#ffffff'], ['Crown', 'Corona', 'הכתר', '#ff3050'],
  ['Prism', 'Prisma', 'המנסרה', '#7ae0ff'], ['Spore', 'Espora', 'הנבג', '#c060ff'], ['Gear', 'Engranaje', 'גלגל השיניים', '#c0a060'],
  ['Anchor', 'Ancla', 'העוגן', '#40e0c0'], ['Bolt', 'Rayo', 'הברק', '#ffe040'], ['Icicle', 'Carámbano', 'הנטיף', '#a0f0ff'],
  ['Toxin', 'Toxina', 'הרעל', '#90ff40'], ['Skull', 'Calavera', 'הגולגולת', '#80a0ff'], ['Magma', 'Magma', 'המאגמה', '#ff8020'], ['Star', 'Estrella', 'הכוכב', '#ff40ff'],
].map(([en, es, he, sym]) => ({ name: n3(en + ' Medal', 'Medalla ' + es, 'מדליית ' + he), sym }));

/* Bosses: moves = phase 1, p2 / p3 are added at 50% / 25% hp. arena = layout key in bosses.js */
const BOSSES = [
  { name: n3('Slime King', 'Rey Baboso', 'מלך הרפשים'), tpl: 'blob', c1: '#5ccf4a', c2: '#2e8a2a', eye: '#fff', crown: true, moves: ['hop', 'summon'], p2: ['slam'], arena: 'meadow', hpMul: 0.7 },
  { name: n3('Cave Spider', 'Araña de la Cueva', 'עכביש המערות'), tpl: 'spider', c1: '#6a5a8a', c2: '#3a2e52', eye: '#ff3a3a', moves: ['web', 'charge'], p2: ['ceiling'], p3: ['shoot'], arena: 'cave' },
  { name: n3('Scorpion King', 'Rey Escorpión', 'מלך העקרבים'), tpl: 'beast', c1: '#d27a2a', c2: '#8a4a14', eye: '#ffef5a', moves: ['burrow', 'charge'], p2: ['sting'], p3: ['rain'], arena: 'desert' },
  { name: n3('Swamp Witch', 'Bruja del Pantano', 'מכשפת הביצה'), tpl: 'skull', c1: '#6a8a3a', c2: '#3a4a1e', eye: '#d0ff5a', moves: ['teleport', 'bubbles'], p2: ['flood', 'summon'], arena: 'swamp' },
  { name: n3('Ice Golem', 'Gólem de Hielo', 'גולם הקרח'), tpl: 'golem', c1: '#9ad8f0', c2: '#4a7ea0', eye: '#ffffff', moves: ['breath', 'slam'], p2: ['pillars'], p3: ['rain'], arena: 'ice', breath: 'frost' },
  { name: n3('Doom Knight', 'Caballero Maldito', 'אביר האבדון'), tpl: 'ogre', c1: '#7a7a90', c2: '#3a3a4a', eye: '#ff3a3a', horns: true, moves: ['block', 'combo'], p2: ['boomerang'], p3: ['charge'], arena: 'castle' },
  { name: n3('Lava Dragon', 'Dragón de Lava', 'דרקון הלבה'), tpl: 'beast', c1: '#e04a1a', c2: '#7a1a0a', eye: '#ffe05a', moves: ['shoot', 'charge'], p2: ['flyBreath', 'rain'], p3: ['slam', 'lavaRise'], arena: 'volcano', breath: 'fire' },
  { name: n3('Bat Queen', 'Reina Murciélago', 'מלכת העטלפים'), tpl: 'bat', c1: '#7a4aa0', c2: '#3a1e5a', eye: '#ff5a5a', fly: true, moves: ['swoop', 'shoot'], p2: ['summon', 'screech'], p3: ['rain'], arena: 'belfry' },
  { name: n3('Storm Titan', 'Titán de la Tormenta', 'טיטאן הסערה'), tpl: 'golem', c1: '#f0f0ff', c2: '#7a8ab0', eye: '#5ad0ff', moves: ['lightning', 'slam'], p2: ['gust'], p3: ['shoot', 'lightning'], arena: 'storm' },
  { name: n3('Monster King', 'Rey Monstruo', 'מלך המפלצות'), tpl: 'ogre', c1: '#a02a3a', c2: '#4a0a14', eye: '#ffef5a', horns: true, crown: true, moves: ['combo', 'charge', 'slam'], p2: ['summon', 'ceiling', 'lightning'], p3: ['shrink', 'breath', 'burrow'], arena: 'throne', breath: 'fire' },
  // ---------------- World 2 ----------------
  { name: n3('Crystal Golem', 'Gólem de Cristal', 'גולם הקריסטל'), tpl: 'golem', c1: '#8ae0ff', c2: '#3a70b0', eye: '#ffffff', moves: ['shards', 'pillars'], p2: ['shoot'], p3: ['slam'], arena: 'crystal', shards: true },
  { name: n3('Mushroom Queen', 'Reina Hongo', 'מלכת הפטריות'), tpl: 'mush', c1: '#d04060', c2: '#802040', eye: '#fff0a0', crown: true, moves: ['spores', 'hop'], p2: ['summon'], p3: ['rain', 'spores'], arena: 'jungle' },
  { name: n3('Clockwork Titan', 'Titán Mecánico', 'טיטאן השעון'), tpl: 'robot', c1: '#c0a060', c2: '#6a5030', eye: '#ff4020', moves: ['laser', 'rockets'], p2: ['charge'], p3: ['laser', 'slam'], arena: 'factory' },
  { name: n3('Kraken', 'Kraken', 'הקראקן'), tpl: 'squid', c1: '#8a4ab0', c2: '#4a2070', eye: '#ffe040', moves: ['tentacles', 'shoot'], p2: ['ink', 'flood'], arena: 'ruins' },
  { name: n3('Cloud Serpent', 'Serpiente de Nubes', 'נחש העננים'), tpl: 'serpent', c1: '#e0f0ff', c2: '#7090c0', eye: '#ff40a0', fly: true, moves: ['serpent', 'lightning'], p2: ['shoot'], p3: ['gust'], arena: 'peaks', hpMul: 0.75 },
  { name: n3('Frost Queen', 'Reina de Escarcha', 'מלכת הכפור'), tpl: 'skull', c1: '#a0e0ff', c2: '#4080c0', eye: '#ffffff', crown: true, moves: ['clones', 'breath'], p2: ['pillars', 'teleport'], arena: 'citadel', breath: 'frost' },
  { name: n3('Toxic Blob', 'Masa Tóxica', 'הגוש הרעיל'), tpl: 'blob', c1: '#90ff40', c2: '#408020', eye: '#ff40ff', moves: ['hop', 'spores'], p2: ['split'], p3: ['slam'], arena: 'toxic' },
  { name: n3('Ghost Captain', 'Capitán Fantasma', 'קפטן הרפאים'), tpl: 'ogre', c1: '#8090c0', c2: '#3a4070', eye: '#60ffff', moves: ['invis', 'cannons'], p2: ['combo', 'ink'], arena: 'ship', ghost: true },
  { name: n3('Magma Titan', 'Titán de Magma', 'טיטאן המאגמה'), tpl: 'golem', c1: '#ff7020', c2: '#5a1808', eye: '#ffff60', moves: ['pillars', 'slam'], p2: ['lavaRise', 'rain'], p3: ['breath'], arena: 'magma', breath: 'fire' },
  { name: n3('Void Lord', 'Señor del Vacío', 'אדון הריק'), tpl: 'skull', c1: '#a050ff', c2: '#30106a', eye: '#ff40ff', crown: true, moves: ['blackhole', 'teleport', 'laser'], p2: ['gravity', 'clones'], p3: ['lightning', 'shoot'], arena: 'void' },
];

const ARMORS = [
  { name: n3('Plain Shirt', 'Camisa', 'חולצה רגילה'), red: 0, p: 0, body: '#e04848', bodyD: '#a83030', helm: null },
  { name: n3('Leather Armor', 'Armadura de Cuero', 'שריון עור'), red: 0.15, p: 80, body: '#a0683a', bodyD: '#704622', helm: null },
  { name: n3('Chainmail', 'Cota de Malla', 'שריון שרשראות'), red: 0.28, p: 220, body: '#a4aebb', bodyD: '#6e7682', helm: '#8a929c' },
  { name: n3('Iron Armor', 'Armadura de Hierro', 'שריון ברזל'), red: 0.40, p: 450, body: '#d4dce6', bodyD: '#8a96a6', helm: '#c0c8d4' },
  { name: n3('Gold Armor', 'Armadura de Oro', 'שריון זהב'), red: 0.50, p: 800, body: '#ffcc33', bodyD: '#c08a10', helm: '#ffd84a' },
  { name: n3('Diamond Armor', 'Armadura de Diamante', 'שריון יהלום'), red: 0.62, p: 1300, body: '#6ff0ff', bodyD: '#2aa8c8', helm: '#8ff6ff' },
  { name: n3('Dragon Armor', 'Armadura de Dragón', 'שריון דרקון'), red: 0.70, p: 4000, body: '#c02a3a', bodyD: '#701020', helm: '#ff5a3a', w2: true },
];
const SWORDS = [
  { name: n3('Wooden Sword', 'Espada de Madera', 'חרב עץ'), dmg: 7, p: 0, range: 18, col: '#c08a4a', guard: '#7a5228' },
  { name: n3('Stone Sword', 'Espada de Piedra', 'חרב אבן'), dmg: 12, p: 80, range: 19, col: '#a4a4b0', guard: '#5a5a66' },
  { name: n3('Iron Sword', 'Espada de Hierro', 'חרב ברזל'), dmg: 18, p: 200, range: 21, col: '#dfe8f2', guard: '#8a6a3a' },
  { name: n3('Steel Sword', 'Espada de Acero', 'חרב פלדה'), dmg: 26, p: 420, range: 24, col: '#b8d4f0', guard: '#ffcc33' },
  { name: n3('Crystal Sword', 'Espada de Cristal', 'חרב קריסטל'), dmg: 36, p: 750, range: 27, col: '#7fe3ff', guard: '#b07aff' },
  { name: n3('Legendary Sword', 'Espada Legendaria', 'חרב אגדית'), dmg: 50, p: 1200, range: 30, col: '#ffd54a', guard: '#ff3050' },
];
/* Weaponsmith (world 2) */
const BOWS = [ // owned levels 1..3
  { dmg: 34, p: 1500, cd: 26 }, { dmg: 48, p: 2500, cd: 24 }, { dmg: 66, p: 4000, cd: 22 },
];
const HAMMERS = [ // slow but big; falling smashes deal much more (like a mace)
  { dmg: 55, p: 1800, cd: 34 }, { dmg: 75, p: 3000, cd: 32 }, { dmg: 100, p: 4500, cd: 30 },
];
const THUNDER = [{ chance: 0.02, dmg: 200, p: 1500 }, { chance: 0.03, dmg: 240, p: 2500 }, { chance: 0.04, dmg: 280, p: 3500 }];
const SHARP = [{ mult: 1.08, p: 800 }, { mult: 1.16, p: 1500 }, { mult: 1.25, p: 2400 }];

/* Specials (world 2): mana fills by hitting monsters. lv 1..3 */
const SPECIALS = {
  fireball: { icon: '🔥', cost: 60, p: [900, 1600, 2600], power: [120, 180, 260] },
  storm:    { icon: '⚡', cost: 100, p: [1200, 2000, 3000], power: [4, 6, 8] },      // targets hit (120 dmg each)
  shield:   { icon: '🛡️', cost: 80, p: [1000, 1700, 2600], power: [180, 270, 360] }, // frames
  slow:     { icon: '⏳', cost: 100, p: [1200, 2000, 3000], power: [240, 330, 420] }, // frames
  heal:     { icon: '💚', cost: 100, p: [800, 1400, 2200], power: [0.4, 0.6, 0.8] },
};

const HP_STEP = 20;
const HP_PRICES = [40, 70, 110, 160, 220, 290, 370, 460, 560, 680,      // world 1
  800, 950, 1100, 1300, 1500, 1750, 2000, 2300, 2600, 3000];             // world 2
const ATK_SPEED = [{ cd: 22, p: 0 }, { cd: 18, p: 90 }, { cd: 15, p: 200 }, { cd: 12, p: 380 }, { cd: 10, p: 600 }];
const MAGNET = [{ r: 26, p: 0 }, { r: 50, p: 70 }, { r: 80, p: 160 }, { r: 120, p: 300 }];
const COIN_MAX = 25, COIN_STEP = 2;
const coinPrice = lv => 30 + lv * 12;
const DBL_PRICE = 150, DASH_PRICE = 220, POTION_PRICE = 30, MAX_POTIONS = 5;

/* enemy pools per level (keys of EDEF in engine.js) */
const POOLS = [
  ['S', 'O', 'R', 'H'],
  ['S', 'B', 'H', 'U', 'R', 'cbat'],
  ['O', 'K', 'Z', 'H', 'Q', 'spear'],
  ['S', 'Q', 'R', 'Z', 'W', 'shaman'],
  ['S', 'O', 'B', 'U', 'H', 'bomb'],
  ['K', 'N', 'O', 'W', 'B', 'spear', 'bomb'],
  ['S', 'U', 'Z', 'K', 'N', 'flame', 'brute'],
  ['W', 'B', 'K', 'R', 'Q', 'imp', 'shaman'],
  ['Z', 'B', 'Q', 'W', 'N', 'K', 'cbat', 'spear'],
  ['N', 'K', 'W', 'U', 'O', 'Z', 'H', 'brute', 'imp', 'bomb'],
  ['cbat', 'U', 'K', 'imp', 'S', 'shaman'],
  ['R', 'Q', 'S', 'shaman', 'Z', 'H', 'bomb'],
  ['N', 'bomb', 'spear', 'brute', 'K', 'U'],
  ['Q', 'S', 'W', 'spear', 'shaman', 'B'],
  ['cbat', 'Z', 'spear', 'K', 'brute', 'imp'],
  ['N', 'U', 'H', 'bomb', 'brute', 'cbat'],
  ['S', 'flame', 'bomb', 'R', 'shaman', 'brute'],
  ['W', 'K', 'imp', 'spear', 'B', 'N'],
  ['flame', 'U', 'brute', 'imp', 'Z', 'K'],
  ['imp', 'brute', 'shaman', 'flame', 'spear', 'bomb', 'cbat', 'N', 'W'],
];

/* ---------------- save (no accounts: progress lives on this device) ---------------- */
const SAVE_KEY = 'dvm_save_v2', OLD_ACC_KEY = 'dvm_accounts_v1', SETTINGS_KEY = 'dvm_settings_v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
function newSave() {
  return {
    v: 2, coins: 0, unlocked: 1, medals: Array(NLEVELS).fill(0), best: Array(NLEVELS).fill(0), chests: Array(NLEVELS).fill(0),
    armor: 0, weapon: 0, hpLv: 0, dbl: false, dash: false, potions: 1, tips: {}, kills: 0, bosses: 0, atkLv: 0, magLv: 0, coinLv: 0,
    bowLv: 0, hammerLv: 0, equip: 'sword', thunder: 0, sharp: 0,
    spec: { fireball: 0, storm: 0, shield: 0, slow: 0, heal: 0 }, special: null,
  };
}
function fixSave(s) {
  const base = newSave(), out = Object.assign(base, s || {});
  for (const k of ['medals', 'best', 'chests']) { const a = Array.isArray(out[k]) ? out[k] : []; out[k] = Array.from({ length: NLEVELS }, (_, i) => a[i] || 0); }
  out.spec = Object.assign(newSave().spec, out.spec || {});
  out.v = 2;
  return out;
}
// carry progress over from the old username/password accounts (most advanced one wins)
function loadSave() {
  let s = store.get(SAVE_KEY);
  if (!s) {
    const acc = store.get(OLD_ACC_KEY);
    if (acc) {
      let best = null, score = -1;
      for (const k in acc) {
        const sv = acc[k] && acc[k].save; if (!sv) continue;
        const sc = (sv.unlocked || 0) * 100000 + (sv.medals || []).reduce((a, b) => a + b, 0) * 1000 + (sv.coins || 0);
        if (sc > score) { score = sc; best = sv; }
      }
      if (best) s = best;
    }
  }
  return fixSave(s);
}
let save = loadSave();
function persist() { store.set(SAVE_KEY, save); }
const world2 = () => save.unlocked > PER_WORLD;   // beat level 10
