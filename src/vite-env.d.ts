// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** База API. По умолчанию /api (в dev проксируется на бэкенд). */
  readonly VITE_API_URL?: string;
  /** Таймаут одного запроса в миллисекундах. */
  readonly VITE_API_TIMEOUT_MS?: string;
  /** Публичный ключ платёжного провайдера (карта токенизируется у него). */
  readonly VITE_PAYMENT_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
