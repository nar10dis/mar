// Formes renvoyées par l'API (cf. api/src/*/*.controller.ts)

export interface Theme {
  id: number;
  slug: string;
  name: string;
  color: string;
}

export interface Magazine {
  id: number;
  title: string;
  issue: string | null;
  coverUrl: string;
  /** centimes */
  price: number;
  description: string | null;
  helloAssoUrl: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

/** GET /api/presence */
export interface OnlineUser {
  id: number;
  pseudo: string;
  avatarUrl: string | null;
}
