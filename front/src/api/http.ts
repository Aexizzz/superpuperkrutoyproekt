// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/**
 * Единая точка выхода в сеть.
 *
 * Договорённости с бэкендом (см. docs/API.md):
 *  - база: VITE_API_URL (по умолчанию /api — в dev его проксирует Vite);
 *  - авторизация: Bearer <accessToken> в заголовке Authorization;
 *  - ошибки: любой не-2xx ответ имеет тело { error: { code, message, fields? } };
 *  - 401 на защищённом запросе → один раз пробуем refresh, потом разлогин.
 */
import type { AuthResponse, AuthTokens, Paginated } from '../types';
import { session } from './session';

export const API_URL: string = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000);

export type ErrorCode =
  /** сеть недоступна, таймаут, бэкенд не отвечает */
  | 'network_error'
  /** 400/422 — невалидные данные, см. fieldErrors */
  | 'validation_error'
  /** 401 — нет или протух токен */
  | 'unauthorized'
  /** 403 — нет прав (например, не админ) */
  | 'forbidden'
  /** 404 */
  | 'not_found'
  /** 409 — конфликт, например email занят */
  | 'conflict'
  /** 429 — слишком много запросов */
  | 'rate_limited'
  /** 5xx */
  | 'server_error'
  /** всё остальное */
  | 'unknown_error';

/** Ошибка любого запроса. Страницы ловят её и показывают message. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  /** ошибки по полям формы: { email: 'Уже занят' } */
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code: ErrorCode,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  /** Удобно для формы: ApiError.is(err) ? err.fieldErrors : {} */
  static is(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }
}

/** Разбор тела ошибки: ожидаем { error: { code?, message?, fields? } }. */
interface ErrorBody {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
  message?: string;
  errors?: Record<string, string>;
}

const statusToCode = (status: number): ErrorCode => {
  if (status === 400 || status === 422) return 'validation_error';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'unknown_error';
};

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  network_error: 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.',
  validation_error: 'Проверьте правильность заполнения полей.',
  unauthorized: 'Нужно войти в аккаунт.',
  forbidden: 'Недостаточно прав для этого действия.',
  not_found: 'Не найдено.',
  conflict: 'Такие данные уже существуют.',
  rate_limited: 'Слишком много попыток. Попробуйте позже.',
  server_error: 'Ошибка на сервере. Мы уже разбираемся.',
  unknown_error: 'Что-то пошло не так.',
};

const parseErrorBody = async (response: Response): Promise<{ message?: string; code?: string; fields?: Record<string, string> }> => {
  try {
    const text = await response.text();
    if (!text) return {};
    const body = JSON.parse(text) as ErrorBody;
    return {
      message: body.error?.message ?? body.message,
      code: body.error?.code,
      fields: body.error?.fields ?? body.errors,
    };
  } catch {
    return {};
  }
};

/* ---------- Токены ---------- */

/** Обновление токена по refresh-токену. */
const refreshUrl = `${API_URL}/auth/refresh`;

let refreshPromise: Promise<AuthTokens | null> | null = null;

const refreshTokens = async (): Promise<AuthTokens | null> => {
  const refreshToken = session.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as AuthResponse | AuthTokens;
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
    };
    session.saveTokens(tokens);
    if ('user' in data && data.user) session.saveUser(data.user);
    return tokens;
  } catch {
    return null;
  }
};

/** Параллельные 401 не должны поднимать несколько refresh — все ждут один. */
const ensureFreshTokens = (): Promise<AuthTokens | null> => {
  refreshPromise ??= refreshTokens().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

/* ---------- Основной запрос ---------- */

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** тело как JSON; FormData и Blob отправляются как есть */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** не подставлять Authorization (логин, регистрация, refresh) */
  skipAuth?: boolean;
  /** не пытаться обновить токен при 401 */
  skipRefresh?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const buildQuery = (query?: RequestOptions['query']): string => {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, query, skipAuth, skipRefresh, signal, headers } = options;

  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}${buildQuery(query)}`;

  const send = async (token: string | null): Promise<Response> => {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const finalHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
    if (!isForm && body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (token && !skipAuth) finalHeaders.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    // внешний signal тоже должен отменять запрос
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      return await fetch(url, {
        method,
        headers: finalHeaders,
        credentials: 'include',
        signal: controller.signal,
        body: isForm || body === undefined ? (body as BodyInit | undefined) : JSON.stringify(body),
      });
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  };

  let response: Response;
  try {
    response = await send(skipAuth ? null : session.getAccessToken());
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError' && signal?.aborted) {
      // отменил сам вызывающий код — отдаём как есть
      throw err;
    }
    throw new ApiError(DEFAULT_MESSAGES.network_error, 0, 'network_error');
  }

  // 401 → пробуем один раз обновить токен
  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const tokens = await ensureFreshTokens();
    if (tokens) {
      try {
        response = await send(tokens.accessToken);
      } catch {
        throw new ApiError(DEFAULT_MESSAGES.network_error, 0, 'network_error');
      }
    } else {
      session.clear();
      session.emitExpired();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const parsed = await parseErrorBody(response);
    const code = statusToCode(response.status);
    throw new ApiError(
      parsed.message ?? DEFAULT_MESSAGES[code],
      response.status,
      code,
      parsed.fields ?? {},
    );
  }

  // пустое тело на 200 — тоже валидный кейс (например, DELETE)
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Сервер вернул ответ в неизвестном формате.', response.status, 'server_error');
  }
};

/* ---------- Сокращения ---------- */

export const http = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(path, { query, signal }),

  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options: Omit<RequestOptions, 'method'> = {}) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

/**
 * Бэкенд может отдавать как массив, так и { items, total }.
 * Приводим к Paginated, чтобы страницы не думали об этом.
 */
export const toPaginated = <T>(data: T[] | Paginated<T>, query: { limit?: number; offset?: number } = {}): Paginated<T> => {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit: query.limit ?? data.length,
      offset: query.offset ?? 0,
    };
  }
  if (data && Array.isArray(data.items)) return data;
  return { items: [], total: 0, limit: 0, offset: 0 };
};
