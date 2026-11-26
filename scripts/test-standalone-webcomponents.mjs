import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const styles = ['antd', 'shadcn'];
const schema = {
  type: 'object',
  properties: { name: { type: 'string' } },
};
const uischema = { type: 'Control', scope: '#/properties/name' };

const serve = async (style) => {
  const directory = path.join(
    root,
    'packages',
    `jsonforms-react-${style}-webcomponent`,
    'dist',
    'standalone',
  );
  const tag = `jsonforms-react-${style}`;
  const html = `<!doctype html><html><body><${tag} id="form"></${tag}>
    <script type="module" src="./index.js"></script>
    <script type="module">
      await customElements.whenDefined('${tag}');
      const form = document.querySelector('#form');
      form.schema = ${JSON.stringify(schema)};
      form.uischema = ${JSON.stringify(uischema)};
      form.data = { name: 'Ada' };
      form.addEventListener('change', (event) => {
        window.lastChange = event.detail.data;
      });
    </script></body></html>`;
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') {
      response.setHeader('content-type', 'text/html');
      response.end(html);
      return;
    }
    const file = path.resolve(directory, `.${decodeURIComponent(pathname)}`);
    if (!file.startsWith(`${directory}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const data = await readFile(file);
      response.setHeader(
        'content-type',
        /\.(?:m?js)$/.test(file)
          ? 'text/javascript'
          : 'application/octet-stream',
      );
      response.end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, tag };
};

const browser = await chromium.launch({ headless: true });
try {
  for (const style of styles) {
    const { server, tag } = await serve(style);
    try {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const input = page.locator(tag).locator('input');
      await input.waitFor();
      assert.equal(await input.inputValue(), 'Ada');
      await input.fill('Grace');
      await page.waitForFunction(() => window.lastChange?.name === 'Grace');
      assert.deepEqual(pageErrors, []);
      await page.close();
      console.log(`${tag}: standalone render and change event passed`);
    } finally {
      server.close();
    }
  }
} finally {
  await browser.close();
}
