import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';
import { packageBuild } from '../../vite/package-build.mjs';

const { packageDir, isExternal } = packageBuild(import.meta.url, {
  extraExternalPrefixes: ['@jsonforms-react-shadcn-ui/'],
});

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': resolve(packageDir, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(packageDir, 'src/index.tsx'),
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es'
          ? 'jsonforms-react-shadcn.esm.js'
          : 'jsonforms-react-shadcn.cjs.js',
    },
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
    rolldownOptions: { external: isExternal },
  },
});
