// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/http';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import type { RegisterInput } from '../types';

const PHONE_RE = /^\+?[\d\s()-]{10,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterInput>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof RegisterInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'Введите имя';
    if (!form.lastName.trim()) next.lastName = 'Введите фамилию';
    if (!PHONE_RE.test(form.phone)) next.phone = 'Введите номер в формате +7 (900) 000-00-00';
    if (!EMAIL_RE.test(form.email)) next.email = 'Введите корректную почту';
    if (form.password.length < 6) next.password = 'Минимум 6 символов';
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim(), password: form.password });
      navigate('/profile');
    } catch (err) {
      if (ApiError.is(err)) {
        setErrors(err.fieldErrors);
        if (Object.keys(err.fieldErrors).length === 0) setServerError(err.message);
      } else {
        setServerError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться');
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof RegisterInput, label: string, placeholder: string, type = 'text') => (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        autoComplete={
          key === 'password' ? 'new-password' : key === 'email' ? 'email' : key === 'phone' ? 'tel' : key
        }
        className={errors[key] ? 'invalid' : ''}
      />
      {errors[key] && <small className="error">{errors[key]}</small>}
    </label>
  );

  return (
    <AuthShell image="/images/auth-register.jpg">
      <form onSubmit={submit} noValidate className="auth-form">
        {field('firstName', 'Имя', 'Пётр')}
        {field('lastName', 'Фамилия', 'Паркер')}
        {field('phone', 'Номер телефона', '+7 (900) 000-00-00', 'tel')}
        {field('email', 'Электронная почта', 'name@mail.com', 'email')}
        {field('password', 'Пароль', '••••••••', 'password')}
        {serverError && <small className="error" role="alert">{serverError}</small>}
        <button className="btn btn-blue btn-block" disabled={loading}>
          {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
        </button>
        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </AuthShell>
  );
}
