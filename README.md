# TaskExtraction

Панель для команд поддержки: **сообщения из Telegram → классификация LLM → задачи на канбане → синхронизация с Jira, Trello, GitHub Issues и Slack**.

Один Docker-образ (`nginx` + `FastAPI`), SQLite на диске, настройка через веб-интерфейс без правки кода.

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

### 2. Запуск контейнера

```bash
docker pull bondarevevgeni/taskextraction:latest

docker run -d \
  --name taskextraction \
  --restart unless-stopped \
  -p 8089:80 \
  -v /home/taskextraction/taskextraction-data:/app/data \
  -e ENCRYPTION_KEY="$(cat /home/taskextraction/taskextraction-data/.encryption_key)" \
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

1. **Настройки → Telegram** — `api_id` и `api_hash` с [my.telegram.org/apps](https://my.telegram.org/apps), вход по QR или телефону.
2. **Выбор чатов** — отметьте группы/каналы, из которых читать сообщения.
3. **Настройки → LLM** — URL API, ключ и модель (OpenAI-совместимый endpoint).
4. По желанию: Jira, Trello, GitHub, Slack.

После сохранения чатов фоновый **ingest** подхватывает новые сообщения автоматически (перезапуск контейнера не обязателен).

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
  bondarevevgeni/taskextraction:latest
```

Данные на volume (`taskextraction.db`, `media/`, сессия Telegram) сохраняются между перезапусками.

---

## Что лежит на volume `/app/data`

| Путь | Назначение |
|------|------------|
| `taskextraction.db` | SQLite: сообщения, задачи, настройки |
| `media/` | Вложения из Telegram |
| `session/` | Сессия Telethon |
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

```bash
git clone https://github.com/<user>/TaskExtraction.git
cd TaskExtraction
cp .env.example .env
# Заполните ENCRYPTION_KEY в .env

docker compose up --build
```

- Frontend: http://localhost:5173  
- API / Swagger: http://localhost:8000/docs  

Сборка и публикация образа `linux/amd64`:

```bash
docker buildx build --platform linux/amd64 \
  --build-arg VITE_SITE_URL=http://109.196.101.10:8089 \
  -t bondarevevgeni/taskextraction:latest \
  --push .
```

`VITE_SITE_URL` — публичный URL панели для **Open Graph** (превью ссылки в Telegram), `sitemap.xml` и `robots.txt`. Укажите тот же адрес, по которому открываете сайт (с портом, если он не 80).

После деплоя проверьте превью: вставьте `http://IP:8089/welcome` в чат Telegram — должны появиться заголовок, описание и картинка.

---

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `ENCRYPTION_KEY` | Fernet-ключ для секретов в БД (**обязательно** в проде) |
| `DATABASE_URL` | По умолчанию `sqlite+aiosqlite:////app/data/taskextraction.db` |
| `MEDIA_DIR` | `/app/data/media` |
| `TELEGRAM_SESSION_PATH` | `/app/data/session` |
| `PUBLIC_API_URL` | Публичный URL панели (ссылки в тикетах) |
| `VITE_SITE_URL` | Публичный URL фронтенда при **сборке** образа (OG, sitemap, SEO) |
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
