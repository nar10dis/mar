import { TextField } from '../components/Field.tsx';
import { YoutubeEmbed } from '../article/YoutubeEmbed.tsx';
import { parseYoutube } from './content.ts';
import type { Draft } from './content.ts';

type YoutubeDraft = Extract<Draft, { type: 'youtube' }>;

export function YoutubeBlockEditor({ block, onChange }: { block: YoutubeDraft; onChange: (b: YoutubeDraft) => void }) {
  const invalid = block.url.trim() !== '' && !block.videoId;
  return (
    <div className="media-block">
      <TextField
        label="Lien de la vidéo YouTube"
        placeholder="https://www.youtube.com/watch?v=…"
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value, videoId: parseYoutube(e.target.value) })}
        error={invalid ? "Ce lien n'est pas reconnu comme une vidéo YouTube." : null}
      />
      {block.videoId && <YoutubeEmbed videoId={block.videoId} />}
    </div>
  );
}
