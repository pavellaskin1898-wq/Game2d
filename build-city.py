#!/usr/bin/env python3
# Сборка единого файла mech-city.html (игра «MECH TACTICS: DIABLO» + карта города) из fm2/
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root/'fm2/index.html').read_text()
css  = (root/'fm2/style.css').read_text()
def code(src): return (root/f'fm2/{src}').read_text()
out = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
def repl(m):
    src = m.group(1)
    return f'<script>\n/* ===== {src} (inlined) ===== */\n{code(src)}\n</script>'
out = re.sub(r'<script[^>]*\bsrc="([^"]+)"[^>]*></script>', repl, out)
(root/'mech-city.html').write_text(out)
print('built', root/'mech-city.html', len(out), 'bytes')
