import { useNavigate, useParams } from 'react-router';
import { ArticleContent } from '../article/ArticleContent.tsx';
import { ArticleMeta } from '../article/ArticleMeta.tsx';
import { useAuth } from '../auth/useAuth.ts';
import { Cartouche } from '../components/Cartouche.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { api, errorText } from '../lib/api.ts';
import { asset } from '../lib/assets.ts';
import type { Article } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';

/** Lecture d'un article (réactions et commentaires : phase 5). */
export function ArticlePage() {
  const { id } = useParams();
  const article = useApi<Article>(`/api/articles/${id}`);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (article.status !== 'ready') {
    return (
      <PageLayout title="Blog" poiIcon={poiById('blog').icon}>
        <StatusMessage title={article.status === 'error' ? 'Introuvable' : 'article.txt'}>
          {article.status === 'error' ? "Cet article n'existe pas ou a été supprimé." : 'Chargement…'}
        </StatusMessage>
      </PageLayout>
    );
  }

  const a = article.data;
  const isAuthor = user?.id === a.author.id;
  const canDelete = isAuthor || user?.role === 'ADMIN';

  async function remove() {
    if (!window.confirm(`Supprimer « ${a.title} » ? C'est définitif.`)) return;
    try {
      await api('DELETE', `/api/articles/${a.id}`);
      navigate('/blog');
    } catch (e) {
      window.alert(errorText(e));
    }
  }

  return (
    <PageLayout
      title={a.title}
      actions={
        (isAuthor || canDelete) && (
          <>
            {isAuthor && (
              <PixelButton to={`/blog/articles/${a.id}/modifier`} icon={asset('icon-nouvel-article.png')}>
                Modifier
              </PixelButton>
            )}
            {canDelete && <PixelButton onClick={remove}>Supprimer</PixelButton>}
          </>
        )
      }
    >
      <div className="article-head">
        <PixelButton to="/blog" className="pixel-button--small" icon={asset('icon-retour.png')}>
          Tous les articles
        </PixelButton>
        <ArticleMeta article={a} />
      </div>
      {a.coverUrl && <img className="article-cover" src={a.coverUrl} alt="" />}
      <Cartouche className="cartouche--article">
        <ArticleContent content={a.content} />
      </Cartouche>
    </PageLayout>
  );
}
