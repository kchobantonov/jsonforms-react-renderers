import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

const packageDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': resolve(packageDir, 'src'),
      '@jsonforms-react-shadcn-ui': resolve(packageDir, 'src/components/ui'),
    },
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
