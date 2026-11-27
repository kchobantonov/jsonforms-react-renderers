import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';
import { packageBuild } from '../../vite/package-build.mjs';

const { packageDir, isExternal } = packageBuild(import.meta.url);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(packageDir, 'src/index.tsx'),
        register: resolve(packageDir, 'src/register.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) =>
        entryName === 'index' ? 'jsonforms-react-antd.js' : 'register.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
    rolldownOptions: { external: isExternal },
  },
});
