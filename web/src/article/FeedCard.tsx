import { Link } from 'react-router';
import type { FeedItem } from '../lib/types.ts';
import { ArticleMeta } from './ArticleMeta.tsx';
import './article.css';
import '../social/social.css';

/** Carte d'article du fil (Blog) et des résultats (Archives). */
export function FeedCard({ article: a }: { article: FeedItem }) {
  return (
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
  );
}
