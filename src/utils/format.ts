// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
/** Форматирование значений для отображения. */

/** 100990 -> "100 990 ₽" */
export const formatPrice = (value: number): string =>
  `${value.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')} ₽`;

/** "2026-03-12T09:00:00Z" -> "12 марта 2026" */
export const formatDate = (iso: string | undefined | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** "2026-03-12T09:00:00Z" -> "12 марта" */
export const formatShortDate = (iso: string | undefined | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

/** 6281 -> "6 281" */
export const formatNumber = (value: number): string =>
  value.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
