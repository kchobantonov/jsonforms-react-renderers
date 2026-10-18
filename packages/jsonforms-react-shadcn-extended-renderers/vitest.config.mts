import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

const fromPackage = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: [
      {
        find: '@monaco-editor/react',
        replacement: fromPackage(
          '../jsonforms-react-extended-renderers/node_modules/@monaco-editor/react/dist/index.mjs',
        ),
      },
      {
        find: '@jsonforms-react-shadcn-ui',
        replacement: fileURLToPath(
          new URL(
            '../../apps/jsonforms-react-shadcn-demo/src/components/ui',
            import.meta.url,
          ),
        ),
      },
      {
        find: '@chobantonov/jsonforms-react-renderer-common',
        replacement: fileURLToPath(
          new URL('../jsonforms-react-renderer-common/src', import.meta.url),
        ),
      },
      {
        find: '@chobantonov/jsonforms-react-shadcn-renderers',
        replacement: fromPackage('../jsonforms-react-shadcn-renderers/src'),
      },
      {
        find: '@chobantonov/jsonforms-react-extended-renderers',
        replacement: fromPackage('../jsonforms-react-extended-renderers/src'),
      },
    ],
  },
  test: {
    maxWorkers: 2,
    sequence: { groupOrder: 7 },
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
    },
  },
});
