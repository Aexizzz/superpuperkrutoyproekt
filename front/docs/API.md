# Nuvio API — договор с бэкендом

Полная схема — [`openapi.yaml`](../openapi.yaml). Здесь — что именно ждёт фронтенд и почему.

## Общие правила

| | |
|---|---|
| База | `VITE_API_URL`, по умолчанию `/api` |
| Формат | JSON, `Content-Type: application/json` |
| Кодировка | UTF-8, тексты на русском |
| Авторизация | `Authorization: Bearer <accessToken>` |
| CORS | В проде не нужен (один хост). В dev — `http://localhost:5173`, `credentials: true` |
| Идентификаторы | целые числа (`int64`) |
| Даты | ISO 8601 UTC: `2026-03-12T09:00:00Z` |
| Деньги | целые числа в рублях, без копеек |

### Формат ошибки

```json
{
  "error": {
    "code": "validation_error",
    "message": "Проверьте номер телефона",
    "fields": { "phone": "Введите номер в формате +7 (900) 000-00-00" }
  }
}
```

`message` показывается пользователю как есть — пишите по-русски. `fields` (необязательно) подсвечивает конкретные поля формы.

| HTTP | code | Когда |
|---|---|---|
| 400 / 422 | `validation_error` | невалидные данные |
| 401 | `invalid_credentials` | неверная почта/пароль при входе |
| 401 | `unauthorized` | нет/протух токен |
| 403 | `forbidden` | не админ, чужой заказ |
| 404 | `not_found` | нет такого объекта |
| 409 | `email_taken` | почта занята при регистрации/смене |
| 409 | `stock_changed` | товара нет в наличии или цена изменилась |
| 429 | `rate_limited` | слишком много попыток |
| 5xx | `server_error` | внутренняя ошибка |

### Пагинация

Запросы списков принимают `limit` (1–200, по умолчанию 20) и `offset`, отвечают:

```json
{ "items": [], "total": 123, "limit": 20, "offset": 0 }
```

Фронтенд терпит и голый массив в ответе (`toPaginated` в `src/api/http.ts`), но `{items,...}` предпочтительнее.

---

## Auth

### `POST /auth/register`

```json
{ "firstName": "Пётр", "lastName": "Паркер", "email": "peter@mail.com", "phone": "+7 (900) 000-00-00", "password": "secret123" }
```

`201` → `{ "accessToken": "...", "refreshToken": "...", "user": { ... } }`

Правила: почта уникальна (иначе `409 email_taken`), пароль ≥ 6 символов, телефон ≥ 10 цифр. Пароль — bcrypt/argon2, никогда в открытом виде.

### `POST /auth/login`

`{ "email", "password" }` → `200` с той же формой, что и регистрация. Неверные данные — `401 invalid_credentials` (без подсказок, что именно неверно). Стоит ограничить попытки: 10 в минуту на IP.

### `POST /auth/refresh`

Принимает `{ "refreshToken": "..." }` либо httpOnly-cookie. Возвращает новую пару. Старый refresh-токен должен становиться недействительным (ротация). Клиент вызывает сам при `401`.

### `POST /auth/logout`

`204`. Отзывает refresh-токен. Фронтенд чистит хранилище в любом случае.

### `GET /auth/me`

Вызывается при каждом старте приложения, если в хранилище есть токен. Возвращает актуального пользователя — роль и бонусы могли измениться.

### `PATCH /auth/me`

`{ firstName?, lastName?, email?, phone? }` → обновлённый `User`. Смена почты на занятую — `409`.

### Роли и права

| Действие | user | admin |
|---|---|---|
| Читать каталог/новости | ✅ | ✅ |
| Создавать заказы | ✅ | ✅ |
| Смотреть только свои заказы | ✅ | ✅ |
| CRUD товаров и новостей | ❌ 403 | ✅ |

Права проверяются **на сервере**, а не по тому, что фронтенд спрятал кнопку.

---

## Products

`GET /products?category=iPhone&q=pro&inStock=true&sort=price_asc&limit=20&offset=0`

- `category` — одно из `iPhone | MacBook | iMac | AirPods | Apple Watch` (кириллица не используется).
- `q` — поиск по названию, регистронезависимый (`ILIKE '%q%'`).
- `sort` — `price_asc`, `price_desc`, `new` (по `created_at desc`).

`GET /products/:id` → `Product`, иначе `404`.

`POST /products` (admin) → `201 Product`. `PATCH /products/:id` (admin) → `200 Product`. `DELETE /products/:id` (admin) → `204`.

**Удаление лучше сделать мягким** (`deleted_at`): на товар ссылаются позиции заказов, а `OrderItem` хранит снимок названия и цены.

Форма `Product`:

```json
{
  "id": 1,
  "name": "iPhone 18 Pro",
  "category": "iPhone",
  "price": 100990,
  "image": "/images/iphone-18-pro-black.png",
  "description": "Buy from $1199 or $49.95 for 24 mo.",
  "detail": "Lease from $34.99 for 24 mo with Nuvio Upgrade",
  "inStock": true,
  "createdAt": "2026-03-12T09:00:00Z"
}
```

---

## News

`GET /news?category=Обзоры&q=...` — рубрики кириллицей: `Инструкции | Обзоры | Советы | Подборки`.

`GET /news/:id` — **увеличивает `views` на 1**. Дедупликация (не чаще раза в N часов на пользователя/IP) — на сервере.

Форма `NewsItem`:

```json
{
  "id": 1,
  "title": "Обзор Google FitBit Air",
  "category": "Обзоры",
  "publishedAt": "2026-07-10T09:00:00Z",
  "views": 6281,
  "image": "/images/news-fitbit.jpg",
  "gallery": ["/images/news-fitbit-2.jpg"],
  "sections": [
    { "heading": "Не умные часы", "paragraphs": ["Абзац 1", "Абзац 2"] }
  ]
}
```

Статьи сохраняются как структурированные блоки (`sections`), а не как HTML — так фронтенд рендерит их без рискованного `dangerouslySetInnerHTML`.

---

## Orders

Все методы требуют авторизации. Пользователь видит **только свои** заказы; чужой `id` → `403`.

### `POST /orders`

Заголовок `Idempotency-Key: <uuid>` (рекомендуется) — повтор с тем же ключом не должен создавать второй заказ.

```json
{
  "items": [{ "productId": 11, "quantity": 1 }],
  "paymentMethod": "card",
  "paymentToken": "tok_...",
  "comment": "Позвонить за час"
}
```

Что обязан сделать сервер:

1. Перечитать товары из БД. **Цены и итог берутся из БД**, клиентским суммам не доверяем.
2. Проверить `inStock` и актуальность цены. Расхождение → `409 stock_changed`.
3. Создать заказ и позиции (со снимком `name`/`price`).
4. Провести оплату у провайдера по `paymentToken`.
5. Вернуть `201 Order` со статусом `paid`, либо `402`/`409` при отказе.

Статусы: `pending → paid → shipped → delivered`, в любой момент до отправки — `cancelled`.

### `GET /orders` — свои заказы, новые первыми.
### `GET /orders/:id` — один заказ.
### `POST /orders/:id/cancel` — отмена; если уже `shipped` → `409`.

---

## Оплата: что должен знать бэкендер

Данные карты (номер, срок, CVC) **не должны попадать на сервер Nuvio**. Схема:

1. Фронтенд создаёт токен у провайдера (Stripe Elements / CloudPayments / ЮKassa) публичным ключом `VITE_PAYMENT_PUBLIC_KEY`.
2. В `POST /orders` уходит только `paymentToken`.
3. Бэкенд списывает деньги серверным ключом и сохраняет `provider_payment_id`.

Сейчас `Checkout` собирает поля карты для валидации UX и отправляет заказ без токена — это место помечено `TODO(оплата)` в `src/pages/Checkout.tsx`.

## Чего фронтенд не делает сам

- Не считает итоговую сумму для списания — только показывает предварительную.
- Не доверяет локальной корзине как источнику правды о цене.
- Не хранит пароли и не хеширует их.
- Не решает, кто админ — берёт роль из `/auth/me`.
