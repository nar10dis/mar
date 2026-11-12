import { WIDGET_IDS, WIDGETS } from './widgets.ts';
import type { WidgetId } from './widgets.ts';

interface WidgetSlotProps {
  index: 0 | 1;
  widget: WidgetId;
  onChange(id: WidgetId): void;
}

/** Fenêtre Win98 avec ◀ ▶ dans la barre de titre pour passer d'un widget à l'autre. */
export function WidgetSlot({ index, widget, onChange }: WidgetSlotProps) {
  const { label, Component } = WIDGETS[widget];
  const step = (dir: 1 | -1) => {
    const i = WIDGET_IDS.indexOf(widget);
    onChange(WIDGET_IDS[(i + dir + WIDGET_IDS.length) % WIDGET_IDS.length]);
  };

  return (
    <section className="window98 widget" aria-label={`Emplacement ${index + 1} : ${label}`}>
      <header className="window98__titlebar widget__bar">
        <button type="button" className="widget__arrow" onClick={() => step(-1)} aria-label="Widget précédent">
          <ArrowIcon dir="left" />
        </button>
        <span className="widget__title" aria-live="polite">
          {label}
        </span>
        <button type="button" className="widget__arrow" onClick={() => step(1)} aria-label="Widget suivant">
          <ArrowIcon dir="right" />
        </button>
      </header>
      <div className="widget__body">
        <Component />
      </div>
    </section>
  );
}

function ArrowIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 4 7" width="8" height="14" shapeRendering="crispEdges" aria-hidden>
      <path d={dir === 'left' ? 'M3 0h1v7H3V6H2V5H1V4H0V3h1V2h1V1h1z' : 'M0 0h1v1h1v1h1v1h1v1H3v1H2v1H1v1H0z'} fill="currentColor" />
    </svg>
  );
}
