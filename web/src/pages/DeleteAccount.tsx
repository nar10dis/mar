import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { api, errorText } from '../lib/api.ts';

/** Zone « danger » de la page compte : suppression définitive, confirmée par le mot de passe (RGPD). */
export function DeleteAccount() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('DELETE', '/api/me', { password });
      // D'abord quitter la page protégée, sinon RequireAuth redirige vers /connexion.
      navigate('/', { replace: true });
      setUser(null);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Window98 title="supprimer_compte.exe" className="danger-zone">
      {!open ? (
        <div className="form98">
          <p>Supprimer ton compte efface définitivement :</p>
          <ul className="danger-zone__list">
            <li>tes articles, avec leurs réactions et commentaires ;</li>
            <li>tes commentaires, et les réponses qui leur ont été faites ;</li>
            <li>tes réactions, ton sac, ton avatar et tes fichiers.</li>
          </ul>
          <div className="form98__actions">
            <PixelButton variant="rust" onClick={() => setOpen(true)}>
              Supprimer mon compte…
            </PixelButton>
          </div>
        </div>
      ) : (
        <form className="form98" onSubmit={submit}>
          <p>
            <strong>C’est définitif.</strong> Tape ton mot de passe pour confirmer.
          </p>
          <TextField
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <div className="form98__actions">
            <PixelButton type="submit" variant="rust" disabled={busy || !password}>
              {busy ? 'Suppression…' : 'Supprimer définitivement'}
            </PixelButton>
            <PixelButton
              onClick={() => {
                setOpen(false);
                setPassword('');
                setError(null);
              }}
              disabled={busy}
            >
              Annuler
            </PixelButton>
          </div>
        </form>
      )}
    </Window98>
  );
}
