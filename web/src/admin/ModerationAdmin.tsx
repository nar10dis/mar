import { PixelButton } from '../components/PixelButton.tsx';
import { formatDate } from '../lib/format.ts';
import { confirmDelete, useList } from './useList.ts';

interface AdminArticle {
  id: number;
  title: string;
  createdAt: string;
  author: { pseudo: string };
  theme: { name: string };
}

interface AdminComment {
  id: number;
  body: string;
  createdAt: string;
  author: { pseudo: string };
  article: { id: number; title: string };
}

export function ArticlesAdmin() {
  const { items, error, reload } = useList<AdminArticle>('/api/admin/articles');
  return (
    <div className="admin-section">
      <p className="muted">Supprimer un article supprime aussi ses réactions et commentaires.</p>
      {error && <p className="form-error">{error}</p>}
      {items && items.length === 0 && <p className="muted">Aucun article pour l'instant (l'éditeur arrive en phase 4).</p>}
      {items && items.length > 0 && (
        <div className="table-wrap">
          <table className="table98">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Auteur</th>
                <th>Thème</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.author.pseudo}</td>
                  <td>{a.theme.name}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>
                    <div className="table98__actions">
                      <PixelButton
                        className="pixel-button--small"
                        onClick={() => confirmDelete(`l'article « ${a.title} »`, `/api/admin/articles/${a.id}`, reload)}
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

export function CommentsAdmin() {
  const { items, error, reload } = useList<AdminComment>('/api/admin/comments');
  return (
    <div className="admin-section">
      <p className="muted">Supprimer un commentaire supprime aussi les réponses en dessous.</p>
      {error && <p className="form-error">{error}</p>}
      {items && items.length === 0 && <p className="muted">Aucun commentaire pour l'instant (phase 5).</p>}
      {items && items.length > 0 && (
        <div className="table-wrap">
          <table className="table98">
            <thead>
              <tr>
                <th>Commentaire</th>
                <th>Auteur</th>
                <th>Article</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.body.length > 120 ? `${c.body.slice(0, 120)}…` : c.body}</td>
                  <td>{c.author.pseudo}</td>
                  <td>{c.article.title}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="table98__actions">
                      <PixelButton
                        className="pixel-button--small"
                        onClick={() => confirmDelete('ce commentaire', `/api/admin/comments/${c.id}`, reload)}
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
