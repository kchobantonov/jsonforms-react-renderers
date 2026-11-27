import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';
import { packageBuild } from '../../vite/package-build.mjs';

const { packageDir, isExternal } = packageBuild(import.meta.url, {
  excludeIds: [
    '@chobantonov/jsonforms-react-shadcn-renderers',
    '@chobantonov/jsonforms-react-shadcn-extended-renderers',
  ],
});

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': resolve(packageDir, 'src'),
      '@jsonforms-react-shadcn-ui': resolve(packageDir, 'src/components/ui'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(packageDir, 'src/index.tsx'),
        register: resolve(packageDir, 'src/register.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) =>
        entryName === 'index' ? 'jsonforms-react-shadcn.js' : 'register.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
    rolldownOptions: { external: isExternal },
  },
});
