import { RateLimitStore } from './rate-limit.js';

describe('RateLimitStore', () => {
  it('laisse passer jusqu’à la limite, puis donne le temps d’attente', () => {
    const store = new RateLimitStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(store.hit('k', 3, 10_000, t0 + i)).toBeNull();
    expect(store.hit('k', 3, 10_000, t0 + 5_000)).toBe(5);
  });

  it('fenêtre glissante : les vieilles requêtes ne comptent plus', () => {
    const store = new RateLimitStore();
    const t0 = 1_000_000;
    store.hit('k', 2, 10_000, t0);
    store.hit('k', 2, 10_000, t0 + 1_000);
    expect(store.hit('k', 2, 10_000, t0 + 2_000)).not.toBeNull();
    expect(store.hit('k', 2, 10_000, t0 + 10_001)).toBeNull();
  });

  it('compte chaque clé séparément', () => {
    const store = new RateLimitStore();
    expect(store.hit('a', 1, 10_000, 0)).toBeNull();
    expect(store.hit('b', 1, 10_000, 0)).toBeNull();
    expect(store.hit('a', 1, 10_000, 1)).not.toBeNull();
  });
});
