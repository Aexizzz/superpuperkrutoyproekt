// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import type { ReactNode } from 'react';
import { ApiError } from '../api/http';

/** Блок ошибки с кнопкой «Повторить». */
export function ErrorState({
  error,
  onRetry,
  className = 'page-section',
}: {
  error: ApiError | Error;
  onRetry?: () => void;
  className?: string;
}) {
  const message = error.message || 'Не удалось загрузить данные.';
  return (
    <section className={`container ${className}`} role="alert">
      <p className="error">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-gray inline-btn" onClick={onRetry}>
          Повторить
        </button>
      )}
    </section>
  );
}

export function LoadingState({ text = 'Загрузка...' }: { text?: string }) {
  return <p className="container page-section muted">{text}</p>;
}

/** Пустое состояние: заголовок, пояснение, действие. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p className="muted">{description}</p>}
      {action}
    </div>
  );
}
