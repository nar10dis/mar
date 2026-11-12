import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArticleContent } from '../article/ArticleContent.tsx';
import { ArticleMeta } from '../article/ArticleMeta.tsx';
import { articleHeadings } from '../article/headings.ts';
import { ScrollButtons } from '../article/ScrollButtons.tsx';
import { TableOfContents } from '../article/TableOfContents.tsx';
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
import { Comments } from '../social/Comments.tsx';
import { Reactions } from '../social/Reactions.tsx';

/** Lecture d'un article : contenu, réactions en bulles, commentaires en fil. */
export function ArticlePage() {
  const { id } = useParams();
  const article = useApi<Article>(`/api/articles/${id}`);
  // Calculé une fois par article : le sommaire suit la lecture sans se réinitialiser.
  const headings = useMemo(() => (article.status === 'ready' ? articleHeadings(article.data.content) : []), [article]);
  const hasToc = headings.length >= 2;
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
      <div className="article-layout">
        <div>
          {hasToc && <TableOfContents headings={headings} variant="compact" />}
          {a.coverUrl && <img className="article-cover" src={a.coverUrl} alt="" />}
          <Cartouche className="cartouche--article">
            <ArticleContent content={a.content} />
          </Cartouche>
          <div id="fin-article">
            <Reactions articleId={a.id} />
          </div>
          <Comments articleId={a.id} />
        </div>
        {hasToc && (
          <aside className="article-layout__aside">
            <TableOfContents headings={headings} variant="aside" />
          </aside>
        )}
      </div>
      <ScrollButtons endId="fin-article" />
    </PageLayout>
  );
}
