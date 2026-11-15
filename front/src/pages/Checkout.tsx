// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/http';
import * as ordersApi from '../api/orders';
import Img from '../components/Img';
import { CloseIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { PaymentMethod } from '../types';
import { formatPrice } from '../utils/format';

const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export default function Checkout() {
  const { items, total, remove, clear, setQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (number.replace(/\s/g, '').length !== 16) e.number = 'Введите 16 цифр номера карты';
    const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) e.expiry = 'Формат MM/YY';
    if (cvc.length !== 3) e.cvc = '3 цифры';
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError('');

    if (method === 'card') {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setSubmitting(true);
    try {
      // TODO(оплата): карта должна токенизироваться у платёжного провайдера
      // (Stripe / CloudPayments / ЮKassa), и сюда уходит только paymentToken.
      const order = await ordersApi.createOrder({
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod: method,
      });
      clear();
      setOrderId(order.id);
    } catch (err) {
      if (ApiError.is(err)) {
        setErrors(err.fieldErrors);
        setSubmitError(err.message);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Не удалось оформить заказ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId !== null) {
    return (
      <section className="container page-section">
        <h1 className="page-title">Спасибо за заказ!</h1>
        <p className="muted">Заказ #{orderId} принят. Статус и состав — в профиле.</p>
        <Link to="/profile" className="btn btn-blue inline-btn">Перейти в профиль</Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="container page-section">
        <h1 className="page-title">Оплата</h1>
        <p className="muted">Корзина пуста.</p>
        <Link to="/catalog" className="btn btn-blue inline-btn">Перейти в каталог</Link>
      </section>
    );
  }

  return (
    <section className="container page-section">
      <h1 className="page-title">Оплата</h1>

      <form className="checkout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <h3>Ваш заказ</h3>
          <ul className="order-list">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="order-item">
                <div className="order-img-wrap">
                  <Img src={product.image ?? undefined} alt={product.name} className="order-img" />
                  <button
                    type="button"
                    className="icon-btn order-remove"
                    onClick={() => remove(product.id)}
                    aria-label={`Удалить ${product.name}`}
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="order-item-body">
                  <strong>{formatPrice(product.price * quantity)}</strong>
                  <p>{product.name}</p>
                  <p className="muted">{product.detail ?? product.description}</p>
                  <div className="qty">
                    <button
                      type="button"
                      aria-label="Меньше"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      aria-label="Больше"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <h3>Способ оплаты</h3>
          <label className="radio-card">
            <input type="radio" name="method" checked={method === 'card'} onChange={() => setMethod('card')} />
            <span className="radio-mark" /> Банковская карта
          </label>
          <label className="radio-card">
            <input type="radio" name="method" checked={method === 'applepay'} onChange={() => setMethod('applepay')} />
            <span className="radio-mark" /> Apple Pay
          </label>

          {method === 'card' && (
            <>
              <h3>Детали карты</h3>
              <label className="field">
                <span>Номер карты</span>
                <input
                  value={number}
                  onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className={errors.number ? 'invalid' : ''}
                />
                {errors.number && <small className="error">{errors.number}</small>}
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Срок действия</span>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className={errors.expiry ? 'invalid' : ''}
                  />
                  {errors.expiry && <small className="error">{errors.expiry}</small>}
                </label>
                <label className="field">
                  <span>CVC</span>
                  <input
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="123"
                    inputMode="numeric"
                    type="password"
                    autoComplete="cc-csc"
                    className={errors.cvc ? 'invalid' : ''}
                  />
                  {errors.cvc && <small className="error">{errors.cvc}</small>}
                </label>
              </div>
            </>
          )}

          {submitError && <small className="error" role="alert">{submitError}</small>}

          <button type="submit" className="btn btn-blue btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Оформляем заказ...' : 'Оплатить'}
          </button>
        </div>

        <aside className="summary">
          <h3>Итого</h3>
          <div className="summary-row"><span>Товары ({items.length})</span><span>{formatPrice(total)}</span></div>
          <div className="summary-row"><span>Доставка</span><span>Бесплатно</span></div>
          <div className="summary-row"><span>Скидка</span><span>0 ₽</span></div>
          <hr />
          <div className="summary-row summary-total"><span>Итого</span><span>{formatPrice(total)}</span></div>
          <p className="muted small">Безопасная оплата<br />SSL-шифрование</p>
        </aside>
      </form>
    </section>
  );
}
