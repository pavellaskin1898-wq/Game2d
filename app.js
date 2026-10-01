/* app.js — логика ангара: выбор слота, замена деталей, подсчёт характеристик */

const { TIERS, SLOTS, PARTS, SVG_DRAW } = window.PART_DATA;

// Текущая сборка робота (по умолчанию — средний комплект)
let equipped = {
  head: "medium",
  armR: "medium",
  armL: "medium",
  body: "medium",
  legs: "medium",
};

let selectedSlot = null;

/* ---------- Отрисовка робота ---------- */
function renderRobot() {
  for (const slot of SLOTS) {
    const g = document.getElementById("part-" + slot.id);
    g.innerHTML = SVG_DRAW[slot.id](equipped[slot.id]);
    g.classList.toggle("selected", selectedSlot === slot.id);
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
  // Скорость — средняя по деталям (ноги и руки важнее): считаем средним арифметическим
  const speeds = SLOTS.map((s) => PARTS[s.id][equipped[s.id]].stats.spd);
  totals.spd = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10;

  // Штраф скорости за перегрузку: тяжёлые детали замедляют
  const speedPenalty = Math.floor(totals.weight / 25);
  totals.effectiveSpd = Math.max(1, totals.spd - speedPenalty);
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
    <span class="tstat">❤️ ХП: <b>${t.hp}</b></span>`;
}

/* ---------- Список слотов ---------- */
function renderSlots() {
  const list = document.getElementById("slotsList");
  list.innerHTML = "";
  for (const slot of SLOTS) {
    const tier = equipped[slot.id];
    const part = PARTS[slot.id][tier];
    const btn = document.createElement("button");
    btn.className = "slot-btn" + (selectedSlot === slot.id ? " active" : "");
    btn.style.setProperty("--tier-color", TIERS[tier].color);
    btn.innerHTML = `
      <span class="slot-name">${slot.name}</span>
      <span class="slot-tier">${TIERS[tier].icon} ${TIERS[tier].name}</span>
      <span class="slot-part">${part.label}</span>`;
    btn.addEventListener("click", () => selectSlot(slot.id));
    list.appendChild(btn);
  }
}

/* ---------- Выбор комплекта для слота ---------- */
function renderPicker() {
  const title = document.getElementById("pickerTitle");
  const cards = document.getElementById("pickerCards");
  if (!selectedSlot) {
    title.textContent = "Выберите слот (или деталь на роботе)";
    cards.innerHTML = "";
    return;
  }
  const slotName = SLOTS.find((s) => s.id === selectedSlot).name;
  title.textContent = `Замена: ${slotName}`;
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

function selectSlot(id) {
  selectedSlot = id;
  renderAll();
}

/* ---------- Клик по деталям на роботе ---------- */
document.querySelectorAll(".robot-part").forEach((g) => {
  g.addEventListener("click", () => selectSlot(g.dataset.slot));
});

/* ---------- Полный перерендер ---------- */
function renderAll() {
  renderRobot();
  renderSlots();
  renderPicker();
  renderTotals();
}

renderAll();
