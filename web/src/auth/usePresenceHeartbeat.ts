import { useEffect } from 'react';
import { useAuth } from './useAuth.ts';

/** Moins que la fenêtre « en ligne » de l'API (3 min), avec de la marge. */
const PING_MS = 45_000;

/**
 * Tant qu'un utilisateur connecté a le site ouvert ET visible, signale sa présence à l'API,
 * quel que soit le widget affiché. Onglet caché : on arrête (il sort de la liste « Connectés »
 * après 3 min) ; retour sur l'onglet : signal immédiat.
 */
export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (userId === undefined) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    // Erreurs ignorées : un ping raté sera rattrapé au suivant.
    const ping = () => void fetch('/api/presence/ping', { method: 'POST' }).catch(() => {});
    const start = () => {
      if (timer !== undefined) return;
      ping();
      timer = setInterval(ping, PING_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [userId]);
}
