import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
const root = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);
const dependencies = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];
const entry = Object.fromEntries(
  ['', 'locale/'].flatMap((dir) =>
    readdirSync(resolve(root, 'src', dir))
      .filter((name) => /\.tsx?$/.test(name))
      .map((name) => [
        dir + name.replace(/\.tsx?$/, ''),
        resolve(root, 'src', dir, name),
      ])
  )
);
export default defineConfig({
  build: {
    lib: {
      entry,
      formats: ['es', 'cjs'],
      fileName: (format, name) =>
        `${name}.${format === 'es' ? 'esm' : 'cjs'}.js`,
    },
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: (id) =>
        dependencies.some((name) => id === name || id.startsWith(name + '/')),
    },
  },
});
