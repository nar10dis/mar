import { useCallback, useState } from 'react';
import { DEFAULT_SLOTS, isWidgetId } from './widgets.ts';
import type { WidgetId } from './widgets.ts';

const KEY = 'mar.widgets';
type Slots = [WidgetId, WidgetId];

// Préférence de confort, propre à ce navigateur : si le stockage est bloqué
// (navigation privée, cookies refusés), on retombe sur les widgets par défaut.
function load(): Slots {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (Array.isArray(v) && v.length === 2 && v.every(isWidgetId)) return [v[0], v[1]];
  } catch {
    // stockage indisponible ou valeur corrompue
  }
  return DEFAULT_SLOTS;
}

/** Le widget choisi pour chaque emplacement, mémorisé dans le navigateur. */
export function useWidgetSlots() {
  const [slots, setSlots] = useState<Slots>(load);

  const setSlot = useCallback((index: 0 | 1, id: WidgetId) => {
    setSlots((prev) => {
      const next: Slots = index === 0 ? [id, prev[1]] : [prev[0], id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // tant pis : le choix vaut pour cette visite seulement
      }
      return next;
    });
  }, []);

  return { slots, setSlot };
}
