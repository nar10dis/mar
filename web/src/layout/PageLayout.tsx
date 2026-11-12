import type { ReactNode } from 'react';
import { PixelButton } from '../components/PixelButton.tsx';
import { PixelIcon } from '../components/PixelIcon.tsx';
import { asset } from '../lib/assets.ts';

interface PageLayoutProps {
  title: string;
  /** Icône 32 px du POI affichée à côté du titre */
  poiIcon?: string;
  /** Boutons à droite du titre */
  actions?: ReactNode;
  children: ReactNode;
}

/** Gabarit des pages ouvertes depuis la carte : retour carte + titre + contenu. */
export function PageLayout({ title, poiIcon, actions, children }: PageLayoutProps) {
  return (
    <main className="page">
      <div className="page__head">
        <PixelButton to="/" icon={asset('icon-retour.png')}>
          Carte
        </PixelButton>
        <h1 className="page__title">
          {poiIcon && <PixelIcon src={poiIcon} size={32} />}
          {title}
        </h1>
        {actions && <div className="page__actions">{actions}</div>}
      </div>
      {children}
    </main>
  );
}
