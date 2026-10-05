#!/usr/bin/env bash
# Снимает скриншоты настоящих компонентов панели на демо-данных (src/dev/ShotsPage.tsx)
# для лендинга. Нужен запущенный dev-сервер: npm run dev -- --port 5180
# Использование: scripts/capture-landing-shots.sh [base_url]
set -euo pipefail

BASE="${1:-http://localhost:5180}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/landing"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

shot() { # view theme [width,height]
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size="${3:-1440,900}" --virtual-time-budget=4000 \
    --screenshot="$TMP/$1-$2.png" "$BASE/__shots/$1?theme=$2" >/dev/null 2>&1
}

to_jpg() { # src dst
  sips -s format jpeg -s formatOptions 82 "$1" --out "$2" >/dev/null
}

for theme in light dark; do
  shot board "$theme" 1120,720
  for view in task feed; do shot "$view" "$theme"; done

  # Доска целиком (hero), снята в окне 1120x720, чтобы интерфейс был крупнее: 2240x1440 -> 1600x1029
  sips -Z 1600 "$TMP/board-$theme.png" --out "$TMP/board-$theme-s.png" >/dev/null
  to_jpg "$TMP/board-$theme-s.png" "$OUT/board-$theme.jpg"

  # Панель задачи справа: x 808..1428, y 12..888 (в 2x)
  sips -c 1752 1240 --cropOffset 24 1616 "$TMP/task-$theme.png" --out "$TMP/task-$theme-c.png" >/dev/null
  sips -Z 1100 "$TMP/task-$theme-c.png" --out "$TMP/task-$theme-c.png" >/dev/null
  to_jpg "$TMP/task-$theme-c.png" "$OUT/task-$theme.jpg"

  # Лента: центральная колонка x 240..1200, y 80..900
  sips -c 1640 1920 --cropOffset 160 480 "$TMP/feed-$theme.png" --out "$TMP/feed-$theme-c.png" >/dev/null
  sips -Z 1280 "$TMP/feed-$theme-c.png" --out "$TMP/feed-$theme-c.png" >/dev/null
  to_jpg "$TMP/feed-$theme-c.png" "$OUT/feed-$theme.jpg"
done

ls -la "$OUT"
