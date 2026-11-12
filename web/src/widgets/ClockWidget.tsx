import { useEffect, useState } from 'react';
import { OldClock } from './OldClock.tsx';

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function ClockWidget() {
  // La date seule : l'horloge gère ses propres secondes.
  const [today, setToday] = useState(() => DATE_FMT.format(new Date()));
  useEffect(() => {
    const id = setInterval(() => setToday(DATE_FMT.format(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="clock-widget">
      <div className="clock-widget__face">
        <OldClock />
      </div>
      <p className="clock-widget__date">{today}</p>
    </div>
  );
}
