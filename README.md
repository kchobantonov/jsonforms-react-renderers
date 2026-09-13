### First time setup

- Install [node.js](https://nodejs.org/) (only Node v18.19+ < 19 is currently supported)
- Install pnpm: <https://pnpm.io/installation> (use pnpm 8.6.2+)
- Clone this repository
- Install dependencies: `pnpm i --frozen-lockfile`

### Build & Testing

- Build (all packages): `pnpm run build`
- Build renderer packages: `pnpm run build:libs`
- Test (all packages): `pnpm run test`
- Clean generated package output: `pnpm run clean`
- Run React Ant Design examples: `pnpm run example:antd:dev`
- Run React PrimeReact examples: `pnpm run example:primereact:dev`
- Run React Shadcn UI examples: `pnpm run example:shadcn:dev`
- Run React MUI examples: `pnpm run example:mui:dev`
- Build examples app: `pnpm run examples-app:build`
- Run the examples selector: `pnpm run examples-app:dev`

### Workspace

- `packages/jsonforms-react-antd-renderers` - Ant Design renderer set.
- `packages/jsonforms-react-antd-extended-renderers` - optional advanced Ant Design renderers.
- `packages/jsonforms-react-antd-webcomponent` - Ant Design custom element.
- `packages/jsonforms-react-primereact-renderers` - PrimeReact renderer set.
- `packages/jsonforms-react-primereact-extended-renderers` - optional advanced PrimeReact renderers.
- `packages/jsonforms-react-primereact-webcomponent` - PrimeReact custom element.
- `packages/jsonforms-react-shadcn-renderers` - Shadcn UI renderer set.
- `packages/jsonforms-react-shadcn-extended-renderers` - optional advanced Shadcn UI renderers.
- `packages/jsonforms-react-shadcn-webcomponent` - Shadcn UI custom element.
- `packages/jsonforms-react-mui-extended-renderers` - optional advanced MUI renderers layered on top of `@jsonforms/material-renderers`.
- `packages/jsonforms-react-mui-webcomponent` - MUI custom element backed by `@jsonforms/material-renderers`.
- `packages/jsonforms-react-extended-renderers` - shared extended renderers.
- `packages/jsonforms-react-demo-common` - shared React demo state, editor plumbing, UI adapter contracts, and examples; each renderer demo supplies its own UI-library shell and controls.
- `apps/jsonforms-react-antd-demo` - Ant Design demo app.
- `apps/jsonforms-react-primereact-demo` - PrimeReact demo app.
- `apps/jsonforms-react-shadcn-demo` - Shadcn UI demo app.
- `apps/jsonforms-react-mui-demo` - MUI demo app.
- `apps/jsonforms-react-examples-app` - aggregated React examples app.

### Presentation renderers

All four extended React renderer sets include the shared Svelte-compatible
presentation elements. They honor JSON Forms visibility rules and accept defaults
from the form configuration, with UI Schema options taking precedence.

```json
{
  "type": "VerticalLayout",
  "elements": [
    { "type": "Spacer", "options": { "height": 32 } },
    { "type": "Separator" },
    { "type": "ImageView", "options": { "src": "/image.png", "alt": "Description" } }
  ]
}
```

`Spacer` uses a height in pixels (default 32, negative values clamped to zero).
`ImageView` preserves aspect ratio, fits its container, and omits images without a
nonempty string source. `Separator` renders a horizontal rule. The shared demo
includes **Presentation Renderers**, matching Svelte's image banner, default and
custom spacers, separators, and input fields. Search for **Presentation** in the
example menu or open `#presentation-renderers` in any demo.
There are also individual **Spacer**, **ImageView**, and **Separator** examples, plus
the combined **Spacer, ImageView and Separator** example.

### Horizontal layout columns

All four extended React sets support Svelte's 16-column allocation on each
direct child of a `HorizontalLayout`:

- `options.columns`: an integer from 2 through 16 reserves that fraction of the row.
- Omitted, `null`, or `"auto"`: shares the row's remaining space equally.
- Invalid values fall back to Auto and expose a `data-columns-diagnostic` attribute.

For example, children with columns `4, "auto", "auto"` receive `4, 6, 6`.
Fixed-only rows leave unused space; `12, 8, "auto"` forms rows `12` and `8, 8`.
All-Auto layouts stay in one equally divided row. A `1rem` gap is included in
the width calculation. Hidden children release their space; disabled children
keep it. Columns apply to controls, presentation elements, and nested layouts,
and do not affect vertical or split layouts.

Select **Horizontal Layout Sizing** in any demo to explore the Svelte examples.

### Split layouts

Select **Split Layout** (or open `#split-layout`) in any React demo for the
same horizontal and vertical split-pane example as Svelte. Set
`options.variant` to `"splitter"` on a HorizontalLayout or VerticalLayout.
Vertical splits accept `height` and `minHeight` as CSS lengths or pixel numbers.
Ant Design and PrimeReact use their native splitters; Shadcn and MUI use the
shared draggable splitter with arrow-key resizing. Resizing preserves form data
and does not change `options.columns`.

### Collapsible groups

Groups in Ant Design, PrimeReact, Shadcn, and the MUI extended set support
Svelte's `options.collapsible`, `options.collapsed`, and
`options.showDataIndicator` (all opt-in with `true`). Collapsed content stays
mounted, preserving edits. The accessible data indicator checks bound descendant
controls, including hidden controls and nested paths; `false` and `0` count as
data, while blank strings and empty containers do not. Form configuration can
provide defaults, overridden by UI Schema options. Try **Collapsible Groups** in
the example menu.

### Implementation specification

See [Renderer Set and Demo Application Specification](docs/renderer-set-and-demo-specification.md)
for the required demo layout, settings, renderer behavior, Web Component
parity, project structure, and acceptance checklist for new UI-library
renderer sets.


### MUI file controls

The MUI extended registry (including the MUI web component) supports string schemas
with `contentEncoding: "base64"`, `format: "binary"`, or `format: "byte"`.
The **File** demo exercises all three encodings:

- `format: "uri"` with base64 encoding stores the complete data URI.
- `format: "binary"` stores a data URI with a percent-encoded `filename` parameter.
- Other base64/byte strings store only the base64 payload.

`contentMediaType` supplies the file chooser's MIME filter; `options.accept` is the
fallback. `formatMinimum`, `formatMaximum`, `formatExclusiveMinimum`, and
`formatExclusiveMaximum` accept nonnegative numbers or numeric strings, in bytes.
Schema limits take precedence over UI options; UI options override form config.
Invalid selections leave the current value intact. Reading shows a cancellable
MUI progress dialog and does not upload files to a server.

The renderer honors visibility, read-only/disabled state, `clearable`, `focus`,
`placeholder`, descriptions, and validation errors. File messages use the same
translation keys as the Svelte implementation. Clearing dynamic properties keeps
their key; canceling the chooser or an in-progress read preserves existing data.

### MUI password controls

The MUI extended registry renders string fields with schema `format: "password"`
or UI schema `options.format: "password"` as masked inputs with show/hide and clear
buttons. It supports `clearable`, `placeholder`, `focus`, `restrict` (schema
`maxLength`), `trim`, and `autoComplete` (defaults to `current-password`), along
with standard JSON Forms labels, descriptions, validation, and read-only rules.

### Extended control availability

| Renderer | MUI | Ant Design | PrimeReact | Shadcn |
| --- | --- | --- | --- | --- |
| Button actions | Yes | Yes | Yes | Yes |
| Color, Duration, Null | Yes | Yes | Yes | Yes |
| File | Yes | Yes (base set) | Yes (base set) | Yes |
| Monaco editor | Yes | Yes | Yes | Yes |
| AG Grid arrays | Yes | Yes | Yes | Yes |
| Spacer, ImageView, Separator, Template, Slot, Split Layout | Yes | Yes | Yes | Yes |

The shared demos include **Color**, **Duration**, **Null**, **Monaco Editor**, and
**AG Grid**. Use string schema `format: "color"` or `format: "duration"`, or
schema `type: "null"` for those controls. MUI and PrimeReact also accept the color
and duration format in UI schema `options.format`. MUI composes its color field
from a TextField and browser color input; it does not require a third-party MUI
color picker.

Duration pickers support weeks or year/month/day/time components, `showActions`
(default `true`), `okLabel`, `cancelLabel`, `placeholder`, and `focus`. With
`showActions: false`, component edits apply immediately. Weeks cannot be combined
with the other components. MUI and PrimeReact also expose `clearable` (default
`true`). Null controls distinguish explicit `null` from an absent value.

Monaco is selected with `options: { format: "code", language: "javascript" }`.
Use `language: "json", convertJson: true` to edit JSON values; incomplete JSON
remains in the editor without replacing the last valid form value. `:language`
reads a language from a root-data path. `monaco.rows`, `monaco.autoGrow`,
`monaco.minRows`, `monaco.maxRows`, `monaco.options`, and `monaco.initActions`
configure the editor. Maximize/restore and Escape are supported. The integration
uses `@monaco-editor/react`'s loader; applications can configure that loader for
self-hosted Monaco assets as usual.

AG Grid is selected with `options: { variant: "ag-grid", height: 400 }` on an
array control. It supports object and primitive rows, native cell editing,
selection, sorting, filtering, adding and removing rows, and read-only mode.
Schema `minItems`/`maxItems` restrict removal/addition unless `restrict: false`.
The React implementation uses AG Grid Community; it does not claim parity with
Svelte's advanced grid-specific features or enterprise options.
