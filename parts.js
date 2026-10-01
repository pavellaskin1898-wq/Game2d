/* =========================================================
   parts.js — данные о деталях робота и их 2D-графика (SVG)
   Три комплекта: лёгкий (light), средний (medium), тяжёлый (heavy)
   Характеристики: сила, скорость, грузоподъёмность, вес, ХП
   ========================================================= */

const TIERS = {
  light:  { name: "Лёгкий",  color: "#4dd2ff", icon: "🟦" },
  medium: { name: "Средний", color: "#ffb347", icon: "🟨" },
  heavy:  { name: "Тяжёлый", color: "#ff5c5c", icon: "🟥" },
};

const SLOTS = [
  { id: "head", name: "Голова" },
  { id: "armR", name: "Рука правая" },
  { id: "armL", name: "Рука левая" },
  { id: "body", name: "Тело" },
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

// Голова
function svgHead(tier) {
  const p = tierPalette(tier);
  if (tier === "light") {
    return `
      <circle cx="200" cy="78" r="34" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <rect x="176" y="64" width="48" height="20" rx="10" fill="${p.accent}" opacity="0.85"/>
      <circle cx="188" cy="74" r="5" fill="${p.joint}"/>
      <circle cx="212" cy="74" r="5" fill="${p.joint}"/>
      <rect x="192" y="108" width="16" height="10" fill="${p.dark}"/>
      <line x1="200" y1="44" x2="200" y2="26" stroke="${p.dark}" stroke-width="4"/>
      <circle cx="200" cy="22" r="6" fill="${p.accent}" stroke="${p.dark}" stroke-width="3"/>`;
  }
  if (tier === "medium") {
    return `
      <rect x="164" y="46" width="72" height="64" rx="14" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <rect x="172" y="62" width="56" height="20" rx="6" fill="#1e2a3a"/>
      <rect x="178" y="67" width="16" height="10" rx="3" fill="${p.accent}"/>
      <rect x="206" y="67" width="16" height="10" rx="3" fill="${p.accent}"/>
      <rect x="186" y="90" width="28" height="8" rx="4" fill="${p.dark}"/>
      <rect x="190" y="110" width="20" height="10" fill="${p.dark}"/>`;
  }
  return `
    <path d="M156 44 h88 a10 10 0 0 1 10 10 v46 a10 10 0 0 1 -10 10 h-88 a10 10 0 0 1 -10 -10 v-46 a10 10 0 0 1 10 -10 z"
          fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <rect x="168" y="60" width="64" height="18" rx="4" fill="#2a1210"/>
    <rect x="174" y="64" width="20" height="10" rx="2" fill="#ffdf6b"/>
    <rect x="206" y="64" width="20" height="10" rx="2" fill="#ffdf6b"/>
    <rect x="160" y="38" width="16" height="10" fill="${p.dark}"/>
    <rect x="224" y="38" width="16" height="10" fill="${p.dark}"/>
    <rect x="184" y="110" width="32" height="12" fill="${p.dark}"/>`;
}

// Рука (side: -1 слева, +1 справа; mirror через transform)
function svgArm(tier, side) {
  const p = tierPalette(tier);
  const x = side === "R" ? 262 : 106; // плечо
  const dir = side === "R" ? 1 : -1;
  const g = (dx) => x + dx * dir;

  if (tier === "light") {
    return `
      <circle cx="${x}" cy="150" r="14" fill="${p.dark}"/>
      <rect x="${g(-5)}" y="150" width="10" height="70" rx="5" fill="${p.main}" stroke="${p.dark}" stroke-width="3"/>
      <circle cx="${x}" cy="224" r="9" fill="${p.joint}"/>
      <rect x="${g(-4)}" y="228" width="8" height="52" rx="4" fill="${p.main}" stroke="${p.dark}" stroke-width="3"/>
      <circle cx="${g(10)}" cy="292" r="10" fill="${p.accent}" stroke="${p.dark}" stroke-width="3"/>`;
  }
  if (tier === "medium") {
    return `
      <circle cx="${x}" cy="150" r="18" fill="${p.dark}"/>
      <rect x="${g(-9)}" y="146" width="18" height="76" rx="8" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <circle cx="${x}" cy="228" r="12" fill="${p.joint}"/>
      <rect x="${g(-8)}" y="234" width="16" height="60" rx="7" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <rect x="${g(-12)}" y="292" width="24" height="22" rx="6" fill="${p.dark}"/>
      <rect x="${g(-6)}" y="312" width="6" height="14" fill="${p.joint}"/>
      <rect x="${g(2)}" y="312" width="6" height="14" fill="${p.joint}"/>`;
  }
  return `
    <rect x="${g(-24)}" y="128" width="48" height="34" rx="10" fill="${p.dark}"/>
    <circle cx="${x}" cy="150" r="24" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <rect x="${g(-14)}" y="150" width="28" height="82" rx="10" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <rect x="${g(-18)}" y="176" width="36" height="12" rx="6" fill="${p.joint}"/>
    <circle cx="${x}" cy="238" r="16" fill="${p.dark}"/>
    <rect x="${g(-13)}" y="248" width="26" height="64" rx="10" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <path d="M${g(-18)} 312 h36 v18 a6 6 0 0 1 -6 6 h-8 v10 h-6 v-10 h-8 a6 6 0 0 1 -6 -6 z" fill="${p.dark}"/>`;
}

// Туловище
function svgBody(tier) {
  const p = tierPalette(tier);
  if (tier === "light") {
    return `
      <rect x="168" y="120" width="64" height="90" rx="18" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <circle cx="200" cy="158" r="14" fill="${p.accent}" stroke="${p.dark}" stroke-width="3"/>
      <circle cx="200" cy="158" r="6" fill="${p.joint}"/>
      <rect x="182" y="210" width="36" height="14" rx="6" fill="${p.dark}"/>`;
  }
  if (tier === "medium") {
    return `
      <rect x="156" y="116" width="88" height="104" rx="16" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
      <rect x="172" y="132" width="56" height="34" rx="8" fill="#1e2a3a"/>
      <rect x="180" y="140" width="40" height="6" rx="3" fill="${p.accent}"/>
      <rect x="180" y="152" width="26" height="6" rx="3" fill="${p.accent}"/>
      <circle cx="200" cy="190" r="10" fill="${p.dark}"/>
      <rect x="176" y="220" width="48" height="16" rx="6" fill="${p.dark}"/>`;
  }
  return `
    <rect x="140" y="110" width="120" height="120" rx="14" fill="${p.main}" stroke="${p.dark}" stroke-width="6"/>
    <rect x="140" y="110" width="120" height="22" rx="10" fill="${p.dark}"/>
    <rect x="160" y="142" width="80" height="42" rx="8" fill="#2a1210"/>
    <circle cx="200" cy="163" r="14" fill="#ffdf6b" stroke="${p.dark}" stroke-width="4"/>
    <rect x="152" y="196" width="24" height="10" rx="4" fill="${p.dark}"/>
    <rect x="224" y="196" width="24" height="10" rx="4" fill="${p.dark}"/>
    <rect x="168" y="230" width="64" height="18" rx="6" fill="${p.dark}"/>`;
}

// Ноги
function svgLegs(tier) {
  const p = tierPalette(tier);
  if (tier === "light") {
    return `
      <rect x="182" y="224" width="36" height="10" rx="5" fill="${p.dark}"/>
      <rect x="184" y="232" width="10" height="66" rx="5" fill="${p.main}" stroke="${p.dark}" stroke-width="3"/>
      <rect x="206" y="232" width="10" height="66" rx="5" fill="${p.main}" stroke="${p.dark}" stroke-width="3"/>
      <circle cx="189" cy="302" r="8" fill="${p.joint}"/>
      <circle cx="211" cy="302" r="8" fill="${p.joint}"/>
      <line x1="189" y1="308" x2="189" y2="360" stroke="${p.main}" stroke-width="8" stroke-linecap="round"/>
      <line x1="211" y1="308" x2="211" y2="360" stroke="${p.main}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="189" cy="368" rx="12" ry="7" fill="${p.dark}"/>
      <ellipse cx="211" cy="368" rx="12" ry="7" fill="${p.dark}"/>`;
  }
  if (tier === "medium") {
    return `
      <rect x="176" y="232" width="20" height="74" rx="8" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <rect x="204" y="232" width="20" height="74" rx="8" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <circle cx="186" cy="310" r="11" fill="${p.joint}"/>
      <circle cx="214" cy="310" r="11" fill="${p.joint}"/>
      <rect x="178" y="316" width="16" height="60" rx="7" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <rect x="206" y="316" width="16" height="60" rx="7" fill="${p.main}" stroke="${p.dark}" stroke-width="4"/>
      <rect x="170" y="376" width="30" height="14" rx="5" fill="${p.dark}"/>
      <rect x="200" y="376" width="30" height="14" rx="5" fill="${p.dark}"/>`;
  }
  return `
    <rect x="166" y="244" width="34" height="80" rx="10" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <rect x="200" y="244" width="34" height="80" rx="10" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <rect x="164" y="270" width="38" height="12" rx="6" fill="${p.joint}"/>
    <rect x="198" y="270" width="38" height="12" rx="6" fill="${p.joint}"/>
    <circle cx="183" cy="328" r="15" fill="${p.dark}"/>
    <circle cx="217" cy="328" r="15" fill="${p.dark}"/>
    <rect x="168" y="336" width="30" height="64" rx="10" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <rect x="202" y="336" width="30" height="64" rx="10" fill="${p.main}" stroke="${p.dark}" stroke-width="5"/>
    <path d="M160 400 h44 v14 a4 4 0 0 1 -4 4 h-36 a4 4 0 0 1 -4 -4 z" fill="${p.dark}"/>
    <path d="M196 400 h44 v14 a4 4 0 0 1 -4 4 h-36 a4 4 0 0 1 -4 -4 z" fill="${p.dark}"/>`;
}

// Экран (визор) поверх головы — не используется отдельно, оставлено на будущее
const SVG_DRAW = {
  head: (t) => svgHead(t),
  body: (t) => svgBody(t),
  legs: (t) => svgLegs(t),
  armR: (t) => svgArm(t, "R"),
  armL: (t) => svgArm(t, "L"),
};

window.PART_DATA = { TIERS, SLOTS, PARTS, SVG_DRAW };
