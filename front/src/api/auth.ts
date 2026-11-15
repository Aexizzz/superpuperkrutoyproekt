// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/** Авторизация и профиль текущего пользователя. */
import type { AuthResponse, LoginInput, ProfilePatch, RegisterInput, User } from '../types';
import { http } from './http';
import { session } from './session';

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const auth = await http.post<AuthResponse>('/auth/login', input, { skipAuth: true });
  session.saveAuth(auth);
  return auth;
};

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const auth = await http.post<AuthResponse>('/auth/register', input, { skipAuth: true });
  session.saveAuth(auth);
  return auth;
};

/** Завершает сессию. Сервер отзывает refresh-токен; локально чистим всегда. */
export const logout = async (): Promise<void> => {
  try {
    await http.post<void>('/auth/logout', undefined, { skipRefresh: true });
  } catch {
    /* даже если сервер недоступен — пользователь выходит */
  } finally {
    session.clear();
  }
};

/** Проверка сессии при старте приложения и после refresh. */
export const getMe = async (signal?: AbortSignal): Promise<User> => {
  const user = await http.get<User>('/auth/me', undefined, signal);
  session.saveUser(user);
  return user;
};

export const updateMe = async (patch: ProfilePatch): Promise<User> => {
  const user = await http.patch<User>('/auth/me', patch);
  session.saveUser(user);
  return user;
};

export const changePassword = (currentPassword: string, newPassword: string): Promise<void> =>
  http.post<void>('/auth/change-password', { currentPassword, newPassword }, { skipRefresh: false });
