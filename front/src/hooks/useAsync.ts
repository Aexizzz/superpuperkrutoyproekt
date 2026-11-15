// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
/**
 * Хук для одного асинхронного запроса: статус, данные, ошибка, повторы.
 *
 *   const { data, loading, error, reload } = useAsync(
 *     (signal) => productsApi.getProduct(id, signal),
 *     [id],
 *   );
 *
 * Предыдущий запрос отменяется при смене зависимостей или размонтировании,
 * поэтому результаты не приходят «не в том порядке».
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';
import { ApiError } from '../api/http';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | null;
  /** ручной перезапрос (например, после сохранения) */
  reload: () => void;
  setData: (value: T) => void;
}

export function useAsync<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setLoading(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((value) => {
        if (!alive) return;
        setData(value);
      })
      .catch((err: unknown) => {
        if (!alive || controller.signal.aborted) return;
        setError(
          ApiError.is(err) ? err : new ApiError('Не удалось загрузить данные.', 0, 'network_error'),
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload, setData };
}
