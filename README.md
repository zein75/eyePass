# eyePass

eyePass - MVP системы биометрического контроля доступа для фитнес-центра.

Проект состоит из backend на FastAPI, PostgreSQL с pgvector, Redis, frontend на React/Vite и Nginx. Face service и обработчик камер вынесены в отдельные Docker Compose profiles, чтобы базовый backend/UI можно было запускать и тестировать без готового сервиса распознавания лиц.

## Стек

- Backend: FastAPI, SQLAlchemy, Alembic
- База данных: PostgreSQL + pgvector
- Очереди и кеш: Redis
- Frontend: React, Vite
- Reverse proxy: Nginx
- Python-зависимости: uv
- Опционально: Celery worker, InsightFace face service

## Что нужно установить

На новой машине должны быть установлены:

- Git
- Docker Desktop или Docker Engine с Docker Compose
- uv
- Node.js 20 или новее

Проверка:

```bash
git --version
docker --version
docker compose version
uv --version
node --version
npm --version
```

## Клонирование и настройка

Linux/macOS:

```bash
git clone <repo-url> eyepass
cd eyepass
cp .env.example .env
```

Windows PowerShell:

```powershell
git clone <repo-url> eyepass
cd eyepass
Copy-Item .env.example .env
```

При необходимости отредактируй `.env`: пароли, секретный ключ, URL сервисов, webhook и параметры распознавания лиц.

## Установка зависимостей

Backend:

```bash
cd backend
uv sync
cd ..
```

Frontend:

```bash
cd frontend
npm ci
cd ..
```

Для Docker-запуска выполнять `uv sync` на хосте необязательно: backend-образ сам устанавливает зависимости через `uv sync --frozen`. Локальный `uv sync` нужен для разработки, IDE и запуска команд без Docker.

## Базовый запуск backend/UI

Этот режим не запускает `face_service` и `celery_worker`. Он подходит для проверки backend, UI, авторизации, CRUD, настроек, миграций и Swagger.

Собрать и запустить базовые сервисы:

```bash
docker compose up --build -d
```

В базовом режиме должны подняться:

```text
postgres
redis
backend
frontend
nginx
```

Применить миграции:

```bash
docker compose exec backend uv run alembic upgrade head
```

Создать администратора:

```bash
docker compose exec postgres psql -U eyepass -d eyepass_db -c "INSERT INTO users (id, username, hashed_password, role, is_active) SELECT gen_random_uuid(), 'admin', '\$2b\$12\$cM/sWgmRsPIBN9hITgOTve/ooSyZDBdrMBevr9okpulV7chG48zU6', 'admin', true WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');"
```

Логин и пароль:

```text
admin
admin123
```

Открыть:

```text
Админ-панель: http://localhost
Swagger:      http://localhost/docs
Backend:      http://localhost:8000/health
```

Проверить backend:

```bash
curl http://localhost:8000/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

Проверить контейнеры:

```bash
docker compose ps
```

Проверить, что в базовом режиме face service не запущен:

```bash
docker compose ps --services
```

В списке не должно быть `face_service` и `celery_worker`.

## Запуск с face service

Face service пока можно запускать отдельно через profile `face`.

```bash
docker compose --profile face up --build -d
```

Проверить:

```bash
curl http://localhost:8001/health
```

Ожидаемый ответ при успешной загрузке модели:

```json
{"status":"ok","model_loaded":true}
```

Модели InsightFace должны лежать в:

```text
face_service/models
```

Текущая модель: `buffalo_sc`.

## Запуск обработчика камер

Celery worker запускается отдельно через profile `camera`.

```bash
docker compose --profile camera up --build -d
```

Для полноценной обработки камер обычно нужны оба profile:

```bash
docker compose --profile face --profile camera up --build -d
```

Тогда дополнительно запускаются:

```text
face_service
celery_worker
```

## Логи

Все базовые сервисы:

```bash
docker compose logs -f --tail=100
```

Backend:

```bash
docker compose logs -f backend
```

Face service, если запущен profile `face`:

```bash
docker compose logs -f face_service
```

Celery worker, если запущен profile `camera`:

```bash
docker compose logs -f celery_worker
```

## Полезные команды

Пересобрать backend и frontend:

```bash
docker compose build backend frontend nginx
```

Перезапустить базовый стенд:

```bash
docker compose down
docker compose up --build -d
```

Остановить проект:

```bash
docker compose down
```

Применить миграции:

```bash
docker compose exec backend uv run alembic upgrade head
```

Запустить тесты backend:

```bash
docker compose exec backend uv run pytest -v
```

## Работа с uv

Python-зависимости backend лежат в:

```text
backend/pyproject.toml
backend/uv.lock
```

После изменения `backend/pyproject.toml` обновить lock-файл:

```bash
cd backend
uv lock
cd ..
```

Проверить lock-файл:

```bash
cd backend
uv lock --check
cd ..
```

`requirements.txt` для backend добавлять не нужно. Если нужна новая Python-зависимость, добавь ее в `backend/pyproject.toml` и выполни `uv lock`.

## Разработка frontend

Для разработки frontend можно запустить Vite отдельно:

```bash
cd frontend
npm run dev
```

Открыть:

```text
http://localhost:3000
```

Vite проксирует API и WebSocket-запросы на `localhost:8000`, поэтому backend должен быть запущен через Docker Compose.

## Заметки

- Перед использованием приложения нужно применить миграции.
- Базовый backend/UI работает без face service.
- Загрузка биометрии и распознавание лиц требуют запущенного `face_service`.
- Обработка RTSP-камер требует запущенного `celery_worker`, `face_service` и доступных RTSP URL.
- Для production нужно заменить секреты, настроить CORS, бэкапы, мониторинг и проверить пороги распознавания.
