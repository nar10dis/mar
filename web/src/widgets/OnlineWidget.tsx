import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.ts';
import { asset } from '../lib/assets.ts';
import type { OnlineUser } from '../lib/types.ts';
import type { ApiState } from '../lib/useApi.ts';

const REFRESH_MS = 30_000;

/** Utilisateurs connectés, rafraîchis toutes les 30 s (et quand on se connecte / déconnecte). */
export function OnlineWidget() {
  const { user } = useAuth();
  const [state, setState] = useState<ApiState<OnlineUser[]>>({ status: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    const load = () =>
      fetch('/api/presence', { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<OnlineUser[]>) : Promise.reject(new Error(String(r.status)))))
        .then((data) => setState({ status: 'ready', data }))
        .catch(() => {
          // Une erreur passagère ne vide pas une liste déjà affichée.
          if (!ctrl.signal.aborted) setState((s) => (s.status === 'ready' ? s : { status: 'error' }));
        });
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(id);
      ctrl.abort();
    };
  }, [user?.id]);

  if (state.status === 'loading') return <p className="widget__muted">Chargement…</p>;
  if (state.status === 'error') return <p className="widget__muted">Liste indisponible.</p>;

  return (
    <div className="online-widget">
      <p className="online-widget__count">
        <span className="online-widget__dot" aria-hidden />
        {state.data.length === 0 ? 'Personne en ligne' : `${state.data.length} en ligne`}
      </p>
      {state.data.length > 0 && (
        <ul className="online-widget__list">
          {state.data.map((u) => (
            <li key={u.id} className={u.id === user?.id ? 'online-widget__me' : undefined}>
              <img src={u.avatarUrl ?? asset('avatar-default.png')} alt="" className="online-widget__avatar" />
              <span className="online-widget__pseudo">{u.pseudo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
