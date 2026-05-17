#!/usr/bin/env sh
# Сборка и публикация на Docker Hub (linux/amd64)
set -e
IMAGE="${DOCKER_IMAGE:-bondarevevgeni/taskextraction:latest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker buildx create --name taskextraction-builder --use 2>/dev/null || docker buildx use taskextraction-builder 2>/dev/null || true

VITE_SITE_URL="${VITE_SITE_URL:-https://task-extraction.gazonyh.ru}"

docker buildx build \
  --platform linux/amd64 \
  --build-arg "VITE_SITE_URL=$VITE_SITE_URL" \
  -t "$IMAGE" \
  --push \
  .

echo "Published: $IMAGE"
