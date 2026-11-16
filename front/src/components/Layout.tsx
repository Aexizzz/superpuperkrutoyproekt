import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Footer from './Footer';
import Header from './Header';

export default function Layout() {
  const { pathname } = useLocation();

  // при переходе между страницами прокручиваем наверх
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="page">
      <Header dark={pathname === '/'} />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
