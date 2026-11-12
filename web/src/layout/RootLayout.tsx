import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { usePresenceHeartbeat } from '../auth/usePresenceHeartbeat.ts';
import { WidgetPanel } from '../widgets/WidgetPanel.tsx';
import { StatusBar } from './StatusBar.tsx';

/**
 * Deux écrans façon DS : le contenu de la page, et les widgets
 * (à gauche en paysage, en bas en portrait — tout est dans layout.css).
 */
export function RootLayout() {
  usePresenceHeartbeat();
  const { pathname } = useLocation();
  const screen = useRef<HTMLDivElement>(null);
  // C'est l'écran qui défile, pas la fenêtre : on le remet en haut à chaque changement de page.
  useEffect(() => {
    screen.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <StatusBar />
      <div className="ds">
        <div ref={screen} className="ds__main ds-screen">
          <Outlet />
        </div>
        <WidgetPanel />
      </div>
    </>
  );
}
