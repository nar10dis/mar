import type { ArticleContent, RichNode } from '../lib/types.ts';

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

const textOf = (n: RichNode): string => (n.text ?? '') + (n.content ?? []).map(textOf).join('');

/**
 * Intertitres de l'article, dans l'ordre d'affichage (rangées, puis colonnes, puis texte).
 * Le rendu (ArticleContent) parcourt le contenu dans le même ordre et pose ces mêmes id.
 */
export function articleHeadings(content: ArticleContent): Heading[] {
  const out: Heading[] = [];
  const walk = (n: RichNode) => {
    if (n.type === 'heading') {
      const text = textOf(n).trim();
      out.push({ id: `t${out.length + 1}${text ? `-${slug(text)}` : ''}`, text: text || 'Sans titre', level: n.attrs?.level === 3 ? 3 : 2 });
      return;
    }
    n.content?.forEach(walk);
  };
  for (const row of content.rows) for (const b of row.cols) if (b.type === 'text') walk(b.doc);
  return out;
}
