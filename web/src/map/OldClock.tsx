import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

// Graduations hors 12/3/6/9 (petits carrés), sur un cercle de rayon 21 autour de (32, 32).
const DOTS = [1, 2, 4, 5, 7, 8, 10, 11].map((h) => {
  const a = (h / 12) * 2 * Math.PI;
  return { x: Math.round(32 + 21 * Math.sin(a)) - 1, y: Math.round(32 - 21 * Math.cos(a)) - 1 };
});

/**
 * Vieille horloge façon horloge de la DS : cadran carré quadrillé, gros chiffres pixel,
 * aiguilles crénelées (shape-rendering: crispEdges) et trotteuse rouille.
 */
export function OldClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const s = now.getSeconds();
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  return (
    <svg
      className="old-clock"
      viewBox="0 0 64 64"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Il est ${pad(now.getHours())}:${pad(now.getMinutes())}`}
    >
      {/* Boîtier : bois sombre + biseau */}
      <rect x="0" y="0" width="64" height="64" fill="var(--outline)" />
      <rect x="1" y="1" width="62" height="62" fill="#4a3424" />
      <rect x="1" y="1" width="62" height="1" fill="#6b4c34" />
      <rect x="1" y="1" width="1" height="62" fill="#6b4c34" />
      <rect x="3" y="3" width="58" height="58" fill="var(--outline)" />
      {/* Cadran papier quadrillé */}
      <rect x="4" y="4" width="56" height="56" fill="var(--paper)" />
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} fill="var(--paper-line)" opacity="0.45">
          <rect x={4 + (i + 1) * 8} y="4" width="1" height="56" />
          <rect x="4" y={4 + (i + 1) * 8} width="56" height="1" />
        </g>
      ))}
      {/* Taches de vieillissement */}
      <rect x="47" y="49" width="3" height="2" fill="#cdbb98" />
      <rect x="11" y="13" width="2" height="2" fill="#cdbb98" />
      {/* Chiffres */}
      <g fill="#8a7a5e" fontFamily="var(--font-ui)" fontWeight="700" fontSize="11" textAnchor="middle">
        <text x="32" y="16">12</text>
        <text x="53" y="36">3</text>
        <text x="32" y="57">6</text>
        <text x="11" y="36">9</text>
      </g>
      {DOTS.map((d, i) => (
        <rect key={i} x={d.x} y={d.y} width="2" height="2" fill="var(--ink)" />
      ))}
      {/* Aiguilles */}
      <g strokeLinecap="square">
        <line x1="32" y1="32" x2="32" y2="20" stroke="var(--ink)" strokeWidth="3" transform={`rotate(${h * 30} 32 32)`} />
        <line x1="32" y1="32" x2="32" y2="13" stroke="var(--ink)" strokeWidth="2" transform={`rotate(${m * 6} 32 32)`} />
        <line x1="32" y1="35" x2="32" y2="12" stroke="var(--accent-rust)" strokeWidth="1" transform={`rotate(${s * 6} 32 32)`} />
      </g>
      <rect x="30" y="30" width="4" height="4" fill="var(--ink)" />
      <rect x="31" y="31" width="2" height="2" fill="var(--accent-rust)" />
    </svg>
  );
}
