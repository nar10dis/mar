import { ArticleMeta } from '../article/ArticleMeta.tsx';
import '../article/article.css';
import { useAuth } from '../auth/useAuth.ts';
import { PixelButton } from '../components/PixelButton.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { asset } from '../lib/assets.ts';
import type { ArticleSummary } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';
import { Link } from 'react-router';

/** Blog : liste simple des derniers articles (le vrai fil avec réactions arrive en phase 5). */
export function BlogPage() {
  const { user } = useAuth();
  const articles = useApi<ArticleSummary[]>('/api/articles');

  return (
    <PageLayout
      title="Blog"
      poiIcon={poiById('blog').icon}
      actions={
        <>
          <PixelButton icon={asset('icon-profil.png')} disabled title="Phase 7">
            Profil
          </PixelButton>
          <PixelButton
            variant="rust"
            icon={asset('icon-nouvel-article.png')}
            to={user ? '/blog/nouveau' : '/connexion?next=/blog/nouveau'}
          >
            Nouvel article
          </PixelButton>
        </>
      }
    >
      {articles.status === 'loading' && <StatusMessage title="feed.log">Chargement…</StatusMessage>}
      {articles.status === 'error' && <StatusMessage title="Erreur">Impossible de charger les articles.</StatusMessage>}
      {articles.status === 'ready' && articles.data.length === 0 && (
        <StatusMessage title="feed.log">Aucun article pour l'instant. Soyez le premier !</StatusMessage>
      )}
      {articles.status === 'ready' && articles.data.length > 0 && (
        <ul className="article-list">
          {articles.data.map((a) => (
            <li key={a.id}>
              <Link to={`/blog/articles/${a.id}`} className="article-card ds-select">
                {a.coverUrl ? <img className="article-card__cover" src={a.coverUrl} alt="" loading="lazy" /> : <span className="article-card__cover" />}
                <div>
                  <h2 className="article-card__title">{a.title}</h2>
                  <ArticleMeta article={a} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
