import { useCallback, useEffect, useState } from 'react';
import { api, errorText } from '../lib/api.ts';

/** Liste admin rechargeable après chaque modification. */
export function useList<T>(url: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      api<T[]>('GET', url)
        .then((data) => {
          setItems(data);
          setError(null);
        })
        .catch((e: unknown) => setError(errorText(e))),
    [url],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, error, reload };
}

/** Confirmation avant suppression, puis appel + rechargement. */
export async function confirmDelete(what: string, url: string, reload: () => Promise<unknown>) {
  if (!window.confirm(`Supprimer ${what} ? C'est définitif.`)) return;
  try {
    await api('DELETE', url);
  } catch (e) {
    window.alert(errorText(e));
  }
  await reload();
}
