import { asset } from '../lib/assets.ts';

/**
 * Carte d'accueil, en deux versions :
 * - paysage (écran plus large que haut) : map.png, 1920×1080
 * - portrait (écran plus haut que large) : map-portrait.png, 1080×1920
 *
 * Pour changer une carte : remplacer l'image, puis ajuster les positions ci-dessous.
 * Positions en % de l'image, mesurées au centre de l'icône.
 */
export const MAP = {
  landscape: { image: asset('map.png'), width: 1920, height: 1080 },
  portrait: { image: asset('map-portrait.png'), width: 1080, height: 1920 },
};

export interface Point {
  x: number;
  y: number;
}

export interface Poi {
  id: 'shop' | 'actu' | 'blog' | 'archives';
  label: string;
  path: string;
  /** 32×32 */
  icon: string;
  landscape: Point;
  portrait: Point;
}

export const POIS: Poi[] = [
  {
    id: 'shop',
    label: 'Shop',
    path: '/shop',
    icon: asset('poi-shop.png'),
    landscape: { x: 22, y: 32 },
    portrait: { x: 26, y: 16 },
  },
  {
    id: 'actu',
    label: 'Actu',
    path: '/actu',
    icon: asset('poi-actu.png'),
    landscape: { x: 66, y: 26 },
    portrait: { x: 66, y: 30 },
  },
  {
    id: 'blog',
    label: 'Blog',
    path: '/blog',
    icon: asset('poi-blog.png'),
    landscape: { x: 30, y: 72 },
    portrait: { x: 28, y: 62 },
  },
  {
    id: 'archives',
    label: 'Archives',
    path: '/archives',
    icon: asset('poi-archives.png'),
    landscape: { x: 68, y: 72 },
    portrait: { x: 58, y: 84 },
  },
];

/** Horloge : centre en %, taille en % de la largeur de la carte (elle est carrée). */
export const CLOCK = {
  landscape: { x: 88, y: 50, size: 13 },
  portrait: { x: 78, y: 50, size: 26 },
};

export const poiById = (id: Poi['id']) => POIS.find((p) => p.id === id)!;
