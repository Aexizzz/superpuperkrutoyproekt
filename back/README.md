# Nuvio — бэкенд (Django REST Framework)

Базовая архитектура API для фронта из `../front`.

## Запуск

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed           # админ admin@nuvio.ru / admin123 + товары
python manage.py runserver      # http://localhost:8000/api/ , админка — /admin/
```

## Структура

```
config/             # settings.py (DRF, JWT, CORS), urls.py (роутер), wsgi/asgi
apps/
  common/           # общие permissions: IsAdminRole, IsAdminOrReadOnly
  users/            # кастомный User (почта или телефон), вход по любому из них, JWT
  catalog/          # Product + команда manage.py seed
  news/             # News (gallery и sections — JSONField)
  orders/           # Order + OrderItem (снимок товара на момент покупки)
```

В каждом приложении: `models.py` → `serializers.py` (валидация и создание) → `views.py` (ViewSet/APIView)
→ `admin.py`. ViewSet'ы регистрируются в `config/urls.py` через `DefaultRouter`.

JSON в API — camelCase (`djangorestframework-camel-case`), как в `front/src/types`.

## Эндпоинты (`/api`)

Контракт — `front/docs/API.md`. Бэк подогнан под него: JSON в camelCase, списки —
`{items, total, limit, offset}` (`?limit=&offset=`, по умолчанию 20, максимум 200),
ошибки — `{"error": {"code", "message", "fields"}}` (`apps/common/exceptions.py`).

| Метод | Путь | Доступ | Функция на фронте |
|---|---|---|---|
| POST | `/auth/register` | все | `authApi.register` — firstName, lastName, email, phone, password; занятая почта → `409 email_taken` |
| POST | `/auth/login` | все | `authApi.login` — `{email, password}` (можно и телефон); неверно → `401 invalid_credentials` |
| POST | `/auth/refresh` | все | `{refreshToken}` → новая пара, старый refresh отзывается |
| POST | `/auth/logout` | все | `{refreshToken}` → `204`, токен в blacklist |
| GET / PATCH | `/auth/me` | авторизован | `getMe` / `updateMe` (старый путь `/users/me` тоже работает) |
| POST | `/auth/change-password` | авторизован | `{currentPassword, newPassword}` → `204` |
| GET | `/products?category=&q=&inStock=&sort=price_asc\|price_desc\|new` | все | `listProducts` |
| GET | `/products/{id}` | все | `getProduct` |
| POST / PATCH / DELETE | `/products[/{id}]` | админ | `createProduct` / `updateProduct` / `deleteProduct` |
| GET | `/news?category=&q=` | все | `listNews` |
| GET | `/news/{id}` | все | `getNewsItem` (увеличивает просмотры) |
| POST / PATCH / DELETE | `/news[/{id}]` | админ | `createNews` / `updateNews` / `deleteNews` |
| GET / POST | `/orders` | авторизован | `listOrders` / `createOrder`; товар не в наличии → `409 stock_changed` |
| GET | `/orders/{id}` | владелец | `getOrder`; чужой → `403` |
| POST | `/orders/{id}/cancel` | владелец | `cancelOrder`; уже отправлен → `409` |

Статусы заказа: `pending → paid → shipped → delivered`, `cancelled`. Оплата не подключена:
заказ создаётся в `pending` (см. `TODO(оплата)` в `apps/orders/serializers.py`).

Авторизация: `Authorization: Bearer <accessToken>` из ответа login/register.

## Связка с фронтом

```bash
# терминал 1
python manage.py runserver          # :8000
# терминал 2, в ../front
npm run dev                         # :5173, /api проксируется на :8000 (VITE_PROXY_TARGET)
```
