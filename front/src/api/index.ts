// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/**
 * Слой API — единственное место, где фронтенд знает про сеть.
 * Компоненты импортируют функции отсюда и не знают ни про fetch, ни про URL.
 */
export * from './http';
export * as authApi from './auth';
export * as productsApi from './products';
export * as newsApi from './news';
export * as ordersApi from './orders';
export { session } from './session';
