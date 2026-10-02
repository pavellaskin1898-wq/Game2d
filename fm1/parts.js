'use strict';
/* ============================================================
 * parts.js — данные деталей и оружия (5 слотов × 3 комплекта)
 * Каждая деталь: weight, hp, df (броня), а также бонусы к
 * acc/eva/move. Оружие встроено в детали рук: at/ammo/range.
 * ============================================================ */

// Комплекты (tiers): L — лёгкий, M — средний, H — тяжёлый
const TIERS = {
  L: { name:'LIGHT',   color:'#7fd0ff' },
  M: { name:'MEDIUM',  color:'#ffd23f' },
  H: { name:'HEAVY',   color:'#ff8a66' },
};

// Слоты меха
const SLOTS = ['head','armR','armL','body','legs'];
const SLOT_NAMES = {
  head:'HEAD', armR:'ARM R', armL:'ARM L', body:'TORSO', legs:'LEGS',
};

// ---- База данных деталей ----------------------------------
// w=вес(kg) hp df acc eva move | weapon:{at,ammo,rng} только у рук
const PART_DB = [
  // ГОЛОВА
  { id:'head-L', slot:'head', tier:'L', name:'SCOUT OPTICS',  w:15, hp:20, df:2, acc:+10, eva:+5, move:0, unlocked:true },
  { id:'head-M', slot:'head', tier:'M', name:'COMMAND VISOR', w:35, hp:35, df:5, acc:+5,  eva:0,  move:0, unlocked:true },
  { id:'head-H', slot:'head', tier:'H', name:'SIEGE CROWN',   w:70, hp:60, df:12,acc:0,   eva:-5, move:0, unlocked:false },

  // ПРАВАЯ РУКА (оружейная)
  { id:'armR-L', slot:'armR', tier:'L', name:'PULSE CANNON',  w:25, hp:25, df:3, acc:+5, eva:+5, move:0,
    weapon:{ at:14, ammo:12, rng:5 }, unlocked:true },
  { id:'armR-M', slot:'armR', tier:'M', name:'AC RAILGUN',    w:55, hp:40, df:7, acc:0,  eva:0,  move:0,
    weapon:{ at:26, ammo:8,  rng:7 }, unlocked:true },
  { id:'armR-H', slot:'armR', tier:'H', name:'GAUSS HAMMER',  w:95, hp:55, df:14,acc:-5, eva:-5, move:0,
    weapon:{ at:44, ammo:5,  rng:4 }, unlocked:false },

  // ЛЕВАЯ РУКА (оружейная)
  { id:'armL-L', slot:'armL', tier:'L', name:'SMG SWARM',     w:22, hp:22, df:3, acc:+8, eva:+6, move:0,
    weapon:{ at:10, ammo:16, rng:4 }, unlocked:true },
  { id:'armL-M', slot:'armL', tier:'M', name:'SHOT WEAPON',   w:50, hp:38, df:7, acc:-2, eva:0,  move:0,
    weapon:{ at:22, ammo:9,  rng:3 }, unlocked:true },
  { id:'armL-H', slot:'armL', tier:'H', name:'ROCKET POD',    w:90, hp:52, df:13,acc:-8, eva:-6, move:0,
    weapon:{ at:38, ammo:6,  rng:6 }, unlocked:false },

  // КОРПУС (определяет максимальный груз)
  { id:'body-L', slot:'body', tier:'L', name:'FRAME CORE',    w:60,  hp:45, df:6,  maxLoad:120, unlocked:true },
  { id:'body-M', slot:'body', tier:'M', name:'GUARD CHASSIS', w:110, hp:75, df:12, maxLoad:220, unlocked:true },
  { id:'body-H', slot:'body', tier:'H', name:'FORTRESS HULL', w:180, hp:120,df:22, maxLoad:360, unlocked:false },

  // НОГИ
  { id:'legs-L', slot:'legs', tier:'L', name:'SPRIDER UNITS', w:30, hp:30, df:4, move:+2, eva:+8, unlocked:true },
  { id:'legs-M', slot:'legs', tier:'M', name:'DUO WALKERS',   w:65, hp:50, df:9, move:+1, eva:+2, unlocked:true },
  { id:'legs-H', slot:'legs', tier:'H', name:'SIEGE TRACKS',  w:120,hp:80, df:16,move:0,  eva:-4, unlocked:false },
];

// Быстрый доступ по id
const partById = id => PART_DB.find(p => p.id === id);

// Пресеты врагов для тренировочных боёв (собираются из тех же деталей)
const ENEMY_PRESETS = [
  { label:'RECON MECH "WASP"',  loadout:['head-L','armR-L','armL-L','body-L','legs-L'], tint:'#7fd0ff' },
  { label:'LINE MECH "JAGUAR"', loadout:['head-M','armR-M','armL-M','body-M','legs-M'], tint:'#ffd23f' },
  { label:'SIEGE MECH "BASTION"',loadout:['head-H','armR-H','armL-H','body-H','legs-H'], tint:'#ff8a66' },
];

// Награды и разблокировки за победы (прогрессия MVP)
const REWARDS = [
  { credits:150, unlock:['head-H'] },
  { credits:250, unlock:['armR-H','armL-H'] },
  { credits:400, unlock:['body-H','legs-H'] },
];
