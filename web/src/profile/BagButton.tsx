import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { PixelButton } from '../components/PixelButton.tsx';
import { api, errorText } from '../lib/api.ts';
import type { Inventory } from '../lib/types.ts';

/** « Mettre dans le sac » / « Retirer du sac » sur la page d'un article des autres. */
export function BagButton({ articleId, authorId }: { articleId: number; authorId: number }) {
  const { user } = useAuth();
  const location = useLocation();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canBag = !!user && user.id !== authorId;

  useEffect(() => {
    if (!canBag) return;
    let live = true;
    api<Inventory>('GET', '/api/me/inventory')
      .then((inv) => live && setInventory(inv))
      .catch((e: unknown) => live && setError(errorText(e)));
    return () => {
      live = false;
    };
  }, [canBag]);

  if (user === null) {
    return <PixelButton to={`/connexion?next=${encodeURIComponent(location.pathname)}`}>Mettre dans le sac</PixelButton>;
  }
  if (!canBag || !inventory) return null;

  const position = inventory.findIndex((a) => a?.id === articleId);
  const inBag = position !== -1;
  const full = !inBag && inventory.every(Boolean);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      setInventory(
        inBag
          ? await api<Inventory>('DELETE', `/api/me/inventory/${position}`)
          : await api<Inventory>('POST', '/api/me/inventory', { articleId }),
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PixelButton
        variant={inBag ? 'default' : 'blue'}
        onClick={toggle}
        disabled={busy || full}
        title={full ? 'Ton sac est plein (8 cases). Retire un article depuis ton profil.' : undefined}
      >
        {inBag ? `Dans le sac (case ${position + 1}) · Retirer` : full ? 'Sac plein' : 'Mettre dans le sac'}
      </PixelButton>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
