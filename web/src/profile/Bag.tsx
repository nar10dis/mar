import { useState } from 'react';
import type { DragEvent } from 'react';
import { Cartouche } from '../components/Cartouche.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { api, errorText } from '../lib/api.ts';
import type { Inventory } from '../lib/types.ts';
import './profile.css';

const COLS = 4;

/**
 * Sac de 8 cases façon sac Pokémon.
 * Réordonner : cliquer une case puis une autre (les deux s'échangent), glisser-déposer, ou les flèches de la fiche.
 */
export function Bag({ inventory, onChange }: { inventory: Inventory; onChange: (inv: Inventory) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const filled = inventory.filter(Boolean).length;
  const current = selected === null ? null : inventory[selected];

  async function run(method: string, url: string, body?: unknown, nextSelected: number | null = null) {
    setBusy(true);
    setError(null);
    try {
      onChange(await api<Inventory>(method, url, body));
      setSelected(nextSelected);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const swap = (from: number, to: number) => run('POST', '/api/me/inventory/swap', { from, to }, to);

  function clickSlot(i: number) {
    if (busy) return;
    if (selected === null) {
      if (inventory[i]) setSelected(i);
    } else if (selected === i) {
      setSelected(null);
    } else {
      void swap(selected, i);
    }
  }

  function drop(e: DragEvent, to: number) {
    e.preventDefault();
    if (dragFrom !== null && dragFrom !== to) void swap(dragFrom, to);
    setDragFrom(null);
  }

  return (
    <Window98 title={`sac.exe — ${filled}/${inventory.length}`} className="bag">
      <p className="muted bag__hint">
        {selected === null
          ? 'Choisis une case pour voir l’article. Pour ranger : choisis une case puis une autre (ou glisse-dépose à la souris).'
          : 'Choisis une autre case pour échanger, ou la même pour annuler.'}
      </p>

      <ol className="bag__grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {inventory.map((a, i) => (
          <li key={i}>
            <button
              type="button"
              className={['bag-slot', 'ds-select', a ? '' : 'bag-slot--empty', selected === i ? 'bag-slot--selected' : '']
                .filter(Boolean)
                .join(' ')}
              aria-pressed={selected === i}
              aria-label={a ? `Case ${i + 1} : ${a.title}` : `Case ${i + 1} : vide`}
              disabled={busy || (selected === null && !a)}
              onClick={() => clickSlot(i)}
              draggable={!!a && !busy}
              onDragStart={() => setDragFrom(i)}
              onDragEnd={() => setDragFrom(null)}
              onDragOver={(e) => dragFrom !== null && e.preventDefault()}
              onDrop={(e) => drop(e, i)}
            >
              <span className="bag-slot__num">{i + 1}</span>
              {a ? (
                <>
                  {a.coverUrl ? (
                    <img className="bag-slot__cover" src={a.coverUrl} alt="" loading="lazy" draggable={false} />
                  ) : (
                    <span className="bag-slot__cover bag-slot__cover--none" style={{ background: a.theme.color }} />
                  )}
                  <span className="bag-slot__title">{a.title}</span>
                </>
              ) : (
                <span className="bag-slot__title muted">—</span>
              )}
            </button>
          </li>
        ))}
      </ol>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {filled === 0 && (
        <p className="muted">Ton sac est vide. Sur la page d’un article des autres, clique « Mettre dans le sac ».</p>
      )}

      {selected !== null && current && (
        <Cartouche className="bag__card" title={current.title}>
          <p>
            par {current.author.pseudo} ·{' '}
            <span className="article-meta__dot" style={{ background: current.theme.color }} aria-hidden /> {current.theme.name}
          </p>
          <div className="bag__actions">
            <PixelButton variant="blue" to={`/blog/articles/${current.id}`}>
              Lire
            </PixelButton>
            <PixelButton disabled={busy || selected === 0} onClick={() => swap(selected, selected - 1)} aria-label="Déplacer vers la case précédente">
              ←
            </PixelButton>
            <PixelButton
              disabled={busy || selected === inventory.length - 1}
              onClick={() => swap(selected, selected + 1)}
              aria-label="Déplacer vers la case suivante"
            >
              →
            </PixelButton>
            <PixelButton variant="rust" disabled={busy} onClick={() => run('DELETE', `/api/me/inventory/${selected}`)}>
              Retirer du sac
            </PixelButton>
          </div>
        </Cartouche>
      )}
    </Window98>
  );
}
