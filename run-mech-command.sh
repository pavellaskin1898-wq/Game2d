#!/bin/sh
# Запуск MECH COMMAND на Linux/macOS — открыть единый файл в браузере
DIR="$(cd "$(dirname "$0")" && pwd)"
(xdg-open "$DIR/mech-command.html" 2>/dev/null || open "$DIR/mech-command.html" 2>/dev/null) 
