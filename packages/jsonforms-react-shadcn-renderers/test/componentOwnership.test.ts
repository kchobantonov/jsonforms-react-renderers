// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'vite';

const root = resolve(__dirname, '../../..');
const primitives = [
  'alert',
  'button',
  'calendar',
  'card',
  'checkbox',
  'collapsible',
  'dialog',
  'input',
  'popover',
  'resizable',
  'select',
  'tabs',
  'textarea',
  'switch',
  'radio-group',
  'slider',
];
const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(resolve(directory, entry.name))
      : /\.tsx?$/.test(entry.name)
      ? [resolve(directory, entry.name)]
      : []
  );

describe('application ownership of shadcn/ui', () => {
  for (const host of [
    'apps/jsonforms-react-shadcn-demo',
    'packages/jsonforms-react-shadcn-webcomponent',
  ]) {
    it.each(primitives)(`${host} owns the %s source`, (name) => {
      expect(
        readFileSync(
          resolve(root, host, `src/components/ui/${name}.tsx`),
          'utf8'
        )
      ).toContain('export');
    });
  }
  for (const name of ['renderers', 'extended-renderers']) {
    const project = `packages/jsonforms-react-shadcn-${name}`;
    it(`${name} has no UI runtime dependencies`, () => {
      const pkg = JSON.parse(
        readFileSync(resolve(root, project, 'package.json'), 'utf8')
      );
      expect(
        Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }).filter(
          (key) =>
            /^(antd|@base-ui\/|@radix-ui\/|shadcn|react-day-picker|class-variance-authority|tailwind-merge)/.test(
              key
            )
        )
      ).toEqual([]);
    });
    it(`${name} does not ship primitive implementations`, () => {
      const files = sourceFiles(resolve(root, project, 'src'));
      expect(files.some((file) => file.includes('/components/ui/'))).toBe(
        false
      );
      for (const file of files) {
        expect(readFileSync(file, 'utf8')).not.toMatch(
          /from ['"](?:antd|@base-ui\/|@radix-ui\/|react-day-picker)/
        );
      }
    });
    it(`${name} preserves application imports in the published bundle`, async () => {
      const result: any = await build({
        configFile: resolve(root, project, 'vite.config.mjs'),
        build: { write: false, minify: false },
        logLevel: 'silent',
      });
      const chunks = (Array.isArray(result) ? result : [result])
        .flatMap((output) => output.output)
        .filter((chunk: any) => chunk.type === 'chunk');
      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.code).toContain('@jsonforms-react-shadcn-ui/');
        expect(chunk.code).not.toContain('@radix-ui/');
      }
    }, 30000);
  }
});
