import type { Block, BlockType } from '../lib/types.ts';
import { EMPTY_DOC, cleanDoc, isDocEmpty } from './tiptap.ts';

/**
 * État de l'éditeur : comme ArticleContent, mais une case peut être vide (null)
 * le temps de choisir un bloc, et un bloc média peut ne pas avoir encore de fichier.
 */
export type Draft =
  | { id: string; type: 'text'; doc: Extract<Block, { type: 'text' }>['doc'] }
  | { id: string; type: 'image'; key: string | null; alt: string; caption: string }
  | { id: string; type: 'audio'; key: string | null; title: string }
  | { id: string; type: 'pdf'; key: string | null; title: string }
  | { id: string; type: 'youtube'; videoId: string | null; url: string };

export interface DraftRow {
  id: string;
  cols: (Draft | null)[];
}

export const MAX_COLS = 3;

export const newId = () => Math.random().toString(36).slice(2, 10);

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: 'Texte',
  image: 'Image',
  audio: 'Son',
  pdf: 'PDF',
  youtube: 'Vidéo YouTube',
};

export function newBlock(type: BlockType): Draft {
  const id = newId();
  switch (type) {
    case 'text':
      return { id, type, doc: EMPTY_DOC };
    case 'image':
      return { id, type, key: null, alt: '', caption: '' };
    case 'audio':
    case 'pdf':
      return { id, type, key: null, title: '' };
    case 'youtube':
      return { id, type, videoId: null, url: '' };
  }
}

export const newRow = (cols: number): DraftRow => ({ id: newId(), cols: Array.from({ length: cols }, () => null) });

/** Contenu enregistré → état d'éditeur. */
export function toDraft(rows: { id: string; cols: Block[] }[]): DraftRow[] {
  return rows.map((r) => ({
    id: r.id,
    cols: r.cols.map((b): Draft => {
      switch (b.type) {
        case 'text':
          return b;
        case 'image':
          return { ...b, caption: b.caption ?? '' };
        case 'audio':
        case 'pdf':
          return { ...b, title: b.title ?? '' };
        case 'youtube':
          return { ...b, url: `https://youtu.be/${b.videoId}` };
      }
    }),
  }));
}

/**
 * État d'éditeur → contenu à envoyer. Retire les cases vides, les blocs sans fichier,
 * les textes vides et les rangées devenues vides. Renvoie aussi les problèmes bloquants.
 */
export function toContent(rows: DraftRow[]): { rows: { id: string; cols: Block[] }[]; problems: string[] } {
  const problems: string[] = [];
  const out = rows
    .map((r, ri) => ({
      id: r.id,
      cols: r.cols.flatMap((d): Block[] => {
        if (!d) return [];
        switch (d.type) {
          case 'text':
            return isDocEmpty(d.doc) ? [] : [{ id: d.id, type: 'text', doc: cleanDoc(d.doc) }];
          case 'image':
            if (!d.key) return [];
            if (!d.alt.trim()) problems.push(`Rangée ${ri + 1} : décrivez l'image (texte alternatif), pour les personnes qui ne la voient pas.`);
            return [{ id: d.id, type: 'image', key: d.key, alt: d.alt.trim(), ...(d.caption.trim() && { caption: d.caption.trim() }) }];
          case 'audio':
          case 'pdf':
            return d.key ? [{ id: d.id, type: d.type, key: d.key, ...(d.title.trim() && { title: d.title.trim() }) }] : [];
          case 'youtube':
            if (!d.videoId && d.url.trim()) problems.push(`Rangée ${ri + 1} : le lien YouTube n'est pas reconnu.`);
            return d.videoId ? [{ id: d.id, type: 'youtube', videoId: d.videoId }] : [];
        }
      }),
    }))
    .filter((r) => r.cols.length > 0);
  if (out.length === 0) problems.push("L'article est vide : ajoutez au moins un bloc.");
  return { rows: out, problems };
}

/**
 * ID d'une vidéo YouTube depuis un lien (youtu.be/…, watch?v=…, /embed/…, /shorts/…, /live/…)
 * ou depuis l'ID seul. null si ce n'est pas reconnu.
 */
export function parseYoutube(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let url: URL;
  try {
    url = new URL(s.startsWith('http') ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ?? null;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
