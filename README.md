# eyePass

eyePass - MVP системы биометрического контроля доступа для фитнес-центра.

Проект состоит из backend на FastAPI, PostgreSQL с pgvector, Redis/Celery, отдельного сервиса распознавания лиц на InsightFace, frontend на React/Vite и Nginx reverse proxy.

## Стек

- Backend: FastAPI, SQLAlchemy, Alembic, Celery
- Face service: FastAPI, InsightFace, ONNX Runtime, OpenCV
- База данных: PostgreSQL + pgvector
- Очереди и кеш: Redis
- Frontend: React, Vite
- Запуск окружения: Docker Compose
- Python-зависимости: uv

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

При необходимости отредактируй `.env`: пароли, секретный ключ, URL сервисов, настройки webhook и параметры распознавания лиц.

## Установка зависимостей через uv

Backend:

```bash
cd backend
uv sync
cd ..
```

Face service:

```bash
cd face_service
uv sync
cd ..
```

Frontend:

```bash
cd frontend
npm ci
cd ..
```

Для запуска через Docker Compose локально выполнять `uv sync` необязательно: Docker-образы сами устанавливают Python-зависимости командой `uv sync --frozen`. Но для разработки, IDE, локальных команд и проверки lock-файлов лучше выполнить `uv sync` в `backend` и `face_service`.

## Модели распознавания лиц

Face service ожидает модели InsightFace в папке:

```text
face_service/models
```

Сейчас сервис использует модель `buffalo_sc`.

Если модели уже лежат в проекте, ничего делать не нужно. Если их нет, добавь их перед тестированием распознавания лиц или разреши InsightFace скачать их при первом запуске, если на машине есть доступ в интернет.

## Полный локальный запуск для теста

Собрать и запустить все сервисы:

```bash
docker compose up --build -d
```

Применить миграции базы данных:

```bash
docker compose exec backend uv run alembic upgrade head
```

Создать пользователя администратора:

```bash
docker compose exec postgres psql -U eyepass -d eyepass_db -c "INSERT INTO users (id, username, hashed_password, role, is_active) SELECT gen_random_uuid(), 'admin', '\$2b\$12\$cM/sWgmRsPIBN9hITgOTve/ooSyZDBdrMBevr9okpulV7chG48zU6', 'admin', true WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');"
```

Логин и пароль:

```text
admin
admin123
```

Открыть в браузере:

```text
Админ-панель: http://localhost
Swagger:      http://localhost/docs
Backend:      http://localhost:8000/health
Face service: http://localhost:8001/health
```

## Проверка сервисов

Посмотреть статус контейнеров:

```bash
docker compose ps
```

Должны быть запущены:

```text
postgres
redis
backend
face_service
celery_worker
frontend
nginx
```

Проверить backend:

```bash
curl http://localhost:8000/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

Проверить face service:

```bash
curl http://localhost:8001/health
```

Ожидаемый ответ:

```json
{"status":"ok","model_loaded":true}
```

Если `model_loaded` равен `false`, проверь наличие моделей в `face_service/models` и логи `face_service`.

## Логи

Логи всех сервисов:

```bash
docker compose logs -f --tail=100
```

Логи отдельных сервисов:

```bash
docker compose logs -f backend
docker compose logs -f face_service
docker compose logs -f celery_worker
```

## Полезные команды

Запустить проект:

```bash
docker compose up --build -d
```

Остановить проект:

```bash
docker compose down
```

Посмотреть статус:

```bash
docker compose ps
```

Применить миграции:

```bash
docker compose exec backend uv run alembic upgrade head
```

Запустить тесты backend:

```bash
docker compose exec backend uv run pytest -v
```

Посмотреть последние логи:

```bash
docker compose logs -f --tail=100
```

## Работа с uv

Python-зависимости backend лежат в:

```text
backend/pyproject.toml
backend/uv.lock
```

Python-зависимости face service лежат в:

```text
face_service/pyproject.toml
face_service/uv.lock
```

После изменения `backend/pyproject.toml` обновить lock-файл:

```bash
cd backend
uv lock
cd ..
```

После изменения `face_service/pyproject.toml` обновить lock-файл:

```bash
cd face_service
uv lock
cd ..
```

Проверить lock-файлы:

```bash
cd backend
uv lock --check
cd ../face_service
uv lock --check
cd ..
```

`requirements.txt` в проект добавлять не нужно. Если нужна новая Python-зависимость, добавь ее в соответствующий `pyproject.toml` и выполни `uv lock`.

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

Vite проксирует API и WebSocket-запросы на `localhost:8000`, поэтому backend-стек должен быть запущен через Docker Compose.

## Заметки

- Перед использованием приложения нужно применить миграции.
- Для реальной обработки камер нужны доступные RTSP URL.
- Для production нужно заменить секреты, настроить CORS, бэкапы, мониторинг и проверить пороги распознавания.
