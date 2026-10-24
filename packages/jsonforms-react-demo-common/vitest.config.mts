import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@chobantonov/jsonforms-react-renderer-common': fileURLToPath(
        new URL('../jsonforms-react-renderer-common/src', import.meta.url),
      ),
    },
  },
  test: {
    maxWorkers: 2,
    sequence: { groupOrder: 3 },
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
