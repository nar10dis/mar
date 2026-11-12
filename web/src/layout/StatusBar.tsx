import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { asset } from '../lib/assets.ts';

const pad = (n: number) => String(n).padStart(2, '0');

/** Barre du haut façon écran DS : nom à gauche ; compte, heure et date à droite. */
export function StatusBar() {
  const { user } = useAuth();
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
      <div className="status-bar__right">
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="status-bar__link">
            Admin
          </Link>
        )}
        {user && (
          <Link to="/compte" className="status-bar__link status-bar__user">
            <img src={user.avatarUrl ?? asset('avatar-default.png')} alt="" className="status-bar__avatar" />
            {user.pseudo}
          </Link>
        )}
        {user === null && (
          <Link to="/connexion" className="status-bar__link">
            Connexion
          </Link>
        )}
        <span className="status-bar__sep" />
        <span className="status-bar__clock">
          {pad(now.getHours())}:{pad(now.getMinutes())}
          <span className="status-bar__sep" />
          {pad(now.getDate())}/{pad(now.getMonth() + 1)}
        </span>
      </div>
    </div>
  );
}
