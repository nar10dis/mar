import type { ReactNode } from 'react';
import { Window98 } from './Window98.tsx';

/** Petite fenêtre pour les états chargement / erreur / vide. */
export function StatusMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Window98 title={title} className="status-message">
      <p className="muted">{children}</p>
    </Window98>
  );
}
