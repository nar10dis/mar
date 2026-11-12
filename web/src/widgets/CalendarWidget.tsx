import { useEffect, useState } from 'react';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** Calendrier du mois en cours, comme sur l'écran d'accueil de la DS. */
export function CalendarWidget() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Lundi en premier : getDay() met dimanche à 0.
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;

  return (
    <div className="calendar-widget">
      <p className="calendar-widget__month">{MONTH_FMT.format(now)}</p>
      <div className="calendar-widget__grid" role="grid" aria-label={MONTH_FMT.format(now)}>
        {DAYS.map((d, i) => (
          <span key={i} className="calendar-widget__head" aria-hidden>
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => (
          <span
            key={i}
            className={i + 1 === now.getDate() ? 'calendar-widget__day calendar-widget__day--today' : 'calendar-widget__day'}
            aria-current={i + 1 === now.getDate() ? 'date' : undefined}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
