import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api.ts';
import { AuthContext } from './useAuth.ts';
import type { User } from './useAuth.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api<{ user: User | null }>('GET', '/api/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await api<User>('POST', '/api/auth/sign-in', { email, password }));
  }, []);
  const signUp = useCallback(async (email: string, password: string, pseudo: string) => {
    setUser(await api<User>('POST', '/api/auth/sign-up', { email, password, pseudo }));
  }, []);
  const signOut = useCallback(async () => {
    await api('POST', '/api/auth/sign-out');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signUp, signOut, setUser }), [user, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
