# React renderer features

The installed `@chobantonov/jsonforms-extended-spec@0.2.0` package defines
shared behavior and UI Schema options. Its
[renderer and demo guide](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/renderer-and-demo.md)
defines host and demo requirements. This page records React-specific use and
limits for the Ant Design and shadcn sets. See the [documentation guide](README.md)
for verification and open work.

## Layout and presentation

Both extended sets support `Spacer`, `Separator`, and `ImageView`. `Spacer` has
a 32 px default height, `Separator` renders a horizontal rule, and `ImageView`
preserves aspect ratio. The demos include **Spec: Presentation elements**.

For direct `HorizontalLayout` children, `options.columns` accepts an integer
from 2 to 16. Omitted, `null`, or `"auto"` shares remaining space equally.
For example, `4, "auto", "auto"` gives widths `4, 6, 6`. Hidden children
release their space; disabled children retain it. Try **Horizontal Layout
Sizing** in either demo.

Set `options.variant: "splitter"` on a `HorizontalLayout` or `VerticalLayout`
for resizable panes. Vertical splits accept `height` and `minHeight`. Ant
Design uses its native splitter; shadcn uses a draggable splitter with keyboard
resizing. The spec's **Split layout** example demonstrates both.

Groups support `options.collapsible`, `options.collapsed`, and
`options.showDataIndicator`. All are opt-in. Collapsed content remains mounted.
The indicator includes bound descendants and counts `false` and `0` as data.
Try **Collapsible Groups** in the demos.

## Extended controls

Both families have button actions, Color, Duration, Null, Monaco, AG Grid,
templates, and presentation renderers. File controls are in the Ant Design
base set and the shadcn extended set. The demo catalog provides focused spec
examples; see [demo examples](demo-examples.md).

Use string schema `format: "color"` or `format: "duration"`, or schema
`type: "null"` for those controls. Duration supports week or
year/month/day/time editing; weeks cannot be combined with the other parts.
Null controls distinguish explicit `null` from an absent value.

Select Monaco with `options: { format: "code", language: "javascript" }`.
With `language: "json", convertJson: true`, invalid drafts remain in the
editor without replacing the last valid value. `:language` reads a root-data
path. Applications may configure `@monaco-editor/react`'s loader to self-host
Monaco assets.

Select AG Grid with `options: { variant: "ag-grid", height: 400 }` on an
array control. It supports object and primitive rows, cell editing, selection,
sorting, filtering, add/remove actions, and read-only mode. `minItems` and
`maxItems` constrain those actions unless `restrict: false`. The React
implementation uses AG Grid Community; Enterprise behavior is unverified.

## Verification boundary

The feature descriptions above identify implemented React behavior. The
[demo example catalog](demo-examples.md) maps authored examples to the demos;
those mappings alone do not prove renderer acceptance. Use current package,
demo, and Web Component test output for a passing claim. The [open-work list](TODO.md)
records known gaps and checks still needed at its stated review date.

## shadcn component ownership

The shadcn renderer packages use components owned by the consuming app. They
do not bundle generated shadcn source. Follow the
[shadcn setup guide](../packages/jsonforms-react-shadcn-renderers/README.md)
for aliases, required components, and styles. The demo and Web Component each
carry their own generated components.
