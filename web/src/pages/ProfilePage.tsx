import { useState } from 'react';
import { Link } from 'react-router';
import { PixelButton } from '../components/PixelButton.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { Window98 } from '../components/Window98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { asset } from '../lib/assets.ts';
import { formatDate } from '../lib/format.ts';
import type { Inventory, Profile } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';
import { Bag } from '../profile/Bag.tsx';
import '../article/article.css';
import '../profile/profile.css';

/** Profil privé (visible seulement par son propriétaire) : identité, sac de 8 cases, articles écrits. */
export function ProfilePage() {
  const profile = useApi<Profile>('/api/me/profile');
  // Le sac change sans recharger tout le profil.
  const [inventory, setInventory] = useState<Inventory | null>(null);

  if (profile.status !== 'ready') {
    return (
      <PageLayout title="Profil" poiIcon={poiById('blog').icon}>
        <StatusMessage title={profile.status === 'error' ? 'Erreur' : 'profil.sav'}>
          {profile.status === 'error' ? 'Impossible de charger le profil.' : 'Chargement…'}
        </StatusMessage>
      </PageLayout>
    );
  }

  const p = profile.data;

  return (
    <PageLayout
      title="Profil"
      poiIcon={poiById('blog').icon}
      actions={
        <PixelButton to="/compte" icon={asset('icon-profil.png')}>
          Réglages du compte
        </PixelButton>
      }
    >
      <div className="profile-grid">
        <div className="profile-side">
          <Window98 title="dresseur.sav">
            <div className="profile-id">
              <img className="profile-id__avatar" src={p.avatarUrl ?? asset('avatar-default.png')} alt="" />
              <h2 className="profile-id__pseudo">{p.pseudo}</h2>
              <p className="muted">Membre depuis le {formatDate(p.createdAt)}</p>
              <p className="muted">
                {p.articles.length} article{p.articles.length > 1 ? 's' : ''} écrit{p.articles.length > 1 ? 's' : ''}
              </p>
            </div>
          </Window98>
          <PixelButton to="/blog" icon={asset('icon-retour.png')}>
            Retour au blog
          </PixelButton>
        </div>

        <div className="profile-main">
          <Bag inventory={inventory ?? p.inventory} onChange={setInventory} />

          <Window98 title="mes_articles.txt">
            {p.articles.length === 0 ? (
              <p className="muted">
                Pas encore d’article. <Link to="/blog/nouveau">Écrire le premier</Link>
              </p>
            ) : (
              <ul className="profile-articles">
                {p.articles.map((a) => (
                  <li key={a.id}>
                    <Link to={`/blog/articles/${a.id}`} className="ds-select">
                      <span className="article-meta__dot" style={{ background: a.theme.color }} title={a.theme.name} />
                      <span className="profile-articles__title">{a.title}</span>
                      <time dateTime={a.createdAt}>{formatDate(a.createdAt)}</time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Window98>
        </div>
      </div>
    </PageLayout>
  );
}
