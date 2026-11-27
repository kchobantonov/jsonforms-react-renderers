# Demo example catalog

The default menu contains the specification catalog and original JSON Forms
examples. Portable examples live in `jsonforms-extended-spec/examples`; demo-common
loads the catalog automatically. Framework-specific additions can augment those
fixtures or be registered by a host.

## Portable example coverage

This guide covers the 50 fixtures in `@chobantonov/jsonforms-extended-spec@0.2.0`.
Open a fixture in either demo with the URL hash `#spec-<id>`, for example
`#spec-ag-grid`. The tables describe authored scenarios. See the integration
tests for renderer support and each fixture’s README for host requirements.

| Feature                                                                         | Spec coverage                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color                                                                           | `color-control`: hex3 output, ordinary colors, alpha colors and restrictions                                                                                                     |
| Duration                                                                        | `temporal-controls`: ordinary and week durations, hidden action bar                                                                                                              |
| Null                                                                            | `null-control`: absent versus explicit null                                                                                                                                      |
| Monaco Editor                                                                   | `code-editor`: growing/fixed editors, initialization actions and JSON conversion; `additional-errors`: dynamic language                                                          |
| AG Grid / Table Cells                                                           | `array-controls`: staff table and grid with scalar formats, alpha color, reorder controls, native widths/filter/pagination, object/array summaries, Clear and nested cell detail |
| AG Grid options                                                                 | `ag-grid` compares portable grid options with native AG Grid overrides                                                                                                           |
| Table row details                                                               | `table-row-details` demonstrates row details in a recruitment table                                                                                                              |
| File                                                                            | `file-control`: data URI, named binary URI and base64 encodings; explicit UI file-size limits                                                                                    |
| Collapsible Groups                                                              | `group-layout`: open/collapsed groups, data indicators, false and zero                                                                                                           |
| Horizontal Layout Sizing                                                        | `layout-sizing`: fixed/automatic spans, wrapping, hidden fields, nested presentation and groups                                                                                  |
| Split Layout                                                                    | `split-layout`: horizontal, vertical and three-pane splitters                                                                                                                    |
| Spacer / Separator / ImageView / Presentation Renderers / combined presentation | `presentation`: spacing, separators, static/data images, inline-image permission and visibility rules                                                                            |
| Link                                                                            | `presentation`: explicit translations, unprefixed label, new tab, relative/mail URLs, empty/refused destinations                                                                 |
| Template Layout                                                                 | `template-layout`: named and positional slots, nested templates, data, validation errors and actions; native augmentation demonstrates host components                           |

File-size limits use the spec's explicit UI option. Native components remain
in the native template demonstration.

## Additional spec examples

| Topic                    | Fixture IDs and scenarios                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Basic inputs             | `string-controls`, `numeric-controls`, `boolean-controls`, `password-control`, `cron-control` and `input-adornments`                                         |
| Choices                  | `choice-controls` for single values and `array-choices` for arrays of choices and tokens                                                                     |
| Structured values        | `object-control`, `additional-properties`, `mixed-control` and `tuple-control`                                                                               |
| Detail editors           | `array-detail-modes` for generated and registered array details, and `editor-details` for objects, mixed types and cells                                     |
| Pagination               | `collection-pagination` for collections, `property-pagination` for object properties and `additional-items-pagination` for additional items                  |
| Trees                    | `recursive-tree` for files and folders, and `tree-max-depth` for a five-level limit                                                                          |
| Navigation and labels    | `categorization` for tabs, steppers and accordions, `label-interpolation` for labels with variable content, and `markup-label` for formatted labels          |
| Actions                  | `button-actions` for actions and callbacks, and `destructive-confirmation` for confirming destructive changes                                                |
| Schema-driven forms      | `combinators` for schema alternatives and conditions, `conditional-fields` for generated and authored layouts, and `draft-07-metaschema` for editing schemas |
| Validation               | `container-validation-indicator`, `pre-touch-errors` and the Ajv configuration in `validator-profile`                                                        |
| Templates and dynamic UI | `template-slots` for named UI schema reuse, and `dynamic-playground` for a configuration form with a preview                                                 |
| JSON editing             | `json-editor` for editing any JSON value, and `json-inference` for inferring a schema from pasted data                                                       |
| Complete forms           | `job-application` and `kitchen-sink` combine features in job application forms                                                                               |

Template/Slot named UI-model composition is distinct from TemplateLayout source
templates. Portable uischemas.json registries are exported by the spec catalog and
passed through to the demo; named lookup uses entry.uischema.name, while ordinary
registered details use declarative match rules. Keep these registries when copying examples.

An explicit empty schema {} permits any JSON value. An omitted schema requests
inference from JSON Forms, and omitted initial data must remain
absent. The inferred schema follows changes to the root JSON type. Clearing the
Schema editor and applying changes switches the demo from an explicit schema
to inference.

## Add a host-specific example

Pass an explicit catalog to the existing entry point:

```tsx
import {
  listExamples,
  renderExample,
} from '@chobantonov/jsonforms-react-demo-common';

renderExample(renderers, cells, Wrapper, {
  examples: [
    ...listExamples(),
    {
      name: 'local-workflow',
      label: 'Local workflow',
      schema: { type: 'string' },
      uischema: { type: 'Control', scope: '#' },
      data: 'Hello',
    },
  ],
});
```

Alternatively, call `registerProjectExamples([...])` before `renderExample`.
The entry point reads `listExamples()` at invocation, so late registrations are
included. Use unique names; registrations intentionally replace matching names.
The default export from `src/examples` is an initial snapshot, not a live list.
Use the registration helper rather than upstream `registerExamples` so local
examples are not mistaken for originals.

## Extend a spec example with native behavior

Keep portable JSON in the spec. Add a module in `src/examples/nativeSpecExamples`
that imports the fixture and composes additional categories without mutating it.
Add its composed UI schema to `nativeUiSchemas` in `src/examples/spec.ts`.
`button-actions` and `template-layout` show function callbacks and native templates.
The spec example keeps its name, schema, data and translations. New spec catalog
entries require no entry in this override map.

Before deleting a local example, compare its behaviors and options against the
spec, transfer any missing scenarios, update test imports, and retain regression
checks for the transferred behavior. Do not equate a similar title with coverage.

## Filter the menu by source

The sidebar's **Example source** selector offers **Spec examples**, **JSON Forms
originals**, and **All examples**. It defaults to Spec when that catalog is
present; hosts without spec fixtures start with All. Search applies within the
selected source. All also includes host-specific examples.

Changing the source filters the menu only: it does not replace the open form,
reset edits, or prevent opening an example by its URL. Source selection is local
to the current demo session. All built-in shells place the selector above search,
using their UI adapter's select component. Custom shells can place the optional
`DemoShellProps.exampleFilter` node in their navigation area.
