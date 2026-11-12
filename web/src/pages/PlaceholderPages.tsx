import { Cartouche } from '../components/Cartouche.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';

export function NotFoundPage() {
  return (
    <PageLayout title="Perdu ?">
      <Cartouche title="404">
        <p>Cette page n'existe pas. Les rats ont dû la manger.</p>
      </Cartouche>
    </PageLayout>
  );
}
