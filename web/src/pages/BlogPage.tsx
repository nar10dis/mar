import { useState } from 'react';
import { Link } from 'react-router';
import { ArticleMeta } from '../article/ArticleMeta.tsx';
import '../article/article.css';
import { useAuth } from '../auth/useAuth.ts';
import { PixelButton } from '../components/PixelButton.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { api, errorText } from '../lib/api.ts';
import { asset } from '../lib/assets.ts';
import type { FeedItem, FeedPage } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';
import '../social/social.css';

/** Blog : fil des articles, du plus récent au plus ancien, par pages. */
export function BlogPage() {
  const { user } = useAuth();
  const first = useApi<FeedPage>('/api/articles');
  // Pages suivantes, ajoutées sous la première au clic sur « Voir plus ».
  const [more, setMore] = useState<FeedPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const items: FeedItem[] = first.status === 'ready' ? [...first.data.items, ...(more?.items ?? [])] : [];
  const nextBefore = more ? more.nextBefore : first.status === 'ready' ? first.data.nextBefore : null;

  async function loadMore() {
    if (!nextBefore) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await api<FeedPage>('GET', `/api/articles?before=${nextBefore}`);
      setMore((m) => ({ items: [...(m?.items ?? []), ...page.items], nextBefore: page.nextBefore }));
    } catch (e) {
      setMoreError(errorText(e));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <PageLayout
      title="Blog"
      poiIcon={poiById('blog').icon}
      actions={
        <>
          <PixelButton icon={asset('icon-profil.png')} disabled title="Phase 7">
            Profil
          </PixelButton>
          <PixelButton variant="rust" icon={asset('icon-nouvel-article.png')} to={user ? '/blog/nouveau' : '/connexion?next=/blog/nouveau'}>
            Nouvel article
          </PixelButton>
        </>
      }
    >
      {first.status === 'loading' && <StatusMessage title="feed.log">Chargement…</StatusMessage>}
      {first.status === 'error' && <StatusMessage title="Erreur">Impossible de charger les articles.</StatusMessage>}
      {first.status === 'ready' && items.length === 0 && (
        <StatusMessage title="feed.log">Aucun article pour l'instant. Soyez le premier !</StatusMessage>
      )}
      {items.length > 0 && (
        <ul className="article-list">
          {items.map((a) => (
            <li key={a.id}>
              <Link to={`/blog/articles/${a.id}`} className="article-card ds-select">
                {a.coverUrl ? <img className="article-card__cover" src={a.coverUrl} alt="" loading="lazy" /> : <span className="article-card__cover" />}
                <div>
                  <h2 className="article-card__title">{a.title}</h2>
                  <ArticleMeta article={a} />
                  {a.excerpt && <p className="feed-card__excerpt">{a.excerpt}</p>}
                  <div className="feed-card__stats">
                    <span>
                      {a.reactionCount} réaction{a.reactionCount > 1 ? 's' : ''}
                    </span>
                    <span>
                      {a.commentCount} commentaire{a.commentCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {nextBefore && (
        <div className="feed-more">
          <PixelButton onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Chargement…' : 'Voir plus'}
          </PixelButton>
        </div>
      )}
      {moreError && <p className="form-error">{moreError}</p>}
    </PageLayout>
  );
}
