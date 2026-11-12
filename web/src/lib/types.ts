// Formes renvoyées par l'API (cf. api/src/*/*.controller.ts)

export interface Theme {
  id: number;
  slug: string;
  name: string;
  color: string;
}

export interface Magazine {
  id: number;
  title: string;
  issue: string | null;
  coverUrl: string;
  /** centimes */
  price: number;
  description: string | null;
  helloAssoUrl: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

/** GET /api/presence */
export interface OnlineUser {
  id: number;
  pseudo: string;
  avatarUrl: string | null;
}

// ---------------------------------------------------------------- Articles (GET /api/articles…)
// Format du contenu : voir api/src/articles/article-content.schema.ts

export interface RichMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'highlight' | 'link';
  attrs?: { href: string };
}

export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
}

export type Block =
  | { id: string; type: 'text'; doc: RichNode }
  | { id: string; type: 'image'; key: string; alt: string; caption?: string }
  | { id: string; type: 'audio'; key: string; title?: string }
  | { id: string; type: 'pdf'; key: string; title?: string }
  | { id: string; type: 'youtube'; videoId: string };

export type BlockType = Block['type'];

export interface ArticleContent {
  v: 1;
  rows: { id: string; cols: Block[] }[];
}

export interface ArticleSummary {
  id: number;
  title: string;
  coverUrl: string | null;
  createdAt: string;
  theme: { slug: string; name: string; color: string };
  author: { id: number; pseudo: string; avatarUrl: string | null };
}

export interface Article extends ArticleSummary {
  content: ArticleContent;
  updatedAt: string;
  themeId: number;
}

/** GET /api/articles?before=… */
export interface FeedItem extends ArticleSummary {
  excerpt: string;
  commentCount: number;
  reactionCount: number;
}

export interface FeedPage {
  items: FeedItem[];
  nextBefore: number | null;
}

// ---------------------------------------------------------------- Réactions et commentaires

/** GET/PUT/DELETE /api/articles/:id/reactions */
export interface ReactionSummary {
  counts: Record<string, number>;
  mine: string | null;
}

/** GET /api/articles/:id/comments (liste à plat, triée du plus ancien au plus récent) */
export interface ArticleComment {
  id: number;
  body: string;
  parentId: number | null;
  createdAt: string;
  author: { id: number; pseudo: string; avatarUrl: string | null };
}
