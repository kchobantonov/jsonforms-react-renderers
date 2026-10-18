import { defineConfig } from 'vite-plus';
export default defineConfig({
  test: {
    maxWorkers: 2,
    sequence: { groupOrder: 6 },
    globals: true,
    setupFiles: ['./test/setup.ts'],
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
