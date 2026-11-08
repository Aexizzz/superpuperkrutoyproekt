// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { Link, useParams } from 'react-router-dom';
import * as productsApi from '../api/products';
import Img from '../components/Img';
import { ErrorState, LoadingState } from '../components/States';
import { useCart } from '../context/CartContext';
import { useAsync } from '../hooks/useAsync';
import { formatPrice } from '../utils/format';

export default function Product() {
  const { id } = useParams();
  const { add, has } = useCart();
  const productId = Number(id);

  const { data: product, loading, error, reload } = useAsync(
    (signal) => productsApi.getProduct(productId, signal),
    [productId],
  );

  if (loading) return <LoadingState />;

  if (error) {
    // 404 — товар удалили или ссылка битая
    if (error.code === 'not_found') {
      return (
        <section className="container page-section">
          <h1 className="page-title">Товар не найден</h1>
          <Link to="/catalog" className="link">Вернуться в каталог</Link>
        </section>
      );
    }
    return <ErrorState error={error} onRetry={reload} />;
  }

  if (!product) return null;

  const inCart = has(product.id);

  return (
    <section className="container product-page">
      <div className="product-gallery">
        <Img src={product.image ?? undefined} alt={product.name} className="product-hero-img" />
      </div>

      <div className="product-info">
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        {product.detail && <p>{product.detail}</p>}
        <p className="product-price">{formatPrice(product.price)}</p>
        <button
          className="btn btn-blue"
          onClick={() => add(product)}
          disabled={!product.inStock}
        >
          {!product.inStock ? 'Нет в наличии' : inCart ? 'Добавить ещё' : 'Добавить в корзину'}
        </button>
      </div>
    </section>
  );
}
