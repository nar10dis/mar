import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/react';

/** Liens autorisés : http(s) et mailto (même règle que l'API). */
export const isSafeHref = (href: string) => /^(https?:\/\/|mailto:)/i.test(href.trim());

/**
 * Extensions TipTap, partagées par l'éditeur et l'affichage des articles.
 * N'active que ce que l'API accepte (api/src/articles/article-content.schema.ts) :
 * gras, italique, souligné, barré, surligné, liens, intertitres H2/H3, listes, citations.
 */
export const RICH_TEXT_EXTENSIONS: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https', 'mailto'],
      isAllowedUri: (url) => isSafeHref(url),
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
    },
  }),
  Highlight,
];

/** Ne garde que href sur les liens : target / rel sont imposés par la config ci-dessus. */
export function cleanDoc<T extends { type: string; content?: T[]; marks?: { type: string; attrs?: Record<string, unknown> }[] }>(node: T): T {
  const marks = node.marks?.map((m) => (m.type === 'link' ? { type: 'link', attrs: { href: String(m.attrs?.href ?? '') } } : { type: m.type }));
  return {
    ...node,
    ...(marks && { marks }),
    ...(node.content && { content: node.content.map(cleanDoc) }),
  };
}

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

/** Un document sans aucun texte (paragraphes vides seulement). */
export function isDocEmpty(node: { type: string; text?: string; content?: unknown[] }): boolean {
  if (node.type === 'text') return !node.text?.trim();
  return (node.content ?? []).every((c) => isDocEmpty(c as { type: string }));
}
