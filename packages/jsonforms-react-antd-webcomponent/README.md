# React Ant Design Web Component

`<jsonforms-react-antd>` includes the Ant Design base and extended renderer
registries. Its browser distribution is `dist/standalone/`: a registration
module and supporting chunks that load directly in a plain HTML page.

## Plain HTML and self-hosting

Run `pnpm run wc:antd:build` from the workspace root. Copy the entire
`dist/standalone/` directory to your web server. Serve it over HTTP(S), then
load `index.js` as a module:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ant Design JSON Forms</title>
  </head>
  <body>
    <jsonforms-react-antd id="form"></jsonforms-react-antd>
    <pre id="result"></pre>
    <script type="module" src="./standalone/index.js"></script>
    <script type="module">
      await customElements.whenDefined('jsonforms-react-antd');
      const form = document.getElementById('form');
      form.addEventListener('change', (event) => {
        if (event instanceof CustomEvent) {
          document.getElementById('result').textContent = JSON.stringify(
            event.detail.data,
            null,
            2,
          );
        }
      });
      form.schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };
      form.uischema = { type: 'Control', scope: '#/properties/name' };
      form.data = { name: 'Ada' };
    </script>
  </body>
</html>
```

The module registers the custom element automatically. Keep its supporting
chunks beside `index.js`; the bundle loads them by relative URL when needed.

## npm CDN after publication

Once a version is published to npm, replace `VERSION` with that exact version
and use **one** of these script tags in place of the local `src` above:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@chobantonov/jsonforms-react-antd-webcomponent@VERSION/dist/standalone/index.js"
></script>
```

Or use UNPKG:

```html
<script
  type="module"
  src="https://unpkg.com/@chobantonov/jsonforms-react-antd-webcomponent@VERSION/dist/standalone/index.js"
></script>
```

Neither React Web Component package is currently on public npm, so those URLs
are templates, not live examples. The existing `dist/register.js` and
`dist/jsonforms-react-antd.js` are application-bundler modules with bare package
imports; they cannot be loaded directly from a plain HTML page through a file
CDN. [UNPKG](https://unpkg.com/) and [jsDelivr](https://www.jsdelivr.com/documentation)
serve published npm files by version and path.

## Application bundlers

In a TypeScript application, import `registerJsonFormsAntd` from
`@chobantonov/jsonforms-react-antd-webcomponent` and call it before creating
the element. The app's bundler resolves its React, Ant Design, and JSON Forms
peer dependencies. The element accepts `schema`, `uischema`, `data`, `config`,
and `external` as JavaScript properties or JSON string attributes. It emits
`change` and `handle-action` events. See the
[dynamic UI guide](../../docs/dynamic-ui.md) for overlay configuration.
