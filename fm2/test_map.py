import asyncio
from playwright.async_api import async_playwright

async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1400,'height':900})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file:///workspace/fm2/index.html')
        await pg.wait_for_timeout(600)
        # 1. кнопка карты видна
        assert await pg.is_visible('#btn-mission'), "no map button"
        await pg.click('#btn-mission'); await pg.wait_for_timeout(500)
        assert await pg.is_visible('#scr-map'), "map screen not shown"
        await pg.screenshot(path='shot_citymap.png')
        # 2. клик по метке DOCKS (x=480,y=300 canvas coords -> page coords via bounding box scale)
        box = await pg.evaluate("()=>{const r=document.getElementById('cvm').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}")
        sx, sy = box['w']/960, box['h']/540
        for name,(lx,ly) in [('plaza',(170,150)),('docks',(480,300)),('fortress',(790,130))]:
            await pg.mouse.click(box['x']+lx*sx, box['y']+ly*sy)
            await pg.wait_for_timeout(150)
            t = await pg.text_content('#mc-title')
            print(f"click {name}: card title = {t!r}")
        # выбрана крепость? кликнем docks ещё раз и запомним
        await pg.mouse.click(box['x']+480*sx, box['y']+300*sy); await pg.wait_for_timeout(150)
        sel = await pg.evaluate("GameState.selectedLoc"); print("selected:", sel)
        reward = await pg.text_content('#mc-reward'); print("reward line:", reward)
        # 3. DEPLOY с карты
        await pg.click('#mc-deploy'); await pg.wait_for_timeout(400)
        scr = await pg.evaluate("GameState.screen"); print("screen after deploy:", scr)
        B = await pg.evaluate("({locKey: GameState.battle.locKey, enemies: GameState.battle.enemies.map(e=>e.name), floorType: BF.at(12,12).type, walls: BF.filter? null : (()=>{let n=0;for(let y=0;y<24;y++)for(let x=0;x<24;x++){const t=BF.at(x,y); if(t.block)n++;} return n;})(), reward: GameState.battle.reward})")
        print("battle:", B)
        await pg.screenshot(path='shot_battle_docks.png')
        # 4. быстрая победа: убить врагов программно + закончить ход
        await pg.evaluate("GameState.battle.enemies.forEach(e=>{e.parts.torso.hpCur=0;e.dead=true;}); GameState.battle.checkEnd();")
        await pg.wait_for_timeout(1200)
        vis = await pg.is_visible('#scr-result'); print("result visible:", vis)
        rt = await pg.text_content('#result-title'); print("result:", rt)
        # 5. RETURN TO HANGAR -> должен вернуть на КАРТУ с галочкой
        await pg.click('#btn-back'); await pg.wait_for_timeout(400)
        scr2 = await pg.evaluate("GameState.screen"); cr = await pg.evaluate("GameState.credits")
        comp = await pg.evaluate("GameState.completed"); print("after back: screen=",scr2," credits=",cr," completed=",comp)
        await pg.screenshot(path='shot_citymap_done.png')
        # 6. Esc с карты -> ангар
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        print("esc -> screen=", await pg.evaluate("GameState.screen"))
        # 7. учебный полигон всё ещё работает
        await pg.click('#btn-deploy'); await pg.wait_for_timeout(300)
        print("training battle locKey:", await pg.evaluate("GameState.battle.locKey"))
        await b.close()
    print("JS ERRORS:", errs if errs else "NONE")

asyncio.run(main())
