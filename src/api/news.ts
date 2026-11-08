// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/** Новости и статьи. Публичное чтение, изменение — только admin. */
import type { NewsInput, NewsItem, NewsQuery, Paginated } from '../types';
import { http, toPaginated } from './http';

export const listNews = async (query: NewsQuery = {}): Promise<Paginated<NewsItem>> => {
  const data = await http.get<NewsItem[] | Paginated<NewsItem>>('/news', {
    category: query.category,
    q: query.q,
    limit: query.limit,
    offset: query.offset,
  });
  return toPaginated(data, query);
};

export const getNewsItem = (id: number, signal?: AbortSignal): Promise<NewsItem> =>
  http.get<NewsItem>(`/news/${id}`, undefined, signal);

/**
 * Бэкенд сам увеличивает счётчик просмотров при GET /news/:id.
 * Публичный инкремент с дедупликацией по сессии — на стороне сервера.
 */
export const createNews = (input: NewsInput): Promise<NewsItem> =>
  http.post<NewsItem>('/news', input);

export const updateNews = (id: number, input: Partial<NewsInput>): Promise<NewsItem> =>
  http.patch<NewsItem>(`/news/${id}`, input);

export const deleteNews = (id: number): Promise<void> =>
  http.delete<void>(`/news/${id}`);
