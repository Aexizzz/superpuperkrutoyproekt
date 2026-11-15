// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as productsApi from '../api/products';
import ProductCard from '../components/ProductCard';
import { ErrorState, LoadingState } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { CATEGORIES } from '../types';
import type { Category } from '../types';

export default function Catalog() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('cat');
  const active: Category = CATEGORIES.includes(raw as Category) ? (raw as Category) : 'iPhone';

  // товары перезапрашиваются при смене категории — фильтрацию делает сервер
  const { data, loading, error, reload } = useAsync(
    (_signal: AbortSignal) => productsApi.listProductsByCategory(active),
    [active],
  );

  const [query, setQuery] = useState('');
  const visible = (data ?? []).filter((p) =>
    query.trim() ? p.name.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );

  return (
    <section className="container page-section">
      <h1 className="page-title">Каталог</h1>

      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${c === active ? 'chip-active' : ''}`}
            onClick={() => setParams({ cat: c })}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="admin-search catalog-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск в этой категории"
          aria-label="Поиск в категории"
        />
      </label>

      {error ? (
        <ErrorState error={error} onRetry={reload} className="state-block" />
      ) : loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <p className="muted">В этой категории пока нет товаров.</p>
      ) : (
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
