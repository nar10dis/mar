import type { CSSProperties } from 'react';
import { asset } from '../lib/assets.ts';
import { REACTIONS, reactionIndex } from '../lib/reactions.ts';
import type { ReactionKind } from '../lib/reactions.ts';

interface ReactionBubbleProps {
  kind: ReactionKind;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
}

const SIZE = 16;
const SCALE = 2;

export function ReactionBubble({ kind, count, selected, onClick }: ReactionBubbleProps) {
  const i = reactionIndex(kind);
  const label = REACTIONS[i].label;
  const style = {
    backgroundImage: `url(${asset('reactions.png')})`,
    backgroundSize: `${REACTIONS.length * SIZE * SCALE}px ${SIZE * SCALE}px`,
    backgroundPosition: `${-i * SIZE * SCALE}px 0`,
    width: SIZE * SCALE,
    height: SIZE * SCALE,
  } as CSSProperties;
  return (
    <button
      type="button"
      className={['reaction-bubble', selected && 'reaction-bubble--selected'].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-pressed={selected}
      title={label}
    >
      <span className="reaction-bubble__sprite pixel" style={style} aria-hidden />
      <span className="visually-hidden">{label}</span>
      {count !== undefined && <span className="reaction-bubble__count">{count}</span>}
    </button>
  );
}
