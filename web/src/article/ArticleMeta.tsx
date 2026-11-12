import type { ArticleSummary } from '../lib/types.ts';
import { asset } from '../lib/assets.ts';
import { formatDate } from '../lib/format.ts';

/** Auteur, thème (pastille de couleur) et date. */
export function ArticleMeta({ article }: { article: ArticleSummary }) {
  return (
    <div className="article-meta">
      <img className="article-meta__avatar" src={article.author.avatarUrl ?? asset('avatar-default.png')} alt="" />
      <span>{article.author.pseudo}</span>
      <span className="article-meta__theme">
        <span className="article-meta__dot" style={{ background: article.theme.color }} aria-hidden />
        {article.theme.name}
      </span>
      <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
    </div>
  );
}
