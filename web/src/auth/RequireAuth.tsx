import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { useAuth } from './useAuth.ts';

/** Protège une page : redirige vers /connexion (puis revient), ou refuse si le rôle ne suffit pas. */
export function RequireAuth({ role, children }: { role?: 'ADMIN'; children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    return (
      <main className="page">
        <StatusMessage title="session.exe">Vérification de la session…</StatusMessage>
      </main>
    );
  }
  if (user === null) {
    return <Navigate to={`/connexion?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (role && user.role !== role) {
    return (
      <main className="page">
        <StatusMessage title="Accès refusé">Cette page est réservée aux administrateurs.</StatusMessage>
      </main>
    );
  }
  return children;
}
