import { Link } from 'react-router';
import { PixelIcon } from '../components/PixelIcon.tsx';
import { MAP, POIS } from './map.config.ts';

export function MapPage() {
  return (
    <main className="map-screen">
      <h1 className="visually-hidden">Mort aux Rats — carte</h1>
      <div className="map" style={{ aspectRatio: `${MAP.width} / ${MAP.height}` }}>
        <img className="map__image" src={MAP.image} alt="" draggable={false} />
        <nav aria-label="Lieux">
          {POIS.map((poi) => (
            <Link
              key={poi.id}
              to={poi.path}
              className="poi"
              style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
            >
              <PixelIcon src={poi.icon} size={32} frames={2} />
              <span className="poi__label">{poi.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
