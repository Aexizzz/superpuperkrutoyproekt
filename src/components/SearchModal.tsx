// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as productsApi from '../api/products';
import { ApiError } from '../api/http';
import { CATEGORIES } from '../types';
import type { Category, Product } from '../types';
import { formatPrice } from '../utils/format';
import Img from './Img';
import { CloseIcon, SearchIcon } from './Icons';

const LIMIT = 6;
const DEBOUNCE_MS = 300;

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>('iPhone');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // поиск на сервере с дебаунсом; предыдущий запрос отменяется
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      productsApi
        .listProducts({
          q: query.trim() || undefined,
          category: category ?? undefined,
          limit: LIMIT,
        })
        .then((page) => {
          if (!controller.signal.aborted) setResults(page.items);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setError(ApiError.is(err) ? err.message : 'Поиск недоступен');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, category]);

  const open = (id: number) => {
    onClose();
    navigate(`/product/${id}`);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Поиск">
        <label className="search-field">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найдите устройство по душе"
            aria-label="Строка поиска"
          />
        </label>

        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? 'chip-active' : ''}`}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>

        <ul className="search-results">
          {results.map((p) => (
            <li key={p.id}>
              <button className="search-row" onClick={() => open(p.id)}>
                <Img src={p.image ?? undefined} alt={p.name} className="search-thumb" />
                <span className="search-info">
                  <strong>{p.name}</strong>
                  <span>{formatPrice(p.price)}</span>
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && !loading && (
            <li className="muted search-empty">{error || 'Ничего не найдено'}</li>
          )}
          {loading && <li className="muted search-empty">Поиск...</li>}
        </ul>

        <button className="icon-btn search-close" onClick={onClose} aria-label="Закрыть поиск">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
