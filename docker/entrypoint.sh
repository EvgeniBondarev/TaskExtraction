#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"
export DATABASE_URL="${DATABASE_URL:-sqlite+aiosqlite:////app/data/taskextraction.db}"
export MEDIA_DIR="${MEDIA_DIR:-/app/data/media}"
export TELEGRAM_SESSION_PATH="${TELEGRAM_SESSION_PATH:-/app/data/session}"

mkdir -p "$DATA_DIR" "$MEDIA_DIR" "$(dirname "$TELEGRAM_SESSION_PATH")"

cd /app
echo "Running database migrations..."
alembic upgrade head

echo "Starting API on 127.0.0.1:8000..."
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
UVICORN_PID=$!

trap 'kill "$UVICORN_PID" 2>/dev/null; exit 0' TERM INT

echo "Starting nginx on :80..."
exec nginx -g "daemon off;"
