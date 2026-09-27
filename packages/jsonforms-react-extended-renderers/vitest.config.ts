import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup/matchMedia.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
