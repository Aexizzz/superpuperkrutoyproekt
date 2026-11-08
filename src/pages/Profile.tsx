// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminProfile from './profile/AdminProfile';
import UserProfile from './profile/UserProfile';

export default function Profile() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  // пока проверяем сохранённый токен — не мигаем формой логина
  if (initializing) return <p className="container page-section muted">Загрузка профиля...</p>;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return user.role === 'admin' ? <AdminProfile /> : <UserProfile />;
}
