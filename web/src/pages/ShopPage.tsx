import { PixelButton } from '../components/PixelButton.tsx';
import { StatusMessage } from '../components/StatusMessage.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { formatPrice } from '../lib/format.ts';
import type { Magazine } from '../lib/types.ts';
import { useApi } from '../lib/useApi.ts';
import { poiById } from '../map/map.config.ts';

export function ShopPage() {
  const magazines = useApi<Magazine[]>('/api/magazines');

  return (
    <PageLayout title="Shop" poiIcon={poiById('shop').icon}>
      <p className="page__intro">
        Les numéros se commandent sur HelloAsso. Le paiement se fait là-bas, pas sur ce site.
      </p>

      {magazines.status === 'loading' && <StatusMessage title="magazines.exe">Chargement…</StatusMessage>}
      {magazines.status === 'error' && (
        <StatusMessage title="Erreur">Impossible de charger les magazines. Réessayez plus tard.</StatusMessage>
      )}
      {magazines.status === 'ready' && magazines.data.length === 0 && (
        <StatusMessage title="magazines.exe">Aucun magazine en vente pour l'instant.</StatusMessage>
      )}
      {magazines.status === 'ready' && magazines.data.length > 0 && (
        <ul className="shop-grid">
          {magazines.data.map((m) => (
            <li key={m.id} className="mag-card ds-select">
              <img className="mag-card__cover" src={m.coverUrl} alt={`Couverture : ${m.title} ${m.issue ?? ''}`} loading="lazy" />
              <div className="mag-card__info">
                <h2 className="mag-card__title">
                  {m.title}
                  {m.issue && <span className="mag-card__issue">{m.issue}</span>}
                </h2>
                {m.description && <p className="mag-card__desc">{m.description}</p>}
                <div className="mag-card__buy">
                  <span className="mag-card__price">{formatPrice(m.price)}</span>
                  <PixelButton variant="rust" href={m.helloAssoUrl}>
                    Commander
                  </PixelButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
