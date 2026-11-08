// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice } from '../utils/format';
import Img from './Img';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <h3>{product.name}</h3>
      <p>Цена от {formatPrice(product.price)}</p>
      <Img src={product.image ?? undefined} alt={product.name} className="product-card-img" />
    </Link>
  );
}
