/* =========================================================
   parts.js — данные о деталях робота и их 2D-графика (SVG)
   Три комплекта: лёгкий (light), средний (medium), тяжёлый (heavy)
   Характеристики: сила, скорость, грузоподъёмность, вес, ХП
   ========================================================= */

// IIFE — изолируем переменные от глобальной области видимости
(function () {

const TIERS = {
  light:  { name: "Лёгкий",  color: "#4dd2ff", icon: "🟦" },
  medium: { name: "Средний", color: "#ffb347", icon: "🟨" },
  heavy:  { name: "Тяжёлый", color: "#ff5c5c", icon: "🟥" },
};

const SLOTS = [
  { id: "head", name: "Голова" },
  { id: "armR", name: "Рука правая" },
  { id: "armL", name: "Рука левая" },
  { id: "body", name: "Тело (кабина пилота)" },
  { id: "legs", name: "Ноги" },
];

// stats: str — сила, spd — скорость, cap — грузоподъёмность (кг), weight — вес детали (кг), hp — прочность
const PARTS = {
  head: {
    light:  { label: "Сенсор-купол MK-1",   stats: { str: 1, spd: 8, cap: 2,  weight: 3,  hp: 20 } },
    medium: { label: "Визор «Страж» T-200", stats: { str: 3, spd: 5, cap: 5,  weight: 8,  hp: 45 } },
    heavy:  { label: "Мостовой блок «Бастион»", stats: { str: 6, spd: 2, cap: 9, weight: 18, hp: 80 } },
  },
  armR: {
    light:  { label: "Манипулятор «Стриж»",  stats: { str: 3,  spd: 9, cap: 8,  weight: 4,  hp: 18 } },
    medium: { label: "Серво-рука Т-2",       stats: { str: 7,  spd: 5, cap: 20, weight: 10, hp: 40 } },
    heavy:  { label: "Гидроклешня «Атлас»",  stats: { str: 14, spd: 2, cap: 45, weight: 24, hp: 70 } },
  },
  armL: {
    light:  { label: "Манипулятор «Стриж»",  stats: { str: 3,  spd: 9, cap: 8,  weight: 4,  hp: 18 } },
    medium: { label: "Серво-рука Т-2",       stats: { str: 7,  spd: 5, cap: 20, weight: 10, hp: 40 } },
    heavy:  { label: "Гидроклешня «Атлас»",  stats: { str: 14, spd: 2, cap: 45, weight: 24, hp: 70 } },
  },
  body: {
    light:  { label: "Каркас «Перо»",        stats: { str: 2, spd: 7, cap: 15, weight: 8,  hp: 35 } },
    medium: { label: "Корпус «Баланс» Б-3",  stats: { str: 5, spd: 5, cap: 35, weight: 18, hp: 70 } },
    heavy:  { label: "Бронекорпус «Цитадель»", stats: { str: 9, spd: 2, cap: 80, weight: 42, hp: 130 } },
  },
  legs: {
    light:  { label: "Пружины «Кенгуру»",    stats: { str: 2, spd: 10, cap: 10, weight: 5,  hp: 20 } },
    medium: { label: "Шагоходы Х-3",         stats: { str: 6, spd: 6,  cap: 30, weight: 14, hp: 50 } },
    heavy:  { label: "Экзоскелет «Мамонт»",  stats: { str: 11, spd: 2, cap: 70, weight: 30, hp: 90 } },
  },
};

/* ---------- SVG-графика деталей (координаты под viewBox 400x520) ----------
   Цвета меняются по комплекту: light — голубые/светлые, medium — оранжевые,
   heavy — красные/тёмные.
--------------------------------------------------------------------------- */

function tierPalette(tier) {
  if (tier === "light")  return { main: "#7de3ff", dark: "#3aa8d8", accent: "#e8fbff", joint: "#2b6f8f" };
  if (tier === "medium") return { main: "#ffc06a", dark: "#d9822b", accent: "#fff1d6", joint: "#8f5a1b" };
  return { main: "#ff7b7b", dark: "#c0392b", accent: "#ffd9d0", joint: "#7a2018" };
}

// Голова меха: угловатый «шлем» с V-образным гребнем, жёлтый визор, «рот-вентилятор»
function svgHead(tier) {
  const p = tierPalette(tier);
  const crestH = tier === "heavy" ? 14 : tier === "medium" ? 20 : 26;
  return `
    <!-- шея -->
    <rect x="188" y="104" width="24" height="16" fill="#232c3d"/>
    <rect x="184" y="112" width="32" height="8" rx="3" fill="${p.dark}"/>
    <!-- череп: трапеция, расширяется книзу -->
    <path d="M178 46 L222 46 L236 76 L236 100 L164 100 L164 76 Z"
          fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
    <!-- центральная пластина -->
    <path d="M192 46 L208 46 L212 72 L188 72 Z" fill="${p.dark}" opacity="0.55"/>
    <!-- V-образный гребень (антенны) -->
    <path d="M200 ${70 - crestH * 0.2} L172 ${44 - crestH} L182 ${42 - crestH} L200 ${58 - crestH * 0.3} L218 ${42 - crestH} L228 ${44 - crestH} Z"
          fill="${p.accent}" stroke="${p.dark}" stroke-width="2.5"/>
    <circle cx="200" cy="56" r="4" fill="${p.joint}"/>
    <!-- визор -->
    <path d="M168 74 L232 74 L228 88 L172 88 Z" fill="#141b26" stroke="${p.dark}" stroke-width="2"/>
    <rect x="176" y="77" width="20" height="7" rx="2" fill="#ffd23f"/>
    <rect x="204" y="77" width="20" height="7" rx="2" fill="#ffd23f"/>
    <!-- «рот»-вентилятор -->
    <rect x="182" y="92" width="36" height="6" rx="2" fill="#10161f"/>
    <line x1="188" y1="92" x2="188" y2="98" stroke="${p.dark}" stroke-width="1.5"/>
    <line x1="196" y1="92" x2="196" y2="98" stroke="${p.dark}" stroke-width="1.5"/>
    <line x1="204" y1="92" x2="204" y2="98" stroke="${p.dark}" stroke-width="1.5"/>
    <line x1="212" y1="92" x2="212" y2="98" stroke="${p.dark}" stroke-width="1.5"/>`;
}

// Рука меха: массивная плечевая броня-трапеция, двухцилиндровый бицепс, предплечье-щит, клешня
function svgArm(tier, side) {
  const p = tierPalette(tier);
  const x = side === "R" ? 262 : 106; // плечо
  const dir = side === "R" ? 1 : -1;
  const g = (dx) => x + dx * dir;
  const wPad = tier === "heavy" ? 30 : tier === "medium" ? 24 : 18;

  return `
    <!-- наплечник: трапеция, расширяется книзу -->
    <path d="M${g(-wPad * 0.55)} 122 L${g(wPad * 0.55)} 122 L${g(wPad)} 166 L${g(-wPad)} 166 Z"
          fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
    <line x1="${g(-wPad * 0.7)}" y1="${tier === "light" ? 152 : 148}" x2="${g(wPad * 0.7)}" y2="${tier === "light" ? 152 : 148}" stroke="${p.dark}" stroke-width="3" opacity="0.7"/>
    <!-- шарнир плеча -->
    <circle cx="${x}" cy="168" r="${tier === "heavy" ? 13 : 10}" fill="#2b3648" stroke="${p.dark}" stroke-width="3"/>
    <!-- бицепс: два цилиндра -->
    <rect x="${g(-11)}" y="172" width="10" height="56" rx="5" fill="${p.dark}"/>
    <rect x="${g(1)}" y="172" width="10" height="56" rx="5" fill="${p.dark}"/>
    <rect x="${g(-13)}" y="168" width="26" height="12" rx="5" fill="${p.main}" stroke="${p.dark}" stroke-width="3"/>
    <!-- локоть -->
    <circle cx="${x}" cy="232" r="${tier === "heavy" ? 11 : 9}" fill="${p.joint}" stroke="${p.dark}" stroke-width="3"/>
    <!-- предплечье-щит -->
    <path d="M${g(-12)} 240 L${g(12)} 240 L${g(15)} 292 L${g(-15)} 292 Z"
          fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
    <line x1="${g(-9)}" y1="256" x2="${g(9)}" y2="256" stroke="${p.dark}" stroke-width="2.5"/>
    <line x1="${g(-10)}" y1="268" x2="${g(10)}" y2="268" stroke="${p.dark}" stroke-width="2.5"/>
    <!-- кисть-клешня -->
    <rect x="${g(-9)}" y="292" width="18" height="12" rx="4" fill="#2b3648"/>
    <path d="M${g(-9)} 304 L${g(-14)} 322 L${g(-6)} 320 L${g(-3)} 306 Z" fill="${p.dark}"/>
    <path d="M${g(9)} 304 L${g(14)} 322 L${g(6)} 320 L${g(3)} 306 Z" fill="${p.dark}"/>`;
}

// Торс меха: трапеция с широкой «грудью», панелью-вентилятором И КАБИНА ПИЛОТА
function svgBody(tier) {
  const p = tierPalette(tier);
  const halfW = tier === "heavy" ? 68 : tier === "medium" ? 58 : 48;
  const topY = tier === "heavy" ? 108 : 112;
  return `
    <!-- основной корпус: трапеция, расширяется книзу -->
    <path d="M${200 - halfW * 0.72} ${topY} L${200 + halfW * 0.72} ${topY} L${200 + halfW} 236 L${200 - halfW} 236 Z"
          fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <!-- грудная плита -->
    <path d="M${200 - halfW * 0.5} ${topY + 6} L${200 + halfW * 0.5} ${topY + 6} L${200 + halfW * 0.6} ${topY + 34} L${200 - halfW * 0.6} ${topY + 34} Z"
          fill="${p.dark}" opacity="0.5"/>
    <!-- боковые воздухозаборники -->
    <rect x="${200 - halfW + 6}" y="${topY + 40}" width="12" height="26" rx="3" fill="#10161f"/>
    <rect x="${200 + halfW - 18}" y="${topY + 40}" width="12" height="26" rx="3" fill="#10161f"/>
    <!-- центральная решётка-радиатор -->
    <rect x="184" y="${topY + 12}" width="32" height="18" rx="3" fill="#10161f"/>
    <line x1="190" y1="${topY + 12}" x2="190" y2="${topY + 30}" stroke="${p.dark}" stroke-width="1.5"/>
    <line x1="200" y1="${topY + 12}" x2="200" y2="${topY + 30}" stroke="${p.dark}" stroke-width="1.5"/>
    <line x1="210" y1="${topY + 12}" x2="210" y2="${topY + 30}" stroke="${p.dark}" stroke-width="1.5"/>
    <!-- талия / бедренный блок -->
    <rect x="172" y="236" width="56" height="14" rx="5" fill="#2b3648"/>
    <!-- ==== КАБИНА ПИЛОТА (отсекается по форме иллюминатора) ==== -->
    <clipPath id="cockpitClip">
      <path d="M176 156 L224 156 L230 172 L230 206 L170 206 L170 172 Z"/>
    </clipPath>
    <g clip-path="url(#cockpitClip)">
      <rect x="168" y="154" width="64" height="56" fill="#0c1320"/>
      <!-- приборная панель со огоньками -->
      <rect x="168" y="196" width="64" height="12" fill="#1c2a3d"/>
      <circle cx="178" cy="202" r="1.8" fill="#ff5c5c"/>
      <circle cx="186" cy="202" r="1.8" fill="#ffd23f"/>
      <circle cx="194" cy="202" r="1.8" fill="#4dff88"/>
      <circle cx="206" cy="202" r="1.8" fill="#4dd2ff"/>
      <circle cx="214" cy="202" r="1.8" fill="#ffd23f"/>
      <circle cx="222" cy="202" r="1.8" fill="#ff5c5c"/>
      <!-- ПИЛОТ: кресло -->
      <rect x="186" y="168" width="26" height="34" rx="6" fill="#232f42"/>
      <!-- торс в скафандре -->
      <rect x="190" y="176" width="18" height="24" rx="5" fill="#3e5068"/>
      <rect x="190" y="182" width="18" height="4" fill="${p.accent}" opacity="0.9"/>
      <!-- руки к рычагам -->
      <line x1="192" y1="182" x2="185" y2="196" stroke="#3e5068" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="206" y1="182" x2="213" y2="196" stroke="#3e5068" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="185" cy="196" r="2.2" fill="#c9d6ea"/>
      <circle cx="213" cy="196" r="2.2" fill="#c9d6ea"/>
      <!-- шлем с визором -->
      <circle cx="199" cy="168" r="8" fill="#dbe6f4"/>
      <path d="M193 166 a7 7 0 0 1 12 0 l-1 4 h-10 Z" fill="#7de3ff" opacity="0.85"/>
      <!-- рычаги управления -->
      <rect x="181" y="198" width="8" height="3" rx="1.5" fill="#5a6b83"/>
      <rect x="209" y="198" width="8" height="3" rx="1.5" fill="#5a6b83"/>
      <!-- блик стекла -->
      <path d="M172 206 L196 156 L204 156 L180 206 Z" fill="#ffffff" opacity="0.07"/>
    </g>
    <!-- рама иллюминатора поверх -->
    <path d="M176 156 L224 156 L230 172 L230 206 L170 206 L170 172 Z"
          fill="none" stroke="${p.dark}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M176 156 L224 156 L230 172 L230 206 L170 206 L170 172 Z"
          fill="none" stroke="#0d1420" stroke-width="1.5"/>`;
}

// Кабина крупным планом — для всплывающей подсказки при наведении на тело
function svgCockpitZoom() {
  return `
    <svg viewBox="160 146 80 72" width="100%" xmlns="http://www.w3.org/2000/svg">
      <rect x="160" y="146" width="80" height="72" fill="#10151f"/>
      <path d="M176 156 L224 156 L230 172 L230 206 L170 206 L170 172 Z" fill="#0c1320" stroke="#5a6b83" stroke-width="4"/>
      <rect x="168" y="196" width="64" height="12" fill="#1c2a3d"/>
      <circle cx="178" cy="202" r="1.8" fill="#ff5c5c"/><circle cx="186" cy="202" r="1.8" fill="#ffd23f"/>
      <circle cx="194" cy="202" r="1.8" fill="#4dff88"/><circle cx="206" cy="202" r="1.8" fill="#4dd2ff"/>
      <circle cx="214" cy="202" r="1.8" fill="#ffd23f"/><circle cx="222" cy="202" r="1.8" fill="#ff5c5c"/>
      <rect x="186" y="168" width="26" height="34" rx="6" fill="#232f42"/>
      <rect x="190" y="176" width="18" height="24" rx="5" fill="#3e5068"/>
      <rect x="190" y="182" width="18" height="4" fill="#7de3ff"/>
      <line x1="192" y1="182" x2="185" y2="196" stroke="#3e5068" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="206" y1="182" x2="213" y2="196" stroke="#3e5068" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="199" cy="168" r="8" fill="#dbe6f4"/>
      <path d="M193 166 a7 7 0 0 1 12 0 l-1 4 h-10 Z" fill="#7de3ff" opacity="0.85"/>
    </svg>`;
}

// Ноги меха: V-образный таз, бронированные бёдра, обратный («козлий») сустав, широкие ступни
function svgLegs(tier) {
  const p = tierPalette(tier);
  const hipHalf = tier === "heavy" ? 44 : tier === "medium" ? 38 : 32;
  const thigW = tier === "heavy" ? 26 : tier === "medium" ? 21 : 16;
  const shinW = tier === "heavy" ? 22 : tier === "medium" ? 18 : 14;
  const footH = tier === "heavy" ? 22 : tier === "medium" ? 18 : 14;
  const groundY = 448; // уровень пола в viewBox

  function leg(cx) {
    const kneeY = 344;
    const ankleY = 400;
    return `
      <!-- бедро: верх широкий, сужается к колену -->
      <path d="M${cx - thigW * 0.8} 250 L${cx + thigW * 0.8} 250 L${cx + thigW * 0.5} ${kneeY - 6} L${cx - thigW * 0.5} ${kneeY - 6} Z"
            fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <!-- поршень привода бедра -->
      <line x1="${cx + thigW * 0.55}" y1="258" x2="${cx + thigW * 0.35}" y2="${kneeY - 10}" stroke="#2b3648" stroke-width="5"/>
      <!-- колено (обратный сустав) -->
      <circle cx="${cx}" cy="${kneeY}" r="${thigW * 0.45}" fill="${p.joint}" stroke="${p.dark}" stroke-width="3"/>
      <!-- голень: щит, расширяется книзу -->
      <path d="M${cx - shinW * 0.5} ${kneeY + 6} L${cx + shinW * 0.5} ${kneeY + 6} L${cx + shinW * 0.9} ${ankleY} L${cx - shinW * 0.9} ${ankleY} Z"
            fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <line x1="${cx - shinW * 0.6}" y1="${kneeY + 26}" x2="${cx + shinW * 0.6}" y2="${kneeY + 26}" stroke="${p.dark}" stroke-width="2.5"/>
      <!-- голеностоп -->
      <rect x="${cx - shinW * 0.7}" y="${ankleY}" width="${shinW * 1.4}" height="8" rx="3" fill="#2b3648"/>
      <!-- ступня: трапеция с носками -->
      <path d="M${cx - shinW} ${ankleY + 8} L${cx + shinW} ${ankleY + 8} L${cx + shinW * 1.5} ${groundY - footH + 6} L${cx + shinW * 1.5} ${groundY} L${cx - shinW * 1.5} ${groundY} L${cx - shinW * 1.5} ${groundY - footH + 6} Z"
            fill="${p.dark}" stroke="#0d1420" stroke-width="3"/>
      <line x1="${cx - shinW * 0.5}" y1="${groundY - footH + 8}" x2="${cx - shinW * 0.5}" y2="${groundY - 2}" stroke="#0d1420" stroke-width="2"/>
      <line x1="${cx + shinW * 0.5}" y1="${groundY - footH + 8}" x2="${cx + shinW * 0.5}" y2="${groundY - 2}" stroke="#0d1420" stroke-width="2"/>`;
  }
  const lx = 200 - hipHalf * 0.55, rx = 200 + hipHalf * 0.55;
  return `
    <!-- таз: V-образная деталь под корпусом -->
    <path d="M158 236 L242 236 L232 262 L200 274 L168 262 Z"
          fill="${p.dark}" stroke="#0d1420" stroke-width="3"/>
    <circle cx="200" cy="252" r="7" fill="${p.joint}" stroke="#0d1420" stroke-width="2"/>
    ${leg(lx)}
    ${leg(rx)}`;
}

/* ---------- Оружие (3 слота × 3 комплекта) ----------
   stats: dmg — урон за выстрел, rate — скорострельность (выстр/сек),
   range — дальность (условные единицы по viewBox 400x520),
   ammo — боезапас, energy — энергия на 1 очередь (мс), weight — вес (кг)
------------------------------------------------------------------------- */
const WEAPONS = {
  weaponR: {
    light:  { label: "Лазер «Игла» L-1",     stats: { dmg: 6,  rate: 8,  range: 170, ammo: 120, energy: 3,  weight: 3 } },
    medium: { label: "Импульсер «Оса» P-22", stats: { dmg: 14, rate: 4,  range: 150, ammo: 80,  energy: 8,  weight: 9 } },
    heavy:  { label: "Гаусс-пушка «Молот» G-7", stats: { dmg: 42, rate: 1.2, range: 210, ammo: 30, energy: 25, weight: 26 } },
  },
  weaponL: {
    light:  { label: "Плазменный веер «Вейл»", stats: { dmg: 5,  rate: 9,  range: 120, ammo: 140, energy: 3,  weight: 3 } },
    medium: { label: "Дробовик «Громобой» S-4", stats: { dmg: 20, rate: 2,  range: 90,  ammo: 48,  energy: 12, weight: 11 } },
    heavy:  { label: "Ракетница «Армагеддон» R-9", stats: { dmg: 55, rate: 0.8, range: 190, ammo: 12, energy: 30, weight: 30 } },
  },
  weaponBack: {
    light:  { label: "Рой дронов «Стая» D-3",       stats: { dmg: 4,  rate: 10, range: 160, ammo: 100, energy: 2,  weight: 4 } },
    medium: { label: "Ракетный блок «Залп» M-6",    stats: { dmg: 18, rate: 3,  range: 180, ammo: 60,  energy: 10, weight: 14 } },
    heavy:  { label: "Орбитальная линия «Дамоклов меч» O-1", stats: { dmg: 80, rate: 0.5, range: 240, ammo: 6, energy: 40, weight: 34 } },
  },
};

const WEAPON_SLOTS = [
  { id: "weaponR",    name: "Оружие правое" },
  { id: "weaponL",    name: "Оружие левое" },
  { id: "weaponBack", name: "Оружие на спине" },
];

// Графика оружия (крепится к руке / спине робота; кисть на y≈305, ствол смотрит вперёд-вниз)
function svgWeapon(slotId, tier) {
  const p = tierPalette(tier);
  if (slotId === "weaponR") {
    // ствол из правой руки (кисть ~ x=262, y≈305)
    return `
      <rect x="272" y="298" width="48" height="13" rx="5" fill="#39465c" stroke="#0d1420" stroke-width="2"/>
      <rect x="314" y="300.5" width="18" height="8" rx="3" fill="${p.dark}"/>
      <circle cx="334" cy="304.5" r="4" fill="#fff7c0"/>
      ${tier === "heavy" ? `<rect x="280" y="288" width="26" height="10" rx="4" fill="${p.joint}"/><rect x="276" y="311" width="30" height="7" rx="3" fill="${p.dark}"/>` : ""}
      ${tier === "medium" ? `<rect x="284" y="311" width="20" height="6" rx="3" fill="${p.dark}"/>` : ""}`;
  }
  if (slotId === "weaponL") {
    return `
      <rect x="80" y="298" width="48" height="13" rx="5" fill="#39465c" stroke="#0d1420" stroke-width="2"/>
      <rect x="68" y="300.5" width="18" height="8" rx="3" fill="${p.dark}"/>
      <circle cx="66" cy="304.5" r="4" fill="#fff7c0"/>
      ${tier === "heavy" ? `<rect x="94" y="288" width="26" height="10" rx="4" fill="${p.joint}"/><rect x="92" y="311" width="30" height="7" rx="3" fill="${p.dark}"/>` : ""}
      ${tier === "medium" ? `<rect x="96" y="311" width="20" height="6" rx="3" fill="${p.dark}"/>` : ""}`;
  }
  // weaponBack — ранец/башня за плечами меха (над корпусом, y 84..118)
  const w = tier === "light" ? 56 : tier === "medium" ? 72 : 92;
  const hgt = tier === "light" ? 26 : tier === "medium" ? 32 : 38;
  const topY = 118 - hgt;
  const barrels = [];
  const n = tier === "light" ? 4 : tier === "medium" ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const bx = 200 - w / 2 + 12 + i * ((w - 24) / Math.max(1, n - 1));
    barrels.push(`<rect x="${(bx - 4).toFixed(1)}" y="${topY - 8}" width="8" height="12" rx="3" fill="#39465c" stroke="#0d1420" stroke-width="1.5"/><circle cx="${bx.toFixed(1)}" cy="${topY - 8}" r="3.5" fill="#fff7c0" stroke="${p.joint}" stroke-width="2"/>`);
  }
  return `
    <rect x="${200 - w / 2}" y="${topY}" width="${w}" height="${hgt}" rx="7" fill="${p.dark}" stroke="#0d1420" stroke-width="2.5"/>
    <rect x="${200 - w / 2 + 6}" y="${topY + 8}" width="${w - 12}" height="6" rx="3" fill="${p.main}" opacity="0.7"/>
    ${barrels.join("")}`;
}

const SVG_DRAW = {
  head: (t) => svgHead(t),
  body: (t) => svgBody(t),
  legs: (t) => svgLegs(t),
  armR: (t) => svgArm(t, "R"),
  armL: (t) => svgArm(t, "L"),
};

window.PART_DATA = { TIERS, SLOTS, PARTS, SVG_DRAW, WEAPONS, WEAPON_SLOTS, svgWeapon, svgCockpitZoom };

})();
