import type { BlockType } from '../lib/types.ts';
import { BLOCK_LABELS, MAX_COLS, newBlock, newRow } from './content.ts';
import type { Draft, DraftRow } from './content.ts';
import { MediaBlockEditor } from './MediaBlockEditor.tsx';
import { TextBlockEditor } from './TextBlockEditor.tsx';
import { YoutubeBlockEditor } from './YoutubeBlockEditor.tsx';
import './editor.css';

interface Props {
  rows: DraftRow[];
  onChange: (rows: DraftRow[]) => void;
}

const BLOCK_TYPES: BlockType[] = ['text', 'image', 'audio', 'pdf', 'youtube'];

const hasContent = (d: Draft | null) =>
  !!d && (d.type === 'text' ? true : d.type === 'youtube' ? !!d.url : !!d.key);

/**
 * Mise en page en rangées de 1 à 3 colonnes, une case = un bloc.
 * Tout se fait aux boutons (accessible au clavier) : ↑↓ pour les rangées,
 * ←→ pour changer de colonne, ⇡⇣ pour passer un bloc dans la rangée voisine.
 */
export function ArticleEditor({ rows, onChange }: Props) {
  const update = (fn: (draft: DraftRow[]) => void) => {
    const next = rows.map((r) => ({ ...r, cols: [...r.cols] }));
    fn(next);
    onChange(next);
  };

  const swap = <T,>(a: T[], i: number, j: number) => {
    [a[i], a[j]] = [a[j], a[i]];
  };

  const moveRow = (i: number, dir: -1 | 1) => update((d) => swap(d, i, i + dir));
  const removeRow = (i: number) => {
    if (rows[i].cols.some(hasContent) && !window.confirm('Supprimer cette rangée et ses blocs ?')) return;
    update((d) => d.splice(i, 1));
  };
  const addCol = (i: number) => update((d) => d[i].cols.push(null));
  const removeCol = (i: number, j: number) => update((d) => d[i].cols.splice(j, 1));
  const setBlock = (i: number, j: number, b: Draft | null) => update((d) => (d[i].cols[j] = b));
  const clearCell = (i: number, j: number) => {
    if (hasContent(rows[i].cols[j]) && !window.confirm('Retirer ce bloc ?')) return;
    setBlock(i, j, null);
  };
  const moveH = (i: number, j: number, dir: -1 | 1) => update((d) => swap(d[i].cols, j, j + dir));

  /** Vers la rangée voisine : échange avec la case de même colonne, sinon ajoute une colonne. */
  const canMoveV = (i: number, j: number, dir: -1 | 1) => {
    const target = rows[i + dir];
    return !!target && (j < target.cols.length || target.cols.length < MAX_COLS);
  };
  const moveV = (i: number, j: number, dir: -1 | 1) =>
    update((d) => {
      const target = d[i + dir];
      if (j < target.cols.length) {
        [d[i].cols[j], target.cols[j]] = [target.cols[j], d[i].cols[j]];
      } else {
        target.cols.push(d[i].cols[j]);
        d[i].cols[j] = null;
      }
    });

  return (
    <div className="article-editor">
      {rows.length === 0 && <p className="muted">Commencez par ajouter une rangée.</p>}

      {rows.map((row, i) => (
        <section key={row.id} className="editor-row" aria-label={`Rangée ${i + 1}`}>
          <header className="editor-row__head">
            <span>
              Rangée {i + 1} · {row.cols.length} colonne{row.cols.length > 1 ? 's' : ''}
            </span>
            <div className="editor-row__tools">
              {row.cols.length < MAX_COLS && (
                <ToolButton label="+ colonne" title="Ajouter une colonne" onClick={() => addCol(i)} />
              )}
              <ToolButton label="↑" title="Monter la rangée" disabled={i === 0} onClick={() => moveRow(i, -1)} />
              <ToolButton label="↓" title="Descendre la rangée" disabled={i === rows.length - 1} onClick={() => moveRow(i, 1)} />
              <ToolButton label="✕" title="Supprimer la rangée" onClick={() => removeRow(i)} />
            </div>
          </header>

          <div className="editor-row__cols" style={{ gridTemplateColumns: `repeat(${row.cols.length}, minmax(0, 1fr))` }}>
            {row.cols.map((block, j) => (
              <div key={block?.id ?? `empty-${j}`} className="editor-cell">
                <div className="editor-cell__head">
                  <span className="editor-cell__type">{block ? BLOCK_LABELS[block.type] : 'Case vide'}</span>
                  <div className="editor-row__tools">
                    <ToolButton label="←" title="Vers la colonne de gauche" disabled={j === 0} onClick={() => moveH(i, j, -1)} />
                    <ToolButton label="→" title="Vers la colonne de droite" disabled={j === row.cols.length - 1} onClick={() => moveH(i, j, 1)} />
                    {block && (
                      <>
                        <ToolButton label="⇡" title="Vers la rangée du dessus" disabled={!canMoveV(i, j, -1)} onClick={() => moveV(i, j, -1)} />
                        <ToolButton label="⇣" title="Vers la rangée du dessous" disabled={!canMoveV(i, j, 1)} onClick={() => moveV(i, j, 1)} />
                        <ToolButton label="✕" title="Retirer le bloc" onClick={() => clearCell(i, j)} />
                      </>
                    )}
                    {!block && row.cols.length > 1 && (
                      <ToolButton label="✕" title="Supprimer cette colonne" onClick={() => removeCol(i, j)} />
                    )}
                  </div>
                </div>

                {!block && (
                  <div className="block-picker" role="group" aria-label="Choisir un type de bloc">
                    {BLOCK_TYPES.map((t) => (
                      <button key={t} type="button" className="block-picker__btn" onClick={() => setBlock(i, j, newBlock(t))}>
                        {BLOCK_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
                {block?.type === 'text' && (
                  <TextBlockEditor
                    doc={block.doc}
                    label={`Texte, rangée ${i + 1}, colonne ${j + 1}`}
                    onChange={(doc) => setBlock(i, j, { ...block, doc })}
                  />
                )}
                {(block?.type === 'image' || block?.type === 'audio' || block?.type === 'pdf') && (
                  <MediaBlockEditor block={block} onChange={(b) => setBlock(i, j, b)} />
                )}
                {block?.type === 'youtube' && <YoutubeBlockEditor block={block} onChange={(b) => setBlock(i, j, b)} />}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="editor-add-row">
        <span>Ajouter une rangée :</span>
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" className="block-picker__btn" onClick={() => onChange([...rows, newRow(n)])}>
            {n} colonne{n > 1 ? 's' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolButton({ label, title, onClick, disabled }: { label: string; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="tool98" title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
