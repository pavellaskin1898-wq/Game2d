/* =========================================================
   arena.js — Тренировочный ангар: бой вашего меха с 3 мехами-противниками
   Противники: лёгкая / средняя / тяжёлая броня (пиксельные силуэты)
   Механика: ходы, прицеливание по частям, урон по слотам, разоружение,
   уничтожение деталей и оружия, победа — когда все противники обездвижены.
   ========================================================= */
(function () {
  const PD = window.PART_DATA;
  const { TIERS, SLOTS, PARTS, WEAPONS, WEAPON_SLOTS, SVG_DRAW, svgWeapon } = PD;

  /* ---------- Генератор пиксельного меха для арены ---------- */
  // Возвращает <g transform="translate(tx,ty) scale(sc)"> ... </g>
  function mechGroup(tierIds, weaponsCfg, tx, ty, sc, opts) {
    opts = opts || {};
    const parts = {};
    for (const s of SLOTS) {
      const t = tierIds[s.id];
      if (!t || !PARTS[s.id][t]) continue;
      let inner = SVG_DRAW[s.id](t);
      if (opts.destroyed && opts.destroyed.includes(s.id)) {
        // деталь уничтожена — рисуем обгоревший «огрызок»
        inner = `<g opacity="0.5" filter="url(#wreckFilter)">` + inner +
          `</g><rect x="${opts.wreckX || 180}" y="${opts.wreckY || 200}" width="0" height="0"/>`;
      }
      parts[s.id] = inner;
    }
    let wsvg = "";
    for (const ws of WEAPON_SLOTS) {
      const t = weaponsCfg[ws.id];
      if (!t) continue;
      if (opts.destroyed && opts.destroyed.includes(ws.id)) continue; // оружие сбито
      wsvg += svgWeapon(ws.id, t);
    }
    const hpBar = opts.hpBar || "";
    const nameTag = opts.nameTag || "";
    const selRing = opts.selected ? `<rect x="-6" y="-16" width="412" height="536" fill="none" stroke="#ffdd6e" stroke-width="6" stroke-dasharray="14 10"/>` : "";
    return `<g class="arena-mech" transform="translate(${tx} ${ty}) scale(${sc})">
      ${selRing}
      <g ${opts.dim ? 'opacity="0.55"' : ""}>
        ${parts.weaponBack || ""}
        ${parts.legs || '<g></g>'}
        ${parts.armL || '<g></g>'}
        ${parts.armR || '<g></g>'}
        ${parts.body || '<g></g>'}
        ${parts.head || '<g></g>'}
        ${wsvg}
      </g>
      ${hpBar}${nameTag}
    </g>`;
  }

  /* ---------- Простой пиксельный силуэт вражеского меха ---------- */
  // Строим «квадратиками» по сетке 6px, цвет по классу брони.
  function silhouette(cfg, opts) {
    opts = opts || {};
    const P = 6;
    const px = (x, y, w, h, c, o) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${o ? ` opacity="${o}"` : ""}/>`;
    const m = cfg.main, d = cfg.dark, a = cfg.accent, j = cfg.joint;
    const destroyed = opts.destroyed || [];
    const dim = (part) => destroyed.includes(part) ? 0.25 : 1;
    let s = "";
    // тень
    s += `<ellipse cx="200" cy="512" rx="${90 * cfg.bulk}" ry="10" fill="#000" opacity="0.35"/>`;
    // ноги
    const legW = 26 * cfg.bulk, hipY = 330, footY = 496;
    [[150, "legs"], [250 - legW + 40, "legs"]].forEach(([lx]) => {
      s += px(lx, hipY, legW, 70, d, dim("legs"));
      s += px(lx - 4, hipY + 66, legW + 8, 46, m, dim("legs"));
      s += px(lx - 6, footY - 18, legW + 12, 18, j, dim("legs"));
      s += px(lx - 8, footY, legW + 16, 10, "#151a24", dim("legs"));
    });
    // таз
    s += px(146, hipY - 26, 108, 30, j, dim("legs"));
    // торс
    const bw = 96 * cfg.bulk;
    s += px(200 - bw / 2, 190, bw, 118, m, dim("body"));
    s += px(200 - bw / 2 + 8, 200, bw - 16, 12, a, dim("body") * 0.8);
    s += px(200 - bw / 2, 258, bw, 10, d, dim("body"));
    // кабина пилота (иллюминатор)
    s += px(186, 224, 28, 20, "#0d1420", dim("body"));
    s += px(190, 228, 20, 12, "#7de3ff", dim("body") * 0.9);
    // плечи
    const shW = 34 * cfg.bulk;
    s += px(200 - bw / 2 - shW + 6, 186, shW, 34, d, dim("armL"));
    s += px(200 + bw / 2 - 6, 186, shW, 34, d, dim("armR"));
    // руки
    s += px(200 - bw / 2 - shW + 12, 218, 20 * cfg.bulk, 74, m, dim("armL"));
    s += px(200 + bw / 2 - 6 - 4, 218, 20 * cfg.bulk, 74, m, dim("armR"));
    // кисти
    s += px(200 - bw / 2 - shW + 12, 290, 20 * cfg.bulk, 16, j, dim("armL"));
    s += px(200 + bw / 2 - 8, 290, 20 * cfg.bulk, 16, j, dim("armR"));
    // оружие в руках (упрощённые стволы)
    if (!destroyed.includes("weaponR")) {
      s += px(200 + bw / 2 + 10, 288, 46 * cfg.weapons, 12, "#39465c");
      s += px(200 + bw / 2 + 52 * cfg.weapons, 290, 10, 8, a);
    } else {
      s += px(200 + bw / 2 + 10, 288, 12, 12, "#3a3226", 0.5);
    }
    if (!destroyed.includes("weaponL")) {
      s += px(200 - bw / 2 - shW - 40 * cfg.weapons + 8, 288, 46 * cfg.weapons, 12, "#39465c");
      s += px(200 - bw / 2 - shW - 40 * cfg.weapons + 14, 290, 10, 8, a);
    } else {
      s += px(200 - bw / 2 - shW - 4, 288, 12, 12, "#3a3226", 0.5);
    }
    // ранец на спине
    if (!destroyed.includes("weaponBack")) {
      s += px(200 - 30 * cfg.bulk, 150, 60 * cfg.bulk, 40, d, 0.9);
      s += px(200 - 20 * cfg.bulk, 140, 8, 12, "#39465c");
      s += px(200 + 12 * cfg.bulk, 140, 8, 12, "#39465c");
    }
    // голова
    const hw = 30 * cfg.bulk;
    s += px(200 - hw / 2, 148, hw, 30, m, dim("head"));
    s += px(200 - hw / 2 + 4, 158, hw - 8, 8, cfg.visor, dim("head")); // визор
    // V-гребень
    s += `<polygon points="${200 - hw / 2},148 ${200},${126} ${200 + hw / 2},148" fill="${a}" opacity="${dim("head")}"/>`;
    // искры у разрушенных деталей
    destroyed.forEach((id) => {
      const pos = { head: [200, 140], body: [200, 240], armR: [300, 250], armL: [100, 250], legs: [200, 420],
                    weaponR: [320, 290], weaponL: [80, 290], weaponBack: [200, 150] }[id] || [200, 250];
      s += `<text x="${pos[0]}" y="${pos[1]}" font-size="26" text-anchor="middle">💥</text>`;
    });
    return s;
  }

  /* ---------- Конфиги трёх мехов-противников ---------- */
  const FOES_CFG = [
    {
      id: "scout", name: "MX-1 «Разведчик»", cls: "🟦 ЛЁГКАЯ броня", pilot: "ИИ-пилот «Стриж»",
      bulk: 0.75, weapons: 0.8,
      main: "#6fd8ff", dark: "#2f8fb8", accent: "#dffaff", joint: "#1f5f7d", visor: "#ffe066",
      tierIds: { head: "light", armR: "light", armL: "light", body: "light", legs: "light" },
      weaponsCfg: { weaponR: "light", weaponL: null, weaponBack: "light" },
      color: "#4dd2ff",
    },
    {
      id: "line", name: "MH-4 «Линия фронта»", cls: "🟨 СРЕДНЯЯ броня", pilot: "ИИ-пилот «Барс»",
      bulk: 1.0, weapons: 1.0,
      main: "#ffb347", dark: "#b06a1e", accent: "#fff1d6", joint: "#7a4a12", visor: "#ff5c5c",
      tierIds: { head: "medium", armR: "medium", armL: "medium", body: "medium", legs: "medium" },
      weaponsCfg: { weaponR: "medium", weaponL: "medium", weaponBack: null },
      color: "#ffb347",
    },
    {
      id: "siege", name: "HT-9 «Осадная крепость»", cls: "🟥 ТЯЖЁЛАЯ броня", pilot: "ИИ-пилот «Мамонт»",
      bulk: 1.35, weapons: 1.25,
      main: "#ff6b6b", dark: "#8f2020", accent: "#ffd9d0", joint: "#5c1414", visor: "#7dff9e",
      tierIds: { head: "heavy", armR: "heavy", armL: "heavy", body: "heavy", legs: "heavy" },
      weaponsCfg: { weaponR: "heavy", weaponL: null, weaponBack: "heavy" },
      color: "#ff5c5c",
    },
  ];

  // Слоты, по которым можно прицелиться на арене
  const TARGET_SLOTS = ["head", "body", "armR", "armL", "legs", "weaponR", "weaponL", "weaponBack"];
  const SLOT_NAMES = {
    head: "Голова", body: "Тело (кабина)", armR: "Правая рука", armL: "Левая рука",
    legs: "Ноги", weaponR: "Оружие справа", weaponL: "Оружие слева", weaponBack: "Ранец (спина)",
  };

  /* ---------- Создание объектов противников ---------- */
  function makeFoes() {
    return FOES_CFG.map((cfg, i) => {
      const slots = {};
      let hpMax = 0, dps = 0, weight = 0, spdSum = 0;
      for (const s of SLOTS) {
        const part = PARTS[s.id][cfg.tierIds[s.id]];
        slots[s.id] = { hp: part.stats.hp, hpMax: part.stats.hp, alive: true };
        hpMax += part.stats.hp;
        weight += part.stats.weight;
        spdSum += part.stats.spd;
      }
      const weapons = {};
      for (const ws of WEAPON_SLOTS) {
        const t = cfg.weaponsCfg[ws.id];
        if (!t) { weapons[ws.id] = null; continue; }
        const wp = WEAPONS[ws.id][t];
        const whp = Math.max(10, Math.round(wp.stats.dmg * 2));
        weapons[ws.id] = { tier: t, hp: whp, hpMax: whp, alive: true };
        hpMax += whp;
        weight += wp.stats.weight;
        dps += Math.round(wp.stats.dmg * wp.stats.rate);
      }
      return {
        ...cfg, idx: i, slots, weapons,
        hp: hpMax, hpMax, dps, weight,
        spd: Math.round(spdSum / SLOTS.length),
        destroyed: [], // список уничтоженных слотов (для графики)
        disabled: false, // обездвижен (ноги или тело уничтожены)
        wrecked: false,  // полностью уничтожен
      };
    });
  }

  /* ---------- Экспорт состояния игры из app.js ---------- */
  function playerStats() {
    const st = window.ARENA_GET_STATE ? window.ARENA_GET_STATE() : null;
    if (!st) return null;
    let hpMax = 0, dps = 0, weight = 0, spdSum = 0;
    const slots = {};
    for (const s of SLOTS) {
      const part = PARTS[s.id][st.equipped[s.id]];
      slots[s.id] = { hp: part.stats.hp, hpMax: part.stats.hp, alive: true, label: part.label };
      hpMax += part.stats.hp;
      weight += part.stats.weight;
      spdSum += part.stats.spd;
    }
    const weapons = {};
    for (const ws of WEAPON_SLOTS) {
      const t = st.weapons[ws.id];
      if (!t) { weapons[ws.id] = null; continue; }
      const wp = WEAPONS[ws.id][t];
      const whp = Math.max(10, Math.round(wp.stats.dmg * 2));
      weapons[ws.id] = { tier: t, hp: whp, hpMax: whp, alive: true, label: wp.label, dmg: wp.stats.dmg, rate: wp.stats.rate };
      hpMax += whp;
      weight += wp.stats.weight;
      dps += Math.round(wp.stats.dmg * wp.stats.rate);
    }
    const spd = Math.round(spdSum / SLOTS.length);
    const effSpd = Math.max(1, Math.round((spd - Math.floor(weight / 25)) * 10) / 10);
    return { equipped: st.equipped, weapons: st.weapons, slots, weaponsMap: weapons, hp: hpMax, hpMax, dps, weight, spd: effSpd };
  }

  /* ================= UI АРЕНЫ ================= */
  const el = (id) => document.getElementById(id);
  let foes = [];
  let player = null;
  let turn = null;           // "player" | foe object | null(конец)
  let aimSlot = "body";      // куда целится игрок
  let logLines = [];
  let busy = false;
  let resultShown = false;

  function addLog(txt, cls) {
    logLines.unshift({ txt, cls: cls || "" });
    if (logLines.length > 40) logLines.pop();
    el("battleLog").innerHTML = logLines
      .map((l) => `<div class="blog-line ${l.cls}">${l.txt}</div>`).join("");
  }

  function hpBarHtml(cur, max, color, w) {
    const pct = Math.max(0, Math.round((cur / max) * 100));
    return `<div class="mini-hp" style="width:${w || 120}px"><i style="width:${pct}%;background:${color}"></i></div>`;
  }

  /* ---------- Отрисовка сцены боя ---------- */
  function renderScene() {
    const scene = el("battleSvg");
    const bg = window.HANGAR_DECOR && window.HANGAR_DECOR.backLayer ? window.HANGAR_DECOR.backLayer() : "";
    const fg = window.HANGAR_DECOR && window.HANGAR_DECOR.frontLayer ? window.HANGAR_DECOR.frontLayer() : "";
    let s = `<rect x="-10" y="-10" width="420" height="540" fill="#1c2331"/>` + bg;

    // ваш мех слева (реальная сборка)
    const pDead = Object.keys(player.slots).filter((k) => player.slots[k] && !player.slots[k].alive)
      .concat(Object.keys(player.weaponsMap).filter((k) => player.weaponsMap[k] && !player.weaponsMap[k].alive));
    s += `<g transform="scale(0.62)">` +
      mechGroup(player.equipped, player.weapons, 0, 0, 1, { destroyed: pDead }) + `</g>`;
    s += `<text x="12" y="26" font-size="15" fill="#7de3ff" font-family="monospace" font-weight="bold">🤖 ВЫ</text>`;
    // противники справа (силуэты, уменьшенные)
    foes.forEach((f, i) => {
      const tx = 210 + i * 62;
      const ty = 150 - i * 14;
      const sc = 0.5 - i * 0.04;
      const isTurn = turn && turn.idx === f.idx;
      s += `<g transform="translate(${tx} ${ty}) scale(${sc})" opacity="${f.wrecked ? 0.35 : 1}">` +
        `<rect x="-10" y="-40" width="420" height="560" fill="none"/>` +
        silhouette(f, { destroyed: f.destroyed }) +
        (isTurn ? `<rect x="60" y="110" width="280" height="420" fill="none" stroke="#ffdd6e" stroke-width="8" stroke-dasharray="16 12"/>` : "") +
        `</g>`;
    });
    // передний декор полигона (ящики, бочки, конусы — внизу сцены)
    s += `<g opacity="0.9">${fg}</g>`;
    scene.innerHTML = s;

    // карточки участников сверху
    renderCards();
    renderAimPicker();
    renderTargetInfo();
  }

  function renderCards() {
    const wrap = el("fighterCards");
    let s = `
      <div class="fcard player ${turn === "player" ? "active" : ""}">
        <div class="fcard-name">🤖 Ваш мех</div>
        <div class="fcard-sub">❤️ ${player.hp}/${player.hpMax} • 🔫 DPS ${player.dps} • ⚡ ${player.spd}</div>
        ${hpBarHtml(player.hp, player.hpMax, "#4dd2ff", 150)}
      </div>`;
    foes.forEach((f) => {
      s += `
      <div class="fcard foe ${turn && turn.idx === f.idx ? "active" : ""} ${f.disabled ? "disabled" : ""}" data-foe="${f.idx}">
        <div class="fcard-name" style="color:${f.color}">${f.wrecked ? "☠ " : ""}${f.name}</div>
        <div class="fcard-sub">${f.cls} • ❤️ ${Math.max(0, f.hp)}/${f.hpMax}</div>
        ${hpBarHtml(Math.max(0, f.hp), f.hpMax, f.color, 120)}
      </div>`;
    });
    wrap.innerHTML = s;
  }

  function renderAimPicker() {
    const wrap = el("aimPicker");
    wrap.innerHTML = TARGET_SLOTS.map((sid) => {
      const on = aimSlot === sid;
      return `<button class="aim-btn ${on ? "on" : ""}" data-aim="${sid}">${SLOT_NAMES[sid]}</button>`;
    }).join("");
    wrap.querySelectorAll(".aim-btn").forEach((b) =>
      b.addEventListener("click", () => { aimSlot = b.dataset.aim; renderAimPicker(); renderTargetInfo(); }));
  }

  function currentTarget() {
    // цель = первый живой (не уничтоженный) противник; обездвиженные тоже цели (достреливать)
    return foes.find((f) => !f.wrecked) || null;
  }

  function renderTargetInfo() {
    const box = el("targetInfo");
    const tgt = currentTarget();
    if (!tgt) { box.innerHTML = "<i>Целей нет — полигон пуст 🏁</i>"; return; }
    const slot = aimSlot.startsWith("weapon") ? tgt.weapons[aimSlot] : tgt.slots[aimSlot];
    let row;
    if (!slot) {
      row = `Слот: <b>${SLOT_NAMES[aimSlot]}</b> — отсутствует у этой цели`;
    } else if (!slot.alive) {
      row = `Слот: <b>${SLOT_NAMES[aimSlot]}</b> — УНИЧТОЖЕН 💥`;
    } else {
      row = `Слот: <b>${SLOT_NAMES[aimSlot]}</b> — HP ${slot.hp}/${slot.hpMax} ${hpBarHtml(Math.max(0, slot.hp), slot.hpMax, tgt.color, 100)}`;
    }
    box.innerHTML = `
      <div class="ti-title">🎯 Цель: <b style="color:${tgt.color}">${tgt.name}</b>${tgt.disabled ? " (обездвижен)" : ""}</div>
      <div class="ti-row">${row}</div>
      <div class="ti-row">Вооружение: ${weaponsList(tgt)}</div>`;
  }

  function weaponsList(f) {
    const arr = [];
    for (const ws of WEAPON_SLOTS) {
      const w = f.weapons[ws.id];
      if (!w) continue;
      arr.push(`${TIERS[w.tier].icon} ${WEAPONS[ws.id][w.tier].label} ${w.alive ? "" : "(сбито) 💥"}`);
    }
    return arr.length ? arr.join(", ") : "без оружия";
  }

  /* ---------- Боевая математика ---------- */
  function rand(min, max) { return min + Math.random() * (max - min); }

  function weaponPower(owner) {
    // суммарный DPS всего живого оружия (без оружия — «кулаки»)
    const map = owner === player ? player.weaponsMap : owner.weapons;
    let dps = 0;
    for (const k of Object.keys(map)) {
      const w = map[k];
      if (!w || w.alive === false) continue;
      if (owner === player) dps += w.dmg * w.rate;
      else dps += WEAPONS[k][w.tier].stats.dmg * WEAPONS[k][w.tier].stats.rate;
    }
    return dps > 0 ? dps : 2; // кулаки
  }

  function shotOnce(attackerIsPlayer, atkr, dfnd, aimId) {
    // при вызове for-player передаём объект игрока (player), иначе — врага
    const dps = weaponPower(atkr);
    // «учебные» боеприпасы противника наносят ~40% урона, чтобы учения были победимыми
    const factor = attackerIsPlayer ? 0.4 : 0.16;
    const baseDmg = Math.max(1, Math.round(dps * factor));
    let dmg = Math.max(1, Math.round(baseDmg * rand(0.75, 1.3)));
    // шанс попадания зависит от скорости защитника
    const acc = Math.max(0.45, Math.min(0.95, 0.85 - dfnd.spd * 0.012));
    if (Math.random() > acc) return { dmg: 0, miss: true };
    return { dmg };
  }

  function applyDamage(def, isPlayer, aimId, dmg) {
    const slots = isPlayer ? def.slots : def.slots;
    const wmap = isPlayer ? def.weaponsMap : def.weapons;
    let target = null, kind = "part";
    if (aimId.startsWith("weapon")) {
      const w = wmap[aimId];
      if (!w || !w.alive) return { blocked: true };
      target = w; kind = "weapon";
    } else {
      const sp = slots[aimId];
      if (!sp || !sp.alive) return { blocked: true };
      target = sp;
    }
    target.hp -= dmg;
    def.hp -= dmg;
    let broke = false;
    if (target.hp <= 0) {
      target.hp = 0;
      if (target.alive !== undefined) target.alive = false;
      broke = true;
      if (!isPlayer) {
        def.destroyed.push(aimId);
      } else {
        // у игрока тоже помечаем (для затемнения)
        def._destroyed = def._destroyed || [];
        def._destroyed.push(aimId);
      }
    }
    return { broke, kind };
  }

  function checkDefeated(def, isPlayer) {
    const legsOk = def.slots.legs.alive;
    const bodyOk = def.slots.body.alive;
    const headOk = def.slots.head.alive;
    if (!bodyOk) { def.wrecked = true; def.disabled = true; return "УНИЧТОЖЕН — кабина пробита ☠"; }
    if (!isPlayer && !headOk) { def.wrecked = true; def.disabled = true; return "УНИЧТОЖЕН — голова снесена ☠"; }
    if (!legsOk && !def.disabled) { def.disabled = true; return "обездвижен (ноги сбиты) 🦿"; }
    return null;
  }

  /* ---------- Ходы ---------- */
  async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function playerFire() {
    const tgt = currentTarget();
    if (!tgt) return endBattle(true);
    const shots = Math.max(1, Math.min(3, countPlayerWeapons()));
    for (let i = 0; i < shots; i++) {
      const res = shotOnce(true, player, tgt, aimSlot);
      if (res.miss) {
        addLog(`💨 Ваш мех промахнулся по ${tgt.name} (${SLOT_NAMES[aimSlot]})`, "");
      } else {
        const ap = applyDamage(tgt, false, aimSlot, res.dmg);
        if (ap.blocked) {
          addLog(`⛔ ${SLOT_NAMES[aimSlot]} у ${tgt.name} уже уничтожена — перенос удара на корпус`, "warn");
          applyDamage(tgt, false, "body", res.dmg);
          tgt.destroyed.includes("body") || (tgt.slots.body.alive = tgt.slots.body.alive);
        } else {
          addLog(`🔫 Ваш мех → ${tgt.name}: ${SLOT_NAMES[aimSlot]} −${res.dmg}` + (ap.broke ? " 💥 РАЗРУШЕНО!" : ""), ap.broke ? "crit" : "good");
        }
        const msg = checkDefeated(tgt, false);
        if (msg) addLog(`🏳️ ${tgt.name}: ${msg}`, "warn");
      }
      renderScene();
      await sleep(260);
    }
    if (foes.every((f) => f.wrecked)) return endBattle(true);
    await foesTurn();
  }

  function countPlayerWeapons() {
    return Object.values(player.weaponsMap).filter((w) => w && w.alive).length || 1;
  }

  async function foesTurn() {
    for (const f of foes) {
      if (f.wrecked) continue;
      if (f.disabled) { addLog(`😵 ${f.name} обездвижен и не отвечает`, ""); continue; }
      turn = f; renderCards();
      await sleep(300);
      // ИИ выбирает случайный живой слот игрока (часто — ноги или оружие)
      const options = TARGET_SLOTS.filter((sid) => {
        if (sid.startsWith("weapon")) return player.weaponsMap[sid] && player.weaponsMap[sid].alive;
        return player.slots[sid] && player.slots[sid].alive;
      });
      const weights = options.map((sid) => (sid === "legs" || sid.startsWith("weapon")) ? 3 : 1);
      let pickIdx = weightedPick(options, weights);
      const aim = options[pickIdx];
      const nShots = Math.max(1, Math.min(3, Object.values(f.weapons).filter((w) => w && w.alive).length));
      for (let i = 0; i < nShots; i++) {
        const res = shotOnce(false, f, player, aim);
        if (res.miss) {
          addLog(`💨 ${f.name} промахнулся по вам`, "");
        } else {
          const ap = applyDamage(player, true, aim, res.dmg);
          if (ap.blocked) {
            addLog(`⛔ Ваш слот ${SLOT_NAMES[aim]} уже уничтожен — удар по корпусу`, "warn");
            applyDamage(player, true, "body", res.dmg);
          } else {
            addLog(`👾 ${f.name} → ваш мех: ${SLOT_NAMES[aim]} −${res.dmg}` + (ap.broke ? " 💥 ПОТЕРЯНО!" : ""), ap.broke ? "bad" : "");
          }
          const msg = checkDefeated(player, true);
          if (msg) { addLog(`🚨 Ваш мех: ${msg}`, "bad"); renderScene(); return endBattle(false); }
        }
        renderScene();
        await sleep(240);
      }
    }
    if (player.hp <= 0) return endBattle(false);
    turn = "player";
    renderScene();
  }

  function weightedPick(arr, w) {
    const total = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return arr.length - 1;
  }

  function endBattle(win) {
    turn = null; busy = false;
    const res = el("battleResult");
    res.hidden = false;
    res.className = "battle-result " + (win ? "win" : "lose");
    res.textContent = win
      ? "🏆 ПОБЕДА! Все три учебных меха уничтожены."
      : "💥 ПОРАЖЕНИЕ. Кабина вашего меха пробита. Вернитесь в ангар и усильте броню!";
    addLog(win ? "🏆 Учения завершены: ПОБЕДА" : "💥 Учения завершены: ПОРАЖЕНИЕ", win ? "good" : "bad");
    el("btnAttack").disabled = true;
    el("btnReset").disabled = false;
    renderScene();
  }

  /* ---------- Старт / сброс ---------- */
  function startBattle() {
    player = playerStats();
    if (!player) { addLog("Не удалось получить данные сборки меха.", "bad"); return; }
    foes = makeFoes();
    logLines = [];
    aimSlot = "body";
    turn = "player";
    busy = false;
    resultShown = false;
    el("battleResult").hidden = true;
    el("btnAttack").disabled = false;
    el("btnReset").disabled = false;
    addLog("📣 Учебная тревога! Три учебных меха выходят на полигон. Ваш ход — выберите цель и стреляйте!", "good");
    foes.forEach((f) => addLog(`👾 ${f.name} — ${f.cls}, DPS ${f.dps}, вес ${f.weight} кг`, ""));
    renderScene();
  }

  /* ---------- Кнопки ---------- */
  function bindButtons() {
    el("btnAttack").addEventListener("click", async () => {
      if (busy || turn !== "player") return;
      busy = true;
      el("btnAttack").disabled = true;
      await playerFire();
      busy = false;
      if (turn === "player") el("btnAttack").disabled = false;
    });
    el("btnReset").addEventListener("click", () => startBattle());
  }

  /* ---------- Попадание decor-слоя для фона арены ---------- */
  // (backLayer/frontLayer экспортируются в decor.js)

  /* ---------- Глобальный API для app.js ---------- */
  window.ARENA = {
    init() {
      bindButtons();
    },
    enter() {
      startBattle();
    },
    leave() {
      // ничего special — экран скрывает app.js
    },
  };

  // Авто-экспорт функций рисования наружу (для единого HTML-файла)
  window.ARENA_INTERNAL = { mechGroup, silhouette, FOES_CFG };
})();
