import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { RICH_TEXT_EXTENSIONS } from '../editor/tiptap.ts';
import type { ArticleContent as Content, Block } from '../lib/types.ts';
import { mediaUrl } from '../lib/upload.ts';
import { YoutubeEmbed } from './YoutubeEmbed.tsx';
import './article.css';

/**
 * Rendu d'un article : rangées en grille, blocs dedans.
 * Le texte riche est rendu en éléments React depuis le JSON (aucun innerHTML).
 */
export function ArticleContent({ content }: { content: Content }) {
  return (
    <div className="article-content">
      {content.rows.map((row) => (
        <div key={row.id} className="article-row" style={{ gridTemplateColumns: `repeat(${row.cols.length}, minmax(0, 1fr))` }}>
          {row.cols.map((b) => (
            <BlockView key={b.id} block={b} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <div className="rich-text">{renderToReactElement({ content: block.doc, extensions: RICH_TEXT_EXTENSIONS })}</div>;
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
