'use strict';
/* ============================================================
   SPRITES — покадровая пиксель-анимация меха (формат spritepaint)
   Каждый кадр = массив строк, где символ = индекс палитры ('.' = прозрачный).
   Кадры хранятся в base64 (как экспорт spritepaint.com), декодируются на лету.
   Анимации: idle (стоячая стойка, 4 кадра), walk (шаг, 6 кадров), fire (выстрел, 3 кадра).
   Мех: Front Mission WANZER — угловатый, серо-белая броня, жёлтые акценты,
   V-образный гребень, cockpit-иллюминатор с пилотом, большие наплечники.
   ============================================================ */

// ---- Палитра (индекс -> цвет). 0 = прозрачный ----
const PAL = [
  'rgba(0,0,0,0)', // .  прозрачный
  '#2b2f36',       // 1  тёмный контур/механика
  '#565d68',       // 2  средний металл (тени брони)
  '#8b95a1',       // 3  базовый металл брони
  '#cfd6de',       // 4  светлая броня
  '#eef1f4',       // 5  блики брони
  '#ffd23e',       // 6  жёлтый (акценты FM)
  '#ffdf6b',       // 7  визор (светло-жёлтый)
  '#9adf6b',       // 8  зелёный (стекло кабины / огонь)
  '#3a3e45',       // 9  почти чёрный (ниши, ствол)
  '#d8d2c2',       // A  ракетно-бежевый
  '#e04b3a',       // B  красный (трассеры, индикаторы)
  '#fff7e0',       // C  вспышка выстрела
  '#d9b38c',       // D  кожа пилота
  '#4a6b8a',       // E  комбинезон пилота
];
// символы палитры: '.','1'..'9','A'..'E'
const SYM = '.123456789ABCDE';

// ---------- Кадры ----------
// Мех (WANZER) собирается из «пиксельных прямоугольников» (как слои в spritepaint).
// pose — параметры конкретного кадра анимации:
//   bob        — вертикальное покачивание корпуса (дыхание/шаг)
//   legF, legB — какая нога поднята/вынесена вперёд (шаг)
//   rec        — отдача правой руки со стволом (выстрел)
//   muzzle     — вспышка в дуле
//   visorOff   — визор мигнул (покадровая «жизнь»)
//   lean       — наклон корпуса (idle-микродвижение)
// Все координаты — в пиксельной сетке спрайта SWxSH, лицо меха смотрит ВПРАВО.

const SW = 36, SH = 48; // размер одного кадра спрайт-листа

function rectsFor(pose) {
  const R = [];
  const b = pose.bob || 0, ln = pose.lean || 0;
  const push = (x, y, w, h, c) => R.push([x, y, w, h, c]);
  const Y = 44 + b;                       // уровень земли (подошвы ступней)
  const legF = pose.legF || 0, legB = pose.legB || 0; // шаг: подъём передней/задней ноги

  // ===== НОГИ (двухзвенные, угловатые) =====
  // задняя (левая на экране) нога: стопа/голень поднимаются при шаге (legB)
  push(10 - legB * 2, Y - 3 - legB * 3, 7, 3, '1');        // стопа
  push(11 - legB, Y - 10 - legB * 2, 5, 7, '2');           // голень
  push(11, Y - 16, 6, 6, '3');                              // бедро (броня)
  push(11, Y - 16, 6, 2, '4');                              // блик бедра
  // передняя (правая) нога
  push(19 + legF * 2, Y - 3 - legF * 3, 7, 3, '1');
  push(20 + legF, Y - 10 - legF * 2, 5, 7, '2');
  push(19, Y - 16, 6, 6, '3');
  push(19, Y - 16, 6, 2, '4');
  // коленные жёлтые акценты
  push(12, Y - 11, 1, 2, '6'); push(23, Y - 11, 1, 2, '6');

  // ===== ТАЗ (поверх бёдер — как в FM: пояс закрывает шарниры) =====
  push(9, Y - 22, 18, 6, '1');
  push(10, Y - 21, 16, 4, '2');
  push(16, Y - 21, 4, 4, '6');                             // жёлтый замок таза

  // ===== ТОРС (FM-клин: широкий сверху) =====
  const ty = Y - 34;                                       // верх корпуса
  push(7 + ln, ty, 22, 13, '3');                           // корпус
  push(7 + ln, ty, 22, 2, '5');                            // светлая кромка
  push(7 + ln, ty + 11, 22, 2, '2');                       // нижняя тень
  push(8 + ln, ty + 3, 5, 7, '2');                         // левая панель брони
  push(23 + ln, ty + 3, 5, 7, '2');                        // правая панель брони

  // cockpit-иллюминатор с пилотом (голова+тело = Torso, человек внутри!)
  push(14 + ln, ty + 3, 8, 6, '9');                        // ниша
  push(15 + ln, ty + 4, 6, 4, '8');                        // зелёное стекло
  push(16 + ln, ty + 4, 3, 2, 'D');                        // голова пилота
  push(16 + ln, ty + 6, 3, 2, 'E');                        // комбинезон
  push(15 + ln, ty + 4, 1, 4, '5');                        // блик стекла

  // ===== ГОЛОВНАЯ ЧАСТЬ (встроена в Torso) + V-ГРЕБЕНЬ =====
  push(14 + ln, ty - 6, 8, 6, '4');                        // череп
  push(14 + ln, ty - 6, 8, 1, '5');
  push(15 + ln, ty - 3, 6, 2, pose.visorOff ? '2' : '7');  // Визор (мерцает по кадрам)
  push(17 + ln, ty - 11, 2, 5, '6');                       // центральный шип V
  push(13 + ln, ty - 9, 2, 3, '6');                        // левое перо V
  push(21 + ln, ty - 9, 2, 3, '6');                        // правое перо V

  // ===== НАПЛЕЧНИКИ (плиты поверх корпуса, жёлтая кромка) =====
  push(2 + ln, ty - 1, 6, 9, '2');
  push(2 + ln, ty - 1, 6, 2, '6');
  push(28 + ln, ty - 1, 6, 9, '2');
  push(28 + ln, ty - 1, 6, 2, '6');

  // ===== РУКИ + СТВОЛЫ (правая стреляет вперёд-вправо) =====
  const rec = pose.rec || 0;
  push(3 + ln, ty + 8, 4, 8, '1');                         // левая рука (предплечье)
  push(29 + ln, ty + 8, 4, 8, '1');                        // правая рука
  push(31 + ln - rec, ty + 10, 5, 2, '4');                 // кисть-основа ствола
  push(34 + ln - rec, ty + 10, 2, 1, '9');                 // ствол
  push(35 + ln - rec, ty + 9, 1, 3, '9');                  // дульная насадка
  // левый ствол смотрит назад-влево (зеркалится вместе со всем спрайтом у врагов)
  push(0 + ln, ty + 11, 4, 2, '4');
  push(0 + ln, ty + 11, 1, 2, '9');

  // ===== РАНЦ (back pack: контейнеры ракет ЗА спиной — рисуем до ног, перекрываются) =====
  // (порядок слоёв важнее цвета: ранец физически дальше камеры)

  // ===== ВСПЫШКА ВЫСТРЕЛА (muzzle flash, кадр fire) =====
  if (pose.muzzle) {
    push(36 - rec, ty + 7, 4, 5, 'C');
    push(36 - rec, ty + 8, 3, 3, '6');
    push(37 - rec, ty + 9, 2, 1, 'B');
  }
  return R;
}

// ---------- Рендер слоя-конструктора в маску индексов палитры ----------
function renderFrame(pose) {
  const buf = new Uint8Array(SW * SH); // 0 = transparent
  const rects = [];
  // сначала ранец (задний слой), затем всё остальное поверх
  const ty0 = 44 + (pose.bob || 0) - 34;
  const ln0 = pose.lean || 0;
  rects.push([6 + ln0, ty0 - 10, 4, 6, '2'], [6 + ln0, ty0 - 11, 4, 1, 'A'],
             [26 + ln0, ty0 - 10, 4, 6, '2'], [26 + ln0, ty0 - 11, 4, 1, 'A'],
             [8 + ln0, ty0 - 12, 20, 2, '1']);
  for (const r of rects.concat(rectsFor(pose))) {
    const [x, y, w, h, c] = r;
    const idx = SYM.indexOf(c);
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        if (xx < 0 || yy < 0 || xx >= SW || yy >= SH) continue;
        buf[yy * SW + xx] = idx;
      }
  }
  return buf;
}

// ---------- Позицы анимаций ----------
// IDLE: лёгкое дыхание (bob) + микронаклон + мерцание визора
const IDLE_POSES = [
  { bob: 0, lean: 0, visorOff: false },
  { bob: -1, lean: 0, visorOff: false },
  { bob: -1, lean: 1, visorOff: true },
  { bob: 0, lean: 0, visorOff: false },
];
// WALK: боевой шаг — ноги по очереди поднимаются, корпус покачивается в такт
const WALK_POSES = [
  { bob: 0,  legF: 1, legB: 0 },
  { bob: -1, legF: 1, legB: 0 },
  { bob: 0,  legF: 0, legB: 0 },
  { bob: 0,  legF: 0, legB: 1 },
  { bob: -1, legF: 0, legB: 1 },
  { bob: 0,  legF: 0, legB: 0 },
];
// FIRE: отдача + вспышка (дуло дёргается вперёд-назад)
const FIRE_POSES = [
  { bob: 0, rec: -1, muzzle: true },
  { bob: 0, rec: 3,  muzzle: true },
  { bob: -1, rec: 1, muzzle: false },
];

// ---------- Сборка спрайт-листов (base64, формат экспорта spritepaint) ----------
function encodeFrames(poses) {
  const frames = poses.map(p => Array.from(renderFrame(p)));
  return btoa(JSON.stringify({ w: SW, h: SH, fw: frames.length, pal: PAL.join(','), f: frames }));
}

const SPRITEPAINT_EXPORT = {
  name: 'WANZER_MK1', fps: 9,
  sheet: {
    idle: { cols: IDLE_POSES.length, rows: 1, data: null },
    walk: { cols: WALK_POSES.length, rows: 1, data: null },
    fire: { cols: FIRE_POSES.length, rows: 1, data: null },
  },
};
(function buildSheets() {
  for (const [k, v] of Object.entries(SPRITEPAINT_EXPORT.sheet)) {
    const poses = k === 'idle' ? IDLE_POSES : k === 'walk' ? WALK_POSES : FIRE_POSES;
    v.data = encodeFrames(poses);
  }
})();

// Декодирование base64-листа обратно в кадры (Uint8Array[] + ImageData при отрисовке)
function decodeSheet(b64) {
  const o = JSON.parse(atob(b64));
  return { w: o.w, h: o.h, pal: o.pal.split(','), frames: o.f.map(a => new Uint8Array(a)) };
}

// ---------- Класс анимационного спрайта (как в spritepaint: loop по кадрам) ----------
class PixelAnimator {
  constructor(sheet, fps = 9) {
    this.sheets = {};
    for (const [k, v] of Object.entries(sheet)) this.sheets[k] = decodeSheet(v.data);
    this.cur = 'idle'; this.i = 0; this.acc = Math.random(); this.fps = fps; // рассинхрон юнитов
    this.oneShot = false; this.doneCb = null;
    this._canv = {}; // кэш canvas'ов: key = anim:frame:tint
  }
  play(name, { once = false, cb = null } = {}) {
    if (!this.sheets[name]) return;
    if (this.cur === name && !once) return;
    this.cur = name; this.i = 0; this.acc = 0; this.oneShot = once; this.doneCb = cb;
  }
  update(dt) {
    const s = this.sheets[this.cur]; if (!s) return;
    this.acc += dt * this.fps;
    while (this.acc >= 1) {
      this.acc -= 1; this.i++;
      if (this.i >= s.frames.length) {
        if (this.oneShot) { this.i = s.frames.length - 1;
          const cb = this.doneCb; this.doneCb = null; if (cb) cb();
          this.play('idle');
        } else this.i = 0;
      }
    }
  }
  // Кадры рисуются «лицом вправо»; mirror=true — для врагов (лицом влево)
  draw(ctx, cx, cyBase, scale = 1, mirror = false, tint = null) {
    const s = this.sheets[this.cur]; if (!s) return;
    const fi = Math.min(this.i, s.frames.length - 1);
    const key = this.cur + ':' + fi + ':' + (tint || '-');
    let cv = this._canv[key];
    if (!cv) {
      // ImageData из маски индексов палитры
      const img = new ImageData(s.w, s.h);
      const fr = s.frames[fi];
      for (let i = 0; i < fr.length; i++) {
        const hex = s.pal[fr[i]];
        if (hex.startsWith('rgba')) continue; // прозрачный пиксель
        let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        if (tint === 'red')  { r = Math.min(255, r + 80); g = Math.max(0, g - 35); b = Math.max(0, b - 35); }
        if (tint === 'blue') { b = Math.min(255, b + 80); r = Math.max(0, r - 35); }
        if (tint === 'dark') { r = Math.round(r * .62); g = Math.round(g * .62); b = Math.round(b * .68); }
        const o = i * 4; img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
      }
      cv = document.createElement('canvas'); cv.width = s.w; cv.height = s.h;
      cv.getContext('2d').putImageData(img, 0, 0);
      this._canv[key] = cv;
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(cx), Math.round(cyBase));
    if (mirror) ctx.scale(-scale, scale); else ctx.scale(scale, scale);
    // якорь: центр по X, подошвы (кадр высотой SH, ноги заканчиваются на y=SH-4) у cyBase
    ctx.drawImage(cv, -Math.round(s.w / 2), -(s.h - 4));
    ctx.restore();
  }
}

// ---------- Демо-страница: превью всех анимаций + экспорт spritepaint ----------
if (typeof document !== 'undefined' && document.getElementById('sp-preview')) {
  (function demo() {
    const sheet = SPRITEPAINT_EXPORT.sheet;
    const box = document.getElementById('sp-preview');
    const names = { idle: 'IDLE — стойка (дыхание + визор)', walk: 'WALK — боевой шаг', fire: 'FIRE — выстрел (отдача + вспышка)' };
    for (const anim of ['idle', 'walk', 'fire']) {
      const wrap = document.createElement('div'); wrap.className = 'sp-cell';
      const cap = document.createElement('div'); cap.textContent = names[anim];
      const cv = document.createElement('canvas'); cv.width = SW * 3; cv.height = SH * 3;
      cv.style.width = (SW * 3) + 'px'; cv.style.height = (SH * 3) + 'px';
      const a = new PixelAnimator({ [anim]: sheet[anim] }, anim === 'fire' ? 5 : 9);
      a.play(anim);
      wrap.append(cap, cv); box.append(wrap);
      let last = performance.now();
      (function tick(now) { const dt = (now - last) / 1000; last = now; a.update(dt);
        const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height);
        a.draw(ctx, SW * 1.5, SH * 3 - 6, 3, false, null);
        a.draw(ctx, SW * 4.5, SH * 3 - 6, 3, true, 'dark');   // зеркальный вражеский
        requestAnimationFrame(tick); })(performance.now());
    }
    // JSON-экспорт листов (base64 кадры + палитра) — можно скачать/вставить в spritepaint-подобный редактор
    const dl = document.createElement('a'); dl.id = 'sp-export';
    dl.href = URL.createObjectURL(new Blob([JSON.stringify(SPRITEPAINT_EXPORT)], { type: 'application/json' }));
    dl.download = 'wanzer_spritepaint.json'; dl.textContent = '⬇ Скачать спрайт-лист (JSON/base64)';
    document.getElementById('sp-actions').append(dl);
  })();
}

// Глобальный экспорт для game.js / index.html
window.SPRITEPAINT = { export: SPRITEPAINT_EXPORT, PixelAnimator, SW, SH };
