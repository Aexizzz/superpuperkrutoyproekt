// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/** Товары. Публичное чтение, изменение — только с ролью admin. */
import type { Paginated, Product, ProductInput, ProductQuery } from '../types';
import { http, toPaginated } from './http';

export const listProducts = async (query: ProductQuery = {}): Promise<Paginated<Product>> => {
  const data = await http.get<Product[] | Paginated<Product>>('/products', {
    category: query.category,
    q: query.q,
    inStock: query.inStock,
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  return toPaginated(data, query);
};

/** Все товары одной категории (каталог грузит их разом). */
export const listProductsByCategory = async (category: ProductQuery['category']): Promise<Product[]> => {
  const { items } = await listProducts({ category, limit: 200 });
  return items;
};

export const getProduct = (id: number, signal?: AbortSignal): Promise<Product> =>
  http.get<Product>(`/products/${id}`, undefined, signal);

export const createProduct = (input: ProductInput): Promise<Product> =>
  http.post<Product>('/products', input);

export const updateProduct = (id: number, input: Partial<ProductInput>): Promise<Product> =>
  http.patch<Product>(`/products/${id}`, input);

export const deleteProduct = (id: number): Promise<void> =>
  http.delete<void>(`/products/${id}`);
