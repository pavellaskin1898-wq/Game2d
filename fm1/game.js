'use strict';
/* ============================================================
 * game.js — класс Game + GameState: экраны HANGAR / BATTLE,
 * фоновая отрисовка ангара на canvas, HTML-панели кастомизации,
 * прогрессия (кредиты, разблокировки тяжёлого комплекта).
 * ============================================================ */

const W = 640, H = 360;   // внутреннее разрешение холста

class GameState {
  constructor(){
    this.screen = 'hangar';           // hangar | battle | result
    this.credits = 0;
    this.wins = 0;                    // число побед -> индекс награды
    this.unlocked = new Set(PART_DB.filter(p=>p.unlocked).map(p=>p.id));
    this.loadout = {                  // стартовая сборка игрока
      head:'head-M', armR:'armR-M', armL:'armL-L', body:'body-M', legs:'legs-M',
    };
    this.selectedSlot = null;         // выбранный слот в SELECT PARTS
    this.hoverPart = null;            // деталь под курсором для карточки
  }
}

class Game {
  constructor(){
    this.state = new GameState();
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;   // pixel-perfect!

    // ссылки на DOM
    this.dom = {
      hangarUI: document.getElementById('hangarUI'),
      battleUI: document.getElementById('battleUI'),
      resultUI: document.getElementById('resultUI'),
      slotList: document.getElementById('slotList'),
      statusTable: document.getElementById('statusTable'),
      partDetail: document.getElementById('partDetail'),
      btnBattle: document.getElementById('btnBattle'),
      actionMenu: document.getElementById('actionMenu'),
      turnBanner: document.getElementById('turnBanner'),
      enemyInfo: document.getElementById('enemyInfo'),
      battleLog: document.getElementById('battleLog'),
      targetHint: document.getElementById('targetHint'),
      resultTitle: document.getElementById('resultTitle'),
      resultReward: document.getElementById('resultReward'),
    };

    this.playerMech = this.buildPlayerMech();
    this.battle = null;
    this.time = 0;

    this.bindEvents();
    this.renderHangarUI();
    requestAnimationFrame(t=>this.loop(t));
  }

  /* ---------- СБОРКА МЕХА ИГРОКА ИЗ LOADOUT ---------- */
  buildPlayerMech(){
    return new Mech({
      loadout: Object.values(this.state.loadout),
      tint:'#cfd8e3', name:'PLAYER MECH', facing:1,
    });
  }

  /* ---------- СОБЫТИЯ ---------- */
  bindEvents(){
    this.dom.btnBattle.addEventListener('click', ()=>this.startBattle());
    document.getElementById('btnResultOk').addEventListener('click', ()=>this.toHangar());
    document.getElementById('btnPilot').addEventListener('click', ()=>{
      this.logToast('PILOT ROOM: TODO IN NEXT BUILD');
    });

    this.dom.actionMenu.querySelectorAll('.act-btn').forEach(b=>{
      b.addEventListener('click', ()=>this.battle && this.battle.chooseOrder(b.dataset.act));
    });

    // ввод по canvas: перевод экранных координат во внутренние 640x360
    const toCanvas = e=>{
      const r=this.canvas.getBoundingClientRect();
      // offsetX/offsetY — координаты внутри элемента; + запасной пересчёт через rect
      let ox = (e.offsetX!=null && e.target===this.canvas) ? e.offsetX : null;
      let oy = (e.offsetY!=null && e.target===this.canvas) ? e.offsetY : null;
      if(ox==null){ ox=e.clientX-r.left; oy=e.clientY-r.top; }
      return { x:ox*W/r.width, y:oy*H/r.height };
    };
    this.canvas.addEventListener('mousemove', e=>{
      if(this.battle){
        const p=toCanvas(e);
        const cx=Math.floor((p.x-this.battle.originX)/this.battle.cellPx);
        const cy=Math.floor((p.y-this.battle.originY)/this.battle.cellPx);
        this.battle.hoverCell = (cx>=0&&cx<GRID&&cy>=0&&cy<GRID)?{x:cx,y:cy}:null;
      }
    });
    this.canvas.addEventListener('contextmenu', e=>{
      e.preventDefault();
      if(this.battle){ const hc=this.battle.hoverCell; if(hc) this.battle.click(hc.x,hc.y,true); }
    });
    this.canvas.addEventListener('click', e=>{
      if(this.state.screen==='battle'&&this.battle){
        const p=toCanvas(e);
        const cx=Math.floor((p.x-this.battle.originX)/this.battle.cellPx);
        const cy=Math.floor((p.y-this.battle.originY)/this.battle.cellPx);
        if(cx>=0&&cx<GRID&&cy>=0&&cy<GRID) this.battle.click(cx,cy,false);
      } else if(this.state.screen==='hangar'){
        // клик по меху в ангаре = выбрать соответствующий слот (по зоне)
        this.pickSlotByHangarClick(toCanvas(e));
      }
    });
    window.addEventListener('keydown', e=>{
      if(e.key==='Escape'){
        if(this.battle&&(this.battle.phase==='movePick'||this.battle.phase==='attackPick')){
          this.battle.phase='order'; this.battle.refreshUI();
        } else this.dom.partDetail.hidden=true, this.state.selectedSlot=null, this.renderHangarUI();
      }
      if(this.state.screen==='battle'&&this.battle&&this.battle.phase==='order'){
        if(e.key==='1') this.battle.chooseOrder('move');
        if(e.key==='2') this.battle.chooseOrder('attack');
        if(e.key==='3') this.battle.chooseOrder('wait');
      }
    });
  }

  // зоны клика по меху в ангаре (в координатах 640x360)
  pickSlotByHangarClick(p){
    const zones=[
      {s:'head', x:300,y:126,w:40,h:22},
      {s:'armR', x:346,y:150,w:26,h:52},
      {s:'armL', x:268,y:150,w:26,h:52},
      {s:'body', x:296,y:148,w:48,h:46},
      {s:'legs', x:292,y:196,w:56,h:60},
    ];
    for(const z of zones){
      if(p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h){
        this.state.selectedSlot=z.s; this.renderHangarUI(); return;
      }
    }
  }

  /* ---------- ЭКРАН БОЯ ---------- */
  startBattle(){
    const preset = ENEMY_PRESETS[Math.min(this.state.wins, ENEMY_PRESETS.length-1)];
    const enemy = new Mech({ loadout:preset.loadout, tint:preset.tint, name:preset.label.split('"')[1]||'HOSTILE', facing:-1 });
    // перед боем чиним/пересобираем меха из текущего loadout
    this.playerMech = this.buildPlayerMech();
    this.battle = new Battle(this.playerMech, enemy, res=>this.endBattle(res), {
      turnBanner:this.dom.turnBanner, actionMenu:this.dom.actionMenu,
      enemyInfo:this.dom.enemyInfo, battleLog:this.dom.battleLog, targetHint:this.dom.targetHint,
    });
    this.battle.refreshUI();
    this.state.screen='battle';
    this.dom.hangarUI.hidden=true; this.dom.battleUI.hidden=false; this.dom.resultUI.hidden=true;
  }

  endBattle(result){
    this.state.screen='result';
    this.dom.battleUI.hidden=true; this.dom.resultUI.hidden=false;
    const win = result==='win';
    this.dom.resultTitle.textContent = win?'MISSION COMPLETE':'MECH DESTROYED';
    this.dom.resultTitle.className = 'result-title'+(win?'':' lose');
    let txt='';
    if(win){
      const rw = REWARDS[Math.min(this.state.wins, REWARDS.length-1)];
      this.state.credits += rw.credits;
      rw.unlock.forEach(id=>this.state.unlocked.add(id));
      this.state.wins++;
      txt = `+${rw.credits} CR<br>UNLOCKED: ${rw.unlock.map(id=>partById(id).name).join(', ')||'—'}`;
    } else txt='REPAIRS FREE IN TRAINING.<br>TRY ANOTHER LOADOUT.';
    this.dom.resultReward.innerHTML = txt;
  }

  toHangar(){
    this.state.screen='hangar';
    this.battle=null;
    this.dom.resultUI.hidden=true; this.dom.hangarUI.hidden=false;
    this.renderHangarUI();
  }

  logToast(msg){ this.state.toast=msg; this.state.toastT=this.time; }

  /* ---------- HTML ПАНЕЛИ АНГАРА ---------- */
  renderHangarUI(){
    const st=this.state;
    // SELECT PARTS: строкa слота + 3 кнопки деталей
    this.dom.slotList.innerHTML = SLOTS.map(slot=>{
      const cur=st.loadout[slot];
      const parts=PART_DB.filter(p=>p.slot===slot);
      return `<div class="slot-row">
        <div class="slot-name ${st.selectedSlot===slot?'active':''}" data-slot="${slot}">
          ${SLOT_NAMES[slot]}<br><span style="color:#7fd0ff">${partById(cur).name}</span>
        </div>
        <div class="slot-parts">${parts.map(p=>{
          const unl=st.unlocked.has(p.id);
          return `<button class="pbtn ${cur===p.id?'eq':''} ${unl?'':'locked'}"
            data-part="${p.id}" ${unl?'':'disabled'} title="${TIERS[p.tier].name}">
            ${p.tier}<br>${unl?p.weapon?`${p.weapon.at}AT`:`DF${p.df}`:'???'}</button>`;
        }).join('')}</div>
      </div>`;
    }).join('');

    // делегирование кликов панелей
    this.dom.slotList.onclick = e=>{
      const pb=e.target.closest('[data-part]');
      const sb=e.target.closest('[data-slot]');
      if(pb && !pb.disabled){
        st.loadout[partById(pb.dataset.part).slot]=pb.dataset.part;
        this.playerMech=this.buildPlayerMech();
        this.renderHangarUI(); this.showPartDetail(partById(pb.dataset.part));
      } else if(sb){
        st.selectedSlot = st.selectedSlot===sb.dataset.slot?null:sb.dataset.slot;
        this.renderHangarUI();
        if(st.selectedSlot){
          const first=PART_DB.find(p=>p.slot===st.selectedSlot&&st.unlocked.has(p.id));
          if(first) this.showPartDetail(first);
        } else this.dom.partDetail.hidden=true;
      }
    };

    // STATUS
    const m=this.playerMech, s=m.stats, b=m.baseStats;
    const over = b.weight>b.maxLoad;
    this.dom.statusTable.innerHTML = [
      ['HP', `${m.hpNow}/${s.hpMax}`],
      ['AT', s.at], ['DF', s.df],
      ['WEIGHT', `${b.weight}/${b.maxLoad} kg`, over],
      ['SPEED', s.move], ['ACC', s.acc+'%'], ['EVA', s.eva+'%'],
      ['AMMO', Object.entries(m.ammo).map(([k,v])=>`${k.slice(-1)}:${v}`).join(' ')],
      ['RANGE', s.range],
      ['CREDITS', st.credits+' CR'],
    ].map(([k,v,warn])=>`<div class="st-line"><span>${k}</span><b class="${warn?'warn':''}">${v}</b></div>`).join('')
     + `<div class="st-line"><span>TYPE</span><b>1v1 TACTICAL</b></div>`;
  }

  showPartDetail(p){
    const d=this.dom.partDetail;
    d.hidden=false;
    d.innerHTML=`<div class="panel-title pd-tier-${p.tier}">${p.name}</div>
      <div class="pd-name">${SLOT_NAMES[p.slot]} · ${TIERS[p.tier].name}</div>
      WEIGHT ${p.w} kg<br>HP ${p.hp} · DF ${p.df}<br>
      ${p.isArmed?`AT ${p.weapon.at} · AMMO ${p.weapon.ammo}<br>RANGE ${p.weapon.rng} · TYPE GUN<br>`:''}
      ${p.maxLoad?`MAX LOAD ${p.maxLoad} kg<br>`:''}
      ${p.acc?`ACC ${p.acc>0?'+':''}${p.acc}% `:''}${p.eva?`EVA ${p.eva>0?'+':''}${p.eva}%`:''}
      ${p.move?`<br>MOVE +${p.move}`:''}`;
  }

  /* ---------- ГЛАВНЫЙ ЦИКЛ ---------- */
  loop(t){
    this.time=t/1000;
    const c=this.ctx;
    c.imageSmoothingEnabled=false;
    if(this.state.screen==='battle'&&this.battle){
      this.battle.draw(c,W,H);
    } else {
      this.drawHangar(c);
    }
    requestAnimationFrame(tt=>this.loop(tt));
  }

  /* ---------- ФОН АНГАРА (canvas, пиксельный) ---------- */
  drawHangar(c){
    // стены
    c.fillStyle='#232b36'; c.fillRect(0,0,W,250);
    // панели стен
    for(let i=0;i<8;i++){
      c.fillStyle=i%2?'#28313e':'#222a35';
      c.fillRect(i*80,40,78,150);
      c.fillStyle='#1a212b'; c.fillRect(i*80,40,78,4);
    }
    // фермы потолка
    c.fillStyle='#161c24'; c.fillRect(0,0,W,40);
    for(let x=0;x<W;x+=40){ c.fillRect(x,36,4,10); }
    c.fillStyle='#ffd23f'; c.fillRect(0,38,W,2);
    // прожекторы
    for(const lx of [160,320,480]){
      c.fillStyle='#111'; c.fillRect(lx-8,24,16,10);
      c.fillStyle='rgba(255,240,180,.06)';
      c.beginPath(); c.moveTo(lx-6,34); c.lineTo(lx+6,34); c.lineTo(lx+70,250); c.lineTo(lx-70,250); c.fill();
    }
    // кабели вдоль стены
    c.strokeStyle='#0d1117'; c.lineWidth=3;
    for(const off of [8,14]){
      c.beginPath(); c.moveTo(0,58+off);
      for(let x=0;x<=W;x+=32) c.lineTo(x,58+off+Math.sin(x*0.05+off)*4);
      c.stroke();
    }
    // пол
    c.fillStyle='#31394a'; c.fillRect(0,250,W,110);
    for(let x=0;x<W;x+=32){ c.fillStyle=(x/32)%2?'#2b3242':'#343d4f'; c.fillRect(x,250,32,110); }
    // жёлто-чёрные предупреждающие полосы на полу
    for(let x=-20;x<W;x+=24){
      c.fillStyle='#c9a227'; c.fillRect(x,252,12,8);
      c.fillStyle='#161616'; c.fillRect(x+12,252,12,8);
    }
    // платформа-круг под мехом
    c.fillStyle='#252d3b'; c.fillRect(240,258,160,10);
    c.fillStyle='#1c2330'; c.fillRect(250,268,140,6);

    // большая белая бочка "13"
    c.fillStyle='#e8e8e0'; c.fillRect(540,190,52,62);
    c.fillStyle='#c9c9bf'; c.fillRect(540,190,52,6); c.fillRect(540,214,52,5); c.fillRect(540,238,52,5);
    c.fillStyle='#b53'; c.fillRect(546,200,40,3);
    c.fillStyle='#222'; c.font='bold 20px monospace'; c.fillText('13',552,226);

    // ящики слева
    const crate=(x,y,s)=>{
      c.fillStyle='#7a6a3f'; c.fillRect(x,y,s,s);
      c.fillStyle='#5d5130'; c.fillRect(x,y,s,3); c.fillRect(x,y+s-3,s,3);
      c.strokeStyle='#463d24'; c.strokeRect(x+2.5,y+2.5,s-5,s-5);
      c.beginPath(); c.moveTo(x+2,y+2); c.lineTo(x+s-2,y+s-2); c.stroke();
    };
    crate(30,214,38); crate(72,222,30); crate(38,180,34);
    // стопка шин/колец
    c.fillStyle='#1c1c1c'; c.fillRect(120,232,34,8); c.fillRect(124,224,26,8);

    // мех игрока по центру (тот же спрайт, что в бою)
    this.playerMech.facing=1;
    this.playerMech.draw(c, 320, 258, 46);

    // подсветка выбранного слота на мехе
    const zs={head:[320,120],armR:[352,170],armL:[288,170],body:[320,160],legs:[320,230]};
    if(this.state.selectedSlot&&zs[this.state.selectedSlot]){
      const [zx,zy]=zs[this.state.selectedSlot];
      c.strokeStyle=`rgba(255,210,63,${0.5+0.5*Math.sin(this.time*6)})`;
      c.lineWidth=2; c.strokeRect(zx-24,zy-24,48,48);
    }

    // вывеска
    c.fillStyle='#0d1117'; c.fillRect(200,6,240,26);
    c.strokeStyle='#4a5c78'; c.strokeRect(201,7,238,24);
    c.fillStyle='#7fd0ff'; c.font='bold 14px monospace';
    c.fillText('HANGAR 07 · FM-STYLE',214,24);

    // тост-сообщение
    if(this.state.toast && this.time-this.state.toastT<2.5){
      c.fillStyle='rgba(0,0,0,.7)'; c.fillRect(W/2-130,330,260,20);
      c.fillStyle='#ffd23f'; c.font='11px monospace';
      c.fillText(this.state.toast, W/2-c.measureText(this.state.toast).width/2, 344);
    }
  }
}

window.addEventListener('DOMContentLoaded', ()=>{ window.game = new Game(); });
