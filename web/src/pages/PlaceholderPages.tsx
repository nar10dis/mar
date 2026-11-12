import { Cartouche } from '../components/Cartouche.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { Window98 } from '../components/Window98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { asset } from '../lib/assets.ts';
import { poiById } from '../map/map.config.ts';

// Pages vides de la phase 1 : elles seront remplies aux phases 2 à 6.

export function ShopPage() {
  return (
    <PageLayout title="Shop" poiIcon={poiById('shop').icon}>
      <Window98 title="magazines.exe">
        <Cartouche title="Bientôt">
          <p>La grille des magazines arrive en phase 2, avec un lien vers HelloAsso pour chaque numéro.</p>
        </Cartouche>
      </Window98>
    </PageLayout>
  );
}

export function ActuPage() {
  return (
    <PageLayout title="Actu" poiIcon={poiById('actu').icon}>
      <Window98 title="annonces.txt">
        <Cartouche title="Bientôt">
          <p>Qui sommes-nous, puis la liste des annonces (phase 2).</p>
        </Cartouche>
      </Window98>
    </PageLayout>
  );
}

export function BlogPage() {
  return (
    <PageLayout
      title="Blog"
      poiIcon={poiById('blog').icon}
      actions={
        <>
          <PixelButton icon={asset('icon-profil.png')} disabled title="Phase 7">
            Profil
          </PixelButton>
          <PixelButton variant="rust" icon={asset('icon-nouvel-article.png')} disabled title="Phase 4">
            Nouvel article
          </PixelButton>
        </>
      }
    >
      <Window98 title="feed.log">
        <Cartouche title="Bientôt">
          <p>Le fil des articles, les réactions et les commentaires arrivent en phase 5.</p>
        </Cartouche>
      </Window98>
    </PageLayout>
  );
}

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
