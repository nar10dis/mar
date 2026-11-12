import { z } from 'zod';

/**
 * Contenu d'un article (colonne Article.content, JSON).
 *
 * { v: 1, rows: [ { id, cols: [Bloc, Bloc?, Bloc?] } ] }
 *
 * Le texte riche est un document TipTap/ProseMirror. On n'accepte que les nœuds et
 * marques que l'éditeur propose (cf. web/src/editor/tiptap.ts), avec des liens
 * http(s) / mailto seulement : un document forgé à la main ne peut rien injecter.
 */

const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

const mark = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('highlight') }),
  z.object({
    type: z.literal('link'),
    // Seul href est gardé : target / rel sont imposés à l'affichage.
    attrs: z.object({ href: z.string().max(2000).regex(SAFE_HREF, 'Lien non autorisé') }),
  }),
]);

interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: z.infer<typeof mark>[];
}

const children = (): z.ZodType<RichNode[]> => z.array(node).max(2000);

const node: z.ZodType<RichNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), text: z.string().min(1).max(20_000), marks: z.array(mark).max(10).optional() }),
    z.object({ type: z.literal('paragraph'), content: children().optional() }),
    z.object({
      type: z.literal('heading'),
      attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }),
      content: children().optional(),
    }),
    z.object({ type: z.literal('bulletList'), content: children() }),
    z.object({
      type: z.literal('orderedList'),
      attrs: z.object({ start: z.number().int().min(0).max(10_000).optional() }).optional(),
      content: children(),
    }),
    z.object({ type: z.literal('listItem'), content: children() }),
    z.object({ type: z.literal('blockquote'), content: children() }),
    z.object({ type: z.literal('hardBreak') }),
  ]),
);

const richDoc = z.object({ type: z.literal('doc'), content: children() });

const mediaKey = z.string().min(1).max(300);

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ id, type: z.literal('text'), doc: richDoc }),
  z.object({
    id,
    type: z.literal('image'),
    key: mediaKey,
    alt: z.string().trim().min(1, "Décrivez l'image (texte alternatif)").max(300),
    caption: z.string().trim().max(300).optional(),
  }),
  z.object({ id, type: z.literal('audio'), key: mediaKey, title: z.string().trim().max(200).optional() }),
  z.object({ id, type: z.literal('pdf'), key: mediaKey, title: z.string().trim().max(200).optional() }),
  z.object({ id, type: z.literal('youtube'), videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'Vidéo YouTube invalide') }),
]);

export const contentSchema = z.object({
  v: z.literal(1),
  rows: z
    .array(z.object({ id, cols: z.array(blockSchema).min(1).max(3) }))
    .min(1, "L'article est vide")
    .max(100),
});

export type ArticleContent = z.infer<typeof contentSchema>;
export type Block = z.infer<typeof blockSchema>;

export const articleInputSchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(160),
  themeId: z.number().int().positive(),
  /** Clé d'une image uploadée (purpose article-image), null pour retirer la couverture */
  coverKey: z.string().max(300).nullable().optional(),
  content: contentSchema,
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

/** Les fichiers référencés par un contenu, avec le type d'upload attendu pour chacun. */
export function mediaRefs(content: ArticleContent) {
  const refs: { key: string; purpose: 'article-image' | 'article-audio' | 'article-pdf'; type: 'IMAGE' | 'AUDIO' | 'PDF' }[] = [];
  for (const row of content.rows) {
    for (const b of row.cols) {
      if (b.type === 'image') refs.push({ key: b.key, purpose: 'article-image', type: 'IMAGE' });
      if (b.type === 'audio') refs.push({ key: b.key, purpose: 'article-audio', type: 'AUDIO' });
      if (b.type === 'pdf') refs.push({ key: b.key, purpose: 'article-pdf', type: 'PDF' });
    }
  }
  return refs;
}
