import { useState } from 'react';
import type { FormEvent } from 'react';
import { Checkbox, TextArea, TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { api, errorText } from '../lib/api.ts';
import { formatPrice } from '../lib/format.ts';
import { IMAGE_ACCEPT, uploadImage } from '../lib/upload.ts';
import { confirmDelete, useList } from './useList.ts';

interface AdminMagazine {
  id: number;
  title: string;
  issue: string | null;
  coverUrl: string;
  price: number;
  description: string | null;
  helloAssoUrl: string;
  order: number;
  published: boolean;
}

type Draft = Omit<AdminMagazine, 'id' | 'price' | 'order'> & { id?: number; price: string; order: string };

const EMPTY: Draft = { title: '', issue: '', coverUrl: '', price: '', description: '', helloAssoUrl: '', order: '0', published: true };

/** "8", "8,5", "8.50" → 850 centimes */
const toCents = (v: string) => {
  const n = Number(v.replace(',', '.').replace(/\s|€/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
};

export function MagazinesAdmin() {
  const { items, error, reload } = useList<AdminMagazine>('/api/admin/magazines');
  const [draft, setDraft] = useState<Draft | null>(null);

  return (
    <div className="admin-section">
      <div className="admin-section__head">
        <p className="muted">Les magazines publiés apparaissent dans le Shop, triés par « ordre ».</p>
        <PixelButton variant="rust" onClick={() => setDraft(EMPTY)}>
          Nouveau magazine
        </PixelButton>
      </div>

      {draft && (
        <MagazineForm
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={async () => {
            setDraft(null);
            await reload();
          }}
        />
      )}

      {error && <p className="form-error">{error}</p>}
      {items && items.length === 0 && <p className="muted">Aucun magazine.</p>}
      {items && items.length > 0 && (
        <div className="table-wrap">
          <table className="table98">
            <thead>
              <tr>
                <th />
                <th>Titre</th>
                <th>Prix</th>
                <th>Ordre</th>
                <th>État</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <img className="table98__thumb" src={m.coverUrl} alt="" loading="lazy" />
                  </td>
                  <td>
                    {m.title} {m.issue && <span className="muted">· {m.issue}</span>}
                  </td>
                  <td>{formatPrice(m.price)}</td>
                  <td>{m.order}</td>
                  <td>
                    {m.published ? <span className="badge badge--blue">publié</span> : <span className="badge badge--muted">masqué</span>}
                  </td>
                  <td>
                    <div className="table98__actions">
                      <PixelButton
                        className="pixel-button--small"
                        onClick={() =>
                          setDraft({
                            ...m,
                            issue: m.issue ?? '',
                            description: m.description ?? '',
                            price: (m.price / 100).toFixed(2).replace('.', ','),
                            order: String(m.order),
                          })
                        }
                      >
                        Modifier
                      </PixelButton>
                      <PixelButton
                        className="pixel-button--small"
                        onClick={() => confirmDelete(`« ${m.title} ${m.issue ?? ''} »`, `/api/admin/magazines/${m.id}`, reload)}
                      >
                        Supprimer
                      </PixelButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MagazineForm({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState(draft);
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const price = toCents(form.price);
    if (Number.isNaN(price)) return setError('Prix invalide (ex. 8,50).');
    if (!form.id && !cover) return setError('Ajoutez une couverture.');
    setBusy(true);
    try {
      const coverKey = cover ? (await uploadImage(cover, 'cover')).key : undefined;
      const body = {
        title: form.title,
        issue: form.issue ?? '',
        price,
        description: form.description ?? '',
        helloAssoUrl: form.helloAssoUrl,
        order: Number(form.order) || 0,
        published: form.published,
        ...(coverKey && { coverKey }),
      };
      if (form.id) await api('PATCH', `/api/admin/magazines/${form.id}`, body);
      else await api('POST', '/api/admin/magazines', body);
      await onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Window98 title={form.id ? `Modifier : ${draft.title}` : 'Nouveau magazine'} onClose={onClose} className="admin-form">
      <form className="admin-form__grid" onSubmit={submit}>
        <div className="admin-form__cover">
          {preview || form.coverUrl ? (
            <img src={preview ?? form.coverUrl} alt="Aperçu de la couverture" />
          ) : (
            <div className="admin-form__cover-empty">Pas de couverture</div>
          )}
          <label className="pixel-button pixel-button--blue">
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              className="visually-hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setCover(f);
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            {form.coverUrl || cover ? 'Changer la couverture' : 'Choisir une couverture'}
          </label>
          <p className="field__hint">Format 3:4 conseillé, 5 Mo max.</p>
        </div>
        <div className="form98">
          <TextField label="Titre" required maxLength={120} value={form.title} onChange={(e) => set('title', e.target.value)} />
          <div className="form-row">
            <TextField label="Numéro" maxLength={40} placeholder="N°4, Hors-série…" value={form.issue ?? ''} onChange={(e) => set('issue', e.target.value)} />
            <TextField label="Prix (€)" required inputMode="decimal" placeholder="8,00" value={form.price} onChange={(e) => set('price', e.target.value)} />
            <TextField label="Ordre" type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} hint="Petit = en premier" />
          </div>
          <TextField
            label="Lien HelloAsso"
            type="url"
            required
            placeholder="https://www.helloasso.com/associations/…"
            value={form.helloAssoUrl}
            onChange={(e) => set('helloAssoUrl', e.target.value)}
          />
          <TextArea label="Description" maxLength={1000} rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          <Checkbox label="Publié (visible dans le Shop)" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form98__actions">
            <PixelButton type="submit" variant="rust" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </PixelButton>
            <PixelButton onClick={onClose}>Annuler</PixelButton>
          </div>
        </div>
      </form>
    </Window98>
  );
}
