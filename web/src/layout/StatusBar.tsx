import { useEffect, useState } from 'react';
import { Link } from 'react-router';

const pad = (n: number) => String(n).padStart(2, '0');

/** Barre du haut façon écran DS : nom à gauche, heure + date à droite. */
export function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="status-bar">
      <Link to="/" className="status-bar__name">
        MORT AUX RATS
      </Link>
      <span className="status-bar__clock">
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="status-bar__sep" />
        {pad(now.getDate())}/{pad(now.getMonth() + 1)}
      </span>
    </div>
  );
}
