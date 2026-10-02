#!/usr/bin/env python3
"""Сборка единого файла mech-command.html из fm1/ (index+css+js инлайн).
Запуск на ПК без сервера: открыть mech-command.html двойным кликом."""
import re, os
SRC = os.path.join(os.path.dirname(__file__), 'fm1')
html = open(os.path.join(SRC,'index.html'), encoding='utf-8').read()
css  = open(os.path.join(SRC,'style.css'),  encoding='utf-8').read()
js   = "\n\n".join("/* ===== %s ===== */\n" % f + open(os.path.join(SRC,f),encoding='utf-8').read()
                   for f in ['parts.js','mech.js','battle.js','game.js'])
out = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n'+css+'\n</style>')
out = re.sub(r'<script src="[^"]+"></script>\n?', '', out)
out = out.replace('</body>', '<script>\n"use strict";\n'+js+'\n</script>\n</body>')
dst = os.path.join(os.path.dirname(__file__), 'mech-command.html')
open(dst,'w',encoding='utf-8').write(out)
print('OK:', dst, len(out), 'байт')
