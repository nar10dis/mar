import { Link } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { asset } from '../lib/assets.ts';

/** Barre du haut façon écran DS : nom à gauche ; compte à droite (l'heure est dans le widget Horloge). */
export function StatusBar() {
  const { user } = useAuth();
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
      </div>
    </div>
  );
}
