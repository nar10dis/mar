import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { PixelIcon } from '../components/PixelIcon.tsx';
import { MAP, POIS } from './map.config.ts';

// Les positions paysage / portrait passent en variables CSS : le basculement se fait
// en pur CSS avec @media (orientation: portrait), sans JS ni re-render.
const vars = (v: Record<string, number>) =>
  Object.fromEntries(Object.entries(v).map(([k, n]) => [`--${k}`, n])) as CSSProperties;

export function MapPage() {
  return (
    <main className="map-screen">
      <h1 className="visually-hidden">Mort aux Rats — carte</h1>
      <div className="map">
        <picture>
          <source media="(orientation: portrait)" srcSet={MAP.portrait.image} />
          <img className="map__image" src={MAP.landscape.image} alt="" draggable={false} />
        </picture>

        <nav aria-label="Lieux">
          {POIS.map((poi) => (
            <Link
              key={poi.id}
              to={poi.path}
              className="poi ds-select"
              style={vars({ x: poi.landscape.x, y: poi.landscape.y, xp: poi.portrait.x, yp: poi.portrait.y })}
            >
              <PixelIcon src={poi.icon} size={32} />
              <span className="poi__label">{poi.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
