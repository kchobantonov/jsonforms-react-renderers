import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromPackage = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@chobantonov/jsonforms-react-renderer-common',
        replacement: fileURLToPath(
          new URL('../jsonforms-react-renderer-common/src', import.meta.url)
        ),
      },
      {
        find: '@chobantonov/jsonforms-react-antd-renderers',
        replacement: fromPackage('./src'),
      },
      {
        find: '@chobantonov/jsonforms-react-antd-extended-renderers',
        replacement: fromPackage(
          '../jsonforms-react-antd-extended-renderers/src'
        ),
      },
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
          '../jsonforms-react-extended-renderers/src/core/ajvI18n/localizers'
        ),
      },
      {
        find: '@chobantonov/jsonforms-react-extended-renderers',
        replacement: fromPackage('../jsonforms-react-extended-renderers/src'),
      },
      {
        find: /^@rc-component\/pagination\/(.*)$/,
        replacement: fromPackage(
          './node_modules/@rc-component/pagination/lib/$1'
        ),
      },
      {
        find: /^@rc-component\/picker\/(.*)$/,
        replacement: fromPackage('./node_modules/@rc-component/picker/lib/$1'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './test/renderers/MatchMediaMock.ts',
      './test/setup/jsdomShims.ts',
    ],
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
    },
  },
});
