import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Tabs98 } from '../components/Tabs98.tsx';
import { Window98 } from '../components/Window98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { errorText } from '../lib/api.ts';

type Mode = 'sign-in' | 'sign-up';

/** Redirection après connexion : seulement vers une page du site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'));

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'inscription' ? 'sign-up' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-in') await signIn(email, password);
      else await signUp(email, password, pseudo);
      navigate(next, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLayout title={mode === 'sign-in' ? 'Connexion' : 'Inscription'}>
      <div className="narrow">
        <Window98 title="session.exe">
          <Tabs98
            label="Connexion ou inscription"
            tabs={[
              { id: 'sign-in', label: 'Connexion' },
              { id: 'sign-up', label: 'Créer un compte' },
            ]}
            active={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
          >
            <form className="form98" onSubmit={submit} noValidate={false}>
              <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              {mode === 'sign-up' && (
                <TextField
                  label="Pseudo"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={24}
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  hint="3 à 24 caractères. Modifiable plus tard."
                />
              )}
              <TextField
                label="Mot de passe"
                type="password"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'sign-up' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint={mode === 'sign-up' ? '8 caractères minimum.' : undefined}
              />
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form98__actions">
                <PixelButton type="submit" variant="rust" disabled={busy}>
                  {busy ? 'Un instant…' : mode === 'sign-in' ? 'Se connecter' : 'Créer mon compte'}
                </PixelButton>
              </div>
            </form>
          </Tabs98>
        </Window98>
      </div>
    </PageLayout>
  );
}
