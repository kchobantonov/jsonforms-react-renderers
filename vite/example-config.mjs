import react from '@vitejs/plugin-react';
import { createReadStream, cpSync, existsSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const logoPath = join(
  repoRoot,
  'packages',
  'jsonforms-react-demo-common',
  'src',
  'logo.svg'
);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const isInside = (parent, child) => {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
};

const serveDirectory = (mount, directory) => (req, res, next) => {
  try {
    const requestPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const filePath = resolve(directory, `.${requestPath}`);

    if (
      !isInside(directory, filePath) ||
      !existsSync(filePath) ||
      !statSync(filePath).isFile()
    ) {
      next();
      return;
    }

    const contentType = contentTypes[extname(filePath)];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    createReadStream(filePath).pipe(res);
  } catch {
    next();
  }
};

const exampleAssets = (packageDir, { staticMounts = [] } = {}) => ({
  name: 'jsonforms-example-assets',
  configureServer(server) {
    for (const { mount, directory } of staticMounts) {
      server.middlewares.use(mount, serveDirectory(mount, directory));
    }
  },
  writeBundle() {
    const assetsDir = join(packageDir, 'example', 'dist', 'assets');
    cpSync(logoPath, join(assetsDir, 'logo.svg'));

    for (const { directory, buildTarget } of staticMounts) {
      cpSync(directory, join(assetsDir, buildTarget), { recursive: true });
    }
  },
});

export const defineJsonFormsExampleConfig = ({
  packageUrl,
  primeReactThemes = false,
} = {}) => {
  const packageDir = dirname(fileURLToPath(packageUrl));
  const staticMounts = primeReactThemes
    ? [
        {
          mount: '/assets/themes',
          directory: join(packageDir, 'node_modules', 'primereact', 'resources', 'themes'),
          buildTarget: 'themes',
        },
      ]
    : [];

  return defineConfig({
    root: 'example',
    base: './',
    plugins: [react(), exampleAssets(packageDir, { staticMounts })],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: '127.0.0.1',
      port: 8080,
      fs: {
        allow: [repoRoot],
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
  });
};
