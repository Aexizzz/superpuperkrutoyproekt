// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/** Заказы и оплата. Все методы требуют авторизации. */
import type { CreateOrderInput, Order, Paginated } from '../types';
import { http, toPaginated } from './http';

export const listOrders = async (query: { limit?: number; offset?: number } = {}): Promise<Paginated<Order>> => {
  const data = await http.get<Order[] | Paginated<Order>>('/orders', query);
  return toPaginated(data, query);
};

export const getOrder = (id: number, signal?: AbortSignal): Promise<Order> =>
  http.get<Order>(`/orders/${id}`, undefined, signal);

/**
 * Создаёт заказ и запускает оплату.
 * Цену и наличие сервер пересчитывает сам — клиентским данным не доверяет.
 */
export const createOrder = (input: CreateOrderInput): Promise<Order> =>
  http.post<Order>('/orders', input);

export const cancelOrder = (id: number): Promise<Order> =>
  http.post<Order>(`/orders/${id}/cancel`);
