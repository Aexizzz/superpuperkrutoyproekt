// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/**
 * Доменные типы = контракт с бэкендом.
 * Всё, что описано здесь, должно совпадать с openapi.yaml в корне проекта.
 * Если бэкенд меняет форму ответа — правим сначала здесь и в openapi.yaml.
 */

/* ---------- Товары ---------- */

export type Category = 'iPhone' | 'MacBook' | 'iMac' | 'AirPods' | 'Apple Watch';

export const CATEGORIES: readonly Category[] = ['iPhone', 'MacBook', 'iMac', 'AirPods', 'Apple Watch'];

export interface Product {
  id: number;
  name: string;
  category: Category;
  /** цена в рублях, целое число */
  price: number;
  /** абсолютный URL или путь от корня: /images/iphone.jpg */
  image?: string | null;
  description: string;
  detail?: string | null;
  inStock: boolean;
  /** ISO 8601, например 2026-03-12T09:00:00Z */
  createdAt?: string;
}

/** Тело запроса на создание/редактирование товара (без id) */
export interface ProductInput {
  name: string;
  category: Category;
  price: number;
  description: string;
  image?: string | null;
  detail?: string | null;
  inStock?: boolean;
}

export interface ProductQuery extends PaginationQuery {
  category?: Category;
  /** поиск по названию */
  q?: string;
  inStock?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'new';
}

/* ---------- Новости ---------- */

export type NewsCategory = 'Инструкции' | 'Обзоры' | 'Советы' | 'Подборки';

export const NEWS_CATEGORIES: readonly NewsCategory[] = ['Инструкции', 'Обзоры', 'Советы', 'Подборки'];

export interface NewsSection {
  heading: string;
  paragraphs: string[];
}

export interface NewsItem {
  id: number;
  title: string;
  category: NewsCategory;
  /** ISO 8601 — дата публикации, форматируется на клиенте */
  publishedAt: string;
  views: number;
  image?: string | null;
  /** фото внутри статьи (горизонтальная лента) */
  gallery?: string[] | null;
  sections: NewsSection[];
}

export interface NewsInput {
  title: string;
  category: NewsCategory;
  sections: NewsSection[];
  image?: string | null;
  gallery?: string[] | null;
  publishedAt?: string;
}

export interface NewsQuery extends PaginationQuery {
  category?: NewsCategory;
  q?: string;
}

/* ---------- Пользователи и авторизация ---------- */

export type Role = 'user' | 'admin';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  /** бонусные баллы, 1 балл = 1 ₽ */
  bonuses: number;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  /** если бэкенд отдаёт refresh-токен в теле; иначе живёт в httpOnly-cookie */
  refreshToken?: string | null;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

/** Поля профиля, которые пользователь может менять сам */
export type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>;

/* ---------- Заказы ---------- */

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export type PaymentMethod = 'card' | 'applepay';

export interface OrderItem {
  productId: number;
  /** снимок названия и цены на момент заказа */
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Order {
  id: number;
  status: OrderStatus;
  /** сумма в рублях */
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface CreateOrderInput {
  items: { productId: number; quantity: number }[];
  paymentMethod: PaymentMethod;
  /**
   * Токен платёжного провайдера (Stripe / CloudPayments / ЮKassa).
   * Данные карты на наш бэкенд не отправляются — карта токенизируется у провайдера.
   */
  paymentToken?: string;
  comment?: string;
}

/* ---------- Общее ---------- */

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
