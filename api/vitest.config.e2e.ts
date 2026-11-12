import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Les suites partagent la même base : on les lance l'une après l'autre.
    fileParallelism: false,
    hookTimeout: 30_000,
  },
});
