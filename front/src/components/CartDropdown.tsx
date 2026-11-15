// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import Img from './Img';
import { CloseIcon } from './Icons';

export default function CartDropdown({ onClose }: { onClose: () => void }) {
  const { items, total, remove } = useCart();
  const navigate = useNavigate();

  const goToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="cart-dropdown">
      {items.length === 0 ? (
        <p className="cart-empty">Корзина пуста</p>
      ) : (
        <>
          <ul className="cart-list">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="cart-row">
                <Img src={product.image ?? undefined} alt={product.name} className="cart-thumb" />
                <div className="cart-info">
                  <strong>{formatPrice(product.price * quantity)}</strong>
                  <span>{product.name}{quantity > 1 ? ` × ${quantity}` : ''}</span>
                </div>
                <button className="icon-btn" onClick={() => remove(product.id)} aria-label={`Удалить ${product.name}`}>
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-total">
            <span>Общая сумма</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <button className="btn btn-blue btn-block" onClick={goToCheckout}>
            Перейти к Оплате
          </button>
        </>
      )}
    </div>
  );
}
