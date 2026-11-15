// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/auth';
import { ApiError } from '../api/http';
import { session } from '../api/session';
import type { LoginInput, ProfilePatch, RegisterInput, User } from '../types';

interface AuthValue {
  user: User | null;
  /** true, пока при старте проверяем сохранённую сессию */
  initializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  /** перечитать пользователя с сервера */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // снимок из localStorage — чтобы не мигать логином при перезагрузке
  const [user, setUser] = useState<User | null>(() => session.getCachedUser());
  const [initializing, setInitializing] = useState(() => session.hasAccessToken());

  // при старте подтверждаем сессию у сервера: токен мог протухнуть, роль — измениться
  useEffect(() => {
    if (!session.hasAccessToken()) return; // initializing уже false — токена не было при монтировании
    let alive = true;
    authApi
      .getMe()
      .then((me) => {
        if (alive) setUser(me);
      })
      .catch((err: unknown) => {
        // 401 уже обработан в http.ts (refresh + разлогин)
        if (alive && ApiError.is(err) && err.code === 'unauthorized') setUser(null);
      })
      .finally(() => {
        if (alive) setInitializing(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // токен протух где-то в другом запросе — разлогиниваем без перезагрузки
  useEffect(() => session.onExpired(() => setUser(null)), []);

  const login = useCallback(async (input: LoginInput) => {
    const auth = await authApi.login(input);
    setUser(auth.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const auth = await authApi.register(input);
    setUser(auth.user);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await authApi.logout();
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    const updated = await authApi.updateMe(patch);
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await authApi.getMe());
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, initializing, login, register, logout, updateProfile, refreshUser }),
    [user, initializing, login, register, logout, updateProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
