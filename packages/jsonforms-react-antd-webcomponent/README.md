# React Ant Design Web Component

This package wraps the Ant Design base and extended JSON Forms renderer sets
in the `<jsonforms-react-antd>` custom element. Install the package and its
peer dependencies in a browser application, then register the element:

```ts
import {
  registerJsonFormsAntd,
  type JsonFormsAntdElement,
} from '@chobantonov/jsonforms-react-antd-webcomponent';

registerJsonFormsAntd();

const form = document.createElement(
  'jsonforms-react-antd',
) as JsonFormsAntdElement;
form.schema = { type: 'object', properties: { name: { type: 'string' } } };
form.uischema = {
  type: 'Control',
  scope: '#/properties/name',
};
form.data = { name: 'Ada' };
form.addEventListener('change', (event) => {
  console.log((event as CustomEvent).detail.data);
});
document.body.append(form);
```

The element accepts JSON values through properties such as `schema`,
`uischema`, `data`, `config`, and `external`. The same names can be supplied as
JSON string attributes. `external` provides host-owned dynamic values; enable
experimental overlays by assigning
`{ jsonformsExtended: { dynamic: { enabled: true } } }` to `form.config`.
The element emits `change` and `handle-action` events. See the
[dynamic UI guide](../../docs/dynamic-ui.md) for overlay behavior.

Run `pnpm run wc:antd:build` from the workspace root to build this package.
