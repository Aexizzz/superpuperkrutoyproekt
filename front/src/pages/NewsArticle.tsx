// @owner М — аккаунт и контент: вход, регистрация, профиль, новости, админка. Правила: OWNERS.md
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as newsApi from '../api/news';
import Img from '../components/Img';
import { BackIcon } from '../components/Icons';
import { ErrorState, LoadingState } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export default function NewsArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const newsId = Number(id);

  const { data: item, loading, error, reload } = useAsync(
    (signal) => newsApi.getNewsItem(newsId, signal),
    [newsId],
  );

  if (loading) return <LoadingState />;

  if (error) {
    if (error.code === 'not_found') {
      return (
        <section className="container page-section">
          <h1 className="page-title">Новость не найдена</h1>
          <Link to="/news" className="link">К списку новостей</Link>
        </section>
      );
    }
    return <ErrorState error={error} onRetry={reload} />;
  }

  if (!item) return null;

  return (
    <article className="container article">
      <h1 className="article-title">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Назад">
          <BackIcon />
        </button>
        {item.title}
      </h1>

      <p className="article-meta muted">
        {formatDate(item.publishedAt)} • {formatNumber(item.views)} просмотров
      </p>

      {item.image && (
        <Img src={item.image} alt={item.title} className="article-cover" />
      )}

      {item.sections.map((section, i) => (
        <div key={`${section.heading}-${i}`}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((p, n) => (
            <p key={`${section.heading}-${n}`}>{p}</p>
          ))}
          {i === 0 && item.gallery && item.gallery.length > 0 && (
            <div className="gallery">
              {item.gallery.map((src, n) => (
                <Img key={src} src={src} alt={`${item.title}, фото ${n + 1}`} className="gallery-img" />
              ))}
            </div>
          )}
        </div>
      ))}
    </article>
  );
}
