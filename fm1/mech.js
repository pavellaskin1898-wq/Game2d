'use strict';
/* ============================================================
 * mech.js — класс Part, класс Mech (статы+спрайт) и пиксельный
 * рендер меха. Спрайт собирается процедурно из "пиксельных"
 * прямоугольников: силуэт в стиле Front Mission (модульный).
 * ============================================================ */

class Part {
  constructor(data){ Object.assign(this, data); }
  get isArmed(){ return !!this.weapon; }
}

class Mech {
  /**
   * @param {Object} opts { loadout:[ids], tint, name, facing:-1|1 }
   */
  constructor(opts){
    this.name = opts.name || 'MECH';
    this.tint = opts.tint || '#cfd8e3';   // основной цвет брони
    this.facing = opts.facing || 1;        // 1 вправо, -1 влево
    this.loadout = {};                     // slot -> Part
    for (const id of opts.loadout) {
      const p = new Part(partById(id));
      this.loadout[p.slot] = p;
    }
    this.recalc();
    // HP деталей инициализируются после расчёта
    this.partHP = {};
    for (const s of SLOTS) this.partHP[s] = this.loadout[s].hp;
    this.ammo = {};                        // slot -> остаток боеприпасов
    for (const s of SLOTS){
      const p = this.loadout[s];
      if (p.isArmed) this.ammo[s] = p.weapon.ammo;
    }
    this.x = 0; this.y = 0;                // позиция на тактической сетке
  }

  /** Пересчёт итоговых статов из деталей */
  recalc(){
    let hp=0, df=0, weight=0, acc=65, eva=4, move=2, at=0, maxRange=0, maxLoad=0;
    for (const s of SLOTS){
      const p = this.loadout[s];
      hp += p.hp; df += p.df; weight += p.w;
      acc += p.acc||0; eva += p.eva||0; move += p.move||0;
      if (p.maxLoad) maxLoad = p.maxLoad;
      if (p.isArmed){ at += p.weapon.at; maxRange = Math.max(maxRange, p.weapon.rng); }
    }
    this.baseStats = { hpMax:hp, df, weight, acc, eva, moveBase:move, at, maxRange, maxLoad };
    // Формула скорости: базовая минус штраф за перегрузку (weight/maxLoad)
    const overload = maxLoad > 0 ? weight / maxLoad : 1;
    this.speedFactor = Math.max(0.3, 1.15 - overload * 0.55); // 1.0 при норме
    this.stats = {
      hpMax: hp,
      df,
      weight,
      at,
      range: maxRange,
      move: Math.max(1, Math.round(move * this.speedFactor)),
      acc: Math.min(95, Math.round(acc * (overload>1 ? 0.75 : 1))),
      eva: Math.max(0, Math.round(eva * this.speedFactor)),
    };
  }

  get alive(){ return this.hpNow > 0; }
  get hpNow(){
    let h=0; for (const s of SLOTS) h += Math.max(0, this.partHP[s]); return h;
  }
  /** Общий % разрушений для затемнения спрайта */
  get dmgRatio(){
    return 1 - this.hpNow / this.baseStats.hpMax;
  }

  /** Все руки с патронами и нужной дальностью до цели */
  weaponsInRange(dist){
    const out=[];
    for (const s of ['armR','armL']){
      const p=this.loadout[s];
      if (p && p.isArmed && this.ammo[s]>0 && this.partHP[s]>0 && dist<=p.weapon.rng)
        out.push(s);
    }
    return out;
  }

  /** Урон по слоту цели (AT оружия минус DF/2 детали) */
  rollDamage(slotName, targetPartSlot){
    const p=this.loadout[slotName];
    const tp=targetPartSlot ? this.loadout[targetPartSlot] : null;
    const tdf = targetPartSlot ? targetPartSlot.df : 0;
    return Math.max(1, Math.round(p.weapon.at - tdf/2));
  }

  /* ---------- ПИКСЕЛЬНЫЙ РЕНДЕР ---------- */
  /**
   * Рисует мех в точке (px,py) — центр "ног". scale — размер клетки.
   * style: 'player' | 'enemy'. Использует только fillRect => pixel-perfect.
   */
  draw(ctx, px, py, cell){
    const f = this.facing;
    const dmg = this.dmgRatio;
    // Палитра: броня, тень, акцент (жёлтый), потёмки от повреждений
    const A = shade(this.tint, -dmg*0.45);
    const body   = A;
    const dark   = shade(A, -0.28);
    const light  = shade(A,  0.22);
    const yellow = dmg>0.6 ? '#8a6a20' : '#ffd23f';
    const visor  = dmg>0.8 ? '#552222' : '#ffec6b';
    const gun    = '#39424f';
    const gunLt  = '#5c6a7d';

    const u = cell/16;                 // "пиксель" относительно клетки
    const R = (x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(Math.round(px+x*u), Math.round(py+y*u), Math.ceil(w*u), Math.ceil(h*u)); };
    // зеркалим X если facing=-1
    const X = x => f===1 ? x : (-x-1);

    const tierOf = s => this.loadout[s] ? this.loadout[s].tier : 'M';

    /* --- НОГИ --- */
    const lt = tierOf('legs');
    const legH = lt==='L'?9 : lt==='M'?10 : 8;
    const legW = lt==='H'?4 : 3;
    // таз
    R(X(-4),-legH-3, 9,3, dark);
    // левая нога (задняя)
    R(X(-4),-legH, 3,legH, dark);
    R(X(-4),-1, 3+ (lt==='H'?1:0),1, '#222');
    // правая нога (передняя)
    R(X(1),-legH, legW,legH, body);
    R(X(1),-legH, 1,legH, light);
    R(X(1),-1, legW+(lt==='H'?1:0),1, '#111');
    if(lt==='H'){ R(X(0),-legH, 1,legH, yellow); } // гусеничная кромка

    /* --- КОРПУС --- */
    const bt = tierOf('body');
    const bw = bt==='L'?8 : bt==='M'?10 : 13;
    const bh = bt==='L'?8 : bt==='M'?9 : 11;
    const by = -legH-bh-2;
    R(X(-bw/2|0),by, bw,bh, body);
    R(X(-bw/2|0),by, bw,2, light);                       // верхняя плита
    R(X(-(bw/2|0)+1),by+bh-3, bw-2,2, dark);             // низ
    // кабина пилота (иллюминатор) — как в FM: маленькое окно
    R(X(-1),by+2, 3,3, '#1c2b3a');
    R(X(-1),by+2, 3,1, '#3f6b8f');
    R(X(0),by+3, 1,1, '#cfe9ff');                         // силуэт пилота
    if(bt==='H'){ R(X(-bw/2|0),by, 1,bh, yellow); R(X(bw/2|0)-1,by,1,bh,yellow); }
    if(bt==='M'){ R(X(-bw/2|0)+1,by+bh-1, bw-2,1, yellow); }

    /* --- НАПЛЕЧНИКИ + РУКИ --- */
    const drawArm=(slot, sx, sy)=>{
      const p=this.loadout[slot]; if(!p) return;
      const t=p.tier;
      const pw = t==='L'?4 : t==='M'?5 : 7;
      const ph = t==='L'?4 : t==='M'?5 : 6;
      // наплечник
      R(X(sx-pw/2|0), sy-ph, pw, ph, t==='H'?dark:body);
      R(X(sx-pw/2|0), sy-ph, pw, 1, light);
      if(t!=='L') R(X(sx-pw/2|0)+1, sy-2, pw-2,1, yellow);
      // предплечье
      R(X(sx-1), sy, 3, 6, dark);
      // оружие вместо кисти
      if(p.isArmed){
        const gl = t==='L'?5 : t==='M'?7 : 9;
        R(X(sx), sy+5, gl, 2, gun);
        R(X(sx), sy+5, gl, 1, gunLt);
        R(X(sx)+ (f===1?gl-1:0)*1, sy+5, 1,2, '#111');       // дуло
        const left = this.ammo[slot]||0;
        if(left===0) R(X(sx), sy+3, 2,2, '#a33');            // индикатор "пусто"
      } else {
        R(X(sx-1), sy+6, 3,2, gunLt);                        // кисть
      }
    };
    const shoulderY = by+1;
    drawArm('armL', -(bw/2|0)-2, shoulderY);
    drawArm('armR',  (bw/2|0)+2, shoulderY);

    /* --- ГОЛОВА --- */
    const ht = tierOf('head');
    const hw = ht==='L'?4 : ht==='M'?5 : 7;
    const hh = ht==='L'?3 : ht==='M'?4 : 5;
    const hy = by-hh-1;
    R(X(-hw/2|0),hy, hw,hh, body);
    R(X(-hw/2|0),hy, hw,1, light);
    // визор
    R(X(f===1?0:-hw/2|0+0), hy+1, Math.max(2,hw-2),1, visor);
    if(ht==='H'){ R(X(-hw/2|0)-1,hy+hh-1, hw+2,1, dark); }   // "корона"
    // антенна у лёгкой разведголовы
    if(ht==='L'){ R(X(1),hy-3,1,3,'#9fb'); }

    /* --- повреждения: трещины --- */
    if(dmg>0.3){
      ctx.fillStyle='#1a1a1a';
      for(let i=0;i<Math.floor(dmg*8);i++){
        const rx = px + (((i*53)%17)-8)*u, ry = py + (((i*37)%19)-legH-bh)*u;
        ctx.fillRect(rx|0, ry|0, u|0||1, (2*u)|0||2);
      }
    }
    // тень под мехом
    ctx.fillStyle='rgba(0,0,0,.45)';
    ctx.fillRect(Math.round(px-6*u), Math.round(py), 12*u, Math.max(2,u));
  }
}

/* Затемнение/осветление hex-цвета на k (-1..1) */
function shade(hex,k){
  const n=parseInt(hex.slice(1),16);
  let r=n>>16, g=(n>>8)&255, b=n&255;
  const f=v=>Math.max(0,Math.min(255, Math.round(v + (k>0?(255-v)*k:v*k))));
  r=f(r);g=f(g);b=f(b);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
