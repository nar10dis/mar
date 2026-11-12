/** Erreur renvoyée par l'API, avec un message lisible (validation zod, 409, etc.). */
export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function errorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(' · ') : body.message;
    if (msg) return msg;
  } catch {
    // pas de JSON
  }
  if (res.status === 401) return 'Vous devez être connecté.';
  if (res.status === 403) return "Vous n'avez pas les droits pour faire ça.";
  return `Erreur ${res.status}`;
}

/** Appel JSON à l'API (même origine : le cookie de session part tout seul). */
export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Erreur inattendue');
