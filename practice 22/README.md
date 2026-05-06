# Практика 19 — Работа с PostgreSQL

REST API для управления пользователями с хранением данных в PostgreSQL.

---

## Endpoints

| Метод | URL | Описание |
|---|---|---|
| POST | `/api/users` | Создать пользователя |
| GET | `/api/users` | Получить всех пользователей |
| GET | `/api/users/:id` | Получить пользователя по id |
| PATCH | `/api/users/:id` | Частично обновить пользователя |
| DELETE | `/api/users/:id` | Удалить пользователя |

---

## Примеры запросов

### Создать пользователя

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Иван", "last_name": "Иванов", "age": 25}'
```

```json
{
  "id": 1,
  "first_name": "Иван",
  "last_name": "Иванов",
  "age": 25,
  "created_at": 1700000000,
  "updated_at": 1700000000
}
```

### Получить всех пользователей

```bash
curl http://localhost:3000/api/users
```

### Получить пользователя по id

```bash
curl http://localhost:3000/api/users/1
```

### Частично обновить пользователя

```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age": 26}'
```

Можно передавать любой набор полей — только те, что указаны, будут обновлены. `updated_at` обновляется автоматически.

### Удалить пользователя

```bash
curl -X DELETE http://localhost:3000/api/users/1
```

```json
{ "message": "Пользователь удалён" }
```

---

## Параметры подключения к БД

Заданы в `server.js` в объекте `Pool`:

```js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'users',
  password: 'password',
  port: 5432,
});
```

Если меняешь параметры при запуске Docker-контейнера — меняй и здесь.

---
# Практика 20 — Работа с MongoDB

REST API для управления пользователями с хранением данных в MongoDB через Mongoose.

---

## Endpoints

| Метод | URL | Описание |
|---|---|---|
| POST | `/api/users` | Создать пользователя |
| GET | `/api/users` | Получить всех пользователей |
| GET | `/api/users/:id` | Получить пользователя по id |
| PATCH | `/api/users/:id` | Частично обновить пользователя |
| DELETE | `/api/users/:id` | Удалить пользователя |

---

## Примеры запросов

### Создать пользователя

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Иван", "last_name": "Иванов", "age": 25}'
```

```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "first_name": "Иван",
  "last_name": "Иванов",
  "age": 25,
  "created_at": 1700000000,
  "updated_at": 1700000000
}
```

### Получить всех пользователей

```bash
curl http://localhost:3000/api/users
```

### Получить пользователя по id

```bash
# id берётся из поля _id ответа на POST
curl http://localhost:3000/api/users/65a1b2c3d4e5f6a7b8c9d0e1
```

### Частично обновить пользователя

```bash
curl -X PATCH http://localhost:3000/api/users/65a1b2c3d4e5f6a7b8c9d0e1 \
  -H "Content-Type: application/json" \
  -d '{"age": 26}'
```

Можно передавать любой набор полей. `updated_at` обновляется автоматически.

### Удалить пользователя

```bash
curl -X DELETE http://localhost:3000/api/users/65a1b2c3d4e5f6a7b8c9d0e1
```

```json
{ "message": "Пользователь удалён" }
```

---

## Строка подключения к БД

Задана в `server.js`:

```js
MONGODB_URI = 'mongodb://YourMongoAdmin:1234@localhost:27017/usersdb?authSource=admin'
```

| Параметр | Значение | Описание |
|---|---|---|
| `YourMongoAdmin` | логин | Задаётся при запуске контейнера через `MONGO_INITDB_ROOT_USERNAME` |
| `1234` | пароль | Задаётся через `MONGO_INITDB_ROOT_PASSWORD` |
| `localhost:27017` | адрес | Хост и порт MongoDB |
| `usersdb` | база данных | Создаётся автоматически при первой записи |
| `authSource=admin` | параметр | Указывает, в какой БД хранятся учётные данные пользователя |

---

# Практика 21 — Кэширование с Redis

Доработка практики №11. За основу взято готовое приложение с авторизацией, ролями и управлением товарами — в него добавлен слой кэширования на базе Redis.

---

## Что изменилось по сравнению с практикой №11

В исходное приложение добавлены четыре вещи:

1. **Подключение к Redis** — клиент и функция инициализации
2. **`cacheMiddleware`** — middleware для чтения данных из кэша
3. **`saveToCache`** — функция сохранения данных в кэш после получения с сервера
4. **`invalidateUsersCache` / `invalidateProductsCache`** — очистка кэша при изменении данных

Всё остальное — авторизация, роли, маршруты, Swagger — осталось без изменений.

---


## Какие маршруты кэшируются

| Маршрут | Метод | TTL | Ключ в Redis |
|---|---|---|---|
| `/api/users` | GET | 1 минута | `users:all` |
| `/api/users/:id` | GET | 1 минута | `users:5` |
| `/api/products` | GET | 10 минут | `products:all` |
| `/api/products/:id` | GET | 10 минут | `products:3` |

Все остальные маршруты (POST, PUT, DELETE) кэш не читают, но **инвалидируют** его при изменении данных.

---

## Как работает кэширование

### Первый запрос — данные берутся с сервера

```
Клиент -> cacheMiddleware -> Redis: ключа нет
       -> обработчик маршрута -> данные получены
       -> saveToCache -> данные записаны в Redis с TTL
       -> ответ клиенту: { "source": "server", "data": [...] }
```

### Повторный запрос — данные берутся из кэша

```
Клиент -> cacheMiddleware -> Redis: ключ найден
       -> ответ клиенту сразу: { "source": "cache", "data": [...] }
       (обработчик маршрута не вызывается)
```

Поле `source` в ответе показывает, откуда пришли данные:

```json
{ "source": "server", "data": [...] }   ← первый запрос
{ "source": "cache",  "data": [...] }   ← повторный запрос
```

### Инвалидация — кэш очищается при изменении данных

```
PUT /api/users/:id  ->  invalidateUsersCache(id)
                    ->  удаляет "users:all" и "users:5" из Redis
                    ->  следующий GET снова обратится к серверу
```

---

# Практика 22 — Балансировка нагрузки

Тестовая система балансировки нагрузки на основе **Nginx** и **HAProxy** с тремя backend-серверами на Node.js. Разворачивается одной командой через Docker Compose.

Каждый backend в ответе возвращает своё имя (`server`) — так видно, кто именно обработал запрос.

---

## Быстрый старт

### Запуск через Docker Compose

```bash
docker compose up --build
```

После запуска доступны следующие адреса:

| Адрес | Балансировщик | Алгоритм |
|---|---|---|
| http://localhost/ | Nginx | Round Robin |
| http://localhost:8081/ | Nginx | Least Connections |
| http://localhost:8082/ | Nginx | IP Hash |
| http://localhost:9000/ | HAProxy | Round Robin |
| http://localhost:9001/ | HAProxy | Least Connections |
| http://localhost:8404/stats | HAProxy | Веб-статистика |

Логин для HAProxy статистики: `admin` / `admin123`

### Остановка

```bash
docker compose down
```

---

## Алгоритмы балансировки

### Round Robin (по умолчанию)
Запросы раздаются серверам строго по очереди: 1 → 2 → 1 → 2 → ...

Подходит когда запросы примерно одинаковые по нагрузке.

```
Запрос 1 → backend-1
Запрос 2 → backend-2
Запрос 3 → backend-1
Запрос 4 → backend-2
```

### Least Connections
Следующий запрос уходит на сервер с наименьшим числом активных соединений прямо сейчас.

Подходит когда запросы разной длительности — долгий запрос на одном сервере не блокирует распределение.

```
backend-1: 8 активных соединений
backend-2: 3 активных соединения  ← следующий запрос пойдёт сюда
```

### IP Hash
IP-адрес клиента хэшируется и клиент всегда попадает на один и тот же сервер (sticky session).

Подходит когда сервер хранит состояние сессии в памяти.

```
IP 192.168.1.5  → всегда backend-1
IP 10.0.0.3     → всегда backend-2
```

---

## Отказоустойчивость

### Nginx: пассивные проверки
```nginx
server 127.0.0.1:3000 max_fails=2 fail_timeout=30s;
```
Nginx узнаёт о падении сервера когда реальный запрос провалится. После 2 сбоев подряд — исключает сервер на 30 секунд.

### HAProxy: активные проверки
```
server backend1 backend1:3000 check inter 2s rise 2 fall 3
```
HAProxy сам каждые 2 секунды стучится на каждый сервер независимо от клиентского трафика:
- `inter 2s` — интервал проверки
- `rise 2` — сервер считается живым после 2 успешных проверок подряд
- `fall 3` — сервер исключается после 3 неудачных проверок подряд

Сервер исключается **до** того, как клиент получит ошибку.

### Резервный сервер
`backend-3` помечен как `backup` в обоих балансировщиках. Он не получает трафик пока живы основные серверы и автоматически включается когда оба основных недоступны.

---

## Локальный запуск (без Docker)

Потребуется установленные Nginx и HAProxy.

Открыть четыре терминала:

```bash
# Терминал 1
npm install && npm run start:3000

# Терминал 2
npm run start:3001

# Терминал 3
npm run start:3002

# Терминал 4 — Nginx
nginx -c $(pwd)/nginx.conf

# Терминал 5 — HAProxy
haproxy -f haproxy.cfg
```

---

## Endpoints backend-сервера

| Метод | URL | Описание |
|---|---|---|
| GET | `/` | Имя сервера, порт, время ответа |
| GET | `/health` | Статус сервера (используется для health check) |
| GET | `/api/info` | Имя сервера, порт, uptime |

Пример ответа `/`:
```json
{
  "message": "Response from backend server",
  "server": "backend-1",
  "port": 3000,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```