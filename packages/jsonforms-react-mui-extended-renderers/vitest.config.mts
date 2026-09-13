import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Match the browser's ESM entry so MUI shares the theme context.
      '@jsonforms/material-renderers': fileURLToPath(
        new URL(
          './node_modules/@jsonforms/material-renderers/lib/jsonforms-react-material.esm.js',
          import.meta.url
        )
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
