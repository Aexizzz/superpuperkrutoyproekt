// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/http';
import Img from '../../components/Img';
import { EmptyState, ErrorState } from '../../components/States';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { ORDER_STATUS_LABELS } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';

const recommended = [
  { key: 'macbook', title: 'MacBook', text: '14" теперь с чипом M6', cat: 'MacBook', image: '/images/tile-macbook.jpg', dark: true },
  { key: 'airpods', title: 'AirPods', text: 'Исследуйте магию Активного Шумоподавления', cat: 'AirPods', image: '/images/tile-airpods.jpg', dark: true },
  { key: 'iphone', title: 'iPhone', text: 'Больше мощностей', cat: 'iPhone', image: '/images/tile-iphone.png', dark: false },
  { key: 'imac', title: 'iMac', text: 'Новый чип для ИИ', cat: 'iMac', image: '/images/tile-imac.png', dark: false },
];

export default function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  const { data, loading, error, reload } = useAsync(
    (_signal: AbortSignal) => ordersApi.listOrders({ limit: 50 }).then((page) => page.items),
    [],
  );

  if (!user) return null;

  const orders = data ?? [];
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || 'U';
  const shownOrders = showAll ? orders : orders.slice(0, 3);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) return setSaveError('Введите имя');
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(form);
      setEditing(false);
    } catch (err) {
      setSaveError(ApiError.is(err) ? err.message : 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  const exit = async () => {
    await logout();
    navigate('/');
  };

  return (
    <section className="container profile">
      <aside className="profile-side">
        <div className="avatar">{initials}</div>

        {editing ? (
          <form onSubmit={save} className="profile-edit">
            <label className="field"><span>Имя</span>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </label>
            <label className="field"><span>Фамилия</span>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </label>
            <label className="field"><span>Телефон</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            {saveError && <small className="error" role="alert">{saveError}</small>}
            <button className="btn btn-blue btn-block" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
            <button type="button" className="btn btn-gray btn-block" onClick={() => setEditing(false)}>Отмена</button>
          </form>
        ) : (
          <>
            <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
            <p className="profile-phone">{user.phone || user.email}</p>
            <p className="profile-stat">Заказов <strong>{orders.length}</strong></p>
            <p className="profile-stat">Бонусы <strong className="blue">{formatPrice(user.bonuses)}</strong></p>
            <button className="btn btn-blue btn-block" onClick={() => setEditing(true)}>Редактировать профиль</button>
            <button className="btn btn-gray btn-block" onClick={exit}>Выход</button>
          </>
        )}
      </aside>

      <div className="profile-main">
        <div className="row-between">
          <h2>Мои заказы</h2>
          {orders.length > 3 && (
            <button className="link link-btn" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Свернуть' : 'Все заказы'}
            </button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} className="state-block" />
        ) : loading ? (
          <p className="muted">Загрузка заказов...</p>
        ) : orders.length === 0 ? (
          <EmptyState
            title="Заказов пока нет"
            description="Выберите устройство в каталоге — оно появится здесь после оплаты."
            action={<Link to="/catalog" className="btn btn-blue inline-btn">В каталог</Link>}
          />
        ) : (
          <ul className="orders">
            {shownOrders.map((o) => {
              const first = o.items[0];
              const title =
                o.items.length > 1
                  ? `${first?.name ?? 'Заказ'} и ещё ${o.items.length - 1}`
                  : first?.name ?? 'Заказ';
              return (
                <li key={o.id} className="order-row">
                  <Img src={first?.image ?? undefined} alt={title} className="order-row-img" />
                  <div className="order-row-info">
                    <strong>{title}</strong>
                    <span>Заказ #{o.id} • {formatDate(o.createdAt)}</span>
                    <span className={o.status === 'shipped' || o.status === 'pending' ? 'blue' : ''}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </div>
                  <div className="order-row-sum">
                    <span>Сумма</span>
                    <strong>{formatPrice(o.total)}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="row-between">
          <h2>Рекомендуем к покупке</h2>
          <Link to="/catalog" className="link">Каталог</Link>
        </div>

        <div className="recommend">
          {recommended.map((t) => (
            <Link
              key={t.key}
              to={`/catalog?cat=${encodeURIComponent(t.cat)}`}
              className={`tile tile-${t.key} ${t.dark ? 'tile-dark' : ''}`}
            >
              <Img src={t.image} alt={t.title} className="tile-img" />
              <div className="tile-text">
                <strong>{t.title}</strong>
                <span>{t.text}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
