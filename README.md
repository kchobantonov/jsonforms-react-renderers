### Specification

See the [JSON Forms Extended Specification](https://github.com/kchobantonov/jsonforms-extended-spec)
for the shared renderer behavior, UI Schema options, and reference examples.

### First time setup

- Install [Node.js](https://nodejs.org/) 22.18 or newer within Node 22.
- Install [Vite+](https://viteplus.dev/guide/). It manages Node and the pinned pnpm version.
- Clone this repository
- Install dependencies: `vp install --frozen-lockfile`

### Build & Testing

The workspace uses Vite+ for builds, tests, linting and formatting. Library
output formats and browser targets are preserved. See the
[toolchain guide](docs/toolchain-upgrade.md) for migration details.

- Build (all packages): `vp run build`
- Build renderer packages: `vp run build:libs`
- Check formatting and lint: `vp check`
- Format: `vp fmt .`
- Test (all packages): `vp run test`
- Clean generated package output: `vp run clean`
- Run React Ant Design examples: `vp run example:antd:dev`
- Run React PrimeReact examples: `vp run example:primereact:dev`
- Run React Shadcn UI examples: `vp run example:shadcn:dev`
- Build examples app: `vp run examples-app:build`
- Run the examples selector: `vp run examples-app:dev`

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
- `packages/jsonforms-react-extended-renderers` - shared extended renderers.
- `packages/jsonforms-react-demo-common` - shared React demo state, editor plumbing, UI adapter contracts, and examples; each renderer demo supplies its own UI-library shell and controls.
- `apps/jsonforms-react-antd-demo` - Ant Design demo app.
- `apps/jsonforms-react-primereact-demo` - PrimeReact demo app.
- `apps/jsonforms-react-shadcn-demo` - Shadcn UI demo app.
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
    {
      "type": "ImageView",
      "options": { "src": "/image.png", "alt": "Description" }
    }
  ]
}
```

`Spacer` uses a height in pixels (default 32, negative values clamped to zero).
`ImageView` preserves aspect ratio, fits its container, and omits images without a
nonempty string source. `Separator` renders a horizontal rule. The shared demo
includes **Spec: Presentation elements**, with image banners, default and custom
spacers, separators, links and visibility rules. Open `#spec-presentation`.

The default catalog contains spec examples and original JSON Forms examples.
See [Demo examples](docs/demo-examples.md) for the coverage map and instructions
for adding host examples or native spec tabs.

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

Select **Spec: Split layout** (or open `#spec-split-layout`) in any React demo for the
same horizontal and vertical split-pane example as Svelte. Set
`options.variant` to `"splitter"` on a HorizontalLayout or VerticalLayout.
Vertical splits accept `height` and `minHeight` as CSS lengths or pixel numbers.
Ant Design and PrimeReact use their native splitters; Shadcn uses the
shared draggable splitter with arrow-key resizing. Resizing preserves form data
and does not change `options.columns`.

### Collapsible groups

Groups in Ant Design, PrimeReact, and Shadcn support
Svelte's `options.collapsible`, `options.collapsed`, and
`options.showDataIndicator` (all opt-in with `true`). Collapsed content stays
mounted, preserving edits. The accessible data indicator checks bound descendant
controls, including hidden controls and nested paths; `false` and `0` count as
data, while blank strings and empty containers do not. Form configuration can
provide defaults, overridden by UI Schema options. Try **Collapsible Groups** in
the example menu.

### Implementation specification

See [Renderer Set and Demo Application Specification](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/renderer-and-demo.md)
for the required demo layout, settings, renderer behavior, Web Component
parity, project structure, and acceptance checklist for new UI-library
renderer sets.

### Extended control availability

| Renderer                                                   | Ant Design     | PrimeReact     | Shadcn |
| ---------------------------------------------------------- | -------------- | -------------- | ------ |
| Button actions                                             | Yes            | Yes            | Yes    |
| Color, Duration, Null                                      | Yes            | Yes            | Yes    |
| File                                                       | Yes (base set) | Yes (base set) | Yes    |
| Monaco editor                                              | Yes            | Yes            | Yes    |
| AG Grid arrays                                             | Yes            | Yes            | Yes    |
| Spacer, ImageView, Separator, Template, Slot, Split Layout | Yes            | Yes            | Yes    |

The shared demos include **Color**, **Duration**, **Null**, **Monaco Editor**, and
**AG Grid**. Use string schema `format: "color"` or `format: "duration"`, or
schema `type: "null"` for those controls. PrimeReact also accepts the color
and duration format in UI schema `options.format`.

Duration pickers support weeks or year/month/day/time components, `showActions`
(default `true`), `okLabel`, `cancelLabel`, `placeholder`, and `focus`. With
`showActions: false`, component edits apply immediately. Weeks cannot be combined
with the other components. PrimeReact also exposes `clearable` (default
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

### React shadcn/ui component ownership

The shadcn renderer packages use components owned by the consuming application.
They do not bundle generated shadcn UI source. Configure the component import
alias, install all required components, and provide the theme/styles using the
[shadcn setup guide](packages/jsonforms-react-shadcn-renderers/README.md).
The demo and Web Component each include their own generated component sources.

## Releasing packages

Releases use the same Changesets workflow as `jsonforms-svelte`:

1. Run `pnpm changeset`, select the public packages and bump type, and commit the
   generated file under `.changeset/`.
2. Merge it into `master`. The `Release Packages` workflow opens or updates a
   `task: release` PR containing versions, dependency updates, and changelogs.
3. Merge that PR. The workflow validates the release tarballs, publishes to npm,
   pushes tags, and creates GitHub Releases.

Creating a release manually in GitHub does not trigger npm publishing. Demos and
`jsonforms-react-demo-common` stay private. Package versions are independent.

### Repository setup

Use the Node version in `.node-version` and Vite+ 1.3.0; the workspace pins pnpm 10.28.2.
The repository needs an `NPM_TOKEN` Actions secret with permission to publish
under `@chobantonov`. Enable GitHub Actions to create pull requests and grant the
workflow's `GITHUB_TOKEN` contents and pull-request write permissions. Release
PRs should pass the normal branch protection checks.

### Validate before release

```sh
pnpm test:release
pnpm release:pack /tmp/jsonforms-react-release-packs
pnpm exec playwright install chromium
pnpm test:packed /tmp/jsonforms-react-release-packs
```

Packing builds every public library, rehearses pending Changesets versions in
temporary copies, and validates the actual npm contents with publint. Tarballs
and `overrides.json` are written to the chosen directory. The checkout's
versions are unchanged. See [.changeset/README.md](.changeset/README.md).

## Local specification dependency

Clone `jsonforms-extended-spec` beside this repository before running `vp install`. The demo and fixture tests temporarily use `link:../../../jsonforms-extended-spec` until that package is released. Specification text, schemas, examples, and TypeScript authoring helpers are maintained there. The demo automatically registers the spec package catalog with `spec-` IDs and `Spec: ` labels. Native React template and action demonstrations remain optional enhancements here.

TypeScript consumers should import `forSchema`, `DataOf`, and `CssLength` from `@chobantonov/jsonforms-extended-spec/typescript`; the React extended renderer package no longer exports these portable helpers. Build that package with `pnpm --dir ../jsonforms-extended-spec build` when using its authoring API locally.

For a fresh checkout, prepare the sibling package before the React build:

```sh
pnpm --dir ../jsonforms-extended-spec install
pnpm --dir ../jsonforms-extended-spec build
vp install
vp run build
```

New spec examples only need a catalog entry in the spec project. Run its build (or `pnpm generate:examples` there) to refresh the linked example module; no React registration file needs editing. The maintained [renderer and demo guide](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/renderer-and-demo.md) defines the shared design.
