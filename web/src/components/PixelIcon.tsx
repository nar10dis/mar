import type { CSSProperties } from 'react';

interface PixelIconProps {
  /** URL du PNG (icône simple ou sprite sheet horizontale) */
  src: string;
  /** Taille native d'une frame en px (16 ou 32) */
  size: 16 | 32;
  /** Nombre de frames dans la sheet (ex. 2 pour les POI : normal + hover) */
  frames?: number;
  /** Frame affichée. Laisser vide pour la piloter en CSS via --frame (ex. au hover du parent). */
  frame?: number;
  /** Multiple entier d'affichage */
  scale?: 1 | 2 | 3 | 4;
  /** Texte alternatif ; vide = décoratif */
  label?: string;
  className?: string;
}

export function PixelIcon({ src, size, frames = 1, frame, scale = 2, label, className }: PixelIconProps) {
  const style = {
    '--icon-src': `url(${src})`,
    '--icon-w': `${size * scale}px`,
    '--icon-frames': frames,
    ...(frame !== undefined && { '--frame': frame }),
  } as CSSProperties;
  return (
    <span
      className={['pixel-icon', className].filter(Boolean).join(' ')}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
