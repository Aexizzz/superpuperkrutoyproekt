// @owner К+М — общий контракт, менять только по согласованию. Правила: OWNERS.md
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';

export interface CartItem {
  /** снимок товара на момент добавления; цену при оплате всё равно считает сервер */
  product: Product;
  quantity: number;
}

interface CartValue {
  items: CartItem[];
  /** количество позиций (для точки на иконке) */
  count: number;
  /** количество единиц товара */
  units: number;
  total: number;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  has: (productId: number) => boolean;
}

const CartContext = createContext<CartValue | null>(null);

/** v2 — формат с quantity; старый ключ nuvio_cart больше не читаем */
const STORAGE_KEY = 'nuvio.cart.v2';

const MAX_QUANTITY = 99;

const readCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === 'object' &&
        item !== null &&
        'product' in item &&
        typeof (item as CartItem).product?.id === 'number',
    );
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartValue>(() => {
    const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)));

    return {
      items,
      count: items.length,
      units: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      add: (product, quantity = 1) =>
        setItems((prev) => {
          const existing = prev.find((item) => item.product.id === product.id);
          if (existing) {
            return prev.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: clamp(item.quantity + quantity) }
                : item,
            );
          }
          return [...prev, { product, quantity: clamp(quantity) }];
        }),
      remove: (productId) => setItems((prev) => prev.filter((item) => item.product.id !== productId)),
      setQuantity: (productId, quantity) =>
        setItems((prev) =>
          prev.map((item) =>
            item.product.id === productId ? { ...item, quantity: clamp(quantity) } : item,
          ),
        ),
      clear: () => setItems([]),
      has: (productId) => items.some((item) => item.product.id === productId),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
