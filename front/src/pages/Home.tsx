// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { Link } from 'react-router-dom';
import Img from '../components/Img';

const tiles = [
  { key: 'macbook', title: 'MacBook', text: '14" теперь с чипом M6', cat: 'MacBook', image: '/images/tile-macbook.jpg', dark: true },
  { key: 'airpods', title: 'AirPods', text: 'Исследуйте магию Активного Шумоподавления', cat: 'AirPods', image: '/images/tile-airpods.jpg', dark: true },
  { key: 'iphone', title: 'iPhone', text: 'Больше мощностей', cat: 'iPhone', image: '/images/tile-iphone.png', dark: false },
  { key: 'imac', title: 'iMac', text: 'Новый чип для ИИ', cat: 'iMac', image: '/images/tile-imac.png', dark: false },
  { key: 'watch', title: 'Apple Watch', text: 'Повышенная заряжаемость сверхпрочность', cat: 'Apple Watch', image: '/images/tile-watch.jpg', dark: true },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>MacBook Pro</h1>
          <p>PROLED XDR DISPLAY: В продаже с 11.6</p>
          <div className="hero-actions">
            <Link to="/catalog?cat=MacBook" className="btn btn-white">Узнать больше</Link>
            <Link to="/catalog?cat=MacBook" className="btn btn-blue">Предзаказать</Link>
          </div>
        </div>
        <Img src="/images/hero-macbook.jpg" alt="MacBook Pro" className="hero-img" />
      </section>

      <section className="container home-catalog">
        <h2 className="section-title">Каталог</h2>
        <p className="section-sub">Выберите свое новое устройство</p>

        <div className="tiles">
          {tiles.map((t) => (
            <Link
              key={t.key}
              to={`/catalog?cat=${encodeURIComponent(t.cat)}`}
              className={`tile tile-${t.key} ${t.dark ? 'tile-dark' : ''}`}
            >
              <Img src={t.image} alt={t.title} className="tile-img" />
              <div className="tile-text">
                <strong>{t.title}</strong>
                <span>{t.text}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
