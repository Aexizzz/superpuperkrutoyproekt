# Схема базы данных

Предложение под контракт из [`openapi.yaml`](../openapi.yaml). SQL — PostgreSQL, но структура
переносится на MySQL/SQLite почти без изменений. Имена в `snake_case`, поля в JSON — `camelCase`
(преобразование делает ORM или сериализатор).

```sql
-- Пользователи ---------------------------------------------------------------
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL DEFAULT '',
  email         CITEXT      NOT NULL UNIQUE,
  phone         TEXT        NOT NULL DEFAULT '',
  -- argon2id / bcrypt; никогда не хранить открытый пароль
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  bonuses       INTEGER     NOT NULL DEFAULT 0 CHECK (bonuses >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refresh-токены: храним хеш, а не сам токен; ротация при каждом refresh ----
CREATE TABLE refresh_tokens (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT        NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

-- Товары ---------------------------------------------------------------------
CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL
              CHECK (category IN ('iPhone', 'MacBook', 'iMac', 'AirPods', 'Apple Watch')),
  price       INTEGER     NOT NULL CHECK (price > 0),   -- рубли, целое
  image       TEXT,
  description TEXT        NOT NULL DEFAULT '',
  detail      TEXT,
  in_stock    BOOLEAN     NOT NULL DEFAULT true,
  -- мягкое удаление: на товар ссылаются позиции заказов
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON products (category) WHERE deleted_at IS NULL;
-- поиск по названию: ILIKE '%q%' требует pg_trgm
CREATE INDEX ON products USING gin (name gin_trgm_ops);

-- Новости --------------------------------------------------------------------
CREATE TABLE news (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT        NOT NULL,
  category     TEXT        NOT NULL
               CHECK (category IN ('Инструкции', 'Обзоры', 'Советы', 'Подборки')),
  image        TEXT,
  -- лента фото внутри статьи
  gallery      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  -- блоки статьи: [{ "heading": "...", "paragraphs": ["..."] }]
  sections     JSONB       NOT NULL,
  views        INTEGER     NOT NULL DEFAULT 0 CHECK (views >= 0),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON news (published_at DESC);
CREATE INDEX ON news (category);

-- Просмотры: чтобы не накручивать счётчик одним и тем же посетителем -------
CREATE TABLE news_views (
  news_id   BIGINT      NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  viewer_key TEXT       NOT NULL,          -- hash(ip + user_agent) или user_id
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (news_id, viewer_key)
);

-- Заказы ---------------------------------------------------------------------
CREATE TABLE orders (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT      NOT NULL REFERENCES users(id),
  status             TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  -- итог пересчитывает сервер, из строк order_items
  total              INTEGER     NOT NULL CHECK (total >= 0),
  payment_method     TEXT        NOT NULL CHECK (payment_method IN ('card', 'applepay')),
  payment_provider   TEXT,                  -- stripe / cloudpayments / yookassa
  provider_payment_id TEXT,
  idempotency_key    TEXT        UNIQUE,    -- защита от двойного заказа
  comment            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON orders (user_id, created_at DESC);

-- Позиции: снимок названия и цены на момент заказа -------------------------
CREATE TABLE order_items (
  id         BIGSERIAL PRIMARY KEY,
  order_id   BIGINT  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT  REFERENCES products(id) ON DELETE SET NULL,
  name       TEXT     NOT NULL,
  price      INTEGER  NOT NULL CHECK (price >= 0),
  quantity   INTEGER  NOT NULL CHECK (quantity > 0),
  image      TEXT
);
CREATE INDEX ON order_items (order_id);
```

## Ключевые решения

**Мягкое удаление товаров.** `deleted_at` вместо `DELETE`: заказ ссылается на `product_id`,
а история покупок не должна ломаться. В каталог попадают только строки `deleted_at IS NULL`.

**Снимок цены в `order_items`.** Цена товара меняется, а сумма в старом заказе — нет.
Поэтому `name`, `price` и `image` дублируются в позиции.

**Итог заказа считается на сервере.** `orders.total` — сумма по `order_items`, а не то,
что пришло с клиента. Позиции перечитываются из БД при создании заказа.

**`idempotency_key`.** Двойной клик по «Оплатить» или ретрай сети не должен создавать второй заказ.
Повтор с тем же ключом возвращает уже созданный заказ.

**`sections` в JSONB.** Структурированные блоки статьи вместо HTML — рендерятся списком,
без `dangerouslySetInnerHTML` и без риска XSS.

**`news_views`.** Уникальная пара `(news_id, viewer_key)` + окно по времени даёт честный счётчик
просмотров без накрутки.

**`refresh_tokens.token_hash`.** Сам токен не хранится: утечка БД не даёт войти под пользователем.
Ротация при каждом обновлении, старый помечается `revoked_at`.

## Что должен гарантировать бэкенд на уровне API

- Пароль — только хеш (`argon2id`, минимум 12 раундов bcrypt как альтернатива).
- Все запросы к БД — параметризованные (ORM или `$1, $2`), без склейки строк.
- Роль проверяется по `users.role` на каждом защищённом запросе, а не по данным клиента.
- `PATCH /auth/me` не позволяет менять `role` и `bonuses` — только перечисленные поля.
- Начисление бонусов — отдельным серверным действием при оплате, не из тела запроса.
