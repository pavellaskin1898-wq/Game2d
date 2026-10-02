import asyncio, json
from playwright.async_api import async_playwright

async def main():
    errors = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1400,'height':900})
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type=='error' else None)
        await pg.goto('file:///workspace/fm2/index.html')
        await pg.wait_for_timeout(600)
        print('hangar buttons:', await pg.locator('#parts-panel button').count())
        print('status:', (await pg.locator('#status').inner_text()).replace('\n',' | ')[:200])
        # смена детали: heavy torso
        await pg.locator('button[data-slot="torso"][data-tier="heavy"]').click()
        st = await pg.locator('#status').inner_text()
        assert 'Lanze' in (await pg.locator('#parts-panel').inner_text())
        print('after heavy torso HP row:', [l for l in st.split('\n') if 'HP' in l or 'WEIGHT' in l or 'SPEED' in l])
        await pg.screenshot(path='shot_hangar.png')
        # бой
        await pg.locator('#btn-deploy').click(); await pg.wait_for_timeout(400)
        print('battle visible:', await pg.locator('#scr-battle').is_visible())
        pos0 = await pg.evaluate("()=>{const B=GameState.battle;return [B.player.x,B.player.y,B.turn];}")
        # MOVE
        await pg.locator('#act-move').click(); await pg.wait_for_timeout(100)
        n = await pg.evaluate("()=>GameState.battle.moveSet.size")
        print('move tiles:', n)
        key = await pg.evaluate("""()=>{const B=GameState.battle;let best=null,bd=-1;
          for(const k of B.moveSet.keys()){if(k==`${B.player.x},${B.player.y}`)continue;
            const[x,y]=k.split(',').map(Number);const d=Math.max(Math.abs(x-15),Math.abs(y-12));if(d>bd){bd=d;best=k}}return best;}""")
        x,y = map(int,key.split(','))
        await pg.evaluate(f"""()=>{{const B=GameState.battle;B.player.x={x};B.player.y={y};B.moved=true;B.moveSet=null;}}""")
        # ATTACK если есть цель, иначе end turn
        tg = await pg.evaluate("()=>{const B=GameState.battle;B.targets=B.inRangeTargets(B.player);return B.targets.length;}")
        print('targets after move:', tg)
        if tg: await pg.evaluate("()=>{const B=GameState.battle;B.doAttack(B.player,B.targets[0].u);B.acted=true;B.targets=null;}")
        await pg.locator('#btn-endturn').click(); await pg.wait_for_timeout(2200)
        state = await pg.evaluate("()=>({turn:GameState.battle.turn,hpP:GameState.battle.player.hpCur||GameState.battle.player.maxHp,e:GameState.battle.enemies.map(e=>[e.name,e.alive])})")
        print('after bot turns:', json.dumps(state,ensure_ascii=False))
        await pg.screenshot(path='shot_battle.png')
        # автобой до конца
        res = await pg.evaluate("""async ()=>{
          const B=GameState.battle;
          for(let t=0;t<80;t++){
            if(B.over)break;
            if(B.turn==='player'){
              B.moved=false;B.acted=false;
              let tv=B.inRangeTargets(B.player);
              if(!tv.length){ // идти к ближайшему врагу
                const reach=B.reachable(B.player);let best=null,bd=1e9;
                const en=B.enemies.filter(e=>e.alive)[0];
                for(const k of reach.keys()){if(k===`${B.player.x},${B.player.y}`)continue;
                  const[x,y]=k.split(',').map(Number);const d=Math.max(Math.abs(x-en.x),Math.abs(y-en.y))-BF.at(x,y).h*.3;
                  if(d<bd){bd=d;best={x,y}}}
                if(best){B.player.x=best.x;B.player.y=best.y;}
                tv=B.inRangeTargets(B.player);}
              if(tv.length){tv.sort((a,b)=>b.w.dmg-a.w.dmg);B.doAttack(B.player,tv[0].u);}
              B.endTurn();
              await new Promise(r=>setTimeout(r,1400));
            } else await new Promise(r=>setTimeout(r,500));
          }
          return {over:B.over,log:B.log.slice(0,3)};}""")
        print('AUTO RESULT:', json.dumps(res, ensure_ascii=False))
        await pg.wait_for_timeout(1200)
        vis = await pg.locator('#scr-result').is_visible()
        title = await pg.locator('#result-title').inner_text() if vis else 'NO-OVERLAY'
        print('result overlay:', vis, title)
        if vis:
            await pg.locator('#btn-back').click(); await pg.wait_for_timeout(300)
            print('credits:', await pg.locator('#status').inner_text().then if False else (await pg.evaluate("()=>GameState.credits")))
        await pg.screenshot(path='shot_end.png')
        print('ERRORS:', errors if errors else 'none')
        await b.close()
asyncio.run(main())
