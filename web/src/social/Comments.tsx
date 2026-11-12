import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../auth/useAuth.ts';
import { TextArea } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { api, errorText } from '../lib/api.ts';
import { asset } from '../lib/assets.ts';
import type { ArticleComment } from '../lib/types.ts';
import './social.css';

interface Node extends ArticleComment {
  replies: Node[];
}

/** Liste à plat → arbre (parentId), en gardant l'ordre chronologique à chaque niveau. */
function buildTree(list: ArticleComment[]): Node[] {
  const byId = new Map<number, Node>(list.map((c) => [c.id, { ...c, replies: [] }]));
  const roots: Node[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    (parent ? parent.replies : roots).push(c);
  }
  return roots;
}

const countAll = (nodes: Node[]): number => nodes.reduce((n, c) => n + 1 + countAll(c.replies), 0);

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Commentaires façon Reddit : réponses imbriquées, chaque fil se replie / se déplie. */
export function Comments({ articleId }: { articleId: number }) {
  const { user } = useAuth();
  const location = useLocation();
  const [list, setList] = useState<ArticleComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  useEffect(() => {
    api<ArticleComment[]>('GET', `/api/articles/${articleId}/comments`)
      .then(setList)
      .catch((e: unknown) => setError(errorText(e)));
  }, [articleId]);

  const tree = useMemo(() => buildTree(list ?? []), [list]);

  const toggle = (id: number) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function post(body: string, parentId: number | null) {
    const created = await api<ArticleComment>('POST', `/api/articles/${articleId}/comments`, { body, parentId });
    setList((l) => [...(l ?? []), created]);
    setReplyTo(null);
    if (parentId) setCollapsed((s) => (s.has(parentId) ? new Set([...s].filter((x) => x !== parentId)) : s));
  }

  const renderNode = (c: Node, depth: number) => {
    const isCollapsed = collapsed.has(c.id);
    const hidden = countAll(c.replies);
    return (
      <li key={c.id} className="comment" data-depth={Math.min(depth, 6)}>
        <div className="comment__head">
          <button
            type="button"
            className="comment__toggle"
            onClick={() => toggle(c.id)}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Déplier le fil' : 'Replier le fil'}
          >
            {isCollapsed ? '+' : '–'}
          </button>
          <img className="comment__avatar" src={c.author.avatarUrl ?? asset('avatar-default.png')} alt="" />
          <span className="comment__author">{c.author.pseudo}</span>
          <time className="comment__date" dateTime={c.createdAt}>
            {dateTime.format(new Date(c.createdAt))}
          </time>
          {isCollapsed && hidden > 0 && (
            <span className="comment__hidden">
              ({hidden} réponse{hidden > 1 ? 's' : ''} masquée{hidden > 1 ? 's' : ''})
            </span>
          )}
        </div>
        {!isCollapsed && (
          <>
            <p className="comment__body">{c.body}</p>
            {user && (
              <button type="button" className="comment__reply-btn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
                {replyTo === c.id ? 'Annuler' : 'Répondre'}
              </button>
            )}
            {replyTo === c.id && (
              <CommentForm label={`Réponse à ${c.author.pseudo}`} submitLabel="Répondre" autoFocus onSubmit={(body) => post(body, c.id)} />
            )}
            {c.replies.length > 0 && <ul className="comment-list">{c.replies.map((r) => renderNode(r, depth + 1))}</ul>}
          </>
        )}
      </li>
    );
  };

  const total = list?.length ?? 0;

  return (
    <Window98 title={`commentaires (${total})`} className="comments">
      {user ? (
        <CommentForm label="Votre commentaire" submitLabel="Commenter" onSubmit={(body) => post(body, null)} />
      ) : (
        <p className="muted">
          <Link to={`/connexion?next=${encodeURIComponent(location.pathname)}`}>Connectez-vous</Link> pour commenter.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
      {list && total === 0 && <p className="muted">Pas encore de commentaire.</p>}
      {tree.length > 0 && <ul className="comment-list comment-list--root">{tree.map((c) => renderNode(c, 0))}</ul>}
    </Window98>
  );
}

function CommentForm({
  label,
  submitLabel,
  onSubmit,
  autoFocus,
}: {
  label: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form98 comment-form" onSubmit={submit}>
      <TextArea label={label} rows={3} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} error={error} autoFocus={autoFocus} />
      <div className="form98__actions">
        <PixelButton type="submit" variant="rust" className="pixel-button--small" disabled={busy || !body.trim()}>
          {busy ? 'Envoi…' : submitLabel}
        </PixelButton>
      </div>
    </form>
  );
}
