import type { CSSProperties } from 'react';
import { Link } from 'react-router';
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
              style={vars({
                x: poi.landscape.x,
                y: poi.landscape.y,
                w: poi.landscape.w,
                h: poi.landscape.h,
                xp: poi.portrait.x,
                yp: poi.portrait.y,
                wp: poi.portrait.w,
                hp: poi.portrait.h,
              })}
            >
              {/* <img> plutôt que PixelIcon : sa taille suit celle de l'encadré (cqh), pas une taille fixe en px */}
              <span className="poi__inner">
                <img className="poi__icon" src={poi.icon} alt="" draggable={false} />
                <span className="poi__label">{poi.label}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
