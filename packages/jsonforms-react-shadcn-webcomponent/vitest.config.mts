import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@chobantonov/jsonforms-react-shadcn-renderers': fileURLToPath(
        new URL('../jsonforms-react-shadcn-renderers/src', import.meta.url),
      ),
      '@chobantonov/jsonforms-react-shadcn-extended-renderers': fileURLToPath(
        new URL(
          '../jsonforms-react-shadcn-extended-renderers/src',
          import.meta.url,
        ),
      ),
      '@jsonforms-react-shadcn-ui': fileURLToPath(
        new URL('./src/components/ui', import.meta.url),
      ),
      '@chobantonov/jsonforms-react-renderer-common': fileURLToPath(
        new URL('../jsonforms-react-renderer-common/src', import.meta.url),
      ),
    },
  },
  test: {
    maxWorkers: 2,
    sequence: { groupOrder: 9 },
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
