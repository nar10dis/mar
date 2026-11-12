import { useSearchParams } from 'react-router';
import { AnnouncementsAdmin } from '../admin/AnnouncementsAdmin.tsx';
import { MagazinesAdmin } from '../admin/MagazinesAdmin.tsx';
import { ArticlesAdmin, CommentsAdmin } from '../admin/ModerationAdmin.tsx';
import { UsersAdmin } from '../admin/UsersAdmin.tsx';
import { Tabs98 } from '../components/Tabs98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';

const TABS = [
  { id: 'magazines', label: 'Magazines' },
  { id: 'annonces', label: 'Annonces' },
  { id: 'utilisateurs', label: 'Utilisateurs' },
  { id: 'articles', label: 'Articles' },
  { id: 'commentaires', label: 'Commentaires' },
] as const;

type Tab = (typeof TABS)[number]['id'];

export function AdminPage() {
  // Onglet dans l'URL (?onglet=annonces) : rechargement et lien direct gardent l'onglet.
  const [params, setParams] = useSearchParams();
  const current = TABS.find((t) => t.id === params.get('onglet'))?.id ?? 'magazines';

  return (
    <PageLayout title="Back-office">
      <Tabs98<Tab> label="Sections du back-office" tabs={[...TABS]} active={current} onChange={(id) => setParams({ onglet: id })}>
        {current === 'magazines' && <MagazinesAdmin />}
        {current === 'annonces' && <AnnouncementsAdmin />}
        {current === 'utilisateurs' && <UsersAdmin />}
        {current === 'articles' && <ArticlesAdmin />}
        {current === 'commentaires' && <CommentsAdmin />}
      </Tabs98>
    </PageLayout>
  );
}
