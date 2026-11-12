import { createContext, useContext } from 'react';

export interface User {
  id: number;
  email: string;
  pseudo: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AuthState {
  /** undefined = encore en train de vérifier la session */
  user: User | null | undefined;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, pseudo: string): Promise<void>;
  signOut(): Promise<void>;
  setUser(user: User): void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() hors de <AuthProvider>');
  return ctx;
}
