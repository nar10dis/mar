import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { SelectField, TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { Window98 } from '../components/Window98.tsx';
import { ArticleEditor } from '../editor/ArticleEditor.tsx';
import { newBlock, toContent, toDraft } from '../editor/content.ts';
import type { DraftRow } from '../editor/content.ts';
import { PageLayout } from '../layout/PageLayout.tsx';
import { api, errorText } from '../lib/api.ts';
import type { Article, Theme } from '../lib/types.ts';
import { IMAGE_ACCEPT, uploadFile } from '../lib/upload.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';

/** /blog/nouveau et /blog/articles/:id/modifier */
export function ArticleEditPage() {
  const { id } = useParams();
  const themes = useApi<Theme[]>('/api/themes');
  const article = useApi<Article>(id ? `/api/articles/${id}` : '/api/themes');
  const { user } = useAuth();

  const loading = themes.status === 'loading' || (id && article.status === 'loading');
  if (loading) return <Shell><StatusMessage title="editeur.exe">Chargement…</StatusMessage></Shell>;
  if (themes.status === 'error' || (id && article.status === 'error')) {
    return <Shell><StatusMessage title="Erreur">Impossible de charger l'éditeur.</StatusMessage></Shell>;
  }
  if (themes.status !== 'ready') return null;

  const existing = id && article.status === 'ready' ? (article.data as Article) : null;
  if (existing && existing.author.id !== user?.id) {
    return <Shell><StatusMessage title="Accès refusé">Seul l'auteur peut modifier cet article.</StatusMessage></Shell>;
  }
  // key : repart d'un état neuf si on passe d'un article à l'autre
  return <ArticleForm key={id ?? 'new'} themes={themes.data} existing={existing} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout title="Article" poiIcon={poiById('blog').icon}>
      {children}
    </PageLayout>
  );
}

function ArticleForm({ themes, existing }: { themes: Theme[]; existing: Article | null }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [themeId, setThemeId] = useState(existing?.themeId ?? themes[0]?.id ?? 0);
  const [rows, setRows] = useState<DraftRow[]>(() =>
    existing ? toDraft(existing.content.rows) : [{ id: 'r1', cols: [newBlock('text')] }],
  );
  // Couverture : undefined = inchangée, null = retirée, sinon nouvelle clé uploadée
  const [coverKey, setCoverKey] = useState<string | null | undefined>(undefined);
  const [coverPreview, setCoverPreview] = useState<string | null>(existing?.coverUrl ?? null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    dirty.current = true;
    set(v);
  };

  // Prévenir avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  async function pickCover(file: File | undefined) {
    if (!file) return;
    setCoverBusy(true);
    try {
      const { key, url } = await uploadFile(file, 'article-image');
      dirty.current = true;
      setCoverKey(key);
      setCoverPreview(url);
    } catch (e) {
      setErrors([errorText(e)]);
    } finally {
      setCoverBusy(false);
      if (coverRef.current) coverRef.current.value = '';
    }
  }

  async function save() {
    const { rows: contentRows, problems } = toContent(rows);
    if (!title.trim()) problems.unshift('Donnez un titre à votre article.');
    setErrors(problems);
    if (problems.length) return;
    setSaving(true);
    try {
      const body = { title: title.trim(), themeId, content: { v: 1, rows: contentRows }, ...(coverKey !== undefined && { coverKey }) };
      const saved = existing
        ? await api<Article>('PATCH', `/api/articles/${existing.id}`, body)
        : await api<Article>('POST', '/api/articles', body);
      dirty.current = false;
      navigate(`/blog/articles/${saved.id}`);
    } catch (e) {
      setErrors([errorText(e)]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout title={existing ? 'Modifier l’article' : 'Nouvel article'} poiIcon={poiById('blog').icon}>
      <div className="article-form">
        <Window98 title="article.txt">
          <div className="article-form__meta">
            <div className="form98">
              <TextField label="Titre" required maxLength={160} value={title} onChange={(e) => touch(setTitle)(e.target.value)} />
              <SelectField label="Thème" value={themeId} onChange={(e) => touch(setThemeId)(Number(e.target.value))}>
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="form98 article-form__cover">
              <span className="field__label">Couverture (facultatif)</span>
              {coverPreview && <img src={coverPreview} alt="Aperçu de la couverture" />}
              <input ref={coverRef} type="file" accept={IMAGE_ACCEPT} className="visually-hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
              <div className="form98__actions">
                <PixelButton variant="blue" className="pixel-button--small" disabled={coverBusy} onClick={() => coverRef.current?.click()}>
                  {coverBusy ? 'Envoi…' : coverPreview ? 'Changer' : 'Choisir une image'}
                </PixelButton>
                {coverPreview && (
                  <PixelButton
                    className="pixel-button--small"
                    onClick={() => {
                      dirty.current = true;
                      setCoverKey(null);
                      setCoverPreview(null);
                    }}
                  >
                    Retirer
                  </PixelButton>
                )}
              </div>
            </div>
          </div>
        </Window98>

        <Window98 title="contenu">
          <ArticleEditor rows={rows} onChange={touch(setRows)} />
        </Window98>

        <div className="article-form__bar">
          <PixelButton variant="rust" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : existing ? 'Enregistrer' : 'Publier'}
          </PixelButton>
          <PixelButton
            onClick={() => {
              if (dirty.current && !window.confirm('Quitter sans enregistrer ? Vos modifications seront perdues.')) return;
              dirty.current = false;
              navigate(existing ? `/blog/articles/${existing.id}` : '/blog');
            }}
          >
            Annuler
          </PixelButton>
          {errors.length > 0 && (
            <div className="form-error" role="alert">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
