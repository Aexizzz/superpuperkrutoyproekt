// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/http';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL_RE.test(email)) next.email = 'Введите корректную почту';
    if (password.length < 6) next.password = 'Минимум 6 символов';
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/profile');
    } catch (err) {
      // сервер может вернуть ошибки по конкретным полям
      if (ApiError.is(err)) {
        setErrors(err.fieldErrors);
        setServerError(err.fieldErrors.email || err.fieldErrors.password ? '' : err.message);
      } else {
        setServerError(err instanceof Error ? err.message : 'Не удалось войти');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell image="/images/auth-login.jpg">
      <form onSubmit={submit} noValidate className="auth-form">
        <label className="field">
          <span>Электронная почта</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@mail.com"
            className={errors.email ? 'invalid' : ''}
          />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={errors.password ? 'invalid' : ''}
          />
          {errors.password && <small className="error">{errors.password}</small>}
        </label>
        {serverError && <small className="error" role="alert">{serverError}</small>}
        <button className="btn btn-blue btn-block" disabled={loading}>
          {loading ? 'Входим...' : 'Войти'}
        </button>
        <p className="auth-switch">
          Впервые у нас? <Link to="/register">Регистрация</Link>
        </p>
      </form>
    </AuthShell>
  );
}
