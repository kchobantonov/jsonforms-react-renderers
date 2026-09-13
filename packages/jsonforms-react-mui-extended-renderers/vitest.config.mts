import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@monaco-editor/react': fileURLToPath(
        new URL(
          '../jsonforms-react-extended-renderers/node_modules/@monaco-editor/react/dist/index.mjs',
          import.meta.url
        )
      ),
      'ag-grid-react': fileURLToPath(
        new URL(
          '../jsonforms-react-extended-renderers/node_modules/ag-grid-react/dist/package/index.esm.mjs',
          import.meta.url
        )
      ),
      '@chobantonov/jsonforms-react-extended-renderers': fileURLToPath(
        new URL(
          '../jsonforms-react-extended-renderers/src/index.tsx',
          import.meta.url
        )
      ),
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
