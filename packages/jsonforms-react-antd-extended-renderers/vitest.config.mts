import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromPackage = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@chobantonov/jsonforms-react-antd-renderers',
        replacement: fromPackage('../jsonforms-react-antd-renderers/src'),
      },
      {
        find: '@chobantonov/jsonforms-react-extended-renderers',
        replacement: fromPackage('../jsonforms-react-extended-renderers/src'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
