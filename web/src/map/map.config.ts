import { asset } from '../lib/assets.ts';

/**
 * Carte d'accueil, en deux versions :
 * - paysage (écran plus large que haut) : map.png, 1920×1080
 * - portrait (écran plus haut que large) : map-portrait.png, 1080×1920
 *
 * Pour changer une carte : remplacer l'image, puis ajuster les encadrés ci-dessous.
 * Chaque POI remplit exactement l'encadré clair dessiné sur la carte :
 * coin haut-gauche (x, y) et taille (w, h) en % de l'image, bordure claire comprise.
 */
export const MAP = {
  landscape: { image: asset('map.png'), width: 1920, height: 1080 },
  portrait: { image: asset('map-portrait.png'), width: 1080, height: 1920 },
};

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Poi {
  id: 'shop' | 'actu' | 'blog' | 'archives';
  label: string;
  path: string;
  /** 32×32 */
  icon: string;
  landscape: Rect;
  portrait: Rect;
}

export const POIS: Poi[] = [
  {
    id: 'shop',
    label: 'Shop',
    path: '/shop',
    icon: asset('poi-shop.png'),
    landscape: { x: 18.12, y: 26.67, w: 7.71, h: 10.74 },
    portrait: { x: 19.26, y: 12.92, w: 13.7, h: 6.04 },
  },
  {
    id: 'actu',
    label: 'Actu',
    path: '/actu',
    icon: asset('poi-actu.png'),
    landscape: { x: 62.08, y: 20.74, w: 7.71, h: 10.74 },
    portrait: { x: 59.26, y: 27.08, w: 13.7, h: 6.04 },
  },
  {
    id: 'blog',
    label: 'Blog',
    path: '/blog',
    icon: asset('poi-blog.png'),
    landscape: { x: 26.25, y: 66.67, w: 7.71, h: 10.74 },
    portrait: { x: 21.11, y: 58.96, w: 13.7, h: 6.04 },
  },
  {
    id: 'archives',
    label: 'Archives',
    path: '/archives',
    icon: asset('poi-archives.png'),
    landscape: { x: 64.17, y: 66.67, w: 7.71, h: 10.74 },
    portrait: { x: 51.11, y: 81.04, w: 13.7, h: 6.04 },
  },
];

export const poiById = (id: Poi['id']) => POIS.find((p) => p.id === id)!;
