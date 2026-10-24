import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const logoPath = join(
  repoRoot,
  'packages',
  'jsonforms-react-demo-common',
  'src',
  'logo.svg',
);

const exampleAssets = (packageDir) => ({
  name: 'jsonforms-example-assets',
  writeBundle() {
    const assetsDir = join(packageDir, 'dist', 'assets');
    cpSync(logoPath, join(assetsDir, 'logo.svg'));
  },
});

export const defineJsonFormsExampleConfig = ({ packageUrl } = {}) => {
  const packageDir = dirname(fileURLToPath(packageUrl));

  return defineConfig({
    root: packageDir,
    base: './',
    plugins: [react(), exampleAssets(packageDir)],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      fs: {
        allow: [repoRoot],
      },
    },
    build: {
      // Preserve the Vite 5 browser baseline through the toolchain upgrade.
      target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
  });
};
