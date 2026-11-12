import { useWidgetSlots } from './useWidgetSlots.ts';
import { WidgetSlot } from './WidgetSlot.tsx';

/** Le « second écran » : deux emplacements de widgets, choisis par le visiteur. */
export function WidgetPanel() {
  const { slots, setSlot } = useWidgetSlots();
  return (
    <aside className="ds__widgets ds-screen" aria-label="Widgets">
      <WidgetSlot index={0} widget={slots[0]} onChange={(id) => setSlot(0, id)} />
      <WidgetSlot index={1} widget={slots[1]} onChange={(id) => setSlot(1, id)} />
    </aside>
  );
}
