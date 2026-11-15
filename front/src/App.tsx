// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Login from './pages/Login';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Product from './pages/Product';
import Profile from './pages/Profile';
import Register from './pages/Register';

function NotFound() {
  return (
    <section className="container page-section">
      <h1 className="page-title">404</h1>
      <p className="muted">Такой страницы нет.</p>
      <Link to="/" className="link">На главную</Link>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      {/* страницы входа и регистрации без шапки и подвала, как в макете */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsArticle />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
