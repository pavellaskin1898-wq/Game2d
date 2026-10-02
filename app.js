/* app.js — логика ангара: выбор слотов (детали + оружие), замена, подсчёт характеристик */

// Работает и как отдельный файл (window.PART_DATA), и внутри единого HTML-файла (PART_DATA)
const _PD = (typeof window !== 'undefined' && window.PART_DATA) ? window.PART_DATA : PART_DATA;
const { TIERS, SLOTS, PARTS, SVG_DRAW, WEAPONS, WEAPON_SLOTS, svgWeapon, svgCockpitZoom } = _PD;

// Текущая сборка меха (по умолчанию — средний комплект)
let equipped = {
  head: "medium",
  armR: "medium",
  armL: "medium",
  body: "medium",
  legs: "medium",
};

// Экипированное оружие (null — слот пуст)
let weapons = {
  weaponR: "medium",
  weaponL: null,
  weaponBack: null,
};

let selectedSlot = null; // может быть id детали или id оружия

/* ---------- Отрисовка робота ---------- */
function renderRobot() {
  for (const slot of SLOTS) {
    const g = document.getElementById("part-" + slot.id);
    g.innerHTML = SVG_DRAW[slot.id](equipped[slot.id]);
    g.classList.toggle("selected", selectedSlot === slot.id);
  }
  for (const wslot of WEAPON_SLOTS) {
    const g = document.getElementById("part-" + wslot.id);
    g.innerHTML = weapons[wslot.id] ? svgWeapon(wslot.id, weapons[wslot.id]) : "";
    g.classList.toggle("selected", selectedSlot === wslot.id);
  }
}

/* ---------- Итоговые характеристики ---------- */
function computeTotals() {
  const totals = { str: 0, spd: 0, cap: 0, weight: 0, hp: 0 };
  for (const slot of SLOTS) {
    const st = PARTS[slot.id][equipped[slot.id]].stats;
    totals.str += st.str;
    totals.cap += st.cap;
    totals.weight += st.weight;
    totals.hp += st.hp;
  }
  // Вес и DPS оружия
  totals.dps = 0;
  totals.weaponCount = 0;
  for (const wslot of WEAPON_SLOTS) {
    const tierId = weapons[wslot.id];
    if (!tierId) continue;
    const st = WEAPONS[wslot.id][tierId].stats;
    totals.weight += st.weight;
    totals.dps += Math.round(st.dmg * st.rate);
    totals.weaponCount++;
  }
  // Скорость — средняя по деталям
  const speeds = SLOTS.map((s) => PARTS[s.id][equipped[s.id]].stats.spd);
  totals.spd = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10;

  // Штраф скорости за перегрузку: тяжёлые детали и оружие замедляют
  const speedPenalty = Math.floor(totals.weight / 25);
  totals.effectiveSpd = Math.max(1, Math.round((totals.spd - speedPenalty) * 10) / 10);
  return totals;
}

function renderTotals() {
  const t = computeTotals();
  const el = document.getElementById("totalStats");
  el.innerHTML = `
    <span class="tstat">💪 Сила: <b>${t.str}</b></span>
    <span class="tstat">⚡ Скорость: <b>${t.effectiveSpd}</b></span>
    <span class="tstat">📦 Грузоподъёмность: <b>${t.cap} кг</b></span>
    <span class="tstat">⚖️ Вес: <b>${t.weight} кг</b></span>
    <span class="tstat">❤️ ХП: <b>${t.hp}</b></span>
    <span class="tstat">🔫 Урон/сек: <b>${t.dps}</b></span>`;
}

/* ---------- Список слотов (детали + оружие) ---------- */
function makeSlotBtn(name, tierLabel, partLabel, tierColor, slotId, empty) {
  const btn = document.createElement("button");
  btn.className = "slot-btn" + (selectedSlot === slotId ? " active" : "") + (empty ? " empty" : "");
  btn.style.setProperty("--tier-color", tierColor || "#5a6b83");
  btn.innerHTML = `
    <span class="slot-name">${name}</span>
    <span class="slot-tier">${tierLabel}</span>
    <span class="slot-part">${partLabel}</span>`;
  btn.addEventListener("click", () => selectSlot(slotId));
  return btn;
}

function renderSlots() {
  const list = document.getElementById("slotsList");
  list.innerHTML = "";

  const h1 = document.createElement("div");
  h1.className = "slots-header";
  h1.textContent = "🦾 Детали";
  list.appendChild(h1);
  for (const slot of SLOTS) {
    const tier = equipped[slot.id];
    const part = PARTS[slot.id][tier];
    list.appendChild(makeSlotBtn(slot.name, `${TIERS[tier].icon} ${TIERS[tier].name}`, part.label, TIERS[tier].color, slot.id, false));
  }

  const h2 = document.createElement("div");
  h2.className = "slots-header";
  h2.textContent = "🔫 Оружие";
  list.appendChild(h2);
  for (const wslot of WEAPON_SLOTS) {
    const tier = weapons[wslot.id];
    if (tier) {
      const wp = WEAPONS[wslot.id][tier];
      list.appendChild(makeSlotBtn(wslot.name, `${TIERS[tier].icon} ${TIERS[tier].name}`, wp.label, TIERS[tier].color, wslot.id, false));
    } else {
      list.appendChild(makeSlotBtn(wslot.name, "— не установлено", "пусто", null, wslot.id, true));
    }
  }
}

/* ---------- Выбор комплекта для слота (деталь или оружие) ---------- */
function renderPartPicker(slotName) {
  const cards = document.getElementById("pickerCards");
  cards.innerHTML = "";
  for (const tierId of Object.keys(TIERS)) {
    const tier = TIERS[tierId];
    const part = PARTS[selectedSlot][tierId];
    const isCurrent = equipped[selectedSlot] === tierId;
    const card = document.createElement("button");
    card.className = "part-card" + (isCurrent ? " current" : "");
    card.style.setProperty("--tier-color", tier.color);
    card.innerHTML = `
      <div class="card-head">
        <span class="badge">${tier.icon} ${tier.name}</span>
        ${isCurrent ? '<span class="installed">✔ стоит</span>' : ""}
      </div>
      <div class="card-label">${part.label}</div>
      <ul class="card-stats">
        <li>💪 Сила: <b>${part.stats.str}</b></li>
        <li>⚡ Скорость: <b>${part.stats.spd}</b></li>
        <li>📦 Грузопод.: <b>${part.stats.cap} кг</b></li>
        <li>⚖️ Вес: <b>${part.stats.weight} кг</b></li>
        <li>❤️ ХП: <b>${part.stats.hp}</b></li>
      </ul>`;
    card.addEventListener("click", () => {
      equipped[selectedSlot] = tierId;
      renderAll();
    });
    cards.appendChild(card);
  }
}

function renderWeaponPicker() {
  const cards = document.getElementById("pickerCards");
  cards.innerHTML = "";
  for (const tierId of Object.keys(TIERS)) {
    const tier = TIERS[tierId];
    const wp = WEAPONS[selectedSlot][tierId];
    const isCurrent = weapons[selectedSlot] === tierId;
    const dps = Math.round(wp.stats.dmg * wp.stats.rate);
    const card = document.createElement("button");
    card.className = "part-card" + (isCurrent ? " current" : "");
    card.style.setProperty("--tier-color", tier.color);
    card.innerHTML = `
      <div class="card-head">
        <span class="badge">${tier.icon} ${tier.name}</span>
        ${isCurrent ? '<span class="installed">✔ стоит</span>' : ""}
      </div>
      <div class="card-label">${wp.label}</div>
      <ul class="card-stats">
        <li>💥 Урон: <b>${wp.stats.dmg}</b></li>
        <li>🔁 Скорострельность: <b>${wp.stats.rate}/с</b></li>
        <li>🎯 DPS: <b>${dps}</b></li>
        <li>📏 Дальность: <b>${wp.stats.range}</b></li>
        <li>🔷 Боезапас: <b>${wp.stats.ammo}</b></li>
        <li>⚡ Энергия: <b>${wp.stats.energy}</b></li>
        <li>⚖️ Вес: <b>${wp.stats.weight} кг</b></li>
      </ul>`;
    card.addEventListener("click", () => {
      weapons[selectedSlot] = tierId;
      renderAll();
    });
    cards.appendChild(card);
  }
  // кнопка снять оружие
  if (weapons[selectedSlot]) {
    const off = document.createElement("button");
    off.className = "part-card remove";
    off.innerHTML = `<div class="card-label">✖ Снять оружие</div>`;
    off.addEventListener("click", () => {
      weapons[selectedSlot] = null;
      renderAll();
    });
    cards.appendChild(off);
  }
}

function renderPicker() {
  const title = document.getElementById("pickerTitle");
  const cards = document.getElementById("pickerCards");
  if (!selectedSlot) {
    title.textContent = "Выберите слот (или деталь/оружие на роботе)";
    cards.innerHTML = "";
    return;
  }
  const isWeapon = selectedSlot.startsWith("weapon");
  const slotObj = isWeapon ? WEAPON_SLOTS.find((s) => s.id === selectedSlot)
                           : SLOTS.find((s) => s.id === selectedSlot);
  title.textContent = `Замена: ${slotObj.name}`;
  if (isWeapon) renderWeaponPicker();
  else renderPartPicker(slotObj.name);
}

function selectSlot(id) {
  selectedSlot = id;
  renderAll();
}

/* ---------- Клик по деталям на мехе ---------- */
document.querySelectorAll(".robot-part").forEach((g) => {
  g.addEventListener("click", () => selectSlot(g.dataset.slot));
});

/* ---------- Подсказка «кабина пилота» при наведении на тело ---------- */
const cockpitTip = document.getElementById("cockpitTip");
const bodyPart = document.getElementById("part-body");
if (bodyPart && cockpitTip) {
  cockpitTip.innerHTML = svgCockpitZoom() + '<div class="tip-caption">👨‍✈️ Пилот управляет мехом из кабины в торсе</div>';
  bodyPart.addEventListener("mouseenter", () => cockpitTip.classList.add("visible"));
  bodyPart.addEventListener("mouseleave", () => cockpitTip.classList.remove("visible"));
}

/* ---------- Полный перерендер ---------- */
function renderAll() {
  renderRobot();
  renderSlots();
  renderPicker();
  renderTotals();
}

renderAll();

/* ============================================================
   КОМНАТА ПИЛОТА: переключение экранов, папки с делами
   ============================================================ */
const PR = (typeof window !== 'undefined' && window.PILOT_ROOM) ? window.PILOT_ROOM : null;

const pilotRoomEl = document.getElementById("pilotRoom");
const hangarWrapEl = document.getElementById("hangarWrap");
const panelEl = document.querySelector(".panel");
const screenTitle = document.getElementById("screenTitle");
const btnHangar = document.getElementById("btnHangar");
const btnPilotRoom = document.getElementById("btnPilotRoom");

// Данные личных дел пилотов
const PILOTS = {
  male: {
    name: "Артём «Ястреб» Соколов",
    rank: "⭐ Капитан • Ведущий пилот меха MH-7",
    photo: PR ? PR.svgPilotM() : "",
    list: [
      ["Позывной", "Ястреб"],
      ["Возраст", "27 лет"],
      ["Стаж полётов", "6 лет / 412 боевых выходов"],
      ["Любимый мех", "«Цитадель» — тяжёлый комплект"],
      ["Навыки", "штурм, работа гаусс-орудия, точность 94%"],
      ["Характер", "спокойный, любит тактику и шахматы"],
      ["Достижения", "орден «За оборону Сектора-7», кубок ангарных учений"],
    ],
    mech: "🤖 Закреплённый мех: MH-7 «Гроза» • средняя сборка, импульсер «Оса»",
  },
  female: {
    name: "Алиса «Ласточка» Верещагина",
    rank: "⭐ Лейтенант • Пилот разведывательного меха",
    photo: PR ? PR.svgPilotF() : "",
    list: [
      ["Позывной", "Ласточка"],
      ["Возраст", "24 года"],
      ["Стаж полётов", "3 года / 187 боевых выходов"],
      ["Любимый мех", "«Стриж» — лёгкий скоростной комплект"],
      ["Навыки", "разведка, уклонение, рейды на высокой скорости"],
      ["Характер", "весёлая, дерзкая, обожает рисовать на броне"],
      ["Достижения", "рекорд полигона по скорости, медаль «Быстрая тень»"],
    ],
    mech: "🤖 Закреплённый мех: MH-3 «Ветер» • лёгкая сборка, лазер «Игла» + рой дронов",
  },
};

function showScreen(which) {
  const isRoom = which === "room";
  pilotRoomEl.hidden = !isRoom;
  hangarWrapEl.hidden = isRoom;
  if (panelEl) panelEl.style.display = isRoom ? "none" : "";
  screenTitle.textContent = isRoom
    ? "🪑 Комната пилота: рабочий стол и личные дела"
    : "🏗️ Ангар: Мех-конструктор (с пилотом)";
  btnHangar.classList.toggle("active", !isRoom);
  btnPilotRoom.classList.toggle("active", isRoom);
  if (!isRoom && cockpitTip) cockpitTip.classList.remove("visible");
  closeDossier();
}

btnHangar.addEventListener("click", () => showScreen("hangar"));
btnPilotRoom.addEventListener("click", () => showScreen("room"));

// Вставляем папки в SVG-сцену комнаты
if (PR) {
  document.getElementById("folderMale").innerHTML += PR.svgFolderOnDesk("#2f5fa8", "#1c3a66", "СОКОЛОВ А. • ЯСТРЕБ", "☠ МЕХ-7");
  document.getElementById("folderFemale").innerHTML += PR.svgFolderOnDesk("#b0487a", "#6e2447", "ВЕРЕЩАГИНА А. • ЛАСТОЧКА", "☠ МЕХ-3");
}

// Открытие дела по клику на папку
document.querySelectorAll(".folder").forEach((f) => {
  f.addEventListener("click", () => openDossier(f.dataset.pilot));
});

const dossier = document.getElementById("dossier");
function openDossier(id) {
  const p = PILOTS[id];
  if (!p || !PR) return;
  document.getElementById("dossierPhoto").innerHTML = p.photo;
  document.getElementById("dossierName").textContent = p.name;
  document.getElementById("dossierRank").textContent = p.rank;
  document.getElementById("dossierList").innerHTML = p.list
    .map(([k, v]) => `<li><span>${k}:</span> <b>${v}</b></li>`)
    .join("");
  document.getElementById("dossierMech").textContent = p.mech;
  dossier.hidden = false;
  const inner = dossier.querySelector(".dossier-inner");
  if (inner) {
    inner.classList.remove("dossier-card-anim");
    void inner.offsetWidth; // рестарт анимации
    inner.classList.add("dossier-card-anim");
  }
}
function closeDossier() {
  if (dossier) dossier.hidden = true;
}
document.getElementById("dossierClose").addEventListener("click", closeDossier);
dossier.addEventListener("click", (e) => { if (!e.target.closest(".dossier-inner")) closeDossier(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDossier(); });

// Кнопка «Комната пилота» прямо из кабины на мехе (по клику на иллюминатор тела)
const bodyG = document.getElementById("part-body");
if (bodyG) {
  const goBtn = document.createElement("button");
  goBtn.id = "goPilotRoom";
  goBtn.className = "go-pilot-btn";
  goBtn.textContent = "🪑 В комнату пилота";
  goBtn.title = "Открыть рабочий стол пилотов";
  const wrap = document.getElementById("hangar");
  if (wrap) wrap.appendChild(goBtn);
  goBtn.addEventListener("click", () => showScreen("room"));
}

showScreen("hangar");
