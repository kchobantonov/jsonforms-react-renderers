import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      '@jsonforms-react-shadcn-ui': fileURLToPath(
        new URL(
          '../../apps/jsonforms-react-shadcn-demo/src/components/ui',
          import.meta.url
        )
      ),
      '@chobantonov/jsonforms-react-renderer-common': fileURLToPath(
        new URL('../jsonforms-react-renderer-common/src', import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
    },
  },
});
