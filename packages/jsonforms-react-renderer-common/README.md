# Shared React renderer behavior

`@chobantonov/jsonforms-react-renderer-common` contains UI-independent behavior
for the Ant Design, MUI, PrimeReact, and shadcn renderer families. It depends on
React and JSON Forms, but does not depend on a UI library, a renderer family,
or the optional extended renderer package.

Use module entry points to load only the behavior your renderer needs:

```ts
import { useGroupState } from '@chobantonov/jsonforms-react-renderer-common/groupState';
import { shouldConfirm } from '@chobantonov/jsonforms-react-renderer-common/confirmation';
import { temporalBounds } from '@chobantonov/jsonforms-react-renderer-common/temporalBounds';
```

The package also exports these APIs from its root. Temporal helpers use Dayjs;
mask helpers use Maska. Importing a temporal helper registers its required Dayjs
plugins. Renderer message catalogs are shared across consumers in the same
module instance.

Each renderer family supplies its own controls, dialogs, icons, accessibility
wiring, themes, component locales, and widget event adapters. Layout helpers
accept family spacing defaults; their fallback is zero. Ant Design's wrapper
retains its 16px horizontal gap and zero vertical gap.

Existing module paths in the renderer packages remain compatibility exports.
MUI, PrimeReact, and shadcn already consume the shared group-state hook;
PrimeReact also consumes shared focus and debounced-change hooks. Other shared
APIs support porting features without importing Ant Design. This extraction
does not register new controls or claim feature parity between the families.

See [the ownership map](../../docs/renderer-common.md) for the specification
boundaries and migration details.

```sh
pnpm --filter @chobantonov/jsonforms-react-renderer-common build
pnpm --filter @chobantonov/jsonforms-react-renderer-common test
```
