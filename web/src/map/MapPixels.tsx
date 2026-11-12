import { useEffect, useRef } from 'react';
import { MAP } from './map.config.ts';

/** Taille d'une case du quadrillage, en px de l'image source (1920×1080 → 120×68 cases). */
const CELL = 16;
/** Une case est « du fond » si 85 % de ses pixels sont à moins de TOLERANCE de MAP.background. */
const FREE_RATIO = 0.85;
const TOLERANCE = 14;
/** Un groupe de cases « décor » plus petit que ça (un grain de poussière) compte comme du fond. */
const MIN_DECOR_CELLS = 6;
/** Pas de simulation : ~30 images/s, saccadé exprès pour l'effet pixel. */
const TICK_MS = 33;

/** Traînée : quelques cases voisines au hasard, dans ce rayon (en cases). */
const SCATTER_RADIUS = 3;
const SCATTER_COUNT = 4;
/** Extinction par pas (+ une part aléatoire), et propagation façon feu de Doom. */
const DECAY_MIN = 0.025;
const DECAY_RAND = 0.05;
const SPREAD_FROM = 0.55;
const SPREAD_CHANCE = 0.35;
/**
 * Onde de choc au clic : un anneau fin qui s'élargit, vide au milieu. Rayon max en cases,
 * vitesse en cases par pas, épaisseur du front (en cases) et de la petite traîne derrière.
 */
const WAVE_MAX = 18;
const WAVE_SPEED = 0.9;
const WAVE_FRONT = 0.6;
const WAVE_TAIL = 1.4;
/** Irrégularité de l'anneau : bosses du contour (en cases), trous et étincelles au hasard. */
const WAVE_WOBBLE = 0.9;
const WAVE_GAP_CHANCE = 0.18;
const WAVE_SPARK_CHANCE = 0.04;

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Quadrillage fin + « feu » de pixels sous la souris et onde de choc au clic, dessinés dans un
 * canvas posé sur la carte. Le quadrillage et l'effet ne touchent que les cases de fond
 * (repérées en analysant l'image) : chemins, encadrés et bordure restent nets.
 * Les événements sont écoutés sur .map (parent), le canvas laisse passer les clics vers les POI.
 */
export function MapPixels() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const map = canvas?.parentElement;
    const img = map?.querySelector<HTMLImageElement>('.map__image');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !map || !img || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const GRID = token('--grid', '#2a2520');
    // Blanc, en paliers d'opacité du plus chaud au plus froid (saccadé exprès, façon palette rétro).
    const RAMP: [number, string][] = [
      [0.85, 'rgb(255 255 255 / 0.9)'],
      [0.65, 'rgb(255 255 255 / 0.65)'],
      [0.45, 'rgb(255 255 255 / 0.42)'],
      [0.25, 'rgb(255 255 255 / 0.24)'],
      [0.08, 'rgb(255 255 255 / 0.1)'],
    ];
    const colorOf = (h: number) => RAMP.find(([min]) => h > min)?.[1];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0; // taille de l'image source
    let H = 0;
    let cols = 0;
    let rows = 0;
    let free = new Uint8Array(0);
    let heat = new Float32Array(0);
    /** Couche de l'onde, recalculée à chaque pas : elle ne laisse pas de braises derrière elle. */
    let wave = new Float32Array(0);
    let xs: number[] = []; // bords des cases en px du canvas
    let ys: number[] = [];
    let line = 1;
    let gridLayer: HTMLCanvasElement | null = null;
    /** harmonics : bosses du contour [fréquence, phase, vitesse], tirées au clic, propres à chaque onde. */
    let waves: { c: number; r: number; radius: number; harmonics: [number, number, number][] }[] = [];
    let last: [number, number] | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;

    /** Repère les cases de fond dans l'image affichée (paysage ou portrait). */
    function buildMask() {
      if (!img || !img.complete || !img.naturalWidth) return;
      W = img.naturalWidth;
      H = img.naturalHeight;
      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const o = off.getContext('2d', { willReadFrequently: true });
      if (!o) return;
      o.drawImage(img, 0, 0);
      const data = o.getImageData(0, 0, W, H).data;
      const [br, bg, bb] = hex(MAP.background);
      free = new Uint8Array(cols * rows);
      heat = new Float32Array(cols * rows);
      wave = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let ok = 0;
          let total = 0;
          for (let y = r * CELL; y < Math.min(H, (r + 1) * CELL); y++) {
            for (let x = c * CELL; x < Math.min(W, (c + 1) * CELL); x++) {
              const i = (y * W + x) * 4;
              total++;
              if (Math.max(Math.abs(data[i] - br), Math.abs(data[i + 1] - bg), Math.abs(data[i + 2] - bb)) <= TOLERANCE) ok++;
            }
          }
          free[r * cols + c] = ok >= total * FREE_RATIO ? 1 : 0;
        }
      }
      keepSmallDecorAsBackground();
      layout();
    }

    /**
     * Les petits groupes de cases « non fond » (poussières du décor) repassent en fond :
     * sinon chaque grain troue le quadrillage. Chemins et encadrés, eux, sont bien plus grands.
     */
    function keepSmallDecorAsBackground() {
      const seen = new Uint8Array(free.length);
      for (let start = 0; start < free.length; start++) {
        if (free[start] || seen[start]) continue;
        const group = [start];
        seen[start] = 1;
        for (let k = 0; k < group.length; k++) {
          const c = group[k] % cols;
          const r = (group[k] - c) / cols;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const j = at(c + dx, r + dy);
            if (j >= 0 && !free[j] && !seen[j]) {
              seen[j] = 1;
              group.push(j);
            }
          }
        }
        if (group.length < MIN_DECOR_CELLS) for (const i of group) free[i] = 1;
      }
    }

    /** Recalcule la grille en px du canvas (à chaque redimensionnement) et redessine le quadrillage. */
    function layout() {
      if (!canvas || !ctx || !W) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      xs = Array.from({ length: cols + 1 }, (_, c) => Math.round((Math.min(W, c * CELL) / W) * canvas.width));
      ys = Array.from({ length: rows + 1 }, (_, r) => Math.round((Math.min(H, r * CELL) / H) * canvas.height));
      line = Math.max(1, Math.round(dpr));

      gridLayer = document.createElement('canvas');
      gridLayer.width = canvas.width;
      gridLayer.height = canvas.height;
      const g = gridLayer.getContext('2d');
      if (!g) return;
      g.fillStyle = GRID;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!free[r * cols + c]) continue;
          const [x0, x1, y0, y1] = [xs[c], xs[c + 1], ys[r], ys[r + 1]];
          g.fillRect(x0, y0, x1 - x0, line); // haut
          g.fillRect(x0, y0, line, y1 - y0); // gauche
          // Fermer la grille au bord de la zone de fond
          if (c === cols - 1 || !free[r * cols + c + 1]) g.fillRect(x1 - line, y0, line, y1 - y0);
          if (r === rows - 1 || !free[(r + 1) * cols + c]) g.fillRect(x0, y1 - line, x1 - x0, line);
        }
      }
      draw();
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (gridLayer) ctx.drawImage(gridLayer, 0, 0);
      for (let i = 0; i < heat.length; i++) {
        const h = Math.max(heat[i], wave[i]);
        if (h <= 0.08 || !free[i]) continue;
        const color = colorOf(h);
        if (!color) continue;
        const c = i % cols;
        const r = (i - c) / cols;
        // Case pleine, en laissant le trait du quadrillage visible
        ctx.fillStyle = color;
        ctx.fillRect(xs[c] + line, ys[r] + line, xs[c + 1] - xs[c] - line, ys[r + 1] - ys[r] - line);
      }
    }

    const at = (c: number, r: number) => (c >= 0 && r >= 0 && c < cols && r < rows ? r * cols + c : -1);
    const warm = (i: number, v: number) => {
      if (i >= 0 && v > heat[i]) heat[i] = v;
    };

    /** La case visée s'allume à fond, quelques voisines au hasard, de plus en plus faiblement. */
    function ignite(c: number, r: number) {
      warm(at(c, r), 1);
      for (let k = 0; k < SCATTER_COUNT; k++) {
        const dx = Math.round((Math.random() * 2 - 1) * SCATTER_RADIUS);
        const dy = Math.round((Math.random() * 2 - 1) * SCATTER_RADIUS);
        const d = Math.hypot(dx, dy);
        if (d > SCATTER_RADIUS + 0.5) continue;
        warm(at(c + dx, r + dy), (1 - d / (SCATTER_RADIUS + 1)) * (0.5 + 0.5 * Math.random()));
      }
    }

    function tick() {
      // Onde de choc : anneau fin qui s'élargit et faiblit. Calculé à neuf à chaque pas, sans
      // passer par `heat` : pas de braises ni de propagation, donc le centre reste vide (halo).
      wave.fill(0);
      for (const w of waves) {
        w.radius += WAVE_SPEED;
        const amp = 0.9 * (1 - w.radius / WAVE_MAX);
        // + bosses du contour et étincelles qui dépassent le rayon théorique
        const R = Math.ceil(w.radius + WAVE_WOBBLE) + 3;
        for (let r = w.r - R; r <= w.r + R; r++) {
          for (let c = w.c - R; c <= w.c + R; c++) {
            const i = at(c, r);
            if (i < 0) continue;
            // Contour irrégulier : le rayon varie selon l'angle (quelques bosses qui ondulent
            // dans le temps), et grandit avec l'onde pour qu'elle se déforme en s'éloignant.
            const angle = Math.atan2(r - w.r, c - w.c);
            let wobble = 0;
            for (const [freq, phase, speed] of w.harmonics) wobble += Math.sin(freq * angle + phase + speed * w.radius);
            const radius = w.radius + (wobble / w.harmonics.length) * WAVE_WOBBLE * Math.min(1, w.radius / 4);
            // behind > 0 : la case est derrière le front (déjà traversée)
            const behind = radius - Math.hypot(c - w.c, r - w.r);
            let v = 0;
            if (Math.abs(behind) <= WAVE_FRONT) v = Math.random() < WAVE_GAP_CHANCE ? 0 : amp;
            else if (behind > 0 && behind <= WAVE_FRONT + WAVE_TAIL) v = Math.random() < 0.5 ? amp * 0.35 : 0;
            // Quelques étincelles juste devant le front
            else if (behind < 0 && behind > -2 && Math.random() < WAVE_SPARK_CHANCE) v = amp * 0.6;
            if (v > 0) wave[i] = Math.max(wave[i], v * (0.6 + 0.4 * Math.random()));
          }
        }
      }
      waves = waves.filter((w) => w.radius < WAVE_MAX);

      // Extinction aléatoire, puis propagation façon feu de Doom : une case chaude
      // réchauffe parfois une voisine, en plus faible (la traînée crépite sans s'étaler).
      const next = new Float32Array(heat.length);
      let alive = waves.length > 0;
      for (let i = 0; i < heat.length; i++) {
        if (heat[i] > 0) next[i] = Math.max(0, heat[i] - DECAY_MIN - Math.random() * DECAY_RAND);
      }
      for (let i = 0; i < heat.length; i++) {
        const h = heat[i];
        if (h < SPREAD_FROM || Math.random() > SPREAD_CHANCE) continue;
        const c = i % cols;
        const r = (i - c) / cols;
        const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
        const j = at(c + dx, r + dy);
        if (j >= 0) next[j] = Math.max(next[j], h * (0.45 + 0.3 * Math.random()));
      }
      for (let i = 0; i < next.length && !alive; i++) alive = next[i] > 0.08;
      heat = next;
      draw();
      if (!alive) {
        heat.fill(0);
        wave.fill(0);
        draw();
        clearInterval(timer);
        timer = undefined;
      }
    }

    const start = () => {
      timer ??= setInterval(tick, TICK_MS);
    };

    function cellAt(e: PointerEvent): [number, number] {
      const rect = canvas!.getBoundingClientRect();
      return [
        Math.floor((((e.clientX - rect.left) / rect.width) * W) / CELL),
        Math.floor((((e.clientY - rect.top) / rect.height) * H) / CELL),
      ];
    }

    function onMove(e: PointerEvent) {
      if (!W) return;
      const [c, r] = cellAt(e);
      // Mouvement rapide : on remplit les cases entre deux positions, pas de trous dans la traînée
      const [c0, r0] = last ?? [c, r];
      const steps = Math.max(Math.abs(c - c0), Math.abs(r - r0), 1);
      for (let s = 1; s <= steps; s++) ignite(Math.round(c0 + ((c - c0) * s) / steps), Math.round(r0 + ((r - r0) * s) / steps));
      last = [c, r];
      start();
    }
    function onDown(e: PointerEvent) {
      if (!W) return;
      const [c, r] = cellAt(e);
      // Pas d'ignite ici : le centre du clic reste vide, seul l'anneau part
      waves.push({
        c,
        r,
        radius: 0,
        harmonics: [2, 3, 5].map((freq) => [freq, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6]),
      });
      start();
    }
    const onLeave = () => {
      last = null;
    };

    // Rotation de l'écran : <picture> charge l'autre image → nouveau masque
    img.addEventListener('load', buildMask);
    buildMask();
    const resize = new ResizeObserver(() => layout());
    resize.observe(canvas);
    if (!reduced) {
      map.addEventListener('pointermove', onMove);
      map.addEventListener('pointerdown', onDown);
      map.addEventListener('pointerleave', onLeave);
    }
    return () => {
      img.removeEventListener('load', buildMask);
      resize.disconnect();
      map.removeEventListener('pointermove', onMove);
      map.removeEventListener('pointerdown', onDown);
      map.removeEventListener('pointerleave', onLeave);
      clearInterval(timer);
    };
  }, []);

  return <canvas ref={ref} className="map-pixels" aria-hidden />;
}
