import { useState } from 'react';
import type { FormEvent } from 'react';
import { Checkbox, TextArea, TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { api, errorText } from '../lib/api.ts';
import { formatDate } from '../lib/format.ts';
import { confirmDelete, useList } from './useList.ts';

interface AdminAnnouncement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  published: boolean;
}

type Draft = Pick<AdminAnnouncement, 'title' | 'body' | 'published'> & { id?: number };

export function AnnouncementsAdmin() {
  const { items, error, reload } = useList<AdminAnnouncement>('/api/admin/announcements');
  const [draft, setDraft] = useState<Draft | null>(null);

  return (
    <div className="admin-section">
      <div className="admin-section__head">
        <p className="muted">Les annonces publiées apparaissent dans Actu, de la plus récente à la plus ancienne.</p>
        <PixelButton variant="rust" onClick={() => setDraft({ title: '', body: '', published: true })}>
          Nouvelle annonce
        </PixelButton>
      </div>

      {draft && (
        <AnnouncementForm
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={async () => {
            setDraft(null);
            await reload();
          }}
        />
      )}

      {error && <p className="form-error">{error}</p>}
      {items && items.length === 0 && <p className="muted">Aucune annonce.</p>}
      {items && items.length > 0 && (
        <div className="table-wrap">
          <table className="table98">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>État</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>
                    {a.published ? <span className="badge badge--blue">publiée</span> : <span className="badge badge--muted">masquée</span>}
                  </td>
                  <td>
                    <div className="table98__actions">
                      <PixelButton className="pixel-button--small" onClick={() => setDraft(a)}>
                        Modifier
                      </PixelButton>
                      <PixelButton
                        className="pixel-button--small"
                        onClick={() => confirmDelete(`l'annonce « ${a.title} »`, `/api/admin/announcements/${a.id}`, reload)}
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

function AnnouncementForm({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { title: form.title, body: form.body, published: form.published };
      if (form.id) await api('PATCH', `/api/admin/announcements/${form.id}`, body);
      else await api('POST', '/api/admin/announcements', body);
      await onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Window98 title={form.id ? `Modifier : ${draft.title}` : 'Nouvelle annonce'} onClose={onClose} className="admin-form">
      <form className="form98" onSubmit={submit}>
        <TextField label="Titre" required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <TextArea
          label="Texte"
          required
          maxLength={10000}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          hint="Laissez une ligne vide entre deux paragraphes."
        />
        <Checkbox label="Publiée (visible dans Actu)" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
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
      </form>
    </Window98>
  );
}
