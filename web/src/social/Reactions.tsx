import { useEffect, useState } from 'react';
import { ReactionBubble } from '../components/ReactionBubble.tsx';
import { api, errorText } from '../lib/api.ts';
import { REACTIONS } from '../lib/reactions.ts';
import type { ReactionKind } from '../lib/reactions.ts';
import type { ReactionSummary } from '../lib/types.ts';
import './social.css';

/**
 * Les 9 bulles sous un article. Ouvert à tous, sans compte : une réaction par personne,
 * cliquer une autre bulle change d'avis, re-cliquer la sienne la retire.
 */
export function Reactions({ articleId }: { articleId: number }) {
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ReactionSummary>('GET', `/api/articles/${articleId}/reactions`)
      .then(setSummary)
      .catch((e: unknown) => setError(errorText(e)));
  }, [articleId]);

  async function react(kind: ReactionKind) {
    if (!summary || busy) return;
    setBusy(true);
    setError(null);
    // Affichage immédiat, corrigé par la réponse du serveur.
    const previous = summary;
    const counts = { ...summary.counts };
    if (summary.mine) counts[summary.mine] = Math.max(0, (counts[summary.mine] ?? 1) - 1);
    const removing = summary.mine === kind;
    if (!removing) counts[kind] = (counts[kind] ?? 0) + 1;
    setSummary({ counts, mine: removing ? null : kind });
    try {
      setSummary(
        removing
          ? await api<ReactionSummary>('DELETE', `/api/articles/${articleId}/reactions`)
          : await api<ReactionSummary>('PUT', `/api/articles/${articleId}/reactions`, { kind }),
      );
    } catch (e) {
      setSummary(previous);
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="reactions" aria-label="Réactions">
      <div className="reactions__bubbles">
        {REACTIONS.map((r) => (
          <ReactionBubble
            key={r.kind}
            kind={r.kind}
            count={summary?.counts[r.kind] ?? 0}
            selected={summary?.mine === r.kind}
            onClick={() => react(r.kind)}
          />
        ))}
      </div>
      <p className="reactions__hint">
        {summary?.mine ? 'Re-cliquez votre bulle pour la retirer.' : 'Une réaction par personne, sans compte.'}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
