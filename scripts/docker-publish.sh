#!/usr/bin/env sh
# Сборка и публикация на Docker Hub (linux/amd64)
set -e
IMAGE="${DOCKER_IMAGE:-bondarevevgeni/taskextraction:latest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker buildx create --name taskextraction-builder --use 2>/dev/null || docker buildx use taskextraction-builder 2>/dev/null || true

docker buildx build \
  --platform linux/amd64 \
  -t "$IMAGE" \
  --push \
  .

echo "Published: $IMAGE"
