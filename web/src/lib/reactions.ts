// Même ordre que l'enum ReactionKind (Prisma) et que les bulles de reactions.png.
export const REACTIONS = [
  { kind: 'HEART', label: 'Cœur' },
  { kind: 'DROP', label: 'Goutte' },
  { kind: 'QUESTION', label: 'Question' },
  { kind: 'ELLIPSIS', label: 'Points de suspension' },
  { kind: 'SMILE', label: 'Sourire' },
  { kind: 'ZZ', label: 'Ennui' },
  { kind: 'EXCLAMATION', label: 'Exclamation' },
  { kind: 'NOTE', label: 'Musique' },
  { kind: 'ANGER', label: 'Colère' },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]['kind'];

export const reactionIndex = (kind: ReactionKind) => REACTIONS.findIndex((r) => r.kind === kind);
