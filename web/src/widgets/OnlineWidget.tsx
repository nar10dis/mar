import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.ts';
import { asset } from '../lib/assets.ts';
import type { OnlineUser } from '../lib/types.ts';
import type { ApiState } from '../lib/useApi.ts';

/**
 * Utilisateurs connectés, mis à jour en direct : l'API pousse la liste par SSE
 * dès qu'elle change. Le widget ne fait que lire ; la présence est signalée par
 * usePresenceHeartbeat (RootLayout).
 */
export function OnlineWidget() {
  const { user } = useAuth();
  const [state, setState] = useState<ApiState<OnlineUser[]>>({ status: 'loading' });

  useEffect(() => {
    // EventSource se reconnecte tout seul si le flux coupe (redéploiement, réseau).
    const source = new EventSource('/api/presence/stream');
    source.onmessage = (e: MessageEvent<string>) => setState({ status: 'ready', data: JSON.parse(e.data) as OnlineUser[] });
    // Pendant une reconnexion, on garde la dernière liste affichée.
    source.onerror = () => setState((s) => (s.status === 'ready' ? s : { status: 'error' }));
    return () => source.close();
  }, []);

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
