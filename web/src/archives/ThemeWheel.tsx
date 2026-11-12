import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { asset } from '../lib/assets.ts';
import type { Theme } from '../lib/types.ts';
import './archives.css';

interface Props {
  themes: Theme[];
  /** slug du thème actif, null = « tous » */
  value: string | null;
  onChange: (slug: string | null) => void;
}

interface Slot {
  slug: string | null;
  name: string;
  icon: string;
}

/**
 * Roue des thèmes (DA : menu DS) : disque à cercles concentriques, pastilles en orbite.
 * Au clic, la roue tourne pour amener le thème choisi en haut ; il s'affiche au centre.
 * Au clavier : flèches gauche / droite (groupe de boutons radio).
 */
export function ThemeWheel({ themes, value, onChange }: Props) {
  const slots: Slot[] = [
    { slug: null, name: 'Tous les thèmes', icon: asset('theme-tous.png') },
    ...themes.map((t) => ({ slug: t.slug, name: t.name, icon: asset(`theme-${t.slug}.png`) })),
  ];
  const step = 360 / slots.length;
  const index = Math.max(0, slots.findIndex((s) => s.slug === value));
  // Tours complets accumulés : la roue prend toujours le chemin le plus court.
  const [turns, setTurns] = useState(0);
  const rotation = -index * step + turns * 360;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function select(i: number, focus = false) {
    const next = -i * step + turns * 360;
    const delta = next - rotation;
    if (delta > 180) setTurns((t) => t - 1);
    else if (delta < -180) setTurns((t) => t + 1);
    onChange(slots[i].slug);
    if (focus) buttons.current[i]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select((index + 1) % slots.length, true);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select((index - 1 + slots.length) % slots.length, true);
    else return;
    e.preventDefault();
  }

  const active = slots[index];

  return (
    <div className="wheel">
      <div className="wheel__disc" role="radiogroup" aria-label="Thème" onKeyDown={onKeyDown}>
        <div className="wheel__orbit" style={{ '--rot': `${rotation}deg` } as CSSProperties}>
          {slots.map((s, i) => (
            <button
              key={s.slug ?? 'tous'}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={i === index}
              aria-label={s.name}
              title={s.name}
              tabIndex={i === index ? 0 : -1}
              className="wheel__pastille"
              style={{ '--angle': `${i * step}deg` } as CSSProperties}
              onClick={() => select(i)}
            >
              <img src={s.icon} alt="" className="pixel" />
            </button>
          ))}
        </div>
        <div className="wheel__center" aria-hidden>
          <img src={active.icon} alt="" className="pixel" />
        </div>
        <span className="wheel__cursor" aria-hidden>
          ▼
        </span>
      </div>
      <div className="wheel__label" aria-live="polite">
        {active.name}
      </div>
    </div>
  );
}
