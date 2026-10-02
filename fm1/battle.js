'use strict';
/* ============================================================
 * battle.js — класс Battle: пошаговый бой 1v1 на сетке 8x8.
 * Действия игрока: MOVE / ATTACK / WAIT. Простой ИИ врага.
 * Canvas рисует поле; HTML-панели (game.js) — меню и лог.
 * ============================================================ */

const GRID = 8;

class Battle {
  /**
   * @param {Mech} player
   * @param {Mech} enemy
   * @param {Function} onEnd(result:'win'|'lose')
   * @param {Object} ui ссылки на DOM-элементы боевого UI
   */
  constructor(player, enemy, onEnd, ui){
    this.player = player; this.enemy = enemy;
    this.onEnd = onEnd; this.ui = ui;
    this.turn = 'player';           // 'player' | 'enemy'
    this.phase = 'order';           // order | movePick | attackPick | anim | over
    this.moveLeft = 0;
    this.logLines = [];
    this.fx = [];                   // эффекты: [{type:'shot'|'boom', ...}]
    this.hoverCell = null;
    this.cellPx = 34;               // пересчитывается в draw
    this.originX = 0; this.originY = 0;

    // Расстановка: игрок слева, враг справа
    player.x = 1; player.y = 5; player.facing = 1;
    enemy.x = 6;  enemy.y = 2;  enemy.facing = -1;

    this.addLog(`${enemy.name} ENGAGED!`);
    this.addLog('YOUR TURN — SELECT ORDER');
  }

  /* ---------- ВВОД (вызывается из game.js) ---------- */
  click(cx, cy, right){
    if (this.phase === 'movePick'){
      if (right || (cx===this.player.x && cy===this.player.y)){
        this.phase='order'; this.moveLeft=0; this.refreshUI(); return;
      }
      if (this.inMoveRange(cx,cy)){
        const steps = this.pathCost(this.player.x,this.player.y,cx,cy);
        if (steps <= this.moveLeft){
          this.player.x=cx; this.player.y=cy;
          this.moveLeft -= steps;
          this.addLog(`MOVED (${cx},${cy}) LEFT:${this.moveLeft}`);
          // остаёмся в movePick для нескольких шагов? Нет: 1 приказ = 1 движение
          this.phase='order'; this.refreshUI();
        }
      } else {
        this.addLog('CELL NOT IN RANGE');
      }
      return;
    }
    if (this.phase === 'attackPick'){
      if (right){ this.phase='order'; this.refreshUI(); return; }
      if (cx===this.enemy.x && cy===this.enemy.y){
        this.doPlayerAttack();
      }
      return;
    }
  }

  chooseOrder(act){
    if (this.turn!=='player' || this.phase!=='order') return;
    if (act==='move'){
      this.moveLeft = this.player.stats.move;
      if (this.moveLeft<=0){ this.addLog('NO MOVE LEFT'); return; }
      this.phase='movePick';
      this.addLog(`PICK CELL (MAX ${this.moveLeft})`);
    } else if (act==='attack'){
      const d = this.dist(this.player,this.enemy);
      const ok = this.player.weaponsInRange(d);
      if (!ok.length){ this.addLog('TARGET OUT OF RANGE / NO AMMO'); return; }
      this.phase='attackPick';
      this.addLog('CONFIRM TARGET');
    } else if (act==='wait'){
      this.endPlayerTurn();
    }
    this.refreshUI();
  }

  /* ---------- ХОД АТАКИ ИГРОКА ---------- */
  doPlayerAttack(){
    const d = this.dist(this.player,this.enemy);
    const slots = this.player.weaponsInRange(d);
    // залп: стреляет каждое доступное оружие (как в FM — по очереди)
    for (const s of slots){
      const wpn=this.player.loadout[s].weapon;
      const hitChance = Math.max(10, Math.min(95, this.player.stats.acc + (3-d)*4 - this.enemy.stats.eva));
      const hit = Math.random()*100 < hitChance;
      this.player.ammo[s]--;
      this.spawnFx('shot', this.player, this.enemy);
      if (hit){
        // выбор случайной живой детали цели
        const parts=SLOTS.filter(x=>this.enemy.partHP[x]>0);
        const targetSlot = parts[Math.floor(Math.random()*parts.length)];
        const tdf = this.enemy.loadout[targetSlot].df;
        const dmg = Math.max(1, Math.round(wpn.at - tdf/2));
        this.enemy.partHP[targetSlot] -= dmg;
        this.spawnFx('boom', this.enemy, null);
        this.addLog(`${s.toUpperCase()} HIT ${targetSlot.toUpperCase()} -${dmg}`);
      } else {
        this.addLog(`${s.toUpperCase()} MISS`);
      }
    }
    if (this.enemy.hpNow<=0) return this.finish('win');
    this.endPlayerTurn();
  }

  endPlayerTurn(){
    this.phase='anim';
    setTimeout(()=>{ this.enemyTurn(); }, 500);
  }

  /* ---------- ИИ ВРАГА (очень простой) ---------- */
  enemyTurn(){
    this.turn='enemy';
    this.addLog(`${this.enemy.name} TURN...`);
    this.refreshUI();
    setTimeout(()=>{
      const d = this.dist(this.player,this.enemy);
      const ok = this.enemy.weaponsInRange(d);
      if (ok.length && Math.random()<0.8){
        // атака
        for (const s of ok){
          const wpn=this.enemy.loadout[s].weapon;
          const chance=Math.max(10,Math.min(90,this.enemy.stats.acc+(3-d)*3-this.player.stats.eva));
          this.enemy.ammo[s]--;
          this.spawnFx('shot', this.enemy, this.player);
          if (Math.random()*100<chance){
            const parts=SLOTS.filter(x=>this.player.partHP[x]>0);
            const ts=parts[Math.floor(Math.random()*parts.length)];
            const dmg=Math.max(1,Math.round(wpn.at - this.player.loadout[ts].df/2));
            this.player.partHP[ts]-=dmg;
            this.spawnFx('boom', this.player,null);
            this.addLog(`E.${s.toUpperCase()} HIT ${ts.toUpperCase()} -${dmg}`);
          } else this.addLog(`E.${s.toUpperCase()} MISS`);
        }
        if (this.player.hpNow<=0) return this.finish('lose');
      } else {
        // сблизиться к клетке рядом с игроком (жадно, без поиска пути)
        const mv=this.enemy.stats.move; let moved=0;
        while(moved<mv){
          const dx=Math.sign(this.player.x-this.enemy.x);
          const dy=Math.sign(this.player.y-this.enemy.y);
          if(dx===0&&dy===0) break;
          let nx=this.enemy.x+dx, ny=this.enemy.y+dy;
          if(nx===this.player.x&&ny===this.player.y){ if(dy!==0){nx=this.enemy.x;}else{break;} }
          this.enemy.x=nx; this.enemy.y=ny; moved++;
          if(this.dist(this.player,this.enemy)<=Math.max(2,this.enemy.baseStats.maxRange-1)) break;
        }
        if(moved) this.addLog(`${this.enemy.name} ADVANCED`);
      }
      this.turn='player'; this.phase='order';
      this.addLog('YOUR TURN');
      this.refreshUI();
    }, 700);
  }

  finish(result){
    this.phase='over';
    this.addLog(result==='win'?'ENEMY DESTROYED!':'MECH DISABLED...');
    this.refreshUI();
    setTimeout(()=>this.onEnd(result), 900);
  }

  /* ---------- УТИЛИТИ ---------- */
  dist(a,b){ return Math.max(Math.abs(a.x-b.x), Math.abs(a.y-b.y)); } // chessboard
  inMoveRange(cx,cy){
    if (cx===this.player.x&&cy===this.player.y) return false;
    if (cx===this.enemy.x&&cy===this.enemy.y) return false;
    return this.pathCost(this.player.x,this.player.y,cx,cy)<=this.moveLeft;
  }
  pathCost(x0,y0,x1,y1){ return Math.max(Math.abs(x1-x0),Math.abs(y1-y0)); }

  addLog(t){ this.logLines.unshift(t); if(this.logLines.length>5)this.logLines.pop(); }

  spawnFx(type, from, to){
    if(type==='shot'&&to){
      this.fx.push({type,x1:this.cellCX(from),y1:this.cellCY(from)-20,
                    x2:this.cellCX(to),y2:this.cellCY(to)-20,t:0});
    } else if(type==='boom'){
      this.fx.push({type,x:this.cellCX(from),y:this.cellCY(from)-22,t:0});
    }
  }
  cellCX(m){ return this.originX+m.x*this.cellPx+this.cellPx/2; }
  cellCY(m){ return this.originY+m.y*this.cellPx+this.cellPx/2; }

  refreshUI(){
    const u=this.ui;
    if(!u) return;
    u.turnBanner.textContent = this.turn==='player'?'PLAYER TURN':`${this.enemy.name}`;
    u.turnBanner.classList.toggle('enemy', this.turn!=='player');
    u.actionMenu.hidden = !(this.turn==='player'&&this.phase==='order');
    u.targetHint.hidden = !(this.phase==='movePick'||this.phase==='attackPick');
    u.battleLog.innerHTML = this.logLines.map(l=>`<div>▸ ${l}</div>`).join('');
    const e=this.enemy, p=this.player;
    u.enemyInfo.innerHTML =
      `<b>${e.name}</b><br>HP ${e.hpNow}/${e.baseStats.hpMax}<br>`+
      `AT ${e.stats.at} · DF ${e.stats.df}<br>MOVE ${e.stats.move} · RNG ${e.baseStats.maxRange}<br>`+
      `<span style="color:#8fa">YOU: HP ${p.hpNow}/${p.baseStats.hpMax} · MV ${this.moveLeft||p.stats.move}</span>`;
  }

  /* ---------- ОТРИСОВКА ПОЛЯ ---------- */
  draw(ctx, W, H){
    // фон поля — индустриальный пол ангара
    ctx.fillStyle='#141a22'; ctx.fillRect(0,0,W,H);

    // адаптивная клетка
    this.cellPx = Math.floor(Math.min((W-40)/GRID,(H-70)/GRID));
    this.originX = Math.floor((W-this.cellPx*GRID)/2);
    this.originY = Math.floor((H-this.cellPx*GRID)/2)+10;

    // жёлто-чёрные предупреждающие полосы сверху/снизу поля
    for(let i=-1;i<GRID+2;i++){
      ctx.fillStyle = i%2? '#c9a227':'#161616';
      ctx.fillRect(this.originX+i*this.cellPx, this.originY-8, this.cellPx, 8);
      ctx.fillRect(this.originX+i*this.cellPx, this.originY+GRID*this.cellPx, this.cellPx, 8);
    }

    // клетки
    for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
      const px=this.originX+x*this.cellPx, py=this.originY+y*this.cellPx;
      ctx.fillStyle=(x+y)%2?'#1b2430':'#171f29';
      ctx.fillRect(px,py,this.cellPx,this.cellPx);
      ctx.strokeStyle='#26313f'; ctx.lineWidth=1;
      ctx.strokeRect(px+.5,py+.5,this.cellPx-1,this.cellPx-1);
    }

    // подсветка диапазона движения
    if(this.phase==='movePick'){
      for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
        if(this.inMoveRange(x,y)){
          ctx.fillStyle='rgba(90,160,255,.28)';
          ctx.fillRect(this.originX+x*this.cellPx+1,this.originY+y*this.cellPx+1,this.cellPx-2,this.cellPx-2);
        }
      }
    }
    // подсветка дальности атаки
    if(this.phase==='attackPick'){
      const d=this.dist(this.player,this.enemy);
      ctx.fillStyle = this.player.weaponsInRange(d).length ? 'rgba(255,80,60,.25)' : 'rgba(120,120,120,.2)';
      ctx.fillRect(this.originX+this.enemy.x*this.cellPx+1,this.originY+this.enemy.y*this.cellPx+1,this.cellPx-2,this.cellPx-2);
    }
    // курсор
    if(this.hoverCell){
      ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2;
      ctx.strokeRect(this.originX+this.hoverCell.x*this.cellPx+1.5,this.originY+this.hoverCell.y*this.cellPx+1.5,this.cellPx-3,this.cellPx-3);
    }

    // мехи (сортировка по y для порядка отрисовки)
    const ms=[this.enemy,this.player].sort((a,b)=>a.y-b.y);
    for(const m of ms) m.draw(ctx, this.cellCX(m), this.originY+m.y*this.cellPx+this.cellPx-3, this.cellPx);

    // HP-бары над мехами
    this.bar(ctx,this.cellCX(this.player), this.originY+this.player.y*this.cellPx-this.cellPx*0.9, this.player,'#5ad06a');
    this.bar(ctx,this.cellCX(this.enemy),  this.originY+this.enemy.y*this.cellPx-this.cellPx*0.9, this.enemy,'#ff6b5e');

    // эффекты
    this.fx=this.fx.filter(fx=>{
      fx.t+=1/60;
      if(fx.type==='shot'){
        const k=Math.min(1,fx.t/0.25);
        ctx.strokeStyle='#ffe97a'; ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(fx.x1,fx.y1);
        ctx.lineTo(fx.x1+(fx.x2-fx.x1)*k, fx.y1+(fx.y2-fx.y1)*k);
        ctx.stroke();
        return fx.t<0.3;
      }
      if(fx.type==='boom'){
        const r=fx.t*40;
        ctx.fillStyle=`rgba(255,140,40,${Math.max(0,1-fx.t*3)})`;
        ctx.fillRect(fx.x-r/2,fx.y-r/2,r,r);
        ctx.fillStyle=`rgba(255,255,120,${Math.max(0,1-fx.t*4)})`;
        ctx.fillRect(fx.x-r/4,fx.y-r/4,r/2,r/2);
        return fx.t<0.35;
      }
      return false;
    });
  }
  bar(ctx,x,y,m,color){
    const w=this.cellPx*1.2, h=4;
    const ratio=Math.max(0,m.hpNow/m.baseStats.hpMax);
    ctx.fillStyle='#000'; ctx.fillRect(x-w/2-1,y-1,w+2,h+2);
    ctx.fillStyle='#3a1010'; ctx.fillRect(x-w/2,y,w,h);
    ctx.fillStyle=color; ctx.fillRect(x-w/2,y,w*ratio,h);
  }
}
