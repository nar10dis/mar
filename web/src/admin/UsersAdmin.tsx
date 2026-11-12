import { useState } from 'react';
import { useAuth } from '../auth/useAuth.ts';
import { api, errorText } from '../lib/api.ts';
import { formatDate } from '../lib/format.ts';
import { useList } from './useList.ts';

interface AdminUser {
  id: number;
  email: string;
  pseudo: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count: { articles: number; comments: number };
}

export function UsersAdmin() {
  const { user: me } = useAuth();
  const { items, error, reload } = useList<AdminUser>('/api/admin/users');
  const [rowError, setRowError] = useState<string | null>(null);

  async function setRole(u: AdminUser, role: AdminUser['role']) {
    setRowError(null);
    const verb = role === 'ADMIN' ? 'donner les droits admin à' : 'retirer les droits admin de';
    if (!window.confirm(`Voulez-vous ${verb} ${u.pseudo} ?`)) return;
    try {
      await api('PATCH', `/api/admin/users/${u.id}/role`, { role });
    } catch (e) {
      setRowError(errorText(e));
    }
    await reload();
  }

  return (
    <div className="admin-section">
      <p className="muted">Tout le monde peut écrire des articles. Les admins ont accès à ce back-office.</p>
      {(error || rowError) && <p className="form-error">{error ?? rowError}</p>}
      {items && (
        <div className="table-wrap">
          <table className="table98">
            <thead>
              <tr>
                <th>Pseudo</th>
                <th>Email</th>
                <th>Inscrit le</th>
                <th>Articles</th>
                <th>Comm.</th>
                <th>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.pseudo}</td>
                  <td className="muted">{u.email}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{u._count.articles}</td>
                  <td>{u._count.comments}</td>
                  <td>
                    <select
                      className="input98 input98--compact"
                      value={u.role}
                      disabled={u.id === me?.id}
                      title={u.id === me?.id ? 'Vous ne pouvez pas modifier votre propre rôle' : undefined}
                      onChange={(e) => setRole(u, e.target.value as AdminUser['role'])}
                      aria-label={`Rôle de ${u.pseudo}`}
                    >
                      <option value="USER">Rédacteur</option>
                      <option value="ADMIN">Admin</option>
                    </select>
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
