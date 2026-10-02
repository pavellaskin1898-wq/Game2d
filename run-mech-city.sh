#!/bin/sh
# Запуск MECH COMMAND на Linux/macOS — открыть единый файл в браузере
DIR="$(cd "$(dirname "$0")" && pwd)"
(xdg-open "$DIR/mech-city.html" 2>/dev/null || open "$DIR/mech-city.html" 2>/dev/null) 
