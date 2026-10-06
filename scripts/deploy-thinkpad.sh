#!/usr/bin/env bash
# Deploy the checked-out revision on the ThinkPad self-hosted Actions runner.
set -Eeuo pipefail

readonly container_name="taskextraction"
readonly image_current="taskextraction:current"
readonly image_next="taskextraction:${DEPLOY_SHA:?DEPLOY_SHA is required}"
readonly env_file="${TASKEXTRACTION_ENV_FILE:-/home/evg/taskextraction/.env}"
readonly data_dir="${TASKEXTRACTION_DATA_DIR:-/home/evg/taskextraction-data}"
readonly bind_ip="${TASKEXTRACTION_BIND_IP:-10.8.0.7}"
readonly health_url="http://${bind_ip}:8089/health"

test -f "$env_file" || { echo "Missing deployment environment: $env_file" >&2; exit 1; }
mkdir -p "$data_dir"

previous_image=""
if docker image inspect "$image_current" >/dev/null 2>&1; then
  previous_image="taskextraction:rollback-${DEPLOY_SHA}"
  docker tag "$image_current" "$previous_image"
fi

rollback() {
  local exit_code=$?
  if [[ -n "$previous_image" ]]; then
    echo "Deployment failed; restoring the previous image..." >&2
    docker rm -f "$container_name" >/dev/null 2>&1 || true
    docker run -d \
      --name "$container_name" \
      --restart unless-stopped \
      --env-file "$env_file" \
      -e PUBLIC_WEB_URL=https://task-extraction.ru \
      -e TASK_PANEL_URL=https://task-extraction.ru \
      -e PUBLIC_API_URL=https://task-extraction.ru \
      -e CORS_ORIGINS=https://task-extraction.ru \
      -e GOOGLE_REDIRECT_URI=https://task-extraction.ru/api/auth/google/callback \
      -v "$data_dir:/app/data" \
      -p "${bind_ip}:8089:80" \
      "$previous_image" >/dev/null || true
  fi
  exit "$exit_code"
}
trap rollback ERR

docker build \
  --build-arg VITE_SITE_URL=https://task-extraction.ru \
  --tag "$image_next" \
  .

docker rm -f "$container_name" >/dev/null 2>&1 || true
docker run -d \
  --name "$container_name" \
  --restart unless-stopped \
  --env-file "$env_file" \
  -e PUBLIC_WEB_URL=https://task-extraction.ru \
  -e TASK_PANEL_URL=https://task-extraction.ru \
  -e PUBLIC_API_URL=https://task-extraction.ru \
  -e CORS_ORIGINS=https://task-extraction.ru \
  -e GOOGLE_REDIRECT_URI=https://task-extraction.ru/api/auth/google/callback \
  -v "$data_dir:/app/data" \
  -p "${bind_ip}:8089:80" \
  "$image_next" >/dev/null

for attempt in {1..20}; do
  if curl --fail --silent --show-error "$health_url" >/dev/null; then
    docker tag "$image_next" "$image_current"
    [[ -z "$previous_image" ]] || docker image rm "$previous_image" >/dev/null
    echo "Deployment succeeded: $DEPLOY_SHA"
    exit 0
  fi
  sleep 3
done

echo "Health check failed: $health_url" >&2
exit 1
