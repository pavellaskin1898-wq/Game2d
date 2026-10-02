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
        await pg.wait_for_timeout(500)
        print('hangar part buttons:', await pg.locator('#parts-panel button').count())
        st = (await pg.locator('#status').inner_text()).replace('\n',' | ')
        print('STATUS:', st[:260])
        # экипировка тяжёлого торса
        await pg.locator('button[data-slot="torso"][data-tier="heavy"]').click()
        await pg.wait_for_timeout(100)
        print('after heavy torso:', [l for l in (await pg.locator('#status').inner_text()).split('\n') if any(k in l for k in ('HP','WEIGHT','SPEED'))])
        await pg.screenshot(path='shot_hangar.png')
        # бой
        await pg.locator('#btn-deploy').click(); await pg.wait_for_timeout(400)
        pos = await pg.evaluate("()=>({p:[GameState.battle.player.x,GameState.battle.player.y],e:GameState.battle.enemies.map(e=>[e.name,e.x,e.y]),d:GameState.battle.enemies.map(e=>BF.dist(GameState.battle.player,e))})")
        print('deploy:', json.dumps(pos,ensure_ascii=False))
        assert min(pos['d'])>=5, 'enemies too close!'
        # UI действий
        await pg.locator('#act-move').click(); await pg.wait_for_timeout(80)
        print('move tiles:', await pg.evaluate("()=>GameState.battle.moveSet.size"))
        await pg.screenshot(path='shot_battle.png')
        # автопилот до конца боя
        res = await pg.evaluate("""async ()=>{
          const B=GameState.battle;
          for(let t=0;t<120;t++){
            if(B.over)break;
            if(B.turn==='player'){
              B.moved=false;B.acted=false;
              let tv=B.inRangeTargets(B.player);
              if(!tv.length){
                const reach=B.reachable(B.player);let best=null,bd=1e9;
                const en=B.enemies.filter(e=>e.alive).sort((a,c)=>BF.dist(B.player,a)-BF.dist(B.player,c))[0];
                for(const k of reach.keys()){if(k===`${B.player.x},${B.player.y}`)continue;
                  const[x,y]=k.split(',').map(Number);const d=BF.dist({x,y},en)-BF.at(x,y).h*.3;
                  if(d<bd){bd=d;best={x,y}}}
                if(best){B.player.x=best.x;B.player.y=best.y;}
                tv=B.inRangeTargets(B.player);}
              if(tv.length){tv.sort((a,b)=>b.w.dmg-a.w.dmg);B.doAttack(B.player,tv[0].u);}
              B.endTurn();
              await new Promise(r=>setTimeout(r,1500));
            } else await new Promise(r=>setTimeout(r,400));
          }
          return {over:B.over,turns:t,hpP:B.player.hpCur,enemies:B.enemies.map(e=>[e.name,e.alive,e.hpCur]),log:B.log.slice(0,4)};}""")
        print('AUTO RESULT:', json.dumps(res, ensure_ascii=False))
        await pg.wait_for_timeout(1300)
        vis = await pg.locator('#scr-result').is_visible()
        title = (await pg.locator('#result-title').inner_text()) if vis else 'NO-OVERLAY'
        rtext = (await pg.locator('#result-text').inner_text()) if vis else ''
        print('result overlay:', vis, '|', title, '|', rtext[:80])
        if vis and title.startswith('MISSION'):
            await pg.locator('#btn-back').click(); await pg.wait_for_timeout(300)
            print('credits after win:', await pg.evaluate("()=>GameState.credits"), 'wins:', await pg.evaluate("()=>GameState.wins"))
        print('ERRORS:', errors if errors else 'none')
        await b.close()
asyncio.run(main())
