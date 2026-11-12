import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router';
import { FeedCard } from '../article/FeedCard.tsx';
import { ThemeWheel } from '../archives/ThemeWheel.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { PixelIcon } from '../components/PixelIcon.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { api, errorText } from '../lib/api.ts';
import { asset } from '../lib/assets.ts';
import type { SearchPage, Theme } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';

const SORTS = [
  { id: 'random', label: 'Aléatoire' },
  { id: 'recent', label: 'Récent → ancien' },
  { id: 'ancien', label: 'Ancien → récent' },
  { id: 'az', label: 'A → Z' },
  { id: 'za', label: 'Z → A' },
] as const;

type Sort = (typeof SORTS)[number]['id'];

const newSeed = () => Math.random().toString(36).slice(2, 10);

/**
 * Archives : roue des thèmes × tri × recherche, combinables.
 * L'état vit dans l'URL (?theme=cinema&sort=za&q=BD) : partageable, et le bouton retour marche.
 */
export function ArchivesPage() {
  const [params, setParams] = useSearchParams();
  const themes = useApi<Theme[]>('/api/themes');

  const theme = params.get('theme');
  const sort: Sort = SORTS.some((s) => s.id === params.get('sort')) ? (params.get('sort') as Sort) : 'random';
  const q = params.get('q') ?? '';
  // Graine du tri aléatoire : fixe pendant la visite (les pages suivantes ne se remélangent pas).
  const [seed, setSeed] = useState(newSeed);

  /** Met à jour un paramètre d'URL ; la valeur par défaut est retirée pour garder des liens courts. */
  const setParam = useCallback(
    (key: string, value: string | null) =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        // La frappe ne remplit pas l'historique ; thème et tri, si (bouton retour).
        { replace: key === 'q' },
      ),
    [setParams],
  );

  // Recherche : le champ suit la frappe, l'URL (et donc la requête) 300 ms après.
  // Ne réagit qu'à la frappe : un changement d'URL venu d'ailleurs (retour, lien) n'est pas écrasé.
  const [text, setText] = useState(q);
  useEffect(() => {
    const id = setTimeout(() => {
      setParams(
        (p) => {
          const wanted = text.trim();
          if ((p.get('q') ?? '') === wanted) return p;
          const next = new URLSearchParams(p);
          if (wanted) next.set('q', wanted);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(id);
  }, [text, setParams]);

  const query = new URLSearchParams({ sort, ...(theme && { theme }), ...(q && { q }), ...(sort === 'random' && { seed }) }).toString();
  const first = useApi<SearchPage>(`/api/articles/search?${query}`);

  // Pages suivantes : rattachées à la requête qui les a produites (oubliées si elle change).
  const [more, setMore] = useState<{ query: string; page: SearchPage } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const extra = more?.query === query ? more.page : null;

  const items = first.status === 'ready' ? [...first.data.items, ...(extra?.items ?? [])] : [];
  const nextOffset = extra ? extra.nextOffset : first.status === 'ready' ? first.data.nextOffset : null;

  async function loadMore() {
    if (nextOffset === null) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await api<SearchPage>('GET', `/api/articles/search?${query}&offset=${nextOffset}`);
      setMore({ query, page: { ...page, items: [...(extra?.items ?? []), ...page.items] } });
    } catch (e) {
      setMoreError(errorText(e));
    } finally {
      setLoadingMore(false);
    }
  }

  const onSortKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = SORTS[(i + dir + SORTS.length) % SORTS.length];
    setParam('sort', next.id === 'random' ? null : next.id);
    (e.currentTarget.parentElement?.children[(i + dir + SORTS.length) % SORTS.length] as HTMLElement | undefined)?.focus();
  };

  return (
    <PageLayout title="Archives" poiIcon={poiById('archives').icon}>
      <div className="archives">
        <aside className="archives__wheel">
          {themes.status === 'ready' && <ThemeWheel themes={themes.data} value={theme} onChange={(slug) => setParam('theme', slug)} />}
        </aside>

        <section aria-label="Résultats">
          <div className="archives__controls">
            <label className="archives__search">
              <PixelIcon src={asset('icon-recherche.png')} size={16} />
              <span className="visually-hidden">Rechercher</span>
              <input
                className="input98"
                type="search"
                placeholder="Titre, texte, auteur…"
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <div className="archives__sort" role="radiogroup" aria-label="Trier">
              <span className="archives__sort-label" aria-hidden>
                Tri :
              </span>
              {SORTS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={sort === s.id}
                  tabIndex={sort === s.id ? 0 : -1}
                  className="sort98"
                  onClick={() => setParam('sort', s.id === 'random' ? null : s.id)}
                  onKeyDown={(e) => onSortKey(e, i)}
                >
                  {s.label}
                </button>
              ))}
              {sort === 'random' && (
                <PixelButton className="pixel-button--small" onClick={() => setSeed(newSeed())} title="Nouvel ordre aléatoire">
                  Mélanger
                </PixelButton>
              )}
            </div>
          </div>

          {first.status === 'loading' && <StatusMessage title="archives.exe">Recherche…</StatusMessage>}
          {first.status === 'error' && <StatusMessage title="Erreur">La recherche a échoué. Réessayez.</StatusMessage>}
          {first.status === 'ready' && (
            <p className="archives__count" aria-live="polite">
              {first.data.total === 0 ? 'Aucun article ne correspond.' : `${first.data.total} article${first.data.total > 1 ? 's' : ''}`}
            </p>
          )}
          {items.length > 0 && (
            <ul className="article-list">
              {items.map((a) => (
                <li key={a.id}>
                  <FeedCard article={a} />
                </li>
              ))}
            </ul>
          )}
          {nextOffset !== null && (
            <div className="feed-more">
              <PixelButton onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Chargement…' : 'Voir plus'}
              </PixelButton>
            </div>
          )}
          {moreError && <p className="form-error">{moreError}</p>}
        </section>
      </div>
    </PageLayout>
  );
}
