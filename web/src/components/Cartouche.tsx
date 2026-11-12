import type { ReactNode } from 'react';

interface CartoucheProps {
  /** Titre optionnel, sur la première ligne (comme le nom sur une fiche Pokémon) */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Fiche « papier vieilli » à lignes pointillées, calées sur l'interligne (--lh). */
export function Cartouche({ title, children, className }: CartoucheProps) {
  return (
    <article className={['cartouche', className].filter(Boolean).join(' ')}>
      {title && <h2 className="cartouche__title">{title}</h2>}
      <div className="cartouche__body">{children}</div>
    </article>
  );
}
