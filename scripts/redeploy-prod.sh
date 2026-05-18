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

docker pull "$IMAGE"
docker stop "$NAME" 2>/dev/null || true
docker rm "$NAME" 2>/dev/null || true

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p "${PORT}:80" \
  -v "${DATA_DIR}:/app/data" \
  -e "ENCRYPTION_KEY=$(cat "$DATA_DIR/.encryption_key")" \
  -e "PUBLIC_API_URL=${PUBLIC_API_URL:-https://task-extraction.gazonyh.ru}" \
  -e "CORS_ORIGINS=${CORS_ORIGINS:-https://task-extraction.gazonyh.ru}" \
  "$IMAGE"

echo "Waiting for health..."
sleep 3
curl -sf "http://127.0.0.1:${PORT}/health" | head -c 500
echo ""
docker logs --tail 20 "$NAME"
