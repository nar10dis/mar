import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { PixelIcon } from './PixelIcon.tsx';

type Variant = 'default' | 'rust' | 'blue';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Icône 16 px affichée ×2 à gauche du texte */
  icon?: string;
  /** Si présent, rend un lien interne au lieu d'un bouton */
  to?: string;
  children?: ReactNode;
}

export function PixelButton({ variant = 'default', icon, to, children, className, ...rest }: PixelButtonProps) {
  const cls = ['pixel-button', `pixel-button--${variant}`, className].filter(Boolean).join(' ');
  const content = (
    <>
      {icon && <PixelIcon src={icon} size={16} />}
      {children && <span>{children}</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {content}
    </button>
  );
}
