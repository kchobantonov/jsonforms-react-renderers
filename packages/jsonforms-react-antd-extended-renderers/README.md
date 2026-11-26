# React Ant Design extended renderers

This package adds Ant Design implementations of the optional extended JSON
Forms controls and layouts. Use it with the
[base Ant Design renderer set](../jsonforms-react-antd-renderers/README.md)
and `@jsonforms/core` and `@jsonforms/react`.

```tsx
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  ExtendedJsonForms,
  antdExtendedCells,
  antdExtendedRenderers,
} from '@chobantonov/jsonforms-react-antd-extended-renderers';

<ExtendedJsonForms
  schema={schema}
  uischema={uischema}
  data={data}
  renderers={[...antdRenderers, ...antdExtendedRenderers]}
  cells={[...antdCells, ...antdExtendedCells]}
  onChange={({ data }) => setData(data)}
/>;
```

The extended registry includes Ant Design button actions, color, cron,
duration, mask and null controls, Monaco and AG Grid editors, split layouts,
markup labels, and shared presentation and template renderers. Add the
extended cells for color, cron, duration, mask and null editing in tables and
grids. Monaco opens in a larger editor rather than an inline cell.

Use `createAntdExtendedRenderers({ components })` to supply host components
for templates. `ExtendedJsonForms` is re-exported from the
[shared extended package](../jsonforms-react-extended-renderers/README.md).
See the [React feature guide](../../docs/renderer-features.md) for supported
behavior and the [dynamic UI guide](../../docs/dynamic-ui.md) for experimental
`$dynamic` overlays.
