import asyncio, json, sys
from playwright.async_api import async_playwright
async def run_once(pw):
    b = await pw.chromium.launch()
    pg = await b.new_page(viewport={'width':1400,'height':900})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('file:///workspace/fm2/index.html'); await pg.wait_for_timeout(350)
    res = await pg.evaluate("""async ()=>{
      document.getElementById('btn-deploy').click();
      const B=GameState.battle; let turns=0;
      for(let t=0;t<400;t++){
        if(B.over)break;
        if(B.turn==='player'){
          turns++;
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
          await new Promise(r=>setTimeout(r,300));
        } else await new Promise(r=>setTimeout(r,120));
      }
      return {over:B.over,turns,hpP:B.player.hpCur};}""")
    await b.close()
    return res, errs
async def main():
    n = int(sys.argv[1]) if len(sys.argv)>1 else 3
    wins=losses=none=0
    async with async_playwright() as pw:
        for i in range(n):
            r,e = await run_once(pw)
            print(i, r, 'errs:', e[:1] if e else '')
            if r['over']=='win': wins+=1
            elif r['over']=='lose': losses+=1
            else: none+=1
    print(f'SUMMARY wins={wins} losses={losses} unfinished={none} of {n}')
asyncio.run(main())
