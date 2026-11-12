import { useEffect, useState } from 'react';
import type { Heading } from './headings.ts';
import { scrollBehavior } from './reading.ts';

/** Suit l'intertitre en cours de lecture : le dernier passé sous le haut de l'écran. */
function useActiveHeading(headings: Heading[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Le premier titre visible dans la zone haute ; sinon on garde le précédent.
        const first = headings.find((h) => visible.has(h.id));
        if (first) setActive(first.id);
      },
      // Zone « en cours de lecture » : le tiers haut de l'écran.
      { rootMargin: '0px 0px -66% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return active;
}

/**
 * Sommaire de l'article (intertitres). Variante « aside » : liste collée à droite pendant la lecture ;
 * variante « compact » : repliable, au-dessus de l'article sur les écrans étroits.
 */
export function TableOfContents({ headings, variant }: { headings: Heading[]; variant: 'aside' | 'compact' }) {
  const active = useActiveHeading(headings);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  const list = (
    <ol className="toc__list">
      {headings.map((h) => (
        <li key={h.id} className={`toc__item toc__item--h${h.level}`}>
          <a
            href={`#${h.id}`}
            aria-current={active === h.id ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(h.id);
            }}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === 'compact') {
    return (
      <nav className="toc toc--compact" aria-label="Sommaire">
        <details>
          <summary>Sommaire ({headings.length})</summary>
          {list}
        </details>
      </nav>
    );
  }
  return (
    <nav className="toc toc--aside" aria-label="Sommaire">
      <div className="toc__title">Sommaire</div>
      {list}
    </nav>
  );
}
