// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Img from './Img';
import { Logo } from './Icons';

interface AuthShellProps {
  image: string;
  children: ReactNode;
}

/** Общая раскладка для входа и регистрации: фото слева, форма справа. */
export default function AuthShell({ image, children }: AuthShellProps) {
  return (
    <div className="auth">
      <Img src={image} alt="" className="auth-photo" />
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-logo" aria-label="На главную">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
