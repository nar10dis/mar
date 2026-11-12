import { asset } from '../lib/assets.ts';

/**
 * Carte d'accueil. Pour changer la carte : remplacer web/public/assets/map.png
 * (1920×1080) puis ajuster les positions ci-dessous. Positions en % de l'image,
 * mesurées au centre de l'icône.
 */
export const MAP = {
  image: asset('map.png'),
  width: 1920,
  height: 1080,
};

export interface Poi {
  id: 'shop' | 'actu' | 'blog' | 'archives';
  label: string;
  path: string;
  /** Sheet 64×32 : frame 0 normale, frame 1 hover */
  icon: string;
  x: number;
  y: number;
}

export const POIS: Poi[] = [
  { id: 'shop', label: 'Shop', path: '/shop', icon: asset('poi-shop.png'), x: 22, y: 32 },
  { id: 'actu', label: 'Actu', path: '/actu', icon: asset('poi-actu.png'), x: 72, y: 26 },
  { id: 'blog', label: 'Blog', path: '/blog', icon: asset('poi-blog.png'), x: 30, y: 72 },
  { id: 'archives', label: 'Archives', path: '/archives', icon: asset('poi-archives.png'), x: 76, y: 70 },
];

export const poiById = (id: Poi['id']) => POIS.find((p) => p.id === id)!;
