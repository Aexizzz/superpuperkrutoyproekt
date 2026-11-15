// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDropdown from './CartDropdown';
import SearchModal from './SearchModal';
import { BagIcon, Logo, SearchIcon, UserIcon } from './Icons';

interface HeaderProps {
  /** прозрачная тёмная шапка поверх чёрного hero на главной */
  dark?: boolean;
}

export default function Header({ dark }: HeaderProps) {
  const { count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  // закрываем корзину при переходе на другую страницу
  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname]);

  // и при клике вне её
  useEffect(() => {
    if (!cartOpen) return;
    const onClick = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) setCartOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [cartOpen]);

  return (
    <header className={`header ${dark ? 'header-dark' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="logo">
          <Logo /> Nuvio
        </Link>

        <nav className="nav">
          <NavLink to="/" end>Главная</NavLink>
          <NavLink to="/catalog">Каталог</NavLink>
          <NavLink to="/news">Новости</NavLink>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Поиск">
            <SearchIcon />
          </button>
          <div className="cart-wrap" ref={cartRef}>
            <button className="icon-btn" onClick={() => setCartOpen((v) => !v)} aria-label="Корзина">
              <BagIcon />
              {count > 0 && <span className="cart-dot" />}
            </button>
            {cartOpen && <CartDropdown onClose={() => setCartOpen(false)} />}
          </div>
          <button
            className="icon-btn"
            onClick={() => navigate(user ? '/profile' : '/login')}
            aria-label={user ? 'Профиль' : 'Войти'}
          >
            <UserIcon />
          </button>
        </nav>
      </div>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
