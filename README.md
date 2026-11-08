# Nuvio — фронтенд магазина Apple-техники

React 19 + TypeScript + Vite. Вёрстка по макету из Figma.
**Бэкенда ещё нет:** все данные приходят по HTTP из `src/api/`, моков в проекте не осталось.

## Быстрый старт

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:5173
npm run build             # проверка типов + сборка
npm run lint              # oxlint
```

Пока бэкенд не поднят, страницы каталога и новостей покажут ошибку загрузки — это ожидаемо.

## Что нужно от бэкенда

1. Реализовать контракт из [`openapi.yaml`](openapi.yaml) — это единственный источник правды.
2. Отдавать `/api` на том же хосте в проде. В dev Vite проксирует `/api` на `VITE_PROXY_TARGET` (`http://localhost:3000`).
3. Соблюдать формат ошибок: `{ "error": { "code", "message", "fields?" } }` — фронтенд показывает `message` и подсвечивает поля из `fields`.
4. Придерживаться схемы БД из [`docs/database.md`](docs/database.md) (или повторить связи один в один).

Подробное описание эндпоинтов, кодов ошибок и сценариев — [`docs/API.md`](docs/API.md).

## Структура

```
src/
  api/            # единственное место, где есть сеть
    http.ts       # fetch-обёртка: base URL, JWT, refresh, таймаут, ApiError
    session.ts    # хранение токенов и снимка пользователя
    auth.ts       # вход, регистрация, logout, /auth/me
    products.ts   # каталог
    news.ts       # статьи
    orders.ts     # заказы и оплата
  components/     # Header, Footer, ProductCard, Img, States (загрузка/ошибка/пусто) ...
  context/        # AuthContext (сессия), CartContext (корзина с количеством)
  hooks/          # useAsync — загрузка с отменой запроса
  pages/          # Home, Catalog, Product, Checkout, News, NewsArticle, Login, Register, Profile
  styles/         # index.css
  types/          # доменные типы = контракт
  utils/          # форматирование цены и даты
```

## Маршруты

| Маршрут | Страница |
|---|---|
| `/` | Главная |
| `/catalog?cat=iPhone` | Каталог, фильтр по категории (запрос к серверу) |
| `/product/:id` | Карточка товара |
| `/checkout` | Оформление заказа (требует авторизации) |
| `/news`, `/news/:id` | Новости и статья |
| `/login`, `/register` | Вход и регистрация |
| `/profile` | Профиль: покупатель или админ (по роли) |

## Авторизация

- Access-токен хранится в `localStorage`, уходит в `Authorization: Bearer`.
- На `401` клиент один раз вызывает `POST /api/auth/refresh`. Если refresh не удался — сессия сбрасывается, пользователь разлогинивается.
- Refresh-токен по возможности должен жить в `httpOnly`-cookie (`credentials: 'include'` уже включён).

## Переменные окружения

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `VITE_API_URL` | `/api` | База API |
| `VITE_PROXY_TARGET` | `http://localhost:3000` | Куда dev-сервер проксирует `/api` |
| `VITE_API_TIMEOUT_MS` | `15000` | Таймаут запроса |
| `VITE_PAYMENT_PUBLIC_KEY` | — | Публичный ключ платёжного провайдера |

## Ещё не сделано (за бэкендом)

- **Оплата картой.** Сейчас `Checkout` валидирует поля и отправляет `paymentMethod` в `POST /orders`, но карта никуда не токенизируется. Нужно подключить Stripe / CloudPayments / ЮKassa: провайдер отдаёт `paymentToken`, он уходит в `CreateOrderInput.paymentToken`.
- **Загрузка картинок.** В админке картинка задаётся URL. Для загрузки файлов нужен `POST /uploads` (multipart) — тогда в форме появится `<input type="file">`.
- **Избранное, промокоды, отзывы** — в макете их нет, контрактом не покрыты.

## Картинки

Статика лежит в `public/images/`. Товар или статья ссылаются на неё путём вида `/images/iphone-18-pro.png`.
Если файла нет, `Img` показывает серую заглушку.
