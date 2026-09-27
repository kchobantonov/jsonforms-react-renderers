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
      /*
        Two entries, not one. `ajvLocalizers` re-exports every language
        `ajv-i18n` ships, and anything reachable from the main entry is
        reachable from every consumer's bundle. Giving it its own entry - and
        its own `exports` subpath in package.json - is what lets a host that
        wants localized validator messages ask for them, and a host that does
        not carry none of it.

        `ajv-i18n` is an external dependency either way, so this is about what
        a consumer's bundler can drop, not about this package's own size.
      */
      entry: {
        'jsonforms-react-extended': resolve(packageDir, 'src/index.tsx'),
        'ajv-localizers': resolve(
          packageDir,
          'src/core/ajvI18n/localizers.ts'
        ),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'es' ? `${entryName}.esm.js` : `${entryName}.cjs.js`,
    },
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2015',
    rollupOptions: { external: isExternal },
  },
});
