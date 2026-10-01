# Shared renderer behavior and UI ownership

The common package is `packages/jsonforms-react-renderer-common`. It sits below
both the base renderer families and `jsonforms-react-extended-renderers`.
Dependencies flow toward common; common imports neither renderer families nor
extended renderers. Demo application state stays in `jsonforms-react-demo-common`.

## Specification ownership

The portable contracts, schemas, examples, and TypeScript authoring helpers are
owned by [jsonforms-extended-spec](https://github.com/kchobantonov/jsonforms-extended-spec).
The [renderer/demo guide](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/renderer-and-demo.md) defines the shared presentation and host requirements. This document describes how the React packages implement those contracts.

| Contract                                        | Common implementation                                                                                                            | Family-owned implementation                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Configuration namespaces and precedence         | `configNamespaces`                                                                                                               | Component prop mapping                                                        |
| Layout participation, sizing, visibility (§6–7) | `layoutSizing`, `layoutContext`                                                                                                  | Layout components, splitter interaction, spacing defaults                     |
| Group/category state and indicators (§8)        | `groupState`, `categoryState`, `validationIndicator`                                                                             | Cards, tabs, badges, tooltips, focus behavior                                 |
| Renderer messages (§9)                          | `i18nDefaults`, `rendererLocale`, `translate`, locale catalogs                                                                   | UI-library locale loading and component text integration                      |
| Destructive changes (§14)                       | `confirmation` decides whether to prompt                                                                                         | Dialog rendering and committing the approved action                           |
| Error visibility and constraints (§15)          | `preTouchErrors`, temporal bound calculation                                                                                     | Error presentation and disabled widget callbacks                              |
| Queued edits (§18.4)                            | `debounce`, `pendingChanges`                                                                                                     | Input events and detail dialog Apply/Cancel controls                          |
| Choices, tuples and schema composition (§18)    | `arrayChoices`, `tuple`, `combinators`, `scalarComposition`, `mixed`                                                             | Selectors, array controls and renderer registries                             |
| Dynamic properties and mixed data (§18)         | `additionalProperties`, `additionalPropertyName`, `literalPropertySchema`, `dynamicProperties`, `mixedTree`                      | Property editors, tree widgets and navigation                                 |
| Composite cells (§18.13–14)                     | `cellMode`, `compositeActions`, `compositeSummary`, `uiSchemaCycle`                                                              | Cell frames, validation tooltips and detail dialogs                           |
| Value conversion (§18)                          | `numeric`, `datejs`, `temporalFormats`, `temporalBounds`, `colorFormat`, `maskFormat`, `maskControls`, legacy `duration` helpers | Picker format mapping, picker events, upload controls and widget presentation |
| Small React/web utilities                       | `focus`, `clearAffordance`, `visuallyHidden`                                                                                     | Actual buttons, icons and focus targets                                       |

The schema files under `@chobantonov/jsonforms-extended-spec/schemas/` define the public configuration and UI
schema vocabulary. Extraction preserves those names and shapes; it does not add
new options or require schema migrations. The container-validation specification
maps to shared error aggregation and family-owned indicator rendering.

Expression evaluation, actions, templates, URL policy,
additional-error ownership, the richer duration model, Monaco and AG Grid were
already shared in the optional extended package. They remain there. Demo state,
example registration adapters, and demo layout requirements remain in the demo layer. Portable example catalogs are imported from the spec package.

The implementation-gaps document and `TODO.md` describe outstanding behavior;
this extraction does not mark those items complete or extend other libraries'
renderer registries to match Ant Design's catalogue.

## Adoption and compatibility

- Ant Design imports the extracted behavior through compatibility exports at its
  existing module paths. Its public names and renderer registrations remain.
- MUI, PrimeReact, and shadcn use the same group-state hook, including namespaced
  options with the existing flat-config fallback.
- PrimeReact uses the shared focus and debounce hooks. Pending edits now cancel
  on clear, unmount, rebinding, and external replacement as specified in §18.4.
- Ant Design and the shared splitter use the same effective-child visibility
  hook. Each retains its own splitter implementation.
- Common layout spacing defaults are zero. Ant Design supplies its existing
  row/column defaults through a local adapter.
- Ant Design date/time disabled callbacks and colour-picker format mapping stay
  local. Shared value conversion does not import Ant Design picker types.
- Compatibility exports name their symbols explicitly so library bundling does
  not ambiguously resolve symbols through multiple external wildcard exports.

Pure behavior tests live alongside the common implementation. Tests that mount
library components remain with their renderer family. Workspace build and test
filters discover common through dependency edges, including each demo's scope.
