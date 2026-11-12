import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import type { User } from '../auth/useAuth.ts';
import { TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { api, errorText } from '../lib/api.ts';
import { asset } from '../lib/assets.ts';
import { IMAGE_ACCEPT, uploadImage } from '../lib/upload.ts';
import { DeleteAccount } from './DeleteAccount.tsx';

/** Réglages du compte : pseudo, avatar, déconnexion. (Le profil et le sac : /profil.) */
export function AccountPage() {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState(user?.pseudo ?? '');
  const [pseudoMsg, setPseudoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<'pseudo' | 'avatar' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null; // RequireAuth s'en occupe

  async function savePseudo(e: FormEvent) {
    e.preventDefault();
    setBusy('pseudo');
    setPseudoMsg(null);
    try {
      setUser(await api<User>('PATCH', '/api/me', { pseudo }));
      setPseudoMsg({ ok: true, text: 'Pseudo enregistré.' });
    } catch (err) {
      setPseudoMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  }

  async function changeAvatar(file: File | undefined) {
    if (!file) return;
    setBusy('avatar');
    setAvatarMsg(null);
    try {
      const { key } = await uploadImage(file, 'avatar');
      setUser(await api<User>('PATCH', '/api/me', { avatarKey: key }));
    } catch (err) {
      setAvatarMsg(errorText(err));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeAvatar() {
    setBusy('avatar');
    setAvatarMsg(null);
    try {
      setUser(await api<User>('PATCH', '/api/me', { avatarKey: null }));
    } catch (err) {
      setAvatarMsg(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageLayout
      title="Mon compte"
      actions={
        <PixelButton
          onClick={async () => {
            // D'abord quitter la page protégée, sinon RequireAuth redirige vers /connexion.
            navigate('/');
            await signOut();
          }}
        >
          Se déconnecter
        </PixelButton>
      }
    >
      <div className="account-grid">
        <Window98 title="avatar.bmp">
          <div className="avatar-edit">
            <img className="avatar-edit__img" src={user.avatarUrl ?? asset('avatar-default.png')} alt="Votre avatar" />
            <div className="form98">
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="visually-hidden"
                id="avatar-file"
                onChange={(e) => changeAvatar(e.target.files?.[0])}
              />
              <PixelButton variant="blue" onClick={() => fileRef.current?.click()} disabled={busy === 'avatar'}>
                {busy === 'avatar' ? 'Envoi…' : "Changer l'avatar"}
              </PixelButton>
              {user.avatarUrl && (
                <PixelButton onClick={removeAvatar} disabled={busy === 'avatar'}>
                  Avatar par défaut
                </PixelButton>
              )}
              <p className="field__hint">PNG, JPG, WebP ou GIF, 2 Mo max. Les petites images pixel art rendent mieux.</p>
              {avatarMsg && (
                <p className="form-error" role="alert">
                  {avatarMsg}
                </p>
              )}
            </div>
          </div>
        </Window98>

        <Window98 title="compte.ini">
          <form className="form98" onSubmit={savePseudo}>
            <TextField label="Email" value={user.email} readOnly disabled />
            <TextField
              label="Pseudo"
              required
              minLength={3}
              maxLength={24}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              error={pseudoMsg && !pseudoMsg.ok ? pseudoMsg.text : null}
              hint={pseudoMsg?.ok ? pseudoMsg.text : 'Visible sur vos articles et commentaires.'}
            />
            <div className="form98__actions">
              <PixelButton type="submit" variant="rust" disabled={busy === 'pseudo' || pseudo === user.pseudo}>
                Enregistrer
              </PixelButton>
              {user.role === 'ADMIN' && <span className="badge badge--rust">ADMIN</span>}
            </div>
          </form>
        </Window98>
      </div>
      <DeleteAccount />
    </PageLayout>
  );
}
