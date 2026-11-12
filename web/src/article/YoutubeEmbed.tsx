import { useState } from 'react';
import './article.css';

/**
 * Lecteur YouTube chargé au clic seulement : tant qu'on ne lance pas la vidéo, aucune requête
 * ne part vers YouTube/Google (pas de traceur, page plus légère). Ensuite, mode
 * « confidentialité renforcée » (youtube-nocookie.com).
 */
export function YoutubeEmbed({ videoId, title }: { videoId: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const label = title ?? 'Vidéo YouTube';
  return (
    <div className="youtube-embed">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" className="youtube-embed__facade" onClick={() => setPlaying(true)}>
          <span className="youtube-embed__play" aria-hidden>
            ▶
          </span>
          <span>Lancer la vidéo</span>
          <span className="youtube-embed__note">La vidéo se charge depuis YouTube.</span>
        </button>
      )}
    </div>
  );
}
