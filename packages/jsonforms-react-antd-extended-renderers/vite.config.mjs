import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';
import { packageBuild } from '../../vite/package-build.mjs';

const { packageDir, isExternal } = packageBuild(import.meta.url);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(packageDir, 'src/index.tsx'),
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es'
          ? 'jsonforms-react-antd-extended.esm.js'
          : 'jsonforms-react-antd-extended.cjs.js',
    },
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
    rolldownOptions: { external: isExternal },
  },
});
