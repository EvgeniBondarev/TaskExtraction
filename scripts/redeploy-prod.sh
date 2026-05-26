#!/usr/bin/env sh
# Перезапуск production-контейнера (запускать на VPS с Docker).
set -e

DATA_DIR="${DATA_DIR:-/home/taskextraction/taskextraction-data}"
IMAGE="${DOCKER_IMAGE:-bondarevevgeni/taskextraction:latest}"
PORT="${PORT:-8089}"
NAME="${CONTAINER_NAME:-taskextraction}"

if [ ! -f "$DATA_DIR/.encryption_key" ]; then
  echo "Нет $DATA_DIR/.encryption_key — создайте Fernet-ключ (см. README.md)"
  exit 1
fi

# TELEGRAM_API_ID / TELEGRAM_API_HASH — из env или $DATA_DIR/telegram.env (chmod 600)
if [ -f "$DATA_DIR/telegram.env" ]; then
  # shellcheck disable=SC1090
  . "$DATA_DIR/telegram.env"
fi
if [ -z "${TELEGRAM_API_ID:-}" ] || [ -z "${TELEGRAM_API_HASH:-}" ]; then
  echo "Задайте TELEGRAM_API_ID и TELEGRAM_API_HASH (my.telegram.org/apps):"
  echo "  export TELEGRAM_API_ID=... TELEGRAM_API_HASH=... && $0"
  echo "  или создайте $DATA_DIR/telegram.env с этими переменными"
  exit 1
fi

docker pull "$IMAGE"
docker stop "$NAME" 2>/dev/null || true
docker rm "$NAME" 2>/dev/null || true

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p "${PORT}:80" \
  -v "${DATA_DIR}:/app/data" \
  -e "ENCRYPTION_KEY=$(cat "$DATA_DIR/.encryption_key")" \
  -e "TELEGRAM_API_ID=${TELEGRAM_API_ID}" \
  -e "TELEGRAM_API_HASH=${TELEGRAM_API_HASH}" \
  -e "PUBLIC_API_URL=${PUBLIC_API_URL:-https://task-extraction.ru}" \
  -e "CORS_ORIGINS=${CORS_ORIGINS:-https://task-extraction.ru}" \
  "$IMAGE"

echo "Waiting for health..."
sleep 3
curl -sf "http://127.0.0.1:${PORT}/health" | head -c 500
echo ""
docker logs --tail 20 "$NAME"
