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

| Метод | Путь | Доступ | Функция на фронте |
|---|---|---|---|
| POST | `/auth/register` | все | `register` |
| POST | `/auth/login` | все | `login` (поле `login` — почта или телефон) |
| POST | `/auth/refresh` | все | обновить access-токен по `refresh` |
| GET / PATCH | `/users/me` | авторизован | профиль |
| GET | `/products?category=&q=` | все | `getProducts` |
| GET | `/products/{id}` | все | `getProduct` |
| POST / PATCH / DELETE | `/products[/{id}]` | админ | `createProduct` / `updateProduct` / `deleteProduct` |
| GET | `/news?category=` | все | `getNews` |
| GET | `/news/{id}` | все | `getNewsItem` (увеличивает просмотры) |
| POST / PATCH / DELETE | `/news[/{id}]` | админ | `createNews` / `updateNews` / `deleteNews` |
| GET / POST | `/orders` | авторизован | `getOrders` / оформление заказа |

Авторизация: `Authorization: Bearer <accessToken>` из ответа login/register.

## Что дальше

- PostgreSQL вместо SQLite
- пагинация и django-filter, когда данных станет больше
- оплата заказов, загрузка картинок, тесты (`APITestCase`)
