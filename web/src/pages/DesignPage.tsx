import { useEffect, useState } from 'react';
import { Cartouche } from '../components/Cartouche.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { PixelIcon } from '../components/PixelIcon.tsx';
import { ReactionBubble } from '../components/ReactionBubble.tsx';
import { Separator98, Window98 } from '../components/Window98.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';
import { asset } from '../lib/assets.ts';
import { REACTIONS } from '../lib/reactions.ts';
import type { ReactionKind } from '../lib/reactions.ts';
import { POIS } from '../map/map.config.ts';

interface Theme {
  id: number;
  slug: string;
  name: string;
  color: string;
}

const TOKENS = ['--bg', '--grid', '--panel', '--paper', '--paper-line', '--ink', '--text', '--accent-blue', '--accent-rust'];
const ICONS = ['profil', 'nouvel-article', 'recherche', 'retour', 'fermer', 'carte'];

/** Page de démo du design system (critère de fin de la phase 0). */
export function DesignPage() {
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [apiError, setApiError] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({ HEART: 4, SMILE: 2, ZZ: 1 });
  const [mine, setMine] = useState<ReactionKind | null>(null);

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setThemes)
      .catch(() => setApiError(true));
  }, []);

  // Une réaction par personne, modifiable : re-cliquer la retire.
  function react(kind: ReactionKind) {
    setCounts((c) => {
      const next = { ...c };
      if (mine) next[mine] = (next[mine] ?? 1) - 1;
      if (mine !== kind) next[kind] = (next[kind] ?? 0) + 1;
      return next;
    });
    setMine((m) => (m === kind ? null : kind));
  }

  return (
    <PageLayout title="Design system">
      <div className="design-grid">
        <Window98 title="Palette" icon={asset('icon-carte.png')}>
          <ul className="swatches">
            {TOKENS.map((t) => (
              <li key={t}>
                <span className="swatch" style={{ background: `var(${t})` }} />
                <code>{t}</code>
              </li>
            ))}
          </ul>
        </Window98>

        <Window98 title="Boutons" onClose={() => {}}>
          <div className="row wrap">
            <PixelButton>Normal</PixelButton>
            <PixelButton variant="rust" icon={asset('icon-nouvel-article.png')}>
              Nouvel article
            </PixelButton>
            <PixelButton variant="blue" icon={asset('icon-recherche.png')}>
              Rechercher
            </PixelButton>
            <PixelButton disabled>Désactivé</PixelButton>
          </div>
          <Separator98 />
          <p className="muted">Séparateur gravé au-dessus. Le bouton ✕ de la barre de titre est le composant Window98.</p>
        </Window98>

        <Cartouche title="Cartouche d'article" className="span-2">
          <p>
            Lettre de Rattus norvegicus. Il dort le jour et sort la nuit. On le retrouve souvent près des
            égouts de la ville, où il lit les vieux magazines qu'on a jetés. Chaque ligne de texte se pose
            sur une ligne pointillée, comme sur une fiche de description.
          </p>
          <p>Deuxième paragraphe, toujours aligné sur les pointillés.</p>
        </Cartouche>

        <Window98 title="Réactions (cliquables)">
          <div className="row wrap">
            {REACTIONS.map((r) => (
              <ReactionBubble
                key={r.kind}
                kind={r.kind}
                count={counts[r.kind] ?? 0}
                selected={mine === r.kind}
                onClick={() => react(r.kind)}
              />
            ))}
          </div>
        </Window98>

        <Window98 title="Icônes UI 16 px (×2)">
          <div className="row wrap">
            {ICONS.map((name) => (
              <span key={name} className="icon-cell">
                <PixelIcon src={asset(`icon-${name}.png`)} size={16} />
                <code>{name}</code>
              </span>
            ))}
          </div>
        </Window98>

        <Window98 title="POI de la carte (survol = 2e frame)">
          <div className="row wrap">
            {POIS.map((p) => (
              <span key={p.id} className="icon-cell poi-demo" tabIndex={0}>
                <PixelIcon src={p.icon} size={32} frames={2} />
                <code>{p.id}</code>
              </span>
            ))}
            <span className="icon-cell">
              <PixelIcon src={asset('avatar-default.png')} size={32} />
              <code>avatar</code>
            </span>
          </div>
        </Window98>

        <Window98 title="Thèmes (depuis la BDD : /api/themes)">
          {apiError && <p className="muted">API injoignable.</p>}
          {!themes && !apiError && <p className="muted">Chargement…</p>}
          {themes && (
            <div className="row wrap">
              <span className="icon-cell">
                <PixelIcon src={asset('theme-tous.png')} size={32} />
                <code>tous</code>
              </span>
              {themes.map((t) => (
                <span key={t.slug} className="icon-cell">
                  <PixelIcon src={asset(`theme-${t.slug}.png`)} size={32} label={t.name} />
                  <code>{t.name}</code>
                </span>
              ))}
            </div>
          )}
        </Window98>
      </div>
    </PageLayout>
  );
}
