/**
 * Texte cherchable d'un article (colonne Article.searchText) : titre + texte + légendes,
 * en minuscules et sans accents. La recherche applique la même normalisation à la requête,
 * donc « egouts », « Égouts » et « égout » se trouvent mutuellement (stemmer français de Postgres).
 *
 * Volontairement indépendant du format exact du contenu : on ramasse le texte des nœuds
 * « text » et les champs descriptifs (alt, légende, titre de média), où qu'ils soient.
 */
export const normalizeSearch = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const DESCRIPTIVE_FIELDS = ['alt', 'caption', 'title'] as const;

function collect(node: unknown, out: string[]) {
  if (Array.isArray(node)) {
    for (const n of node) collect(n, out);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (obj.type === 'text' && typeof obj.text === 'string') out.push(obj.text);
  const attrs = (obj.attrs && typeof obj.attrs === 'object' ? obj.attrs : {}) as Record<string, unknown>;
  for (const f of DESCRIPTIVE_FIELDS) {
    if (typeof obj[f] === 'string') out.push(obj[f]);
    if (typeof attrs[f] === 'string') out.push(attrs[f]);
  }
  for (const [k, v] of Object.entries(obj)) {
    // Pas les marques (liens), ni les clés techniques.
    if (k !== 'marks' && k !== 'attrs' && typeof v === 'object') collect(v, out);
  }
}

export function searchTextOf(title: string, content: unknown): string {
  const parts = [title];
  collect(content, parts);
  return normalizeSearch(parts.join(' ')).slice(0, 100_000);
}
