import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@chobantonov/jsonforms-react-renderer-common': fileURLToPath(
        new URL('../jsonforms-react-renderer-common/src', import.meta.url)
      ),
      '@jsonforms/material-renderers': fileURLToPath(
        new URL(
          './node_modules/@jsonforms/material-renderers/lib/jsonforms-react-material.esm.js',
          import.meta.url
        )
      ),
      '@chobantonov/jsonforms-react-mui-extended-renderers': fileURLToPath(
        new URL(
          '../jsonforms-react-mui-extended-renderers/src/index.tsx',
          import.meta.url
        )
      ),
    },
  },
  test: {
    globals: true,
    server: {
      deps: {
        inline: ['@jsonforms/material-renderers', '@mui/x-date-pickers'],
      },
    },
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
