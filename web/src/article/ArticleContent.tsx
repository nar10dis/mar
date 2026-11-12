import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { RICH_TEXT_EXTENSIONS } from '../editor/tiptap.ts';
import type { ArticleContent as Content, Block, RichNode } from '../lib/types.ts';
import { mediaUrl } from '../lib/upload.ts';
import { articleHeadings } from './headings.ts';
import { YoutubeEmbed } from './YoutubeEmbed.tsx';
import './article.css';

const countHeadings = (n: RichNode): number =>
  n.type === 'heading' ? 1 : (n.content ?? []).reduce((sum, c) => sum + countHeadings(c), 0);

/**
 * Rendu d'un article : rangées en grille, blocs dedans.
 * Le texte riche est rendu en éléments React depuis le JSON (aucun innerHTML).
 * Les intertitres reçoivent les id du sommaire (articleHeadings, même ordre de parcours).
 */
export function ArticleContent({ content }: { content: Content }) {
  const ids = articleHeadings(content).map((h) => h.id);
  // Pour chaque bloc texte, la tranche d'id qui lui revient.
  const idsByBlock = new Map<string, string[]>();
  let next = 0;
  for (const row of content.rows) {
    for (const b of row.cols) {
      if (b.type !== 'text') continue;
      const n = countHeadings(b.doc);
      idsByBlock.set(b.id, ids.slice(next, next + n));
      next += n;
    }
  }

  return (
    <div className="article-content">
      {content.rows.map((row) => (
        <div key={row.id} className="article-row" style={{ gridTemplateColumns: `repeat(${row.cols.length}, minmax(0, 1fr))` }}>
          {row.cols.map((b) => (
            <BlockView key={b.id} block={b} headingIds={idsByBlock.get(b.id) ?? []} />
          ))}
        </div>
      ))}
    </div>
  );
}

function RichText({ doc, headingIds }: { doc: RichNode; headingIds: string[] }) {
  // Les titres sont rendus dans l'ordre du document : chacun prend l'id suivant.
  const ids = headingIds[Symbol.iterator]();
  return (
    <div className="rich-text">
      {renderToReactElement({
        content: doc,
        extensions: RICH_TEXT_EXTENSIONS,
        options: {
          nodeMapping: {
            heading: ({ node, children }) => {
              const Tag = node.attrs.level === 3 ? 'h3' : 'h2';
              return <Tag id={ids.next().value}>{children}</Tag>;
            },
          },
        },
      })}
    </div>
  );
}

function BlockView({ block, headingIds }: { block: Block; headingIds: string[] }) {
  switch (block.type) {
    case 'text':
      return <RichText doc={block.doc} headingIds={headingIds} />;
    case 'image':
      return (
        <figure className="article-figure">
          <img src={mediaUrl(block.key)} alt={block.alt} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case 'audio':
      return (
        <figure className="article-audio">
          {block.title && <figcaption>{block.title}</figcaption>}
          <audio src={mediaUrl(block.key)} controls preload="none" />
        </figure>
      );
    case 'pdf':
      return (
        <figure className="article-pdf">
          <iframe src={mediaUrl(block.key)} title={block.title ?? 'Document PDF'} loading="lazy" />
          <a href={mediaUrl(block.key)} target="_blank" rel="noopener noreferrer">
            Ouvrir le PDF{block.title ? ` : ${block.title}` : ''}
          </a>
        </figure>
      );
    case 'youtube':
      return <YoutubeEmbed videoId={block.videoId} />;
  }
}
