/** ADMIN_EMAILS="a@x.fr, b@y.fr" : ces comptes sont ADMIN (à l'inscription et à chaque déploiement). */
export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}
