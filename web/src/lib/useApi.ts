import { useEffect, useState } from 'react';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: T };

const LOADING = { status: 'loading' } as const;

/** GET JSON sur l'API (même origine). Suffisant tant qu'on n'a pas besoin de cache. */
export function useApi<T>(url: string): ApiState<T> {
  // On garde l'URL avec le résultat : si l'URL change, on est « loading » sans setState synchrone.
  const [result, setResult] = useState<{ url: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => setResult({ url, state: { status: 'ready', data } }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        console.error(`GET ${url} failed`, e);
        setResult({ url, state: { status: 'error' } });
      });
    return () => ctrl.abort();
  }, [url]);

  return result?.url === url ? result.state : LOADING;
}
