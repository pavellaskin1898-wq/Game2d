import asyncio
from playwright.async_api import async_playwright

async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1400,'height':900})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        # 1) единый файл (запуск на ПК двойным кликом, file:// без сервера)
        await pg.goto('file:///workspace/mech-city.html')
        await pg.wait_for_timeout(700)
        assert await pg.is_visible('#btn-mission'), "no map button"
        await pg.click('#btn-mission'); await pg.wait_for_timeout(500)
        assert await pg.is_visible('#scr-map'), "map not shown"
        sel0 = await pg.evaluate("GameState.selectedLoc")
        t0 = await pg.text_content('#mc-title')
        print("auto-selected:", sel0, "| card:", repr(t0))
        box = await pg.evaluate("()=>{const r=document.getElementById('cvm').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}")
        sx, sy = box['w']/960, box['h']/540
        # координаты меток берём из самой игры (LOCS), чтобы не зависеть от правок
        locs = await pg.evaluate("Object.fromEntries(Object.entries(LOCS).map(([k,L])=>[k,[L.x,L.y]]))")
        print("markers:", locs)
        for name,(lx,ly) in locs.items():
            await pg.mouse.click(box['x']+lx*sx, box['y']+ly*sy); await pg.wait_for_timeout(120)
            t = await pg.text_content('#mc-title')
            print(f"click {name}: {t!r}")
        # клик по пустой точке рядом с docks -> должен выбраться ближайший
        await pg.mouse.click(box['x']+430*sx, box['y'+0]*0+box['y']+340*sy); await pg.wait_for_timeout(120)
        print("near-click selected:", await pg.evaluate("GameState.selectedLoc"))
        await pg.screenshot(path='shot_citymap.png')
        # 2) DEPLOY с карты -> бой с локацией
        await pg.mouse.click(box['x']+locs['fortress'][0]*sx, box['y']+locs['fortress'][1]*sy); await pg.wait_for_timeout(100)
        await pg.click('#mc-deploy'); await pg.wait_for_timeout(500)
        B = await pg.evaluate("({screen: GameState.screen, locKey: GameState.battle.locKey, enemies: GameState.battle.enemies.map(e=>e.name), reward: GameState.battle.reward})")
        print("battle:", B)
        await pg.screenshot(path='shot_battle_fortress.png')
        # 3) победа программно -> награда и возврат на карту
        await pg.evaluate("GameState.battle.enemies.forEach(e=>{e.parts.torso.hpCur=0;e.dead=true;}); GameState.battle.checkEnd();")
        await pg.wait_for_timeout(1500)
        print("result visible:", await pg.is_visible('#scr-result'), "|", await pg.text_content('#result-title'))
        await pg.click('#btn-back'); await pg.wait_for_timeout(400)
        st = await pg.evaluate("({screen: GameState.screen, credits: GameState.credits, completed: GameState.completed, unlocked: GameState.unlockedTiers})")
        print("after win:", st)
        await pg.screenshot(path='shot_map_after_win.png')
        await b.close()
    print("JS errors:", errs if errs else "NONE")

asyncio.run(main())
