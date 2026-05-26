# TaskExtraction

**Сайт:** [https://task-extraction.ru/](https://task-extraction.ru/)

Панель для команд поддержки: **сообщения из Telegram → классификация LLM → задачи на канбане → синхронизация с Jira, Trello, GitHub Issues и Slack**.

Один Docker-образ (`nginx` + `FastAPI`), SQLite на диске, настройка через веб-интерфейс без правки кода.

**Изоляция данных:** у каждого владельца своих `api_id` / `api_hash` с [my.telegram.org](https://my.telegram.org/apps) — отдельная БД, медиа и сессия панели (cookie). Пользователи не видят чужие задачи и чаты.

**Docker Hub:** [`bondarevevgeni/taskextraction:latest`](https://hub.docker.com/r/bondarevevgeni/taskextraction)

---

## Что делает продукт

В рабочих чатах поддержки поручения теряются в потоке переписки. TaskExtraction подключается к выбранным группам и каналам как **user-клиент Telegram**, сохраняет сообщения, отделяет задачи от вопросов и «шума», создаёт карточки в панели и при необходимости отправляет их во внешние трекеры.

| Этап | Описание |
|------|----------|
| **Ingest** | Telethon слушает новые сообщения в выбранных чатах |
| **Pre-filter** | Быстрые эвристики без LLM (пустой текст, шум) |
| **Классификация** | LLM: задача / вопрос / нерелевантное |
| **Канбан** | Inbox → В работе → Готово → Архив |
| **Интеграции** | Jira, Trello, GitHub Issues, Slack (auto-push и вручную) |

**В панели:** live-уведомления о новых сообщениях, счётчики на «Задачи» / «Лента», ответ в исходный Telegram-чат из карточки задачи (со ссылкой на карточку), предложение подключить интеграции после первого входа.

Промо-страница и гайд: `/welcome`.

---

## Установка на сервер (VPS)

Пример для Linux-сервера с Docker. Панель будет доступна на порту **8089**.

### 1. Каталог данных и ключ шифрования

Секреты (Telegram API, токены интеграций, LLM) хранятся в БД в зашифрованном виде. Нужен **Fernet-ключ** — один раз сгенерируйте и сохраните; при смене ключа старые данные в БД не расшифруются.

```bash
mkdir -p /home/taskextraction/taskextraction-data
```

Сгенерировать новый ключ:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Сохранить ключ в файл на volume (рекомендуется):

```bash
echo -n 'ВАШ_FERNET_КЛЮЧ_44_СИМВОЛА' > /home/taskextraction/taskextraction-data/.encryption_key
chmod 600 /home/taskextraction/taskextraction-data/.encryption_key
```

> Ключ должен быть валидным Fernet (~44 символа, base64). Примеры вида `xK7vN2mP9qR4sT1uV5wX8yZ0aB3cD6eF9gH2jK5lM8=` **не подходят**.

Ключи приложения Telegram (одно приложение на весь сервис, пользователи входят только по QR):

```bash
cat > /home/taskextraction/taskextraction-data/telegram.env << 'EOF'
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=ваш_api_hash_с_my_telegram_org
EOF
chmod 600 /home/taskextraction/taskextraction-data/telegram.env
```

Значения возьмите с [my.telegram.org/apps](https://my.telegram.org/apps). Без них в UI будет ошибка *Telegram API credentials not configured*.

### 2. Запуск контейнера

```bash
docker pull bondarevevgeni/taskextraction:latest

set -a && . /home/taskextraction/taskextraction-data/telegram.env && set +a

docker run -d \
  --name taskextraction \
  --restart unless-stopped \
  -p 8089:80 \
  -v /home/taskextraction/taskextraction-data:/app/data \
  -e ENCRYPTION_KEY="$(cat /home/taskextraction/taskextraction-data/.encryption_key)" \
  -e TELEGRAM_API_ID="$TELEGRAM_API_ID" \
  -e TELEGRAM_API_HASH="$TELEGRAM_API_HASH" \
  bondarevevgeni/taskextraction:latest
```

Тот же запуск с ключом напрямую в `-e` (если файл не используете):

```bash
docker run -d \
  --name taskextraction \
  --restart unless-stopped \
  -p 8089:80 \
  -v /home/taskextraction/taskextraction-data:/app/data \
  -e ENCRYPTION_KEY='ВАШ_FERNET_КЛЮЧ' \
  bondarevevgeni/taskextraction:latest
```

Откройте в браузере: **http://IP_СЕРВЕРА:8089**

### 3. Первичная настройка в UI

1. **Настройки → Telegram** — вход по QR (ключи приложения уже заданы на сервере в `telegram.env`; шаг my.telegram.org в UI не показывается).
2. **Выбор чатов** — отметьте группы/каналы, из которых читать сообщения.
3. **Настройки → LLM** — URL API, ключ и модель (OpenAI-совместимый endpoint).
4. По желанию: Jira, Trello, GitHub, Slack.
5. **Выйти из панели** (в шапке) — сброс cookie-сессии без удаления данных на диске; повторный вход — снова свои `api_id` / `api_hash`.

После сохранения чатов фоновый **ingest** подхватывает новые сообщения автоматически (перезапуск контейнера не обязателен).

**Ответ в Telegram из задачи:** откройте карточку → внизу строка ввода как в Telegram → напишите текст → Enter. К сообщению автоматически добавится ссылка на карточку (`/?task=…`).

### 4. Проверка

```bash
curl -s http://127.0.0.1:8089/health
```

Ожидаемый ответ (фрагмент):

```json
{
  "status": "ok",
  "ingest": {
    "running": true,
    "handler_registered": true,
    "monitored_chat_ids": [-1001234567890],
    "last_error": null
  }
}
```

Логи:

```bash
docker logs -f taskextraction
```

При успешном приёме сообщения в логе: `Telegram ingest active` и `Ingested message ...`.

### 5. Обновление образа

На сервере:

```bash
curl -sO https://raw.githubusercontent.com/EvgeniBondarev/TaskExtraction/master/scripts/redeploy-prod.sh
chmod +x redeploy-prod.sh
./redeploy-prod.sh
```

Или вручную:

```bash
docker pull bondarevevgeni/taskextraction:latest
docker stop taskextraction
docker rm taskextraction

docker run -d \
  --name taskextraction \
  --restart unless-stopped \
  -p 8089:80 \
  -v /home/taskextraction/taskextraction-data:/app/data \
  -e ENCRYPTION_KEY="$(cat /home/taskextraction/taskextraction-data/.encryption_key)" \
  -e TELEGRAM_API_ID="$TELEGRAM_API_ID" \
  -e TELEGRAM_API_HASH="$TELEGRAM_API_HASH" \
  -e PUBLIC_API_URL=https://task-extraction.ru \
  -e CORS_ORIGINS=https://task-extraction.ru \
  bondarevevgeni/taskextraction:latest
```

> На VPS с **одним** tenant cookie сессии восстанавливается автоматически — интеграции (Jira/Trello/GitHub/Slack) снова доступны без повторного ввода ключей Telegram.

Данные на volume (`taskextraction.db`, `media/`, сессия Telegram) сохраняются между перезапусками.

---

## Что лежит на volume `/app/data`

| Путь | Назначение |
|------|------------|
| `tenants/{api_id}/taskextraction.db` | SQLite tenant: сообщения, задачи, настройки |
| `tenants/{api_id}/media/` | Вложения из Telegram для этого tenant |
| `session/` | Сессии Telethon (по tenant) |
| `taskextraction.db` | Устаревший одиночный файл — при старте мигрируется в первый tenant |
| `.encryption_key` | Fernet-ключ (если создан на хосте; entrypoint может сгенерировать свой при первом запуске без `-e`) |

---

## Локальный быстрый старт

```bash
mkdir -p ./taskextraction-data
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# подставьте ключ:

docker run -d \
  --name taskextraction \
  --restart unless-stopped \
  -p 8080:80 \
  -v "$(pwd)/taskextraction-data:/app/data" \
  -e ENCRYPTION_KEY="ВАШ_FERNET_КЛЮЧ" \
  bondarevevgeni/taskextraction:latest
```

Панель: http://localhost:8080 · Промо: http://localhost:8080/welcome

---

## Разработка (docker compose)

Локально поведение как на **task-extraction.ru**: hosted Telegram (только QR), ключи приложения из `.env` / `docker-compose.yml`.

```bash
git clone https://github.com/<user>/TaskExtraction.git
cd TaskExtraction
cp .env.example .env
# Заполните ENCRYPTION_KEY в .env (TELEGRAM_API_* уже заданы как на сервере)

docker compose up --build
```

- Frontend: http://localhost:5173  
- API / Swagger: http://localhost:8000/docs  

**Только API без Docker** (фронт: `cd frontend && npm run dev`):

```bash
cd backend
export $(grep -v '^#' ../.env | xargs)   # или source ../.env при необходимости
# В ../.env для локального SQLite: DATABASE_URL=sqlite+aiosqlite:///./data/taskextraction.db
uvicorn app.main:app --reload --port 8000
```

> **Прод на VPS** по-прежнему через `scripts/redeploy-prod.sh` и `telegram.env` на диске — `docker compose` там не обязателен.

Сборка и публикация образа `linux/amd64`:

```bash
docker buildx build --platform linux/amd64 \
  --build-arg VITE_SITE_URL=https://task-extraction.ru \
  -t bondarevevgeni/taskextraction:latest \
  --push .
```

`VITE_SITE_URL` — публичный URL панели для **Open Graph**, `sitemap.xml`, `robots.txt` и canonical. Пример: `https://task-extraction.ru`.

Опционально при сборке:

- `VITE_YANDEX_VERIFICATION` — код из [Яндекс.Вебмастер](https://webmaster.yandex.ru)
- `VITE_GOOGLE_SITE_VERIFICATION` — код из [Google Search Console](https://search.google.com/search-console)

После деплоя:

1. Откройте `https://ваш-домен/robots.txt` и `https://ваш-домен/sitemap.xml`
2. Добавьте сайт в Вебмастер и Search Console, подтвердите права (meta-теги или файл в `frontend/public/seo/`)
3. Загрузите sitemap в обе панели
4. Запросите индексирование страницы `/welcome`

Индексируется лендинг (`/welcome`). Панель (`/settings`, `/feed`, `/admin`) закрыта `noindex` в robots.txt и meta.

После деплоя проверьте превью: вставьте `https://ваш-домен/welcome` в чат Telegram — должны появиться заголовок, описание и картинка.

---

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `ENCRYPTION_KEY` | Fernet-ключ для секретов в БД (**обязательно** в проде) |
| `SESSION_SECRET` | Секрет подписи cookie `te_session` (изоляция панели по tenant) |
| `DATABASE_URL` | Legacy; рабочие БД — `data/tenants/{api_id}/` |
| `MEDIA_DIR` | Legacy; медиа — `data/tenants/{api_id}/media/` |
| `TELEGRAM_SESSION_PATH` | `/app/data/session` |
| `PUBLIC_API_URL` | Публичный URL панели (ссылки в тикетах и ответах в Telegram) |
| `VITE_SITE_URL` | Публичный URL фронтенда при **сборке** образа (OG, sitemap, SEO, ссылки на задачи) |
| `CORS_ORIGINS` | Разрешённые origin для API |

Telegram, LLM и интеграции удобнее настраивать в UI (**Настройки**).

---

## Структура репозитория

```
TaskExtraction/
├── backend/           # FastAPI, Telethon, пайплайн, Alembic
├── frontend/          # React-панель
├── docker/            # nginx.conf, entrypoint
├── Dockerfile         # production-образ
├── docker-compose.yml # локальная разработка
└── scripts/           # telegram_login, docker-publish
```

---

## Безопасность

- Не коммитьте `.env`, `*.session`, `taskextraction-data/`, `*.db`, `.encryption_key`.
- Не публикуйте `ENCRYPTION_KEY` и `api_hash` в открытых репозиториях.
- После утечки перевыпустите ключи на [my.telegram.org](https://my.telegram.org/apps).
- Бэкапьте **volume и ключ шифрования вместе** — без ключа БД не расшифровать.

---

## Контакты

Вопросы и обратная связь: [@Burn1ngSnow](https://t.me/Burn1ngSnow)

---

## Лицензия

[MIT](LICENSE)
