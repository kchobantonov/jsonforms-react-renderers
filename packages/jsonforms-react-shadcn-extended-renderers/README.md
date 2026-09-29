# React shadcn extended renderers

Optional renderers for actions, files, colors, cron, duration, editors, grids, and
split layouts. Combine `createShadcnExtendedRenderers()` with `shadcnRenderers`.

This package does not ship or depend on generated shadcn/ui components. The
consuming app must supply the components and the `@jsonforms-react-shadcn-ui/*`
alias described in the [base renderer setup](../jsonforms-react-shadcn-renderers/README.md).
Import customized UI components from the app, not from either renderer package.

## Cron schedules

Use `format: "cron"` on a string schema or `options.format: "cron"` on its
Control UI schema. The control edits six-field cron expressions and offers a
schedule picker. Apply commits the draft; Cancel discards it. Set
`options.showActions: false` for immediate picker updates. Advanced syntax stays
editable as text, and opening and applying an unchanged value does not rewrite it.
The app supplies `button`, `input`, `checkbox`, `popover`, and `select` components.

## Specialized table and grid cells

Pass `cells={[...shadcnExtendedCells, ...shadcnCells]}` to JSON Forms.
The base cells include date, time and date-time pickers; the extended cells add
color, duration, cron and null controls. Both tables and AG Grid use these
registries. The demo and web component register both sets automatically.
