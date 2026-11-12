import { Cartouche } from '../components/Cartouche.tsx';
import { Window98 } from '../components/Window98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { poiById } from '../map/map.config.ts';

// Pages encore vides : elles seront remplies aux phases 5 et 6.

export function ArchivesPage() {
  return (
    <PageLayout title="Archives" poiIcon={poiById('archives').icon}>
      <Window98 title="archives">
        <Cartouche title="Bientôt">
          <p>La roue des thèmes, la recherche et le tri arrivent en phase 6.</p>
        </Cartouche>
      </Window98>
    </PageLayout>
  );
}

export function NotFoundPage() {
  return (
    <PageLayout title="Perdu ?">
      <Cartouche title="404">
        <p>Cette page n'existe pas. Les rats ont dû la manger.</p>
      </Cartouche>
    </PageLayout>
  );
}
