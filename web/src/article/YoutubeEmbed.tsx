import './article.css';

/**
 * Lecteur YouTube en mode « confidentialité renforcée » (youtube-nocookie.com) :
 * pas de cookie de suivi tant que la vidéo n'est pas lancée.
 */
export function YoutubeEmbed({ videoId, title }: { videoId: string; title?: string }) {
  return (
    <div className="youtube-embed">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
        title={title ?? 'Vidéo YouTube'}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
