/**
 * Ce n'est pas la fenêtre qui défile mais l'écran DS (.ds-screen, cf. RootLayout).
 * Repli sur le document si la page est affichée ailleurs.
 */
export function scrollContainerOf(el: Element | null): HTMLElement {
  return (el?.closest('.ds-screen') as HTMLElement | null) ?? (document.scrollingElement as HTMLElement);
}

/** Défilement doux, sauf si l'utilisateur a demandé moins d'animations. */
export const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
