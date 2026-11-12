import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

/*
 * Sprite du rat, 1 caractère = 1 pixel :
 * o contour · G pelage · L ventre · P rose (oreille, nez, pattes, queue) · E œil
 */
const RAT = [
  '..............oo......',
  '.............oPPo.....',
  '........oooooPPPo.....',
  '......ooGGGGGoPo......',
  '.....oGGGGGGGGGoo.....',
  '....oGGGGGGGGGGGGoo...',
  '....oGGGGGGGGGGEGGGo..',
  '...oGGGGGGGGGGGGGGGPo.',
  '...oGGGGGGGGGGGGGoooo.',
  '.P.oGLLLLLLGGGGGo.....',
  'P.oGLLLLLLLLGGGo......',
  '.PooooPPoooPPoo.......',
];
const HEART = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];

const COLORS: Record<string, string> = {
  o: 'var(--outline)',
  G: '#8f877c',
  L: '#c9bda7',
  P: '#d08a7a',
  E: 'var(--outline)',
  R: 'var(--accent-rust-light)',
};

function Pixels({ rows, blink = false }: { rows: string[]; blink?: boolean }) {
  return rows.flatMap((row, y) =>
    [...row].map((c, x) =>
      c === '.' ? null : (
        // Œil fermé : la case de l'œil prend la couleur du pelage.
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={blink && c === 'E' ? COLORS.G : COLORS[c]} />
      ),
    ),
  );
}

const W = RAT[0].length;
const H = RAT.length;
const KEY = 'mar.rat.love';

function loadLove() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Petit rat façon tamagotchi : il respire, cligne des yeux, et on peut le caresser. */
export function RatWidget() {
  const [love, setLove] = useState(loadLove);
  const [hearts, setHearts] = useState<{ id: number; dx: number }[]>([]);
  const [blink, setBlink] = useState(false);
  const [hop, setHop] = useState(0);
  const nextId = useRef(0);

  // Clignement de temps en temps
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          loop();
        }, 160);
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  function pet() {
    const id = nextId.current++;
    setHearts((h) => [...h, { id, dx: Math.round(Math.random() * 40 - 20) }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 900);
    setHop((n) => n + 1);
    setLove((n) => {
      try {
        localStorage.setItem(KEY, String(n + 1));
      } catch {
        // pas de stockage : le compteur vaut pour cette visite
      }
      return n + 1;
    });
  }

  return (
    <div className="rat-widget">
      <button type="button" className="rat-widget__pet" onClick={pet} aria-label="Caresser le rat">
        {hearts.map((h) => (
          <svg
            key={h.id}
            className="rat-widget__heart"
            style={{ '--dx': `${h.dx}%` } as CSSProperties}
            viewBox="0 0 7 6"
            shapeRendering="crispEdges"
            aria-hidden
          >
            <Pixels rows={HEART} />
          </svg>
        ))}
        {/* key={hop} relance l'animation de saut à chaque caresse */}
        <svg key={hop} className={hop ? 'rat-widget__rat rat-widget__rat--hop' : 'rat-widget__rat'} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden>
          <Pixels rows={RAT} blink={blink} />
        </svg>
      </button>
      <p className="rat-widget__love" aria-live="polite">
        <span aria-hidden>♥</span> {love}
      </p>
    </div>
  );
}
