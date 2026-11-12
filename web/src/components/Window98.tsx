import type { ReactNode } from 'react';
import { asset } from '../lib/assets.ts';
import { PixelIcon } from './PixelIcon.tsx';

interface Window98Props {
  title: string;
  /** Icône 16 px dans la barre de titre */
  icon?: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

/** Fenêtre façon Windows 98, version sombre. */
export function Window98({ title, icon, onClose, children, className }: Window98Props) {
  return (
    <section className={['window98', className].filter(Boolean).join(' ')} aria-label={title}>
      <header className="window98__titlebar">
        {icon && <PixelIcon src={icon} size={16} scale={1} />}
        <span className="window98__title">{title}</span>
        {onClose && (
          <button type="button" className="window98__close" onClick={onClose} aria-label="Fermer">
            <PixelIcon src={asset('icon-fermer.png')} size={16} scale={1} />
          </button>
        )}
      </header>
      <div className="window98__body">{children}</div>
    </section>
  );
}

/** Séparateur gravé façon menu Win98 */
export function Separator98() {
  return <hr className="separator98" />;
}
