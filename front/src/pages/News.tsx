// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as newsApi from '../api/news';
import Img from '../components/Img';
import { ErrorState, LoadingState } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { NEWS_CATEGORIES } from '../types';
import type { NewsCategory } from '../types';
import { formatShortDate, formatNumber } from '../utils/format';

export default function News() {
  const [filter, setFilter] = useState<NewsCategory | 'Все'>('Все');

  const { data, loading, error, reload } = useAsync(
    (_signal: AbortSignal) =>
      newsApi
        .listNews({ category: filter === 'Все' ? undefined : filter, limit: 100 })
        .then((page) => page.items),
    [filter],
  );

  const items = data ?? [];

  return (
    <section className="container page-section">
      <h1 className="page-title">Новости</h1>

      <div className="chips">
        {(['Все', ...NEWS_CATEGORIES] as const).map((c) => (
          <button key={c} className={`chip ${filter === c ? 'chip-active' : ''}`} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} className="state-block" />
      ) : loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <p className="muted">Новостей в этой рубрике пока нет.</p>
      ) : (
        <div className="news-grid">
          {items.map((n) => (
            <Link key={n.id} to={`/news/${n.id}`} className="news-card">
              <Img src={n.image ?? undefined} alt={n.title} className="news-card-img" />
              <div className="news-card-text">
                <strong>{n.title}</strong>
                <span>{formatShortDate(n.publishedAt)} | {formatNumber(n.views)} просмотров</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
