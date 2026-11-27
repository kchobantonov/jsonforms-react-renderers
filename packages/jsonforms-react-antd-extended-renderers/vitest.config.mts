import { rendererTestAlias } from '../../vite/renderer-test-alias.mjs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

const fromPackage = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      rendererTestAlias('jsonforms-react-renderer-common'),
      rendererTestAlias('jsonforms-react-antd-renderers'),
      {
        /*
          Before the bare-name alias, because vite matches in order and
          `@chobantonov/.../ajv-localizers` would otherwise be rewritten to
          `src/ajv-localizers`, which does not exist. The published package
          resolves this subpath through its `exports` map; the alias is what
          reproduces that when tests run against source.
        */
        find: '@chobantonov/jsonforms-react-extended-renderers/ajv-localizers',
        replacement: fromPackage(
          '../jsonforms-react-extended-renderers/src/core/ajvI18n/localizers',
        ),
      },
      {
        find: '@chobantonov/jsonforms-react-extended-renderers',
        replacement: fromPackage('../jsonforms-react-extended-renderers/src'),
      },
    ],
  },
  test: {
    maxWorkers: 2,
    // Cold lazy-loaded editor/grid fixtures can exceed five seconds before assertions finish.
    // Keep this above flushUntil's own diagnostic deadline to avoid orphaned act scopes.
    testTimeout: 20000,
    sequence: { groupOrder: 0 },
    environment: 'jsdom',
    setupFiles: [
      '../jsonforms-react-extended-renderers/test/setup/matchMedia.ts',
      '../jsonforms-react-antd-renderers/test/setup/jsdomShims.ts',
    ],
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
    },
  },
});
