import type { ArticleContent } from './article-content.schema.js';
import { readingMinutes, wordCount } from './reading-time.js';

const textBlock = (text: string) => ({
  id: 't',
  type: 'text' as const,
  doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
});
const image = { id: 'i', type: 'image' as const, key: 'media/1/x.png', alt: 'x' };
const content = (...cols: ArticleContent['rows'][number]['cols']): ArticleContent => ({ v: 1, rows: [{ id: 'r', cols }] });
const words = (n: number) => Array.from({ length: n }, () => 'mot').join(' ');

describe('temps de lecture', () => {
  it('compte les mots français (apostrophes, traits d’union, accents)', () => {
    expect(wordCount(content(textBlock("L'été, c'est l'arc-en-ciel… 3 rats !")))).toBe(5);
  });

  it('200 mots par minute', () => {
    expect(readingMinutes(content(textBlock(words(400))))).toBe(2);
    expect(readingMinutes(content(textBlock(words(1000))))).toBe(5);
  });

  it('au moins 1 minute, même pour un article très court ou sans texte', () => {
    expect(readingMinutes(content(textBlock('Bonjour')))).toBe(1);
    expect(readingMinutes(content({ id: 'y', type: 'youtube', videoId: 'dQw4w9WgXcQ' }))).toBe(1);
  });

  it('+10 s par image', () => {
    const row = (cols: ArticleContent['rows'][number]['cols']) => ({ id: Math.random().toString(36).slice(2), cols });
    // 400 mots = 120 s = 2 min
    expect(readingMinutes(content(textBlock(words(400))))).toBe(2);
    // 400 mots + 6 images = 120 + 60 = 180 s = 3 min
    expect(readingMinutes({ v: 1, rows: [row([textBlock(words(400))]), row([image, image, image]), row([image, image, image])] })).toBe(3);
  });

  it('ne compte que les blocs texte', () => {
    expect(wordCount(content(textBlock('un deux'), { id: 'a', type: 'audio', key: 'media/1/a.mp3', title: 'trois quatre cinq' }))).toBe(2);
  });
});
