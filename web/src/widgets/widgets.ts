import type { ComponentType } from 'react';
import { CalendarWidget } from './CalendarWidget.tsx';
import { ClockWidget } from './ClockWidget.tsx';
import { OnlineWidget } from './OnlineWidget.tsx';
import { RatWidget } from './RatWidget.tsx';

/**
 * Catalogue des widgets que le visiteur peut placer dans les deux emplacements.
 * Ajouter un widget = un composant + une ligne ici.
 */
export const WIDGETS = {
  clock: { label: 'Horloge', Component: ClockWidget },
  online: { label: 'Connectés', Component: OnlineWidget },
  rat: { label: 'Raton', Component: RatWidget },
  calendar: { label: 'Calendrier', Component: CalendarWidget },
} satisfies Record<string, { label: string; Component: ComponentType }>;

export type WidgetId = keyof typeof WIDGETS;

/** Ordre de défilement des flèches ◀ ▶ */
export const WIDGET_IDS = Object.keys(WIDGETS) as WidgetId[];

/** Emplacement 1 = haut (paysage) ou gauche (portrait). */
export const DEFAULT_SLOTS: [WidgetId, WidgetId] = ['clock', 'online'];

export const isWidgetId = (v: unknown): v is WidgetId => typeof v === 'string' && v in WIDGETS;
