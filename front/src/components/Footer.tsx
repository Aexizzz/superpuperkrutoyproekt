// @owner К — витрина: главная, каталог, товар, поиск, корзина, оплата, каркас и стили. Правила: OWNERS.md
import { Logo } from './Icons';

const columns = [
  { title: 'Компания', links: ['Обзор', 'Поиск вакансий', 'Офисы', 'Контакты'] },
  { title: 'Знания', links: ['ESG', 'Интеллектуальная собственность', 'Традиции', 'Программы развития талантов'] },
  {
    title: 'Бизнес-услуги',
    links: ['Поставщики', 'Данные и API для разработчиков', 'Nuvio Open Source', 'Система информирования о нарушениях (ВРО)'],
  },
  { title: 'Покупка', links: ['Устройства', 'Аксессуары', 'Цифровые дополнения'] },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-logo">
          <Logo /> Nuvio
        </div>
        <div className="footer-cols">
          {columns.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" onClick={(e) => e.preventDefault()}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
