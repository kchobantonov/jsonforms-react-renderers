# JSON Forms React shadcn/ui renderers

This renderer set uses application-owned **React shadcn/ui components**. It does
not bundle generated UI components or depend on shadcn, Ant Design, or Radix UI
at runtime. The consuming application must define **every component used by the
renderer registry**, install their dependencies, and supply their CSS. This is
the same ownership model as the Svelte shadcn renderer.

## Install and configure

Initialize [shadcn/ui](https://ui.shadcn.com/docs/installation) in your application.
Use the Radix-based component APIs and install these components:

```sh
pnpm dlx shadcn@latest add alert avatar item button calendar card checkbox collapsible dialog input popover resizable select tabs textarea tooltip switch radio-group slider
pnpm add @chobantonov/jsonforms-react-shadcn-renderers @jsonforms/core @jsonforms/react
```

Commit the generated component files. Customize and update them in your app.
The renderer imports named exports from a stable prefix, for example
`@jsonforms-react-shadcn-ui/input` exports `Input`. It does not provide fallbacks.
Missing components produce a module resolution error at build time.

Map that prefix to your generated components in Vite:

```ts
import { fileURLToPath, URL } from 'node:url';

export default {
  resolve: {
    alias: {
      '@jsonforms-react-shadcn-ui': fileURLToPath(
        new URL('./src/components/ui', import.meta.url)
      ),
    },
  },
  ssr: {
    noExternal: [
      '@chobantonov/jsonforms-react-shadcn-renderers',
      '@chobantonov/jsonforms-react-shadcn-extended-renderers',
    ],
  },
};
```

Merge the equivalent mapping into your TypeScript configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@jsonforms-react-shadcn-ui/*": ["./src/components/ui/*"]
    }
  }
}
```

The alias must resolve subpaths. Keep your app's usual `@/` alias for imports
inside generated components. CommonJS consumers also need a bundler or resolver
that maps the prefix; unconfigured direct Node `require` is not supported.

## Usage

```tsx
import { JsonForms } from '@jsonforms/react';
import {
  shadcnRenderers,
  shadcnCells,
} from '@chobantonov/jsonforms-react-shadcn-renderers';

<JsonForms
  schema={schema}
  uischema={uischema}
  data={data}
  renderers={shadcnRenderers}
  cells={shadcnCells}
  onChange={({ data }) => setData(data)}
/>;
```

Import UI components directly from your app, never from the renderer package:

```tsx
import { Button } from './components/ui/button';
```

The optional extended renderer package uses the same alias and app components.
It does not supply a second UI library. Add its `createShadcnExtendedRenderers()`
registry to the base registry.

## Styling and hosts

Configure shadcn's semantic theme tokens, dark mode, and Tailwind in the host.
Scan the renderer and extended renderer `src/**/*.{ts,tsx}` files in addition to
your generated components. Include the renderer's `src/styles.css` for its form
layout classes. The demo contains a complete Tailwind 3 configuration; adapt
source scanning to your Tailwind version.

The demo and Web Component projects each own their generated components and
runtime dependencies. A React app supplies the alias when bundling the renderer.
The Web Component build resolves the alias against its own component directory.
Keep shadow-root styles in the Web Component build.

## Development and verification

`pnpm test:shadcn` runs the renderer and shared behavioral tests.
`pnpm build:shadcn` checks declarations and builds the demo and its dependencies.
The ownership tests check host component inventories, runtime dependencies,
source imports, and the external component imports in library bundles. Control
contract tests exercise the real demo-owned components, including edits, clears,
readonly state, validation feedback, and JSON value types.

`test/ui-types` contains build-only declaration fixtures for the app component
API. These are not shipped as a component implementation. When changing a
component API, update both host components and these fixtures.

## Parity status

The ownership migration covers the base renderer, extended renderer, demo, and
Web Component projects. Behavioral tests cover primitives, editable cells,
combinators, array action restrictions and confirmation, layout sizing, and host
updates. This is not yet complete Ant Design feature parity. Remaining work
includes advanced table options, list array variants and tuple controls, the complete temporal display/save-format contract,
and the full localization and validation-indicator contracts. The repository
specification remains the acceptance target for those features.

### Table and AG Grid composite columns

Pass `shadcnCells` alongside the renderer registry. Object and array cells show
compact summaries and open host-owned shadcn dialogs. Edits and Clear stay in a
draft until Apply; Cancel discards the draft. Readonly forms allow inspection.
If the underlying value changes while a dialog is open, Apply is disabled.

Use `options.table: true` for a table, or `options.variant: "ag-grid"` with
the extended renderers. Configure summaries and detail layouts with
`options.cells.<property>.summary` and `detail`.
The shared **Array controls → Scalar and composite cells** spec example shows
both presentations using the same data, including object and array columns.

### Categorization variants

Set `options.variant` to `accordion` or `stepper`; the default is tabs.
All three honor category visibility rules, translated labels and
`options.initial` (a category name). Accordion panels remain mounted when
closed, with at most one open and an optional all-closed state. Stepper supports
`showNavButtons` and `vertical`. Navigation remains available in readonly forms.
No extra UI aliases are required: these presentations use the app's Button and
Tabs components.

Collapsible groups use the app-owned `collapsible` module (`Collapsible`,
`CollapsibleTrigger`, `CollapsibleContent`) with the [shadcn Base UI API](https://ui.shadcn.com/docs/components/base/collapsible).
Supply support for `render` composition and `keepMounted` content so collapsing preserves field state.
The consuming app installs Base UI; the renderer has no Base UI runtime dependency.

List-with-detail arrays use the app-owned `item` and `avatar` modules. Each list row includes selection and delete actions; `hideAvatar` hides its numbered avatar.

Array toolbar actions use the Button `icon-sm` size (28px); include this variant in the host-owned Button component.
