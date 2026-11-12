import type { ArticleContent } from './article-content.schema.js';

/**
 * Temps de lecture estimé.
 * - 200 mots/minute : lecture silencieuse d'un adulte (méta-analyse Brysbaert 2019 :
 *   ~240 mots/min pour du documentaire, ~185 pour de la fiction ; 200 est un compromis prudent).
 * - +10 s par image, le temps de la regarder.
 * - Sons, PDF et vidéos ne sont pas comptés (durée inconnue).
 * Toujours au moins 1 minute.
 */
export const WORDS_PER_MINUTE = 200;
export const SECONDS_PER_IMAGE = 10;

/** Nombre de mots des blocs texte (un « mot » = une suite de lettres ou de chiffres). */
export function wordCount(content: ArticleContent | null): number {
  let count = 0;
  const walk = (n: { text?: string; content?: unknown[] }) => {
    if (n.text) count += n.text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
    for (const c of n.content ?? []) walk(c as { text?: string; content?: unknown[] });
  };
  for (const row of content?.rows ?? []) {
    for (const b of row.cols) if (b.type === 'text') walk(b.doc as { content?: unknown[] });
  }
  return count;
}

export function readingMinutes(content: ArticleContent | null): number {
  const images = (content?.rows ?? []).flatMap((r) => r.cols).filter((b) => b.type === 'image').length;
  const seconds = (wordCount(content) / WORDS_PER_MINUTE) * 60 + images * SECONDS_PER_IMAGE;
  return Math.max(1, Math.round(seconds / 60));
}
