# TaskExtraction — single image (nginx + FastAPI), amd64
# Build: docker buildx build --platform linux/amd64 -t bondarevevgeni/taskextraction:latest --push .

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
RUN apk add --no-cache python3 py3-pillow
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/ .
ARG VITE_SITE_URL=
ENV VITE_API_URL= VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev nginx \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /app/data

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite+aiosqlite:////app/data/taskextraction.db \
    MEDIA_DIR=/app/data/media \
    TELEGRAM_SESSION_PATH=/app/data/session \
    DATA_DIR=/app/data

VOLUME ["/app/data"]
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
