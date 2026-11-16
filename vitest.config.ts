import { defineConfig } from 'vitest/config';

// Plain Node tests: the engine, parsers, license check and PDF filling are DOM-free modules.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
