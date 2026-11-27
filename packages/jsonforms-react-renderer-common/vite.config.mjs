import { readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { defineConfig } from 'vite-plus';
import { packageBuild } from '../../vite/package-build.mjs';

const { packageDir, isExternal } = packageBuild(import.meta.url);
const sourceDir = resolve(packageDir, 'src');
const entry = Object.fromEntries(
  readdirSync(sourceDir, { recursive: true })
    .filter((file) => /(?<!\.d)\.tsx?$/.test(file))
    .map((file) => [
      file
        .split(sep)
        .join('/')
        .replace(/\.tsx?$/, ''),
      resolve(sourceDir, file),
    ]),
);
export default defineConfig({
  build: {
    // Preserve the Vite 5 browser baseline through the toolchain upgrade.
    target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
    lib: {
      entry,
      formats: ['es', 'cjs'],
      fileName: (format, name) =>
        `${name}.${format === 'es' ? 'esm' : 'cjs'}.js`,
    },
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: { external: isExternal },
  },
});
