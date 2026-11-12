import { useEffect, useRef, useState } from 'react';
import { scrollBehavior, scrollContainerOf } from './reading.ts';

/**
 * « ↑ Haut » et « ↓ Fin » flottants en bas à droite de l'écran pendant la lecture.
 * Chacun n'apparaît que quand il sert. `endId` : élément où mène « Fin ».
 */
export function ScrollButtons({ endId }: { endId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const box = scrollContainerOf(ref.current);
    // Sur le document, l'événement scroll part de window, pas de <html>.
    const target: HTMLElement | Window = box === document.scrollingElement ? window : box;
    const update = () => {
      const end = document.getElementById(endId);
      setShowTop(box.scrollTop > 400);
      // « Fin » visible tant que la fin de l'article est encore sous l'écran.
      setShowEnd(!!end && end.getBoundingClientRect().top > window.innerHeight);
    };
    // Premier calcul une fois la page affichée (le contenu a alors sa hauteur réelle).
    const first = requestAnimationFrame(update);
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(first);
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [endId]);

  return (
    <div ref={ref} className="scroll-buttons">
      {showTop && (
        <button
          type="button"
          className="scroll-buttons__btn"
          onClick={() => scrollContainerOf(ref.current).scrollTo({ top: 0, behavior: scrollBehavior() })}
          title="Revenir en haut de l'article"
        >
          ↑ Haut
        </button>
      )}
      {showEnd && (
        <button
          type="button"
          className="scroll-buttons__btn"
          onClick={() => document.getElementById(endId)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })}
          title="Aller à la fin de l'article (réactions et commentaires)"
        >
          ↓ Fin
        </button>
      )}
    </div>
  );
}
