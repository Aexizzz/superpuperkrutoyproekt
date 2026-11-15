// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/**
 * Хранилище сессии: access-токен, refresh-токен и снимок пользователя.
 *
 * Access-токен живёт в localStorage и уходит в заголовке Authorization.
 * Refresh-токен по-хорошему должен быть httpOnly-cookie — тогда бэкенд
 * выставляет его сам, а мы просто шлём credentials: 'include'.
 */
import type { AuthResponse, AuthTokens, User } from '../types';

const ACCESS_KEY = 'nuvio.accessToken';
const REFRESH_KEY = 'nuvio.refreshToken';
const USER_KEY = 'nuvio.user';

/** Событие «сессия протухла» — на него подписан AuthContext. */
export const SESSION_EXPIRED_EVENT = 'nuvio:session-expired';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* приватный режим или переполнение — работаем без сохранения */
  }
};

const remove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const session = {
  getAccessToken: (): string | null => read(ACCESS_KEY),

  getRefreshToken: (): string | null => read(REFRESH_KEY),

  hasAccessToken: () => Boolean(read(ACCESS_KEY)),

  /** Снимок пользователя для мгновенной отрисовки до ответа /auth/me. */
  getCachedUser: (): User | null => {
    const raw = read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  saveTokens(tokens: AuthTokens) {
    write(ACCESS_KEY, tokens.accessToken);
    if (tokens.refreshToken) write(REFRESH_KEY, tokens.refreshToken);
  },

  saveUser(user: User) {
    write(USER_KEY, JSON.stringify(user));
  },

  saveAuth(auth: AuthResponse) {
    session.saveTokens(auth);
    session.saveUser(auth.user);
  },

  clear() {
    remove(ACCESS_KEY);
    remove(REFRESH_KEY);
    remove(USER_KEY);
  },

  /** Сообщить приложению, что сессии больше нет. */
  emitExpired() {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  },

  onExpired(handler: () => void): () => void {
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  },
};
