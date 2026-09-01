import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromPackage = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@chobantonov/jsonforms-react-primereact-renderers',
        replacement: fromPackage('./src'),
      },
      {
        find: '@chobantonov/jsonforms-react-primereact-extended-renderers',
        replacement: fromPackage(
          '../jsonforms-react-primereact-extended-renderers/src'
        ),
      },
      {
        find: '@chobantonov/jsonforms-react-extended-renderers',
        replacement: fromPackage('../jsonforms-react-extended-renderers/src'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    onConsoleLog(log, type) {
      // jsdom 22 cannot parse PrimeReact's valid CSS cascade layers. PrimeReact
      // reports the entire generated stylesheet for every mounted component,
      // although rendering and assertions continue normally.
      if (
        type === 'stderr' &&
        log.includes('Could not parse CSS stylesheet') &&
        log.includes('@layer primereact')
      ) {
        return false;
      }
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
    },
  },
});
