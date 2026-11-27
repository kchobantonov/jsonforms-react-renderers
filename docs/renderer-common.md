# Shared renderer behavior and UI ownership

The common package is `packages/jsonforms-react-renderer-common`. It sits below
both the base renderer families and `jsonforms-react-extended-renderers`.
Dependencies flow toward common; common imports neither renderer families nor
extended renderers. Demo application state stays in `jsonforms-react-demo-common`.

## Specification ownership

The portable contracts, schemas, examples, and TypeScript authoring helpers are
owned by the installed `@chobantonov/jsonforms-extended-spec@0.2.0` package.
The [renderer/demo guide](https://github.com/kchobantonov/jsonforms-extended-spec/blob/v0.2.0/docs/renderer-and-demo.md) defines the shared presentation and host requirements. This document describes how the React packages implement those contracts.

| Contract                                        | Common implementation                                                                                                                        | Family-owned implementation                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Configuration namespaces and precedence         | `configNamespaces`                                                                                                                           | Component prop mapping                                                        |
| Layout participation, sizing, visibility (§6–7) | `layoutSizing`, `layoutContext`                                                                                                              | Layout components, splitter interaction, spacing defaults                     |
| Group/category state and indicators (§8)        | `groupState`, `categoryState`, `validationIndicator`                                                                                         | Cards, tabs, badges, tooltips, focus behavior                                 |
| Renderer messages (§9)                          | `i18nDefaults`, `rendererLocale`, `translate`, locale catalogs                                                                               | UI-library locale loading and component text integration                      |
| Destructive changes (§14)                       | `confirmation` decides whether to prompt                                                                                                     | Dialog rendering and committing the approved action                           |
| Error visibility and constraints (§15)          | `preTouchErrors`, temporal bound calculation                                                                                                 | Error presentation and disabled widget callbacks                              |
| Queued edits (§18.4)                            | `useDebouncedChange`, `pendingChanges`                                                                                                       | Input events and detail dialog Apply/Cancel controls                          |
| Choices, tuples and schema composition (§18)    | `arrayChoices`, `tuple/tupleSchema`, `combinators`, `scalarComposition`, `mixed/mixedSchema`                                                 | Selectors, array controls and renderer registries                             |
| Dynamic properties and mixed data (§18)         | `additionalProperties`, `additionalPropertyName`, `literalPropertySchema`, `dynamicProperties`, `mixedTree`                                  | Property editors, tree widgets and navigation                                 |
| Composite cells (§18.13–14)                     | `cellMode`, `compositeActions`, `compositeSummary`, `uiSchemaCycle`                                                                          | Cell frames, validation tooltips and detail dialogs                           |
| Value conversion (§18)                          | `numeric`, `formats/dateValues`, `temporalFormats`, `temporalBounds`, `colorFormat`, `maskFormat`, `maskControls`, legacy `duration` helpers | Picker format mapping, picker events, upload controls and widget presentation |
| Editor detail selection                         | `core/detailUiSchema`, `rowDetail`                                                                                                           | Native dialogs and detail dispatch                                            |
| Conditional object fields                       | `conditionalFields`                                                                                                                          | Object renderer opt-in, layout and diagnostics                                |
| Recursive node trees                            | `RecursiveTreeRenderer`, `recursiveTree`                                                                                                     | Native tree rows, actions and selected-node presentation                      |
| Container error summaries                       | `errorSummary`, `validationIndicator`                                                                                                        | Icons, tooltips and inline feedback                                           |
| Small React/web utilities                       | `useFocus`, `useClearAffordance`, `visuallyHidden`                                                                                           | Actual buttons, icons and focus targets                                       |

The schema files under `@chobantonov/jsonforms-extended-spec/schemas/` define the public configuration and UI
schema vocabulary. Extraction preserves those names and shapes; it does not add
new options or require schema migrations. The container-validation specification
maps to shared error aggregation and family-owned indicator rendering.

Expression evaluation, actions, templates, URL policy,
additional-error ownership, the richer duration model, Monaco and AG Grid are
implemented in the optional extended package. Its `useCronPicker` hook also
shares cron draft and commit behavior between the two toolkit pickers. Demo state,
example registration adapters, and demo layout requirements remain in the demo layer. Portable example catalogs are imported from the spec package.

## Source and test layout

The common package shares composite cell draft handling, confirmation state,
tuple editing, mixed-value navigation, and mask editing. Both web component
hosts share observed attributes, property setters, input parsing, and
translation fallback. Each host supplies its own renderer registry and theme.

Both families use the shared group-state hook. The shared layout helpers
default to a 16px gap in both directions and honor an explicit zero. Ant Design
suppresses the native outer field margins within layouts so they do not add
to the gap. Picker event handling and widget-specific bounds callbacks stay
with the family adapters.

Choose a common module by the behavior it owns. For example,
`collections/useTableSelection` owns table selection, `mixed/useMixedRenderer`
owns mixed-value behavior, and `webcomponent/input` handles shared host input.
`composition/` groups JSON Schema combinator behavior. English and Bulgarian
messages live under `locale/`, which exports `enRendererLocale`,
`bgRendererLocale`, and the English default alias `i18nDefaults`.

In the family extended packages, `src/renderers/` holds the JSON Forms
renderers and `src/components/` holds supporting UI such as editor buttons and
frames. Ant Design keeps `useAntdEditorTheme` under `src/hooks/` and its
`asCell` adapter under `src/cells/`. The base packages group controls, cells,
layouts and complex renderers with their feature-specific supporting code.
The private demo package keeps shell components and editor state in `src/app/`,
translation catalogs in `src/locale/`, and example registration in `src/examples/`.

Place a module’s tests in the matching feature folder under the package’s
`test/` directory. For example, common’s `src/formats/duration.ts` has
`test/formats/duration.test.ts`. Use `test/integration/` for scenarios spanning
features, `test/support/` for reusable fixtures and helpers, and the package’s
existing test setup for environment shims. Each web component’s element and
its test are at the roots of `src/` and `test/`, respectively.

## Package imports

Consumers can import shared behavior through the common package’s feature
subpaths. For example, replace the former flat `/useMixedRenderer` subpath
with `/mixed/useMixedRenderer`. Family-specific code imports its widgets
locally. Ant Design’s public duration helpers come directly from
`@chobantonov/jsonforms-react-renderer-common/formats/duration`. The shadcn
extended package also handles ISO week durations such as `P2W`.

See the [common package README](../packages/jsonforms-react-renderer-common/README.md)
for import examples and the [development checks](linting-and-formatting.md)
for focused test commands.
