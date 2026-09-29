import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

// React custom elements have npm peers, unlike the standalone Svelte bundles.
// Install the tarballs into a fresh host so workspace links cannot hide missing
// files, unresolved dependencies, or invalid package entry points.
const artifacts = path.resolve(
  process.argv[2] ?? path.join(tmpdir(), 'jsonforms-react-release-packs')
);
const overrides = JSON.parse(
  readFileSync(path.join(artifacts, 'overrides.json'), 'utf8')
);
const workspace = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const styles = ['antd', 'mui', 'primereact', 'shadcn'];
const dependencies = {
  ...overrides,
  react: '18.3.1',
  'react-dom': '18.3.1',
  '@jsonforms/core': '3.9.0-alpha.1',
  '@jsonforms/react': '3.9.0-alpha.1',
};
for (const style of styles) {
  const name = `@chobantonov/jsonforms-react-${style}-webcomponent`;
  assert.ok(
    overrides[name]?.startsWith('file:'),
    `Missing packed artifact for ${name}`
  );
  dependencies[name] = overrides[name];
}
const staging = realpathSync(
  mkdtempSync(path.join(tmpdir(), 'jsonforms-react-packed-browser-'))
);
let browser;
let server;
try {
  writeFileSync(
    path.join(staging, 'package.json'),
    JSON.stringify(
      {
        name: 'jsonforms-react-packed-consumer',
        private: true,
        type: 'module',
        dependencies,
        pnpm: { overrides: { ...workspace.pnpm.overrides, ...overrides } },
      },
      null,
      2
    ) + '\n'
  );
  execFileSync(
    'pnpm',
    [
      'install',
      '--ignore-workspace',
      '--ignore-scripts',
      '--no-frozen-lockfile',
    ],
    { cwd: staging, stdio: 'inherit' }
  );
  writeFileSync(
    path.join(staging, 'index.html'),
    '<!doctype html><html><body><script type="module" src="/main.js"></script></body></html>'
  );
  const loaders = styles
    .map(
      (style) =>
        `${JSON.stringify(
          style
        )}: () => import('@chobantonov/jsonforms-react-${style}-webcomponent/dist/register.js')`
    )
    .join(',\n');
  writeFileSync(
    path.join(staging, 'main.js'),
    `
    const style = new URLSearchParams(location.search).get('style');
    await ({ ${loaders} })[style]();
    const form = document.createElement('jsonforms-react-' + style);
    form.schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
    form.uischema = { type: 'Control', scope: '#/properties/name' };
    form.data = { name: 'Ada' };
    form.mode = 'dark';
    form.addEventListener('change', (event) => {
      if (event instanceof CustomEvent) window.formChange = event.detail;
    });
    document.body.append(form);
  `
  );
  await build({
    configFile: false,
    root: staging,
    resolve: { dedupe: ['react', 'react-dom'] },
    build: { target: 'esnext', minify: false },
    logLevel: 'warn',
  });
  server = await preview({
    configFile: false,
    root: staging,
    preview: { host: '127.0.0.1', port: 0 },
  });
  const address = server.httpServer.address();
  browser = await chromium.launch();
  for (const style of styles) {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    try {
      await page.goto(`http://127.0.0.1:${address.port}/?style=${style}`);
      const input = page.getByRole('textbox');
      await input.waitFor();
      assert.equal(await input.inputValue(), 'Ada', `${style}: initial data`);
      await input.fill('Grace');
      await page.waitForFunction(
        () => window.formChange?.data?.name === 'Grace'
      );
      await page.evaluate((style) => {
        document.querySelector('jsonforms-react-' + style).readonly = true;
      }, style);
      await page.waitForFunction(
        (style) =>
          document
            .querySelector('jsonforms-react-' + style)
            .shadowRoot.querySelector('input')?.disabled === true,
        style
      );
      assert.deepEqual(errors, [], `${style}: browser runtime errors`);
      console.log(
        `Packed ${style}: render, edit, change event, readonly passed`
      );
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
  rmSync(staging, { recursive: true, force: true });
}
