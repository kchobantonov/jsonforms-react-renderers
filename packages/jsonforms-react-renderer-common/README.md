# Shared React renderer behavior

`@chobantonov/jsonforms-react-renderer-common` contains UI-independent behavior
for the Ant Design and shadcn renderer families. It depends on
React and JSON Forms, but does not depend on a UI library, a renderer family,
or the optional extended renderer package.

Use module entry points to load only the behavior your renderer needs:

```ts
import { useGroupState } from '@chobantonov/jsonforms-react-renderer-common/layout/groupState';
import { shouldConfirm } from '@chobantonov/jsonforms-react-renderer-common/interaction/confirmation';
import { temporalBounds } from '@chobantonov/jsonforms-react-renderer-common/formats/temporalBounds';
```

The package also exports these APIs from its root. Temporal helpers use Dayjs;
mask helpers use Maska. Importing a temporal helper registers its required Dayjs
plugins. Renderer message catalogs are shared across consumers in the same
module instance.

Modules under `src/` are grouped by feature. For example, `tuple/` contains the
tuple schema, hooks, and components. `composition/` handles JSON Schema
combinators, and `mixed/` handles values with multiple permitted types.
Place a hook beside the behavior it implements. Use the `use` prefix for
hooks and PascalCase for component modules. A module’s path relative to
`src/` is its package subpath. The root `index.ts` defines the root API.

Each renderer family supplies its own controls, dialogs, icons, accessibility
wiring, themes, component locales, and widget event adapters. Shared layout
helpers default to a 16px gap for both rows and columns and honor an explicit
zero. Family adapters can supply their own defaults.

Import `i18nDefaults` from the `/locale` entry point to use the default catalog.
The same entry point exports `enRendererLocale` and `bgRendererLocale` for
explicit language selection. Tests mirror the source features under `test/`.

See [the ownership map](../../docs/renderer-common.md) for the specification
boundaries and migration details.

```sh
pnpm --filter @chobantonov/jsonforms-react-renderer-common build
pnpm --filter @chobantonov/jsonforms-react-renderer-common test
```

For `$dynamic`, authored nested objects patch existing keys. Descriptor results
(`bind`, `expression`, `literal`, or trusted functions) replace their target as a
complete value, including objects. Use `{ literal: completeDetail }` for a whole
detail layout, or `{ elements: [...] }` to update only its children. Literal
payloads are copied without evaluating descriptor-shaped descendants; child
UI elements resolve their own `$dynamic` when dispatched. Invalid results preserve
the accumulated fallback within the current evaluation.

### Activation and trusted functions

Only `config.jsonformsExtended.dynamic.enabled === true` enables overlays. The
`external` prop is independent; passing it alone does not enable `$dynamic`.
Replace the external object to notify the form. There is no experimental `dynamic`
prop alias. To admit synchronous function leaves, import `TRUST_DYNAMIC_FUNCTIONS`
from this package and set `config.jsonformsExtended.dynamic.trusted` to that symbol.
JSON booleans/strings and lookalike symbols cannot grant this capability. The token
alone does not activate overlays. Label `dynamicValues` and template script gates
remain independent.

### Lazy evaluator and shared resolution

CEL loads when the first form enables overlays; disabled forms do not request it.
Concurrent forms share preparation. An initially enabled form holds its editors
back until the evaluator is ready, avoiding a static editor that would immediately
be replaced. Live activation retains mounted editors and drafts while temporarily
blocking editing. Loading failures are shown; disabling and reenabling retries.
Completion from an obsolete activation is ignored.

The form shares the latest pure result for each authored element and referenced
input roots across parent consumers and dispatch. Occurrence-local identity and
snapshot validation remain intact; this does not add field-level subscriptions.

The public form adapters prepare CEL automatically. When calling the low-level
synchronous resolver directly, first `await loadDynamicUiExpressions()` if the UI
contains CEL expressions. Literal values, restricted templates and bindings can
resolve without that preparation.
