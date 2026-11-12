import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { StatusMessage } from '../components/StatusMessage.tsx';

// TipTap (éditeur + rendu du texte riche) pèse lourd : chargé seulement sur les pages d'article.
const ArticlePage = lazy(() => import('./ArticlePage.tsx').then((m) => ({ default: m.ArticlePage })));
const ArticleEditPage = lazy(() => import('./ArticleEditPage.tsx').then((m) => ({ default: m.ArticleEditPage })));

function Loading({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="page">
          <StatusMessage title="chargement.exe">Chargement…</StatusMessage>
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

export function LazyArticlePage() {
  return (
    <Loading>
      <ArticlePage />
    </Loading>
  );
}

export function LazyArticleEditPage() {
  return (
    <Loading>
      <ArticleEditPage />
    </Loading>
  );
}
