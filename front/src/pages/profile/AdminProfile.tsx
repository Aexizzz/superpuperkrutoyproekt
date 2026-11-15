// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import * as newsApi from '../../api/news';
import * as productsApi from '../../api/products';
import Img from '../../components/Img';
import { ErrorState } from '../../components/States';
import { SearchIcon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { CATEGORIES, NEWS_CATEGORIES } from '../../types';
import type { Category, NewsCategory, NewsItem, Product } from '../../types';
import { formatNumber, formatPrice, formatShortDate } from '../../utils/format';

type Modal =
  | { kind: 'product'; item: Product | null }
  | { kind: 'news'; item: NewsItem | null }
  | null;

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [actionError, setActionError] = useState('');

  const productsState = useAsync(
    (_signal: AbortSignal) => productsApi.listProducts({ limit: 200 }).then((page) => page.items),
    [],
  );
  const newsState = useAsync(
    (_signal: AbortSignal) => newsApi.listNews({ limit: 200 }).then((page) => page.items),
    [],
  );

  if (!user) return null;

  const products = productsState.data ?? [];
  const news = newsState.data ?? [];
  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  const reloadAll = () => {
    productsState.reload();
    newsState.reload();
  };

  const removeProduct = async (p: Product) => {
    if (!window.confirm(`Удалить «${p.name}»?`)) return;
    setActionError('');
    try {
      await productsApi.deleteProduct(p.id);
      productsState.reload();
    } catch (err) {
      setActionError(ApiError.is(err) ? err.message : 'Не удалось удалить товар');
    }
  };

  const removeNews = async (n: NewsItem) => {
    if (!window.confirm(`Удалить новость «${n.title}»?`)) return;
    setActionError('');
    try {
      await newsApi.deleteNews(n.id);
      newsState.reload();
    } catch (err) {
      setActionError(ApiError.is(err) ? err.message : 'Не удалось удалить новость');
    }
  };

  const exit = async () => {
    await logout();
    navigate('/');
  };

  return (
    <section className="container profile">
      <aside className="profile-side">
        <div className="avatar">АД</div>
        <h2 className="profile-name">{user.firstName || 'Администратор'}</h2>
        <p className="profile-phone">{user.email}</p>
        <p className="profile-stat">Товаров <strong>{products.length}</strong></p>
        <p className="profile-stat">Новостей <strong className="blue">{news.length}</strong></p>
        <button className="btn btn-blue btn-block" onClick={() => setModal({ kind: 'product', item: null })}>
          Добавить товар
        </button>
        <button className="btn btn-gray btn-block" onClick={() => setModal({ kind: 'news', item: null })}>
          Добавить новость
        </button>
        <button className="btn btn-gray btn-block" onClick={exit}>Выход</button>
      </aside>

      <div className="profile-main">
        {actionError && <p className="error" role="alert">{actionError}</p>}

        <div className="row-between">
          <h2>Каталог товаров</h2>
          <button className="link link-btn" onClick={() => setModal({ kind: 'product', item: null })}>
            Добавить товар
          </button>
        </div>

        <label className="admin-search">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию"
          />
        </label>

        {productsState.error ? (
          <ErrorState error={productsState.error} onRetry={productsState.reload} className="state-block" />
        ) : productsState.loading ? (
          <p className="muted">Загрузка товаров...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Товар</th><th>Цена</th><th>Статус</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><strong>{formatPrice(p.price)}</strong></td>
                  <td className={p.inStock ? 'green' : 'muted'}>
                    {p.inStock ? 'В каталоге' : 'Нет в наличии'}
                  </td>
                  <td className="actions">
                    <button className="btn-small btn-small-blue" onClick={() => setModal({ kind: 'product', item: p })}>
                      Редактировать
                    </button>
                    <button className="btn-small btn-small-red" onClick={() => removeProduct(p)}>Удалить</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="muted">Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        )}

        <div className="row-between">
          <h2>Управление новостями</h2>
          <button className="link link-btn" onClick={() => setModal({ kind: 'news', item: null })}>
            Добавить новость
          </button>
        </div>

        {newsState.error ? (
          <ErrorState error={newsState.error} onRetry={newsState.reload} className="state-block" />
        ) : newsState.loading ? (
          <p className="muted">Загрузка новостей...</p>
        ) : news.length === 0 ? (
          <p className="muted">Новостей пока нет.</p>
        ) : (
          <ul className="orders">
            {news.map((n) => (
              <li key={n.id} className="order-row">
                <Img src={n.image ?? undefined} alt={n.title} className="news-thumb" />
                <div className="order-row-info">
                  <strong>{n.title}</strong>
                  <span>{formatShortDate(n.publishedAt)} • {formatNumber(n.views)} просмотров</span>
                </div>
                <div className="actions">
                  <button className="btn-small btn-small-blue" onClick={() => setModal({ kind: 'news', item: n })}>
                    Редактировать
                  </button>
                  <button className="btn-small btn-small-red" onClick={() => removeNews(n)}>Удалить</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal?.kind === 'product' && (
        <ProductModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reloadAll(); }}
        />
      )}
      {modal?.kind === 'news' && (
        <NewsModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reloadAll(); }}
        />
      )}
    </section>
  );
}

interface ModalProps<T> {
  item: T | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductModal({ item, onClose, onSaved }: ModalProps<Product>) {
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'iPhone');
  const [description, setDescription] = useState(item?.description ?? '');
  const [image, setImage] = useState(item?.image ?? '');
  const [inStock, setInStock] = useState(item?.inStock ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(price);
    if (!name.trim()) return setError('Введите название');
    if (!Number.isFinite(value) || value <= 0) return setError('Цена должна быть больше нуля');

    const payload = {
      name: name.trim(),
      price: value,
      category,
      description: description.trim(),
      image: image.trim() || null,
      inStock,
    };

    setSaving(true);
    setError('');
    try {
      if (item) await productsApi.updateProduct(item.id, payload);
      else await productsApi.createProduct(payload);
      onSaved();
    } catch (err) {
      setError(ApiError.is(err) ? err.message : 'Не удалось сохранить товар');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h3>{item ? 'Редактировать товар' : 'Новый товар'}</h3>
        <label className="field"><span>Название</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field"><span>Цена, ₽</span>
          <input value={price} inputMode="numeric" onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="field"><span>Категория</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field"><span>Описание</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Короткое описание" />
        </label>
        <label className="field"><span>Картинка (URL)</span>
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/images/iphone-18-pro.png" />
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
          В наличии
        </label>
        {error && <small className="error" role="alert">{error}</small>}
        <div className="modal-actions">
          <button type="button" className="btn btn-gray" onClick={onClose}>Отмена</button>
          <button className="btn btn-blue" disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</button>
        </div>
      </form>
    </div>
  );
}

function NewsModal({ item, onClose, onSaved }: ModalProps<NewsItem>) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [category, setCategory] = useState<NewsCategory>(item?.category ?? 'Обзоры');
  const [image, setImage] = useState(item?.image ?? '');
  const [heading, setHeading] = useState(item?.sections?.[0]?.heading ?? '');
  const [body, setBody] = useState(item?.sections?.[0]?.paragraphs?.join('\n\n') ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Введите заголовок');
    if (!heading.trim()) return setError('Введите первый подзаголовок');

    const payload = {
      title: title.trim(),
      category,
      image: image.trim() || null,
      sections: [
        {
          heading: heading.trim(),
          paragraphs: body
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean),
        },
      ],
    };

    setSaving(true);
    setError('');
    try {
      if (item) await newsApi.updateNews(item.id, payload);
      else await newsApi.createNews(payload);
      onSaved();
    } catch (err) {
      setError(ApiError.is(err) ? err.message : 'Не удалось сохранить новость');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h3>{item ? 'Редактировать новость' : 'Новая новость'}</h3>
        <label className="field"><span>Заголовок</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field"><span>Рубрика</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as NewsCategory)}>
            {NEWS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field"><span>Картинка (URL)</span>
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/images/news-imac.jpg" />
        </label>
        <label className="field"><span>Подзаголовок</span>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} />
        </label>
        <label className="field"><span>Текст (абзацы через пустую строку)</span>
          <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        {error && <small className="error" role="alert">{error}</small>}
        <div className="modal-actions">
          <button type="button" className="btn btn-gray" onClick={onClose}>Отмена</button>
          <button className="btn btn-blue" disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</button>
        </div>
      </form>
    </div>
  );
}
