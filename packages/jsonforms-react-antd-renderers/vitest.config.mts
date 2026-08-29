import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromPackage = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@chobantonov/jsonforms-react-antd-renderers',
        replacement: fromPackage('./src'),
      },
      {
        find: '@chobantonov/jsonforms-react-antd-extended-renderers',
        replacement: fromPackage('../jsonforms-react-antd-extended-renderers/src'),
      },
      {
        find: '@chobantonov/jsonforms-react-extended-renderers',
        replacement: fromPackage('../jsonforms-react-extended-renderers/src'),
      },
      {
        find: /^@rc-component\/pagination\/(.*)$/,
        replacement: fromPackage('./node_modules/@rc-component/pagination/lib/$1'),
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
    include: ['test/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
    },
  },
});
