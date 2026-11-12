import { useId, useRef, useState } from 'react';
import { TextField } from '../components/Field.tsx';
import { PixelButton } from '../components/PixelButton.tsx';
import { errorText } from '../lib/api.ts';
import { mediaUrl, uploadFile, uploadRule } from '../lib/upload.ts';
import type { UploadPurpose } from '../lib/upload.ts';
import type { Draft } from './content.ts';

type MediaDraft = Extract<Draft, { type: 'image' | 'audio' | 'pdf' }>;

const PURPOSE: Record<MediaDraft['type'], UploadPurpose> = {
  image: 'article-image',
  audio: 'article-audio',
  pdf: 'article-pdf',
};

/** Bloc image / son / PDF : choix du fichier (upload direct vers le bucket) + champs descriptifs. */
export function MediaBlockEditor({ block, onChange }: { block: MediaDraft; onChange: (b: MediaDraft) => void }) {
  const purpose = PURPOSE[block.type];
  const rule = uploadRule(purpose);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { key } = await uploadFile(file, purpose);
      if (block.type === 'image') {
        onChange({ ...block, key, alt: block.alt || file.name.replace(/\.[^.]+$/, '') });
      } else {
        onChange({ ...block, key, title: block.title || file.name.replace(/\.[^.]+$/, '') });
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="media-block">
      {block.key && <MediaPreview block={block} />}

      <input ref={fileRef} id={inputId} type="file" accept={rule.accept} className="visually-hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <PixelButton variant="blue" className="pixel-button--small" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? 'Envoi…' : block.key ? 'Remplacer le fichier' : 'Choisir un fichier'}
      </PixelButton>
      <p className="field__hint">
        {rule.label}, {rule.maxMb} Mo max.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {block.key && block.type === 'image' && (
        <>
          <TextField
            label="Description (texte alternatif)"
            required
            maxLength={300}
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            hint="Lue par les lecteurs d'écran à la place de l'image."
          />
          <TextField label="Légende (facultatif)" maxLength={300} value={block.caption} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
        </>
      )}
      {block.key && block.type !== 'image' && (
        <TextField label="Titre (facultatif)" maxLength={200} value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} />
      )}
    </div>
  );
}

function MediaPreview({ block }: { block: MediaDraft }) {
  if (!block.key) return null;
  const url = mediaUrl(block.key);
  if (block.type === 'image') return <img className="media-block__img" src={url} alt="" />;
  if (block.type === 'audio') return <audio className="media-block__audio" src={url} controls preload="none" />;
  return (
    <a className="media-block__pdf" href={url} target="_blank" rel="noopener noreferrer">
      📄 {block.title || 'Voir le PDF'}
    </a>
  );
}
