import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

const packageDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(packageDir, 'src/register.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/standalone',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
  },
});
