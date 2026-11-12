import { Cartouche } from '../components/Cartouche.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { Window98 } from '../components/Window98.tsx';
import { ABOUT } from '../content/about.ts';
import { PageLayout } from '../layout/PageLayout.tsx';
import { formatDate } from '../lib/format.ts';
import type { Announcement } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';

export function ActuPage() {
  const announcements = useApi<Announcement[]>('/api/announcements');

  return (
    <PageLayout title="Actu" poiIcon={poiById('actu').icon}>
      <div className="actu-layout">
        <aside className="actu-about">
          <Cartouche title={ABOUT.title}>
            {ABOUT.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Cartouche>
        </aside>

        <section className="actu-feed" aria-label="Annonces">
          {announcements.status === 'loading' && <StatusMessage title="annonces.txt">Chargement…</StatusMessage>}
          {announcements.status === 'error' && (
            <StatusMessage title="Erreur">Impossible de charger les annonces. Réessayez plus tard.</StatusMessage>
          )}
          {announcements.status === 'ready' && announcements.data.length === 0 && (
            <StatusMessage title="annonces.txt">Pas d'annonce pour l'instant.</StatusMessage>
          )}
          {announcements.status === 'ready' &&
            announcements.data.map((a) => (
              <Window98 key={a.id} title={a.title} className="announcement">
                <time className="announcement__date" dateTime={a.createdAt}>
                  {formatDate(a.createdAt)}
                </time>
                <div className="announcement__body">
                  {a.body.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Window98>
            ))}
        </section>
      </div>
    </PageLayout>
  );
}
