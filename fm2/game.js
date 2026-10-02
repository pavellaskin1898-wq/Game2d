'use strict';
/* ============================================================
   MECH TACTICS: DIABLO — 2D изометрическая тактика про мехов
   Стиль: Front Mission (мехи/данные) + Diablo 2 (изометрия, палитра)
   Внутреннее разрешение: 960x540, тайл 64x32 (ромб 2:1), сетка 24x24.
   Все спрайты рисуются программно. Без внешних ассетов.
   Модули: Tile/Battlefield -> IsometricRenderer -> Weapon/Part/Mech -> Battle -> Game(GameState)
   ============================================================ */

// ---------- Утилиты ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let __seed = 1337;
function srand() { __seed = (__seed * 16807) % 2147483647; return (__seed - 1) / 2147483646; }
function srect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function stripPx(px) { // массив строк -> canvas-спрайт (пиксельная матрица)
  const h = px.length, w = Math.max(...px.map(r => r.length));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) for (let x = 0; x < px[y].length; x++) {
    const ch = px[y][x]; if (ch === '.' || ch === ' ') continue;
    cx.fillStyle = DPAL[ch] || '#f0f'; cx.fillRect(x, y, 1, 1);
  }
  return cv;
}
// Палитра «как в Diablo 2»: тёмные землистые тона + жёлтые акценты меха
const DPAL = {
  S: '#c9ccd4', s: '#9aa0ac', D: '#5b6068', d: '#3a3e45', K: '#1c1e22',
  Y: '#ffd23e', y: '#c99a1e', W: '#f2ede0', R: '#a03428', r: '#6e2119',
  G: '#3e6b3a', g: '#28472a', B: '#20242c', C: '#6fa8c9', M: '#8a5a2a', m: '#5d3d1e',
};

// ---------- Данные игры (реальные имена/числа из Game-3 front_mission_3_data.json) ----------
// Формат повторяет JSON источника: weapon=[name,type,AT,...,range_cm,...,ammo,weight], part=[name,HP...,weight,...]
const RAW_WEAPONS = { // [name, type, AT, range_cm, ammo, weight] — значения из fm_game_data.json
  'Mk9 Sniper':   ['Mk9 Sniper','rifle',53,200,13,9],
  'Laoxing 6':    ['Laoxing 6','rifle',62,460,23,22],
  'Laohu 3':      ['Laohu 3','rifle',73,600,39,28],
  'Mk11 Sniper':  ['Mk11 Sniper','rifle',84,780,60,45],
  'Huida 3':      ['Huida 3','m.gun',78,620,45,28],
  'Arc Barrel4':  ['Arc Barrel4','m.gun',91,800,60,45],
  'Wanzerfaust':  ['Wanzerfaust','grenade',92,260,13,0],
  'Type 13GR':    ['Type 13GR','grenade',124,600,31,28],
  'Wagtail 2':    ['Wagtail 2','missile',96,380,13,9],
  'Yunsheng34':   ['Yunsheng34','missile',109,460,23,22],
  'Nightingale':  ['Nightingale','missile',123,660,0,41],
  'Zhiniao 50':   ['Zhiniao 50','missile',123,660,40,28],
  'Bjariger':     ['Bjariger','missile',137,900,60,45],
  'Huoyao 3':     ['Huoyao 3','flame thrower',81,660,45,37],
  'Mk18 Spike':   ['Mk18 Spike','spike',28,400,32,0],
};
// Прогрессия оружия: нужное число побед для разблокировки (0 = доступно сразу)
const W_UNLOCK = { 'Mk11 Sniper': 0, 'Huida 3': 0, 'Wagtail 2': 0, 'Yunsheng34': 0, 'Huoyao 3': 0, 'Arc Barrel4': 1, 'Bjariger': 2, 'Nightingale': 2 };
const WEAPONS = {};
for (const k in RAW_WEAPONS) {
  const [name, type, at, rngcm, ammo, weight] = RAW_WEAPONS[k];
  WEAPONS[k] = { name, type, at, dmg: Math.max(10, Math.round(at / 3)),   // Урон = AT/3 (баланс 1-vs-3)
    rng: clamp(Math.round(rngcm / 50), 6, 18), ammo: ammo || 12, weight: weight || 15 };
}
// Части: [name, HP, weight, df, acc, evasion, speedBonus] (пересчёт из wanzer_body/arms/legs)
const PARTS = {
  torso: { // Head объединён с Body — отдельного слота головы НЕТ
    light:  { name: 'Drake M2C', hp: 190, wt: 60, df: 8,  acc: 55 },
    medium: { name: 'Getty',     hp: 240, wt: 85, df: 14, acc: 60 },
    heavy:  { name: 'Lanze',     hp: 320, wt: 115, df: 22, acc: 62 },
  },
  armR: {
    light:  { name: 'Shangdi 1',   hp: 120, wt: 25, df: 6, acc: 74 },
    medium: { name: 'Jinyo Mk110', hp: 150, wt: 36, df: 10, acc: 63 },
    heavy:  { name: 'Lanze Arm',   hp: 200, wt: 55, df: 16, acc: 50 },
  },
  armL: {
    light:  { name: 'Drake Arm', hp: 120, wt: 25, df: 6, acc: 72 },
    medium: { name: 'Getty Arm', hp: 150, wt: 36, df: 10, acc: 62 },
    heavy:  { name: 'Grapple M1', hp: 200, wt: 59, df: 16, acc: 48 },
  },
  legs: {
    light:  { name: 'Drake M2C Legs', hp: 150, wt: 40, df: 6, spd: 6, eva: 18 },
    medium: { name: 'Vinedrai',       hp: 190, wt: 62, df: 10, spd: 4, eva: 12 },
    heavy:  { name: 'Lanze Legs',     hp: 260, wt: 95, df: 16, spd: 3, eva: 6 },
  },
};
const TIERS = [['light', 'LIGHT'], ['medium', 'MEDIUM'], ['heavy', 'HEAVY']];

// ---------- Классы данных ----------
class Weapon {
  constructor(key) { const d = WEAPONS[key]; Object.assign(this, d, { key, ammoLeft: d.ammo }); }
}
class Part {
  constructor(slot, tier) { const d = PARTS[slot][tier]; Object.assign(this, d, { slot, tier, hpCur: d.hp }); }
}
class Mech {
  constructor(cfg) { // cfg: {name, tint, parts:{...tiers}, weapons:{armR,armL,back}}
    this.name = cfg.name; this.tint = cfg.tint; this.isPlayer = !!cfg.isPlayer;
    this.parts = {}; for (const s of ['torso', 'armR', 'armL', 'legs']) this.parts[s] = new Part(s, cfg.parts[s]);
    this.weapons = {};
    if (cfg.weapons) { if (cfg.weapons.armR) this.weapons.armR = new Weapon(cfg.weapons.armR);
                       if (cfg.weapons.armL) this.weapons.armL = new Weapon(cfg.weapons.armL);
                       if (cfg.weapons.back) this.weapons.back = new Weapon(cfg.weapons.back); }
    this.x = 0; this.y = 0; this.dead = false;
    this.recalc();
    this.hpCur = this.maxHp; // стартовое суммарное HP по частям
  }
  recalc() { // пересчёт итоговых статов из деталей (Head+Body = Torso)
    let hp = 0, wt = 0, df = 0, acc = 0, spd = 0, eva = 0;
    for (const s in this.parts) { const p = this.parts[s];
      hp += p.hp; wt += p.wt; df += p.df; acc += (p.acc || 0); spd += (p.spd || 0); eva += (p.eva || 0); }
    for (const w in this.weapons) wt += this.weapons[w].weight;
    this.maxHp = hp; this.weight = wt; this.df = df;
    this.maxWeight = this.parts.torso.wt * 2 + this.parts.legs.wt * 2.2 + 120; // грузоподъёмность шасси+корпуса
    const overload = wt > this.maxWeight ? wt / this.maxWeight : 1;            // штраф за перегрузку
    this.speed = Math.max(1, Math.round((spd / 2) / overload));                // клетки за ход
    this.accuracy = clamp(Math.round(acc / 4 + 30 - (overload - 1) * 25), 30, 95);
    this.evasion = clamp(eva - (wt - this.maxWeight) * 0.1, 0, 40);
    this.at = 0; this.range = 0;
    for (const w in this.weapons) { this.at += this.weapons[w].dmg; this.range = Math.max(this.range, this.weapons[w].rng); }
  }
  get alive() { return !this.dead && this.parts.torso.hpCur > 0; }
  get armsLost() { return (this.parts.armR.hpCur <= 0 ? 1 : 0) + (this.parts.armL.hpCur <= 0 ? 1 : 0); }
  get mobilityPenalty() { return this.parts.legs.hpCur <= 0 ? 999 : 0; } // ноги уничтожены — мех обездвижен
  takeDamage(d) { // урон по случайной живой части (модульный мех FM)
    const live = Object.values(this.parts).filter(p => p.hpCur > 0);
    if (!live.length) { this.dead = true; return; }
    const p = live[Math.floor(srand() * live.length)];
    p.hpCur = Math.max(0, p.hpCur - d);
    if (p.slot === 'torso' && p.hpCur <= 0) this.dead = true;
    if ((p.slot === 'armR' || p.slot === 'armL') && p.hpCur <= 0 && this.weapons[p.slot]) this.weapons[p.slot].ammoLeft = 0; // рука разоружена
    this.hpCur = Object.values(this.parts).reduce((a, p) => a + p.hpCur, 0);
  }
}

// ---------- Карта вымышленного города: 3 локации (выбор задания) ----------
// Каждая локация = свой набор врагов (разные шаблоны/порядок), своя генерация поля и награда.
const LOCS = {
  plaza: {
    id: 'plaza', name: 'CENTRAL PLAZA', ru: 'Центральная площадь', x: 170, y: 150, seed: 11,
    floor: 'road', danger: 1,
    enemies: ['RECON "WASP"', 'RECON "WASP"', 'LINE "HORNET"'],
    desc: 'Площадь Старого города: фонтан-руины и ряды обгоревших ларьков. Разведка противника засняла перекрёсток — три лёгких меха прикрывают средний. Узкие улицы: много укрытий, короткие дистанции.',
    reward: 350,
    walls: [[6,6],[7,6],[6,7],[7,7],[15,7],[16,7],[15,8],[10,14],[11,14],[17,15],[18,15],[18,16],[4,11],[4,12]],
    covers: [[9,4],[13,12],[5,18],[20,12],[12,20],[21,5],[8,10],[14,17]],
  },
  docks: {
    id: 'docks', name: 'CARGO DOCKS', ru: 'Грузовые доки', x: 480, y: 300, seed: 23,
    floor: 'industrial', danger: 2,
    enemies: ['LINE "HORNET"', 'RECON "WASP"', 'SIEGE "BOAR"'],
    desc: 'Порт на окраине Вергарда: склады, контейнеры и эстакады. Средний мех «HORNET» в паре с тяжёлым «BOAR» — фланги прикрывает разведчик. Контейнеры блокируют обзор: работайте с возвышений.',
    reward: 550,
    walls: [[5,5],[6,5],[5,6],[16,6],[17,6],[18,6],[16,7],[9,13],[10,13],[11,13],[19,14],[19,15],[3,17],[4,17]],
    covers: [[8,3],[13,10],[4,12],[20,9],[12,19],[21,18],[15,15],[6,20]],
    extraBlock: [[13,4],[14,4],[8,8]], // цистерны
  },
  fortress: {
    id: 'fortress', name: 'HILL FORTRESS', ru: 'Холмовая крепость', x: 758, y: 168, seed: 37,
    floor: 'grass', danger: 3,
    enemies: ['SIEGE "BOAR"', 'LINE "HORNET"', 'SIEGE "BOAR"'],
    desc: 'Укрепрайон на heights: два осадных «BOAR» и линия поддержки «HORNET». Рельеф изрезан стенами фортификаций — цель на возвышении труднее для поражения. Награда максимальна.',
    reward: 800,
    walls: [[7,4],[8,4],[9,4],[7,5],[15,9],[16,9],[15,10],[16,10],[5,13],[6,13],[12,16],[13,16],[14,16],[20,6]],
    covers: [[10,7],[4,17],[18,13],[21,4],[9,20],[16,18],[12,11],[7,9]],
  },
};

// ---------- Поле боя: изометрия 24x24, рельеф и укрытия (тайлы 64x32) ----------
const GRID = 24, TW = 64, TH = 32, ELEV = 12; // elevation шаг 12px
class Tile {
  constructor(x, y) { this.x = x; this.y = y; this.h = 0; this.type = 'grass'; this.block = false; this.cover = false; }
}
class Battlefield {
  constructor(locKey) { // locKey — локация с карты города; без неё — полигон (детерминированный сид 1337)
    this.loc = LOCS[locKey] || null;
    __seed = this.loc ? (this.loc.seed * 7919 % 2147483647) : 1337;
    this.tiles = [];
    for (let y = 0; y < GRID; y++) { const row = [];
      for (let x = 0; x < GRID; x++) { const t = new Tile(x, y);
        // мягкие холмы (подъёмы/спуски) — сумма синусов, квант 0..2
        const hh = Math.sin(x * 0.42) * 1.1 + Math.cos(y * 0.35) * 1.1 + Math.sin((x + y) * 0.21) * 0.9;
        t.h = clamp(Math.round((hh + 1.4) / 1.4), 0, 2);
        const L = this.loc;
        if (L && L.floor === 'road') { // городская брусчатка/асфальт вместо травы
          t.type = (x < 2 || y < 2 || x > 21 || y > 21) ? 'metal' : (srand() < 0.15 ? 'crack' : 'road'); }
        else if (L && L.floor === 'industrial') {
          t.type = (srand() < 0.5) ? 'metal' : ((x < 2 || y < 2 || x > 21 || y > 21) ? 'metal' : (srand() < 0.12 ? 'crack' : 'grass')); }
        else {
          t.type = (x < 2 || y < 2 || x > 21 || y > 21) ? 'metal' : (srand() < 0.12 ? 'crack' : 'grass'); }
        row.push(t); } this.tiles.push(row); }
    // стены-блоки (объёмные, блокируют LOS) — «руины» как в D2
    const L = this.loc;
    let walls = [[6,6],[7,6],[6,7],[16,8],[17,8],[16,9],[10,15],[11,15],[17,16],[18,16],[18,17],[4,13],[4,14]];
    if (L) walls = L.walls;
    for (const [x, y] of walls) { const t = this.at(x, y); t.block = true; t.type = 'wall'; t.h = 1; }
    // укрытия (ящики/бочка №13): бонус DF, частичное перекрытие обзора
    let covers = [[9,4],[13,12],[5,18],[20,12],[12,20],[21,5]];
    if (L) covers = L.covers;
    for (const [x, y] of covers) { const t = this.at(x, y); t.cover = true; t.type = (x + y) % 2 ? 'crate' : 'barrel'; }
    // дополнительные препятствия локации (цистерны и т.п.)
    if (L && L.extraBlock) for (const [x, y] of L.extraBlock) { const t = this.at(x, y); t.block = true; t.type = 'tank'; }
  }
  at(x, y) { return (x >= 0 && y >= 0 && x < GRID && y < GRID) ? this.tiles[y][x] : null; }
  passable(x, y, mech) { const t = this.at(x, y); return t && !t.block && !(mech && mech.weight > mech.maxWeight * 1.3 && t.h === 2); }
  // Линия видимости (Bresenham по клеткам): стены блокируют; укрытие/высота перекрывает LOS, если между стрелком и целью есть тайл выше обоих
  los(a, b) {
    let x0 = a.x, y0 = a.y; const x1 = b.x, y1 = b.y;
    const ah = this.at(a.x,a.y).h, bh = this.at(b.x,b.y).h;
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, guard = 0;
    while (guard++ < 100) {
      if (x0 === x1 && y0 === y1) return true;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; } else if (e2 < dx) { err += dx; y0 += sy; }
      const t = this.at(x0, y0);
      if (!t) return false;
      if (t.block) return false;                                  // стена всегда блокирует
      if (t.h > ah && t.h > bh) return false;                     // хребет/подъём между бойцами загораживает обзор
      if (t.cover && t.h >= ah && t.h >= bh && BF.dist({x:x0,y:y0},a) > 1 && BF.dist({x:x0,y:y0},b) > 1) return false; // укрытие в середине линии
    }
    return true;
  }
  dist(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); } // Chebyshev (клетки)
}

// ---------- Изометрический рендерер (D2-вид, depth-sorted occlusion) ----------
class IsometricRenderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.camX = 0; this.camY = 0;
    this.sprites = this.makeSprites();
  }
  iso(x, y, h = 0) { return { sx: (x - y) * TW / 2 - this.camX, sy: (x + y) * TH / 2 - h * ELEV - this.camY }; }
  pick(mx, my) { // экран -> клетка (с учётом высоты верхнего слоя, перебор сверху вниз)
    for (let h = 2; h >= 0; h--) {
      const px = mx + this.camX, py = my + this.camY + h * ELEV;
      const fx = (px / (TW / 2) + py / (TH / 2)) / 2, fy = (py / (TH / 2) - px / (TW / 2)) / 2;
      const x = Math.floor(fx), y = Math.floor(fy);
      const t = BF.at(x, y);
      if (t && t.h === h) return { x, y };
    }
    return null;
  }
  makeSprites() { // пиксельные матрицы пропов: мех (FM-силуэт), ящик, бочка «13»
    const mechP = [
      '..SSSSSSSS..','.SYYYYYYYYYS.','SWWWWWWWWWW.',
      '.SDSSSSSSSDS','SS.SSSSSS.SS','SD.DDDDDD.DS',
      '..SYYSSYYYS...'.slice(0,12),'..SDDDDDDDS..','.SDSSSSSSDS.','.SD.D..D.DS.','.SS.S..S.SS.','..D..DD..D..'];
    // мех рисуется примитивами (см. drawMech) — здесь только декор:
    this.crateSpr = stripPx([
      '.MMMMMM.','Mmmmm.M','MmMMmMM','Mm.MM.m','MmMMmMM','Mmmmm.m','.MMMMM.']);
    this.barrelSpr = stripPx([
      '.WWWWW.','WddWddW','W13WWdW','WddWddW','WWdWWdW','.WWWWW.']);
    return null;
  }
  drawFloor(t) {
    const { sx, sy } = this.iso(t.x, t.y, t.h);
    if (sx < -TW || sy < -TH || sx > CW + TW || sy > CH + TH) return;
    const top = { grass: ['#39412c','#454e33','#2f3626'][t.h], crack: '#33382a', metal: ['#23262c','#2a2e36','#1d2026'][t.h], road: ['#34373d','#3b3f46','#2c2f35'][t.h] };
    let c = top[t.type] || '#3a3f33';
    // тонкая вариативность оттенка по координатам (как тайллинг D2)
    const v = ((t.x * 7 + t.y * 13) % 3); c = shade(c, v - 1);
    const ctx = this.ctx;
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(sx + TW/2, sy); ctx.lineTo(sx + TW, sy + TH/2); ctx.lineTo(sx + TW/2, sy + TH); ctx.lineTo(sx, sy + TH/2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(c, -18); ctx.lineWidth = 1; ctx.stroke();
    if (t.type === 'metal') { srect(ctx, sx + TW/2 - 1, sy + 4, 2, TH - 8, shade(c, 14)); } // стык плит
    if (t.type === 'road') { // брусчатка: диагональные швы как на мостовой D2
      ctx.strokeStyle = shade(c, -14); ctx.beginPath();
      ctx.moveTo(sx + 16, sy + 8); ctx.lineTo(sx + 48, sy + 24); ctx.stroke();
      if ((t.x + t.y) % 2 === 0) { ctx.beginPath(); ctx.moveTo(sx + 48, sy + 8); ctx.lineTo(sx + 16, sy + 24); ctx.stroke(); } }
    if (t.h > 0) { // боковые грани подъёма (объём)
      ctx.fillStyle = shade(c, -34); ctx.beginPath();
      ctx.moveTo(sx, sy + TH/2); ctx.lineTo(sx + TW/2, sy + TH); ctx.lineTo(sx + TW/2, sy + TH + t.h*ELEV); ctx.lineTo(sx, sy + TH/2 + t.h*ELEV); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(c, -22); ctx.beginPath();
      ctx.moveTo(sx + TW/2, sy + TH); ctx.lineTo(sx + TW, sy + TH/2); ctx.lineTo(sx + TW, sy + TH/2 + t.h*ELEV); ctx.lineTo(sx + TW/2, sy + TH + t.h*ELEV); ctx.closePath(); ctx.fill();
    }
  }
  drawProps(t) {
    const { sx, sy } = this.iso(t.x, t.y, t.h); const ctx = this.ctx;
    if (t.type === 'wall') { // объёмная стена-блок
      const H = 26 + t.h * ELEV;
      srect(ctx, sx + 6, sy - H + 14, TW - 12, H, '#4a4f57');
      ctx.fillStyle = '#5b6068'; ctx.beginPath();
      ctx.moveTo(sx + 6, sy - H + 14); ctx.lineTo(sx + TW/2, sy - H); ctx.lineTo(sx + TW - 6, sy - H + 14); ctx.lineTo(sx + TW/2, sy - H + 26); ctx.closePath(); ctx.fill();
      srect(ctx, sx + 10, sy - H + 18, 6, 4, '#2f3338'); srect(ctx, sx + TW - 18, sy - H + 22, 6, 4, '#2f3338');
      // жёлто-чёрные предупреждающие полосы (ангар D2/FM)
      for (let i = 0; i < 5; i++) srect(ctx, sx + 8 + i * 10, sy + 2, 5, 4, i % 2 ? '#111' : '#c9a227');
      return;
    }
    if (t.type === 'crate') { // ящик-укрытие: объёмный D2-проп
      const X0 = sx + TW / 2, Y0 = sy + TH / 2;
      srect(ctx, X0 - 11, Y0 - 14, 22, 14, '#8a5a2a');                       // фасад
      ctx.fillStyle = '#6b4520'; ctx.beginPath();                             // левая грань
      ctx.moveTo(X0 - 11, Y0); ctx.lineTo(X0 - 3, Y0 - 4); ctx.lineTo(X0 - 3, Y0 - 18); ctx.lineTo(X0 - 11, Y0 - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b8905c'; ctx.beginPath();                             // крышка
      ctx.moveTo(X0 - 11, Y0 - 14); ctx.lineTo(X0 - 3, Y0 - 18); ctx.lineTo(X0 + 8, Y0 - 18); ctx.lineTo(X0 + 11, Y0 - 15); ctx.lineTo(X0 + 11, Y0 - 14); ctx.lineTo(X0, Y0 - 10); ctx.closePath(); ctx.fill();
      srect(ctx, X0 - 8, Y0 - 10, 14, 2, '#5d3d1e'); srect(ctx, X0 - 1, Y0 - 13, 2, 10, '#5d3d1e'); // доски
      return; }
    if (t.type === 'barrel') { // белая бочка с номером «13» — объёмная, как в D2
      const bx = sx + TW / 2 - 8, by = sy + TH / 2 - 20;
      srect(ctx, bx, by + 2, 16, 18, '#e8e4d8'); srect(ctx, bx, by + 2, 16, 3, '#f5f2e8'); srect(ctx, bx, by + 17, 16, 3, '#b9b4a5');
      ctx.fillStyle = '#cfcabb'; ctx.beginPath(); ctx.ellipse(bx + 8, by + 3, 8, 3, 0, 0, 7); ctx.fill(); // верхний торец
      srect(ctx, bx + 2, by + 8, 12, 6, '#fff'); ctx.fillStyle = '#333'; ctx.font = 'bold 7px monospace'; ctx.fillText('13', bx + 4, by + 13);
      srect(ctx, bx + 13, by + 4, 2, 14, '#9a958a'); return;
    }
    if (t.type === 'tank') { // промышленная цистерна (препятствие, промзона)
      const cxp = sx + TW / 2, cyp = sy + TH / 2;
      srect(ctx, cxp - 14, cyp - 22, 28, 20, '#6b6f77'); srect(ctx, cxp - 14, cyp - 22, 28, 4, '#8b909c');
      ctx.fillStyle = '#4a4f57'; ctx.beginPath(); ctx.ellipse(cxp, cyp - 22, 14, 5, 0, 0, 7); ctx.fill();
      srect(ctx, cxp - 14, cyp - 12, 28, 2, '#3a3e45'); srect(ctx, cxp + 10, cyp - 18, 2, 14, '#c9a227');
      return; }
    if (t.type === 'crack' && (t.x + t.y) % 2 === 0) { // кабели на полу
      const ctx2 = ctx; ctx2.strokeStyle = '#14161a'; ctx2.lineWidth = 1; ctx2.beginPath();
      ctx2.moveTo(sx + 10, sy + TH/2 + 4); ctx2.quadraticCurveTo(sx + TW/2, sy + TH/2 - 4, sx + TW - 10, sy + TH/2 + 6); ctx2.stroke();
    }
  }
  drawMech(m, hl) {
    const t = BF.at(m.x, m.y); const { sx, sy } = this.iso(m.x, m.y, t ? t.h : 0);
    const ctx = this.ctx;
    const X = sx + TW / 2, Y = sy + TH / 2 + 6; // точка подошв на тайле
    // тень
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(X, Y + 8, 17, 6, 0, 0, 7); ctx.fill();
    if (hl) { ctx.strokeStyle = hl; ctx.lineWidth = 2; ctx.strokeRect(X - 19, Y - 46, 38, 54); }
    // пиксельная анимация (spritepaint-листы): idle/walk/fire по состоянию меха
    if (window.SPRITEPAINT) {
      m.anim = m.anim || new SPRITEPAINT.PixelAnimator(SPRITEPAINT.export.sheet);
      const frac = (m.hpCur ?? m.maxHp) / m.maxHp;
      m.anim.draw(ctx, X, Y, 1, !m.isPlayer, frac < .35 ? 'red' : null);
      // HP-бар поверх спрайта
      if (frac < 1) { srect(ctx, X - 16, Y - 52, 32, 3, '#111'); srect(ctx, X - 15, Y - 51, Math.max(0, Math.round(30 * frac)), 1, frac > .5 ? '#5ad15a' : frac > .25 ? '#ffd23e' : '#e04b3a'); }
      return;
    }
    // ---- legacy-отрисовка примитивами (если sprites.js не загружен) ----
    const P = m.parts;
    const tierCol = { light: '#aab2bd', medium: '#8f9aa8', heavy: '#77808d' };
    const body = tierCol[P.torso.tier], dark = '#3a3e45', yel = '#ffd23e';
    const bob = Math.sin(performance.now() / 400 + m.x) * 1;
    // ноги (по тиру ног)
    const legW = P.legs.tier === 'heavy' ? 8 : 6;
    srect(ctx, X - 12, Y - 6, legW, 14, dark); srect(ctx, X + 12 - legW, Y - 6, legW, 14, dark);
    srect(ctx, X - 14, Y + 6, legW + 4, 4, body); srect(ctx, X + 10 - legW, Y + 6, legW + 4, 4, body);
    // торс FM-меха: большой корпус + V-образный гребень + cockpit-иллюминатор
    srect(ctx, X - 14, Y - 26, 28, 20, body);
    srect(ctx, X - 14, Y - 26, 28, 3, shade(body, 20));
    srect(ctx, X - 4, Y - 30, 8, 4, shade(body, -12)); // «плечи» под головой
    // голова (часть Torso-слота)
    srect(ctx, X - 6, Y - 38, 12, 8, shade(body, 8));
    srect(ctx, X - 5, Y - 36, 10, 2, '#ffdf6b'); // визор
    srect(ctx, X - 1, Y - 41, 2, 3, yel); // антенна
    // кабина пилота (как в нашем ангаре): иллюминатор с человечком
    srect(ctx, X - 6, Y - 22, 12, 8, '#101418'); srect(ctx, X - 5, Y - 21, 10, 6, '#2b4257');
    srect(ctx, X - 2, Y - 20, 3, 3, '#d9b38c'); srect(ctx, X - 2, Y - 17, 3, 2, '#4a6b8a'); // пилот
    // наплечники (по тиру рук)
    const shW = P.armR.tier === 'heavy' ? 12 : (P.armR.tier === 'medium' ? 10 : 8);
    srect(ctx, X - 14 - shW, Y - 28, shW, 12, shade(body, -6)); srect(ctx, X + 14, Y - 28, shW, 12, shade(body, -6));
    srect(ctx, X - 14 - shW, Y - 28, shW, 2, yel); srect(ctx, X + 14, Y - 28, shW, 2, yel); // жёлтая кромка
    // руки + оружие (стволы видны)
    srect(ctx, X - 20, Y - 16, 5, 12, dark); srect(ctx, X + 15, Y - 16, 5, 12, dark);
    const wcol = { rifle: '#cfd6de', 'm.gun': '#b7c0cc', missile: '#d8d2c2', grenade: '#9fb28f', 'flame thrower': '#c98f5a', spike: '#8fa9c9' };
    const flip = m.isPlayer ? 1 : -1; // враги «смотрят» влево
    if (m.weapons.armR) { const c = wcol[m.weapons.armR.type] || '#ccc'; srect(ctx, flip>0?X-30:X+18, Y - 14, 12, 4, c); srect(ctx, flip>0?X-32:X+29, Y - 13, 3, 2, '#222'); }
    if (m.weapons.armL) { const c = wcol[m.weapons.armL.type] || '#ccc'; srect(ctx, flip>0?X+18:X-30, Y - 14, 12, 4, c); srect(ctx, flip>0?X+29:X-32, Y - 13, 3, 2, '#222'); }
    if (m.weapons.back) { srect(ctx, X - 8, Y - 44, 16, 8, '#6b6f77'); for (let i = 0; i < 3; i++) srect(ctx, X - 6 + i * 5, Y - 46, 3, 4, '#d8d2c2'); }
    // индикатор повреждений
    const frac = (m.hpCur ?? m.maxHp) / m.maxHp;
    if (frac < 1) { srect(ctx, X - 16, Y - 48, 32, 3, '#111'); srect(ctx, X - 15, Y - 47, Math.max(0, Math.round(30 * frac)), 1, frac > .5 ? '#5ad15a' : frac > .25 ? '#ffd23e' : '#e04b3a'); }
  }
}
// хелпер оттенка
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ---------- Бой (пошаговый) ----------
let BF = new Battlefield(); // переозначается под локацию с карты города (см. startBattle)
class Battle {
  constructor(player, enemies, locKey) {
    this.locKey = locKey || null; // локация с карты города (null = учебный полигон)
    this.loc = locKey ? LOCS[locKey] : null;
    this.reward = this.loc ? this.loc.reward : 300 + GameState.wins * 100;
    this.player = player; this.enemies = enemies;
    this.units = [player, ...enemies];
    this.placeUnits();
    this.turn = 'player'; this.phase = 'move'; // move -> act
    this.moved = false; this.acted = false;
    this.sel = null; this.moveSet = null; this.targets = null;
    this.log = [this.loc ? ('MISSION: ' + this.loc.name + ' — destroy all 3 hostile WANZERs!') : 'Deployed to training grid. Destroy all 3 hostile WANZERs!'];
    this.fx = []; this.hover = null; this.cursor = { x: player.x, y: player.y };
    this.renderer = new IsometricRenderer(document.getElementById('cvb'));
    this.centerCam(player);
  }
  placeUnits() { // игрок слева, боты справа в случайных проходимых клетках (не ближе 5 клеток)
    __seed = this.loc ? (this.loc.seed * 104729 % 2147483647) : (Date.now() % 100000);
    const free = (x, y) => BF.passable(x, y) && !this.units.some(u => u.x === x && u.y === y);
    this.player.x = 3; this.player.y = 12;
    let placed = 0, tries = 0;
    for (const e of this.enemies) {
      while (tries++ < 500) {
        const x = 12 + Math.floor(srand() * 10), y = 2 + Math.floor(srand() * 20);
        if (free(x, y) && BF.dist({ x, y }, this.player) >= 5) { e.x = x; e.y = y; placed++; break; }
      }
    }
  }
  centerCam(u) { const r = this.renderer; const wx = (u.x - u.y) * TW / 2, wy = (u.x + u.y) * TH / 2; r.camX = wx - CW / 2 + TW / 2; r.camY = wy - CH / 2; }
  //可达范围: BFS по клеткам, подъём на 1 стоит +1 ход, на 2 — невозможен для тяжёлых
  reachable(m) { // BFS по клеткам: шаг=1, подъём на +1 высоту стоит +1; перегруженный мех не залезает вовсе
    const set = new Map(); set.set(`${m.x},${m.y}`, 0);
    if (m.mobilityPenalty) return set; // обездвижен: только текущая клетка
    const q = [[m.x, m.y]];
    while (q.length) { q.sort((a, b) => set.get(`${a[0]},${a[1]}`) - set.get(`${b[0]},${b[1]}`));
      const [x, y] = q.shift(), d = set.get(`${x},${y}`);
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
        const nx = x + dx, ny = y + dy, t = BF.at(nx, ny), cur = BF.at(x, y);
        if (!t || t.block) continue;
        if (t.h - cur.h > 1) continue;
        if (m.mobilityPenalty) continue;                       // без ног не двигаемся
        if (m.weight > m.maxWeight && t.h > cur.h) continue;
        if (this.units.some(u => u.alive && u.x === nx && u.y === ny)) continue;
        const nd = d + 1 + (t.h > cur.h ? 1 : 0);
        const k = `${nx},${ny}`;
        if (nd <= m.speed && (!set.has(k) || set.get(k) > nd)) { set.set(k, nd); q.push([nx, ny]); }
      } }
    return set;
  }
  inRangeTargets(m) {
    const out = [];
    for (const u of this.units) {
      if (u === m || !u.alive) continue;
      const w = bestWeapon(m, u);
      if (!w) continue;
      if (BF.dist(m, u) <= w.rng && BF.los(m, u)) out.push({ u, w });
    }
    return out;
  }
  doAttack(att, def) {
    const w = bestWeapon(att, def);
    if (!w) { this.msg(`${att.name}: no firing solution`); return false; }
    w.ammoLeft--;
    // spritepaint-анимация: мех проигрывает кадры выстрела (отдача + вспышка)
    if (att.anim && window.SPRITEPAINT) att.anim.play('fire', { once: true });
    const variance = 0.75 + srand() * 0.5;            // разброс урона ±25%
    const tile = BF.at(def.x, def.y);
    const coverDf = tile.cover ? 8 : 0;
    const highDf = tile.h > BF.at(att.x,att.y).h ? 6 : 0; // цель на возвышении — труднее
    let hit = att.accuracy + (BF.at(att.x,att.y).h * 3) - def.evasion - Math.round(coverDf / 2) - highDf - att.armsLost * 15;
    hit = clamp(hit, 10, 92);
    if (srand() * 100 < hit) {
      const dmg = Math.max(1, Math.round(w.dmg * variance) - Math.round((def.df + coverDf) / 2));
      def.takeDamage(dmg);
      this.msg(`${att.name} ${w.name} HIT ${def.name} -${dmg}`);
      this.spawnFx(att, def, w);
      if (!def.alive) this.msg(`>> ${def.name} DESTROYED`);
    } else { this.msg(`${att.name} ${w.name} MISS (${hit}%)`); }
    return true;
  }
  spawnFx(att, def, w) {
    const r = this.renderer;
    const a = r.iso(att.x, att.y, BF.at(att.x,att.y).h), d = r.iso(def.x, def.y, BF.at(def.x,def.y).h);
    const col = w.type === 'flame thrower' ? '#ff9a3e' : w.type === 'missile' ? '#ffe9a0' : '#9fdcff';
    this.fx.push({ x1: a.sx + 32, y1: a.sy - 20, x2: d.sx + 32, y2: d.sy - 24, t: 0, dur: 18, col, big: w.type==='missile'||w.type==='grenade' });
  }
  msg(s) { this.log.unshift(s); this.log.length = Math.min(this.log.length, 6); }
  endTurn() {
    this.turn = 'bots'; this.aiQueue = [...this.enemies.filter(e => e.alive)]; this.aiStep();
  }
  reload(m) { // авто-перезарядка пустых оружий в начале хода (чине зацикливание боя без боеприпасов)
    for (const s in m.weapons) { const w = m.weapons[s];
      if (w.ammoLeft <= 0 && WEAPONS[w.key]) { w.ammoLeft = WEAPONS[w.key].ammo; this.msg(`${m.name}: RELOADED ${w.name}`); } }
  }
  aiStep() { // боты ходят по очереди
    if (!this.aiQueue.length) { this.checkEnd(); if (this.over) return;
      this.turn = 'player'; this.moved = this.acted = false; this.sel = null;
      this.reload(this.player);
      return; }
    const e = this.aiQueue.shift();
    setTimeout(() => {
      e.acted = false;
      if (e.alive && this.player.alive) {
        this.reload(e); // если вся броня стреляла всухую — перезарядиться вместо бесконечного «advances»
        const shots = this.inRangeTargets(e);
        // держим дистанцию: если у бота есть дальнобойное оружие и игрок ближе половины его радиуса — отходим
        const maxRng = Math.max(0, ...Object.values(e.weapons).filter(Boolean).map(w => w.rng));
        const pDist = BF.dist(e, this.player);
        const wantRetreat = shots.length && pDist <= Math.max(2, Math.floor(maxRng / 2)) && e.speed > 0 && !e.mobilityPenalty;
        if (shots.length && !wantRetreat) { shots.sort((a, b) => b.w.dmg - a.w.dmg); this.doAttack(e, shots[0].u); e.acted = true; } // один выстрел за ход
        else {
          // движение к игроку: ближайшая достижимая клетка по Чбышёву (с предпочтением высоты)
          const reach = this.reachable(e); let bestK = null, bd = 1e9;
          for (const k of reach.keys()) { if (k === `${e.x},${e.y}`) continue; const [x, y] = k.split(',').map(Number);
            let d = BF.dist({ x, y }, this.player) - BF.at(x,y).h * 0.3;
            if (wantRetreat) d = -d;                 // отступление: максимизируем дистанцию
            if (d < bd) { bd = d; bestK = { x, y }; } }
          if (wantRetreat && !this.inRangeTargets(e).length) { this.msg(`${e.name} holds position (no shot)`); } // не «телепортируемся» из-за рандома промаха
          else if (bestK && !e.mobilityPenalty) { e.x = bestK.x; e.y = bestK.y; this.msg(wantRetreat ? `${e.name} falls back` : `${e.name} advances`); }
          else if (e.mobilityPenalty) this.msg(`${e.name} immobilized (legs destroyed)`);
          const shot2 = this.inRangeTargets(e);
          if (shot2.length && !e.acted) { shot2.sort((a, b) => b.w.dmg - a.w.dmg); this.doAttack(e, shot2[0].u); e.acted = true; }
        }
      }
      this.checkEnd(); if (!this.over) this.aiStep();
    }, 170); // темп хода ботов
  }
  checkEnd() {
    if (!this.player.alive) { this.over = 'lose'; this.msg('MECH DESTROYED — MISSION FAILED'); }
    else if (!this.enemies.some(e => e.alive)) { this.over = 'win'; this.msg('ALL HOSTILES ELIMINATED'); }
  }
  update(dt) { this.fx.forEach(f => f.t += dt * 60); this.fx = this.fx.filter(f => f.t < f.dur);
    // тикем все spritepaint-анимации юнитов: fire (one-shot) не прерываем; walk — во время хода ботов
    for (const u of this.units) if (u.anim && u.alive) {
      if (!u.anim.oneShot) u.anim.play(this.turn === 'bots' ? 'walk' : 'idle');
      u.anim.update(dt);
    }
  }
  render() {
    const r = this.renderer, ctx = r.ctx;
    ctx.clearRect(0, 0, CW, CH);
    // фон-мрак (D2 виньетка вокруг поля)
    srect(ctx, 0, 0, CW, CH, '#0c0d10');
    // тайлы по диагональным «рядам» = корректная глубина
    for (let s = 0; s < GRID * 2; s++) for (let x = 0; x < GRID; x++) { const y = s - x;
      if (y < 0 || y >= GRID) continue; const t = BF.at(x, y); r.drawFloor(t); }
    // юниты + объекты сортируются по (x+y, h)
    const items = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) { const t = BF.at(x, y);
      if (t.block || t.cover || t.type === 'crack') items.push({ d: x + y, kind: 'prop', t }); }
    for (const u of this.units) if (u.alive) items.push({ d: u.x + u.y, kind: 'mech', u });
    items.sort((a, b) => a.d - b.d);
    // подсветка движения/целей
    if (this.moveSet) for (const k of this.moveSet.keys()) { const [x, y] = k.split(',').map(Number); const p = r.iso(x, y, BF.at(x,y).h);
      ctx.fillStyle = 'rgba(90,200,255,.18)'; ctx.beginPath(); ctx.moveTo(p.sx+32,p.sy); ctx.lineTo(p.sx+64,p.sy+16); ctx.lineTo(p.sx+32,p.sy+32); ctx.lineTo(p.sx,p.sy+16); ctx.closePath(); ctx.fill(); }
    if (this.targets) for (const tv of this.targets) { const p = r.iso(tv.u.x, tv.u.y, BF.at(tv.u.x,tv.u.y).h);
      ctx.strokeStyle = '#ff5a4a'; ctx.lineWidth = 2; ctx.strokeRect(p.sx + 14, p.sy - 30, 36, 52); }
    for (const it of items) {
      if (it.kind === 'prop') r.drawProps(it.t);
      else { const hov = this.hover && this.hover.x === it.u.x && this.hover.y === it.u.y;
        const cur = this.cursor && this.cursor.x === it.u.x && this.cursor.y === it.u.y;
        r.drawMech(it.u, hov ? '#7fdcff' : cur ? '#ffd23e' : null); }
    }
    // курсор-ромб на пустой клетке
    if (this.cursor) { const t = BF.at(this.cursor.x, this.cursor.y);
      if (t && !this.units.some(u => u.alive && u.x === t.x && u.y === t.y)) { const p = r.iso(t.x, t.y, t.h);
        ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(p.sx+32,p.sy); ctx.lineTo(p.sx+64,p.sy+16); ctx.lineTo(p.sx+32,p.sy+32); ctx.lineTo(p.sx,p.sy+16); ctx.closePath(); ctx.stroke(); } }
    // трассеры/взрывы
    for (const f of this.fx) { const k = f.t / f.dur;
      ctx.strokeStyle = f.col; ctx.lineWidth = f.big ? 2 : 1; ctx.globalAlpha = 1 - k * .7;
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x1 + (f.x2 - f.x1) * Math.min(1, k * 1.6), f.y1 + (f.y2 - f.y1) * Math.min(1, k * 1.6)); ctx.stroke();
      if (k > .6) { ctx.fillStyle = f.big ? '#ffb347' : '#cfeaff'; ctx.beginPath(); ctx.arc(f.x2, f.y2, (f.big ? 9 : 4) * (k - .6) * 2.5, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; }
    // D2-виньетка
    const g = ctx.createRadialGradient(CW/2, CH/2, CH*0.35, CW/2, CH/2, CH*0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  }
}

// ---------- Game / GameState ----------
const GameState = {
  screen: 'hangar', credits: 0, wins: 0,
  completed: {},       // выполненные задания с карты: { plaza: 1, ... }
  selectedLoc: null,   // выбранная метка на карте города
  unlockedTiers: ['light', 'medium'], // тяжёлый ярус открывается за первую победу (см. endBattle)
  loadout: { torso: 'medium', armR: 'medium', armL: 'medium', legs: 'medium',
             wR: 'Mk11 Sniper', wL: 'Zhiniao 50', back: 'Huoyao 3' },
  battle: null,
  hangarAnim: null, // постоянный PixelAnimator меха в ангаре (иначе пересоздавался каждый кадр)
};
const ENEMY_TEMPLATES = [
  { name: 'RECON "WASP"',  tint: '#7fae7f', parts: { torso:'light', armR:'light', armL:'light', legs:'light' }, weapons: { armR: 'Mk18 Spike', armL: 'Huida 3' } },
  { name: 'LINE "HORNET"', tint: '#c9b45a', parts: { torso:'medium', armR:'medium', armL:'medium', legs:'medium' }, weapons: { armR: 'Huida 3', armL: 'Wanzerfaust', back: 'Wagtail 2' } },
  { name: 'SIEGE "BOAR"',  tint: '#b06a4a', parts: { torso:'heavy', armR:'heavy', armL:'heavy', legs:'heavy' }, weapons: { armR: 'Bjariger', armL: 'Arc Barrel4', back: 'Nightingale' } },
];
function buildPlayerMech() { // каждый вызов = новая сборка с полным HP (ремонт в ангаре)
  const L = GameState.loadout;
  return new Mech({ name: 'PLAYER WANZER', isPlayer: true,
    parts: { torso: L.torso, armR: L.armR, armL: L.armL, legs: L.legs },
    weapons: { armR: L.wR, armL: L.wL, back: L.back } });
}

// выбор лучшего оружия под дистанцию (spike — только в упор)
function bestWeapon(att, def) {
  const d = BF.dist(att, def);
  let best = null;
  for (const s in att.weapons) { const w = att.weapons[s];
    if (!w || w.ammoLeft <= 0) continue;
    if (w.type === 'spike' && d > 1) continue;
    if (d <= w.rng && (!best || w.dmg > best.dmg)) best = w; }
  return best;
}

// ---------- GAME: экраны, hangar UI, ввод, цикл ----------
const CW = 960, CH = 540;
const $ = (id) => document.getElementById(id);
let cvW = 960, cvH = 540; // canvas битовый размер (cvW=CW при 1x)

function fmt(n) { return Number.isInteger(n) ? n : Math.round(n * 10) / 10; }

function renderHangar() {
  $('scr-hangar').style.display = GameState.screen === 'hangar' ? '' : 'none';
  $('scr-map').style.display = GameState.screen === 'map' ? '' : 'none';
  $('scr-battle').style.display = GameState.screen === 'battle' ? '' : 'none';
  if (GameState.screen !== 'hangar') return;
  const m = buildPlayerMech();
  // панель статуса
  $('status').innerHTML = `
    <div class="row"><span>HP</span><b>${m.maxHp}</b></div>
    <div class="row"><span>AT</span><b>${m.at}</b></div>
    <div class="row"><span>DF</span><b>${m.df}</b></div>
    <div class="row"><span>WEIGHT</span><b class="${m.weight > m.maxWeight ? 'warn' : ''}">${fmt(m.weight)} / ${fmt(m.maxWeight)}</b></div>
    <div class="row"><span>SPEED</span><b>${m.speed} cells</b></div>
    <div class="row"><span>ACCURACY</span><b>${m.accuracy}%</b></div>
    <div class="row"><span>EVASION</span><b>${Math.round(m.evasion)}%</b></div>
    <div class="row"><span>RANGE</span><b>${m.range}</b></div>
    <div class="row"><span>CREDITS</span><b>${GameState.credits} CR</b></div>`;
  // слоты деталей
  const slots = [['torso', 'TORSO (BODY+HEAD)'], ['armR', 'RIGHT ARM'], ['armL', 'LEFT ARM'], ['legs', 'LEGS']];
  let html = '';
  for (const [slot, label] of slots) {
    html += `<div class="slot-group"><div class="slot-title">${label}</div><div class="tiers">`;
    for (const [tier, tname] of TIERS) {
      const p = PARTS[slot][tier], cur = GameState.loadout[slot] === tier;
      const locked = !GameState.unlockedTiers.includes(tier);
      html += `<button data-slot="${slot}" data-tier="${tier}" class="pbtn ${cur ? 'cur' : ''} ${locked ? 'locked' : ''}" ${locked ? 'disabled' : ''}>
        <em>${tname}${locked ? ' · 🔒 WIN MORE' : ''}</em><b>${p.name}</b>
        <i>HP ${p.hp} · DF ${p.df} · WT ${p.wt}${p.spd ? ' · SPD +' + p.spd : ''}${p.acc ? ' · ACC ' + p.acc : ''}</i></button>`;
    }
    html += `</div></div>`;
  }
  // оружие
  const wslots = [['wR', 'RIGHT WEAPON'], ['wL', 'LEFT WEAPON'], ['back', 'BACK PACK WEAPON']];
  const armKeys = Object.keys(WEAPONS);
  for (const [slot, label] of wslots) {
    html += `<div class="slot-group"><div class="slot-title">${label}</div><div class="tiers weapons">`;
    for (const k of armKeys) { const w = WEAPONS[k], cur = GameState.loadout[slot] === k;
      const wLocked = (W_UNLOCK[k] ?? 0) > GameState.wins;
      html += `<button data-wslot="${slot}" data-wkey="${k}" class="wbtn ${cur ? 'cur' : ''} ${wLocked ? 'locked' : ''}" ${wLocked ? 'disabled' : ''}>
        <b>${w.name}${wLocked ? ' 🔒' : ''}</b><i>${w.type.toUpperCase()} · DMG ${w.dmg} · RNG ${w.rng} · AMMO ${w.ammo} · WT ${w.weight}</i></button>`;
    }
    html += `</div></div>`;
  }
  $('parts-panel').innerHTML = html;
}

function startBattle(locKey) {
  $('scr-result')._shown = 0; $('scr-result').style.display = 'none'; // сброс оверлея прошлой миссии
  BF = new Battlefield(locKey); // поле генерируется под локацию (свой сид/стены/укрытия/покрытие)
  const loc = locKey ? LOCS[locKey] : null;
  // набор врагов берём из локации (порядок и состав разные на каждой карте); без локации — все три шаблона
  const names = loc ? loc.enemies : ENEMY_TEMPLATES.map(t => t.name);
  const enemies = names.map(n => { const t = ENEMY_TEMPLATES.find(x => x.name === n) || ENEMY_TEMPLATES[0]; return new Mech({ ...t }); });
  GameState.battle = new Battle(buildPlayerMech(), enemies, locKey);
  GameState.lastLocKey = locKey || null;
  GameState.screen = 'battle';
  renderHangar();
}

function endBattle(win) {
  const B = GameState.battle;
  if (win) {
    const reward = B ? B.reward : 300 + GameState.wins * 100; // награда миссии с карты города
    GameState.credits += reward; GameState.wins++;
    if (B && B.locKey) GameState.completed[B.locKey] = (GameState.completed[B.locKey] || 0) + 1;
    // Прогрессия: старт light+medium; победа №1 открывает ТЯЖЁЛЫЙ ярус деталей
    const unlocked = ['light', 'medium'];
    if (GameState.wins >= 1) unlocked.push('heavy');
    GameState.unlockedTiers = unlocked;
    GameState.lastReward = reward;
  }
  const backToMap = B && B.locKey; // после задания с карты возвращаемся на карту
  GameState.battle = null; GameState.screen = backToMap ? 'map' : 'hangar';
  if (backToMap) selectMission(GameState.selectedLoc);
  renderHangar();
}

// ---------- Ввод ----------
window.addEventListener('DOMContentLoaded', () => {
  const cv = $('cv'); cv.width = CW; cv.height = CH;
  cv.getContext('2d').imageSmoothingEnabled = false;
  renderHangar();

  $('btn-deploy').onclick = () => startBattle(null); // учебный полигон (без локации)
  $('btn-mission').onclick = () => { GameState.screen = 'map';
    if (!GameState.selectedLoc) GameState.selectedLoc = 'plaza'; // по умолчанию показываем брифинг первой миссии
    selectMission(GameState.selectedLoc); renderHangar(); };
  $('mc-deploy').onclick = () => { if (GameState.selectedLoc) startBattle(GameState.selectedLoc); };

  // карта города: клик по метке локации / hover-инфо
  const cvm = $('cvm');
  const mapPoint = (e) => { const rc = cvm.getBoundingClientRect();
    return { mx: (e.clientX - rc.left) * (CW / rc.width), my: (e.clientY - rc.top) * (CH / rc.height) }; };
  cvm.addEventListener('mousemove', (e) => {
    const { mx, my } = mapPoint(e); let hov = null;
    for (const k in LOCS) { const L = LOCS[k];
      if (Math.abs(mx - L.x) < 26 && my > L.y - 40 && my < L.y + 42) { hov = k; break; } }
    $('map-info').textContent = hov ? `${LOCS[hov].name} — ${LOCS[hov].ru} · DANGER ${'⚠'.repeat(LOCS[hov].danger)} · REWARD ${LOCS[hov].reward} CR` : '—';
    cvm.style.cursor = hov ? 'pointer' : 'default';
  });
  cvm.addEventListener('click', (e) => {
    const { mx, my } = mapPoint(e);
    for (const k in LOCS) { const L = LOCS[k];
      if (Math.abs(mx - L.x) < 26 && my > L.y - 40 && my < L.y + 42) { selectMission(k); return; } }
    // клик по любой точке карты — выбираем ближайшую локацию (по изопиксельной дистанции до метки)
    let best = null, bd = 1e9;
    for (const k in LOCS) { const L = LOCS[k];
      const d = Math.hypot(mx - L.x, my - (L.y - 10)); if (d < bd) { bd = d; best = k; } }
    if (best && bd < 130) selectMission(best);
  });
  $('btn-leave').onclick = () => endBattle(false);
  $('btn-retry').onclick = () => { $('scr-result').style.display = 'none'; startBattle(GameState.lastLocKey || null); };
  $('btn-back').onclick = () => { $('scr-result').style.display = 'none'; endBattle(GameState.lastWin); };

  // клик по слотам/оружию в ангаре
  $('parts-panel').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.slot) GameState.loadout[b.dataset.slot] = b.dataset.tier;
    if (b.dataset.wslot) GameState.loadout[b.dataset.wslot] = b.dataset.wkey;
    renderHangar();
  });

  // бой: мышь
  const cvb = $('cvb');
  const battleMouse = (e) => {
    const B = GameState.battle; if (!B || B.turn !== 'player' || B.over) return;
    const rc = cvb.getBoundingClientRect();
    const mx = (e.clientX - rc.left) * (CW / rc.width), my = (e.clientY - rc.top) * (CH / rc.height);
    const cell = B.renderer.pick(mx, my); if (!cell) return;
    const u = B.units.find(u => u.alive && u.x === cell.x && u.y === cell.y);
    if (e.type === 'mousemove') { B.hover = cell; updateUnitInfo(B, u); return; }
    // клик
    if (u && !u.isPlayer && B.targets) { // атака по подсвеченной цели
      const tv = B.targets.find(t => t.u === u);
      if (tv) { B.doAttack(B.player, u); B.acted = true; B.targets = null; refreshActionUI(B); checkOver(B); }
      return;
    }
    if (u && u.isPlayer) { B.sel = 'player'; refreshActionUI(B); return; }
    if (!u && B.moveSet && B.moveSet.has(`${cell.x},${cell.y}`) && !B.moved) {
      B.player.x = cell.x; B.player.y = cell.y; B.moved = true; B.moveSet = null;
      B.centerCam(B.player); refreshActionUI(B);
    }
  };
  cvb.addEventListener('mousemove', battleMouse);
  cvb.addEventListener('click', battleMouse);

  // кнопки действий
  $('act-move').onclick = () => { const B = GameState.battle; if (!B || B.moved || B.turn !== 'player') return; B.moveSet = B.reachable(B.player); B.targets = null; setHint('Click a highlighted tile to MOVE'); };
  $('act-attack').onclick = () => { const B = GameState.battle; if (!B || B.acted || B.turn !== 'player') return; B.targets = B.inRangeTargets(B.player); B.moveSet = null;
    setHint(B.targets.length ? 'Click a red-framed enemy to ATTACK' : 'No targets in range / LOS'); };
  $('act-wait').onclick = () => { const B = GameState.battle; if (!B || B.turn !== 'player') return; B.msg('PLAYER waits'); B.endTurn(); refreshActionUI(B); };
  function setHint(s) { $('hint').textContent = s; }

  // клавиатура: WASD/стрелки — курсор, Enter — действие, M/A/W — режимы
  window.addEventListener('keydown', (e) => {
    if (GameState.screen === 'map') { // карта: Enter/Space — высадка, Esc — в ангар
      if ((e.code === 'Enter' || e.code === 'Space') && GameState.selectedLoc) { e.preventDefault(); $('mc-deploy').click(); }
      if (e.code === 'Escape') { GameState.screen = 'hangar'; renderHangar(); }
      return;
    }
    if (GameState.screen !== 'battle') return;
    const B = GameState.battle; if (!B) return;
    const mv = { ArrowUp: [0,-1], KeyW: [0,-1], ArrowDown: [0,1], KeyS: [0,1], ArrowLeft: [-1,0], KeyA: [-1,0], ArrowRight: [1,0], KeyD: [1,0] }[e.code];
    if (mv && B.turn === 'player') { e.preventDefault();
      B.cursor.x = clamp(B.cursor.x + mv[0], 0, GRID - 1); B.cursor.y = clamp(B.cursor.y + mv[1], 0, GRID - 1);
      const u = B.units.find(u => u.alive && u.x === B.cursor.x && u.y === B.cursor.y); updateUnitInfo(B, u); return; }
    if (e.code === 'KeyM') $('act-move').click();
    if (e.code === 'Digit1') $('act-move').click();
    if (e.code === 'Digit2') $('act-attack').click();
    if (e.code === 'Digit3') $('act-wait').click();
    if (e.code === 'Enter') { // выполнить действие на курсоре
      const u = B.units.find(u => u.alive && u.x === B.cursor.x && u.y === B.cursor.y);
      if (u && !u.isPlayer && B.targets?.some(t => t.u === u)) { B.doAttack(B.player, u); B.acted = true; B.targets = null; refreshActionUI(B); checkOver(B); }
      else if (!u && B.moveSet?.has(`${B.cursor.x},${B.cursor.y}`) && !B.moved) { B.player.x = B.cursor.x; B.player.y = B.cursor.y; B.moved = true; B.moveSet = null; refreshActionUI(B); }
    }
  });

  function updateUnitInfo(B, u) {
    if (!u) { $('unit-info').textContent = 'CELL: (' + (B.hover ? `${B.hover.x},${B.hover.y}) elev ${BF.at(B.hover.x,B.hover.y).h}` : '—'); return; }
    const t = BF.at(u.x, u.y);
    $('unit-info').textContent = `${u.name} HP ${u.hpCur ?? u.maxHp}/${u.maxHp} AT ${u.at} DF ${u.df} W ${fmt(u.weight)} SPD ${u.speed} RNG ${u.range} @(${u.x},${u.y}) elev ${t.h}${t.cover ? ' [COVER]' : ''}`;
  }
  function refreshActionUI(B) {
    $('btn-endturn').disabled = B.turn !== 'player';
    $('act-move').disabled = B.moved || B.turn !== 'player';
    $('act-attack').disabled = B.acted || B.turn !== 'player';
    $('turn-label').textContent = B.turn === 'player' ? 'PLAYER TURN' : 'HOSTILE TURN...';
    $('log').innerHTML = B.log.map(l => `<div>${l}</div>`).join('');
    const p = B.player;
    $('phud').innerHTML = `HP ${p.hpCur ?? p.maxHp}/${p.maxHp} · AMMO R:${p.weapons.armR?.ammoLeft ?? '-'} L:${p.weapons.armL?.ammoLeft ?? '-'} B:${p.weapons.back?.ammoLeft ?? '-'}`;
    if (B.turn === 'player' && !B.moved && !B.acted) setHint('MOVE then ATTACK (or WAIT). Keys: 1/2/3, arrows+WASD, Enter');
  }
  function checkOver(B) {
    B.checkEnd();
    if (B.over) { setTimeout(() => {
      $('scr-result').style.display = '';
      $('result-title').textContent = B.over === 'win' ? 'MISSION COMPLETE' : 'MECH DESTROYED';
      $('result-text').textContent = B.over === 'win'
        ? `Reward: ${300 + GameState.wins * 100} CR. Wins: ${GameState.wins + 1}. Next win unlocks heavier parts tier.`
        : 'Repair bay standing by. Retry the training run.';
      GameState.lastWin = B.over === 'win';
    }, 700); }
  }
  window._refreshActionUI = refreshActionUI; window._checkOver = checkOver;

  // ---------- Цикл отрисовки ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const B = GameState.battle;
    if (B && GameState.screen === 'battle') {
      B.update(dt); B.render();
      if (B.over && !$('scr-result').style.display.includes('flex') && !$('scr-result')._shown) { $('scr-result')._shown = 1; checkOver(B); }
      if (!B.over) refreshActionUI(B);
    } else if (GameState.screen === 'map') drawCityMap($('cvm'));
    else if (GameState.screen === 'hangar') drawHangarBG(cv);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});

// ---------- Карта вымышленного города ВЕРГАРД: изометрический «двойник» поля боя ----------
// Город рисуется теми же ромбовидными тайлами 64x32 и объёмными блоками, что и бой (D2-стиль).
const MCAM = { x: -CW / 2 + TW / 2, y: -150 }; // камера: смотрим на верхний угол сетки
function miso(gx, gy, h = 0) { return { sx: (gx - gy) * TW / 2 - MCAM.x, sy: (gx + gy) * TH / 2 - h * ELEV - MCAM.y }; }
function mPick(mx, my) { // экран -> клетка городской сетки (по верхнему слою высоты)
  for (let h = 2; h >= 0; h--) {
    const px = mx + MCAM.x, py = my + MCAM.y + h * ELEV;
    const fx = (px / (TW / 2) + py / (TH / 2)) / 2, fy = (py / (TH / 2) - px / (TW / 2)) / 2;
    const x = Math.floor(fx), y = Math.floor(fy);
    if (x >= 0 && y >= 0 && x < GRID && y < GRID && CITY.h[y][x] === h) return { x, y };
  }
  return null;
}
// Планировка города генерится один раз (свой сид — не трогает сид боя)
const CITY = (() => {
  __seed = 90210;
  const h = [], zone = [];
  for (let y = 0; y < GRID; y++) { const rh = [], rz = [];
    for (let x = 0; x < GRID; x++) {
      const hh = Math.sin(x * 0.35) * 1.1 + Math.cos(y * 0.3) * 1.1 + Math.sin((x + y) * 0.18) * 0.9;
      rh.push(clamp(Math.round((hh + 1.4) / 1.4), 0, 2));
      let z = 'road';
      if ((x + y) % 7 === 0 || (x > 19 && y > 19)) z = 'rail';                       // ж/д по диагонали и в порту
      else if (Math.abs(y - 11) <= 1 && x > 2 && x < 21) z = 'plaza';                // центральная площадь
      else if (x > 17 && y < 8) z = 'hill';                                          // холмы крепости
      else if (x < 7 && y > 15) z = 'dock';                                          // доки у воды
      else if (srand() < 0.34) z = (x < 12 ? 'blockA' : 'blockB');                   // кварталы
      rz.push(z); }
    h.push(rh); zone.push(rz); }
  // здания-блоки в кварталах (объёмные, как стены на поле)
  const buildings = new Set();
  for (let y = 1; y < GRID - 1; y++) for (let x = 1; x < GRID - 1; x++) {
    const z = zone[y][x];
    if ((z === 'blockA' || z === 'blockB') && srand() < 0.16) buildings.add(`${x},${y}`);
  }
  return { h, zone, buildings };
})();
const ZCOL = { road: '#3b3f46', plaza: '#57503e', rail: '#2d3138', hill: '#3a4531', dock: '#333a42', blockA: '#41474f', blockB: '#3c434c' };
function drawCityMap(cv) {
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  srect(ctx, 0, 0, CW, CH, '#0b0c10');
  // тайлы по диагональным рядам (depth order)
  for (let s = 0; s < GRID * 2; s++) for (let gx = 0; gx < GRID; gx++) { const gy = s - gx;
    if (gy < 0 || gy >= GRID) continue;
    const z = CITY.zone[gy][gx], hh = CITY.h[gy][gx];
    const { sx, sy } = miso(gx, gy, hh);
    if (sx < -TW || sy < -TH || sx > CW + TW || sy > CH + TH) continue;
    let c = shade(ZCOL[z], ((gx * 7 + gy * 13) % 3) - 1);
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(sx + TW/2, sy); ctx.lineTo(sx + TW, sy + TH/2); ctx.lineTo(sx + TW/2, sy + TH); ctx.lineTo(sx, sy + TH/2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(c, -18); ctx.stroke();
    if (z === 'rail') { // шпалы вдоль диагонали
      srect(ctx, sx + 20, sy + 8, 24, 2, '#1a1d22'); srect(ctx, sx + 22, sy + 6, 3, 6, '#4a4f57'); srect(ctx, sx + 38, sy + 10, 3, 6, '#4a4f57'); }
    if (z === 'dock' && gx > 19) { srect(ctx, sx + 8, sy + 10, 48, 3, '#20405a'); } // вода у пирсов
    if (hh > 0) { // боковые грани холмов
      ctx.fillStyle = shade(c, -34); ctx.beginPath();
      ctx.moveTo(sx, sy + TH/2); ctx.lineTo(sx + TW/2, sy + TH); ctx.lineTo(sx + TW/2, sy + TH + hh*ELEV); ctx.lineTo(sx, sy + TH/2 + hh*ELEV); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(c, -22); ctx.beginPath();
      ctx.moveTo(sx + TW/2, sy + TH); ctx.lineTo(sx + TW, sy + TH/2); ctx.lineTo(sx + TW, sy + TH/2 + hh*ELEV); ctx.lineTo(sx + TW/2, sy + TH + hh*ELEV); ctx.closePath(); ctx.fill(); }
    // здания (объёмные блоки разной высоты — как стены в бою)
    if (CITY.buildings.has(`${gx},${gy}`)) {
      const bh = 18 + ((gx * 31 + gy * 17) % 3) * 10 + hh * ELEV;
      const wall = ['#4a4f57', '#565049', '#3f4a52'][ (gx + gy) % 3 ];
      srect(ctx, sx + 8, sy - bh + 16, TW - 16, bh, wall);
      ctx.fillStyle = shade(wall, 18); ctx.beginPath();
      ctx.moveTo(sx + 8, sy - bh + 16); ctx.lineTo(sx + TW/2, sy - bh + 2); ctx.lineTo(sx + TW - 8, sy - bh + 16); ctx.lineTo(sx + TW/2, sy - bh + 30); ctx.closePath(); ctx.fill();
      // окна-пиксели
      for (let wy = 0; wy < 2; wy++) for (let wx = 0; wx < 3; wx++)
        srect(ctx, sx + 14 + wx * 12, sy - bh + 24 + wy * 12, 4, 5, ((wx + wy + gx) % 4) ? '#20242c' : '#ffd23e88');
    }
  }
  // метки локаций (маркеры заданий)
  const t = performance.now() / 500;
  for (const k in LOCS) { const L = LOCS[k];
    const sel = GameState.selectedLoc === k, done = GameState.completed[k];
    const col = L.danger === 1 ? '#5ad15a' : L.danger === 2 ? '#ffd23e' : '#ff5a4a';
    const bob = Math.sin(t + L.x) * 3;
    // луч-указатель вниз к тайлу
    ctx.strokeStyle = col + '55'; ctx.beginPath(); ctx.moveTo(L.x, L.y + 10 + bob); ctx.lineTo(L.x, L.y + 34); ctx.stroke();
    // ромб-основание
    ctx.fillStyle = col + '33'; ctx.beginPath();
    ctx.moveTo(L.x, L.y + 26); ctx.lineTo(L.x + 14, L.y + 33); ctx.lineTo(L.x, L.y + 40); ctx.lineTo(L.x - 14, L.y + 33); ctx.closePath(); ctx.fill();
    // маркер-конверт
    srect(ctx, L.x - 9, L.y - 14 + bob, 18, 18, '#14161c');
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(L.x - 9, L.y - 14 + bob); ctx.lineTo(L.x, L.y - 4 + bob); ctx.lineTo(L.x + 9, L.y - 14 + bob); ctx.closePath(); ctx.fill();
    srect(ctx, L.x - 2, L.y - 10 + bob, 4, 4, '#14161c');
    if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(L.x - 12, L.y - 17 + bob, 24, 24); }
    // подпись
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.fillText(L.name, L.x + 1, L.y - 21 + bob + 1);
    ctx.fillStyle = done ? '#5ad15a' : '#e8e4d8';
    ctx.fillText((done ? '✔ ' : '') + L.name, L.x, L.y - 21 + bob);
    ctx.font = '9px monospace'; ctx.fillStyle = '#9aa0ac';
    ctx.fillText(L.ru + ' · ⚠'.repeat(L.danger) + (done ? ` · x${GameState.completed[k]}` : ''), L.x, L.y - 11 + bob);
    ctx.textAlign = 'left';
  }
  // шапка и легенда
  srect(ctx, 0, 0, CW, 26, '#000000aa');
  ctx.fillStyle = '#ffd23e'; ctx.font = 'bold 13px monospace';
  ctx.fillText('TACTICAL MAP — CITY OF VERGARD', 12, 17);
  ctx.fillStyle = '#8fa9c9'; ctx.font = '10px monospace';
  ctx.fillText(`WINS ${GameState.wins} · CREDITS ${GameState.credits} CR`, CW - 210, 16);
  // виньетка D2
  const g = ctx.createRadialGradient(CW/2, CH/2, CH*0.35, CW/2, CH/2, CH*0.9);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
}
function selectMission(k) { // выбор локации -> карточка брифинга справа
  GameState.selectedLoc = k;
  const L = LOCS[k]; if (!L) { $('mc-title').textContent = 'SELECT MISSION'; $('mc-desc').textContent = ''; $('mc-reward').textContent = ''; return; }
  const card = $('mission-card'); card.classList.add('sel');
  $('mc-title').textContent = `${L.name} ${GameState.completed[k] ? '✔' : ''}`;
  $('mc-desc').textContent = L.desc;
  $('mc-reward').textContent = `REWARD: ${L.reward} CR · HOSTILES: ${L.enemies.map(n => n.split(' ')[1]).join(', ')}`;
}

// ---------- Фон ангара на том же canvas (пиксельный, D2/FM) ----------
function drawHangarBG(cv) {
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  srect(ctx, 0, 0, CW, CH, '#14161c');                       // стена
  for (let x = 0; x < CW; x += 80) srect(ctx, x, 0, 2, 300, '#1d2027'); // панели стены
  srect(ctx, 0, 300, CW, 240, '#23262e');                    // пол
  for (let x = 0; x < CW; x += 64) {                         // изополоса-плиты
    ctx.strokeStyle = '#2c303a'; ctx.beginPath(); ctx.moveTo(x, 540); ctx.lineTo(x + 120, 300); ctx.stroke(); }
  for (let i = 0; i < 14; i++) srect(ctx, 120 + i * 22, 296, 11, 8, i % 2 ? '#c9a227' : '#111'); // жёлто-чёрные полосы
  // мех игрока по центру — пиксельная spritepaint-анимация (цикл idle -> walk -> fire каждые 4с)
  if (window.SPRITEPAINT) {
    const A = GameState.hangarAnim = GameState.hangarAnim || new SPRITEPAINT.PixelAnimator(SPRITEPAINT.export.sheet);
    GameState.hangarLast = GameState.hangarLast || performance.now();
    const dt = Math.min(0.05, (performance.now() - GameState.hangarLast) / 1000); GameState.hangarLast = performance.now();
    const now = performance.now(), cyc = Math.floor(now / 4000) % 3;
    if (!A.oneShot) A.play(['idle', 'walk', 'fire'][cyc], { once: cyc === 2 });
    A.update(dt);
    A.draw(ctx, CW / 2, 500, 2.2, false, null);
    ctx.fillStyle = '#8fa9c9'; ctx.font = '10px monospace';
    ctx.fillText('ANIM: ' + ['IDLE', 'WALK CYCLE', 'FIRE + RECOIL'][cyc] + '  (spritepaint frames)', CW / 2 - 100, 522);
  } else {
    const m = buildPlayerMech(); m.x = 0; m.y = 0; m.hpCur = undefined;
    const r = new IsometricRenderer(cv); r.camX = -CW / 2 + 32 + 0; r.camY = -CH / 2 - 40;
    const saveH = BF.at(0, 0).h; BF.at(0, 0).h = 0;
    r.drawMech(m, null);
    BF.at(0, 0).h = saveH;
  }
  // ящики и бочка №13 вокруг
  srect(ctx, 60, 250, 54, 44, '#5d3d1e'); srect(ctx, 64, 254, 46, 36, '#8a5a2a'); srect(ctx, 60, 250, 54, 4, '#caa06a');
  srect(ctx, 86, 216, 40, 34, '#5d3d1e'); srect(ctx, 90, 220, 32, 26, '#8a5a2a');
  srect(ctx, 860, 240, 26, 52, '#e8e4d8'); srect(ctx, 860, 240, 26, 6, '#f5f2e8'); srect(ctx, 860, 286, 26, 6, '#b9b4a5');
  ctx.fillStyle = '#333'; ctx.font = 'bold 12px monospace'; ctx.fillText('13', 866, 270);
  ctx.strokeStyle = '#14161a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(140, 300); ctx.quadraticCurveTo(300, 330, 430, 302); ctx.stroke();
  ctx.fillStyle = '#8fa9c9'; ctx.font = '10px monospace';
  ctx.fillText('HANGAR BAY 07 — WANZER ASSEMBLY DECK', 20, 20);
}
