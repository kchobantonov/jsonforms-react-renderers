import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);
const packageDir = dirname(fileURLToPath(import.meta.url));
const externalPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]);
const isExternal = (id) =>
  [...externalPackages].some(
    (packageName) => id === packageName || id.startsWith(`${packageName}/`)
  );

export default defineConfig({
  build: {
    lib: {
      entry: resolve(packageDir, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es'
          ? 'jsonforms-react-primereact.esm.js'
          : 'jsonforms-react-primereact.cjs.js',
    },
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
    rollupOptions: { external: isExternal },
  },
});
